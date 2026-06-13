import { mkdir, readFile, readdir, writeFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_CONTENT_DIR = "content/posts";
const DATA_FILE = "data/nostalgic_bbs.toml";
const DEFAULT_API_BASE = "https://api.nostalgic.llll-ll.com";

const DEFAULT_LOOKUP_LIMIT = 50;
const DEFAULT_CREATE_DELAY_MS = 1200;
const DEFAULT_RETRY_BASE_MS = 2000;
const MIN_RETRY_BASE_MS = 500;
const DEFAULT_MAX_RETRIES = 5;

const env = process.env;

const token = env.NOSTALGIC_TOKEN || "";
const apiBase = (env.NOSTALGIC_API_BASE || DEFAULT_API_BASE).replace(/\/$/, "");
const CONTENT_DIR = env.NOSTALGIC_CONTENT_DIR || DEFAULT_CONTENT_DIR;

// Pure env-clamp helpers. Each takes an already-Number()-ified raw value so that
// unset env vars (Number(undefined) === NaN) fall through to the fallback.
// Number of URLs resolved per batchLookup request (also the chunk size).
export function clampLookupLimit(raw, fallback = DEFAULT_LOOKUP_LIMIT) {
  return Number.isFinite(raw) && raw >= 1 ? raw : fallback;
}

// Pacing delay applied after each successful create. 0 is valid (disables pacing).
export function clampCreateDelay(raw, fallback = DEFAULT_CREATE_DELAY_MS) {
  return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
}

// Base for linear backoff on retryable failures (429/503/network). A non-finite
// raw (e.g. "abc") collapses to the fallback before flooring, so backoff can never
// become NaN; the floor keeps a user-supplied 0 from disabling backoff entirely.
export function clampRetryBase(raw, fallback = DEFAULT_RETRY_BASE_MS, min = MIN_RETRY_BASE_MS) {
  return Math.max(Number.isFinite(raw) ? raw : fallback, min);
}

export function clampMaxRetries(raw, fallback = DEFAULT_MAX_RETRIES) {
  return Number.isFinite(raw) && raw >= 1 ? raw : fallback;
}

const LOOKUP_LIMIT = clampLookupLimit(Number(env.NOSTALGIC_LOOKUP_LIMIT));
const createDelayMs = clampCreateDelay(Number(env.NOSTALGIC_CREATE_DELAY_MS));
const retryBaseMs = clampRetryBase(Number(env.NOSTALGIC_RETRY_BASE_MS));
const MAX_RETRIES = clampMaxRetries(Number(env.NOSTALGIC_MAX_RETRIES));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizePath(value) {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  return `/${trimmed}/`;
}

export function parseScalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}\\s*=\\s*["']?([^"'\\n]+)["']?\\s*$`, "m"));
  return match ? match[1].trim() : "";
}

export function parseBool(frontmatter, key) {
  return new RegExp(`^${key}\\s*=\\s*true\\s*$`, "m").test(frontmatter);
}

async function walkMarkdown(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkMarkdown(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".md") && !/^_index(\.[^.]+)?\.md$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

export function extractFrontmatter(source) {
  if (!source.startsWith("+++\n")) return "";
  const end = source.indexOf("\n+++", 4);
  return end === -1 ? "" : source.slice(4, end);
}

export function readLanguageCodes(configToml) {
  const codes = new Set();
  for (const match of configToml.matchAll(/^\[languages\.([A-Za-z0-9_-]+)\]/gm)) {
    codes.add(match[1]);
  }
  return codes;
}

export function splitLanguageSuffix(rel, languageCodes) {
  const parts = rel.split("/");
  const basename = parts[parts.length - 1];
  const dot = basename.lastIndexOf(".");
  if (dot === -1) return { rel, lang: "" };

  const suffix = basename.slice(dot + 1);
  if (!languageCodes.has(suffix)) return { rel, lang: "" };

  parts[parts.length - 1] = basename.slice(0, dot);
  return { rel: parts.join("/"), lang: suffix };
}

export function pagePathForFile(file, frontmatter, languageCodes) {
  const explicitPath = parseScalar(frontmatter, "path");
  if (explicitPath) return normalizePath(explicitPath);

  const rawRel = path.relative("content", file).replace(/\\/g, "/").replace(/\.md$/, "");
  const { rel, lang } = splitLanguageSuffix(rawRel, languageCodes);
  const slug = parseScalar(frontmatter, "slug");
  if (!slug) return normalizePath(lang ? `${lang}/${rel}` : rel);

  const parts = rel.split("/");
  parts[parts.length - 1] = slug;
  return normalizePath(lang ? `${lang}/${parts.join("/")}` : parts.join("/"));
}

export function readBaseUrl(configToml) {
  const baseUrl = parseScalar(configToml, "base_url");
  if (!baseUrl) throw new Error("config.toml must define base_url");
  return baseUrl.replace(/\/$/, "");
}

export function parseExistingMap(source) {
  const map = {};
  let inPosts = false;
  for (const line of source.split(/\r?\n/)) {
    if (/^\[posts\]\s*$/.test(line)) {
      inPosts = true;
      continue;
    }
    if (/^\[/.test(line)) inPosts = false;
    if (!inPosts) continue;
    const match = line.match(/^"([^"]+)"\s*=\s*"([^"]+)"\s*$/);
    if (match) map[match[1]] = match[2];
  }
  return map;
}

async function readExistingMap() {
  if (!existsSync(DATA_FILE)) return {};
  const source = await readFile(DATA_FILE, "utf8");
  return parseExistingMap(source);
}

export function toToml(map) {
  const lines = ["# Generated by scripts/sync-nostalgic-bbs.mjs", "# Keyed by article URL path.", "", "[posts]"];
  for (const key of Object.keys(map).sort()) {
    lines.push(`${JSON.stringify(key)} = ${JSON.stringify(map[key])}`);
  }
  return `${lines.join("\n")}\n`;
}

// Atomically persist the map: write to a temp file then rename over the target
// so a crash mid-write never leaves a truncated mapping behind.
export async function writeMapAtomic(map, target = DATA_FILE) {
  await mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp`;
  await writeFile(tmp, toToml(map));
  await rename(tmp, target);
}

export function isRetryableStatus(status) {
  return status === 429 || status === 503;
}

export function backoffMs(attempt, baseMs) {
  return baseMs * (attempt + 1);
}

export async function postJson(action, body, { fetchImpl = globalThis.fetch } = {}) {
  let response;
  try {
    response = await fetchImpl(`${apiBase}/bbs?action=${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Network-level failure (DNS, reset, timeout). Treat as retryable.
    return { ok: false, status: 0, networkError: true, json: {} };
  }
  const json = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, networkError: false, json };
}

export async function withRetry(fn, { label, maxRetries = MAX_RETRIES, baseMs = retryBaseMs, sleepImpl = sleep } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      if (!error.retryable || attempt === maxRetries) {
        throw error;
      }
      const waitMs = backoffMs(attempt, baseMs);
      console.log(`${label} failed (retryable); waiting ${waitMs}ms before retry ${attempt + 1}/${maxRetries}`);
      await sleepImpl(waitMs);
    }
  }
  // Unreachable: the loop either returns or throws. Kept for static safety.
  throw new Error(`${label} exhausted retries`);
}

export async function createBbs(url, { fetchImpl = globalThis.fetch } = {}) {
  const created = await postJson(
    "create",
    {
      url,
      token,
      title: "Comments",
      maxMessages: 100,
      messagesPerPage: 20,
    },
    { fetchImpl }
  );
  // A usable result (success + id) is returned regardless of HTTP status: a
  // gateway can stamp 429/503 onto a response that already created the BBS, and
  // discarding its id here would make a retry create a duplicate BBS.
  if (created.json?.success && created.json?.id) return created.json.id;
  if (isRetryableStatus(created.status) || created.networkError) {
    const error = new Error(`BBS create temporarily failed for ${url}: ${created.status}`);
    error.retryable = true;
    throw error;
  }
  if (!created.ok || !created.json?.success || !created.json?.id) {
    throw new Error(`BBS create failed for ${url}: ${created.status} ${created.json?.error || ""}`.trim());
  }
  return created.json.id;
}

export async function batchLookupBbs(items, { fetchImpl = globalThis.fetch } = {}) {
  const lookup = await postJson(
    "batchLookup",
    {
      urls: items.map((item) => item.url),
      token,
    },
    { fetchImpl }
  );
  // Mirror createBbs: a usable result (success + data array) is returned ahead
  // of the retryable check. Lookups are idempotent so this is just consistency.
  if (lookup.json?.success && Array.isArray(lookup.json?.data)) return lookup.json.data;
  if (isRetryableStatus(lookup.status) || lookup.networkError) {
    const error = new Error(`BBS batchLookup temporarily failed: ${lookup.status}`);
    error.retryable = true;
    throw error;
  }
  if (!lookup.ok || !lookup.json?.success || !Array.isArray(lookup.json?.data)) {
    throw new Error(`BBS batchLookup failed: ${lookup.status} ${lookup.json?.error || ""}`.trim());
  }
  return lookup.json.data;
}

async function createBbsWithRetry(url, deps = {}) {
  const { sleepImpl = sleep } = deps;
  const id = await withRetry(() => createBbs(url, deps), { label: `BBS create ${url}`, sleepImpl });
  // Pacing also goes through sleepImpl so tests can run with zero real waiting.
  if (createDelayMs > 0) await sleepImpl(createDelayMs);
  return id;
}

async function lookupWithRetry(items, deps = {}) {
  const { sleepImpl = sleep } = deps;
  return withRetry(() => batchLookupBbs(items, deps), { label: "BBS batchLookup", sleepImpl });
}

// Provision BBS ids for every missing post into `next`, chunk by chunk. Each
// chunk is batch-looked-up then resolved item-by-item; creates are persisted
// immediately and the chunk is persisted at its end. Deps are injectable so the
// chunk core can be exercised with fakes and zero real waiting. A final write
// after the loop guarantees `next` is persisted even when missing is empty
// (matching the previous main()'s always-write-once behaviour).
export async function provisionMissing(
  missing,
  next,
  { fetchImpl = globalThis.fetch, sleepImpl = sleep, writeMap = (m) => writeMapAtomic(m), lookupLimit = LOOKUP_LIMIT } = {}
) {
  for (let i = 0; i < missing.length; i += lookupLimit) {
    const chunk = missing.slice(i, i + lookupLimit);
    const lookupResults = await lookupWithRetry(chunk, { fetchImpl, sleepImpl });

    for (let j = 0; j < chunk.length; j += 1) {
      const item = chunk[j];
      const result = lookupResults[j];
      if (!result || result.url !== item.url) {
        throw new Error(`BBS batchLookup returned an unexpected result order for ${item.url}`);
      }

      if (result.exists && result.authorized === false) {
        throw new Error(`BBS already exists for ${item.url}, but NOSTALGIC_TOKEN is not its owner token`);
      }

      if (result.exists && !result.id) {
        throw new Error(`BBS batchLookup returned an existing BBS without an id for ${item.url}`);
      }

      if (result.exists) {
        next[item.pagePath] = result.id;
      } else {
        next[item.pagePath] = await createBbsWithRetry(item.url, { fetchImpl, sleepImpl });
        // Persist immediately after a successful create so an interruption mid
        // batch never loses a freshly provisioned id (avoids re-lookup churn).
        await writeMap(next);
      }
      console.log(`${item.pagePath} -> ${next[item.pagePath]}`);
    }

    // Persist after each chunk as well, covering lookups that resolved to
    // existing ids without any create.
    await writeMap(next);
  }

  // Final write covers the missing-empty case so behaviour matches the prior
  // always-write-once main(): `next` (a copy of existing) is still persisted.
  await writeMap(next);
  return next;
}

async function main() {
  const configToml = await readFile("config.toml", "utf8");
  const baseUrl = readBaseUrl(configToml);
  const languageCodes = readLanguageCodes(configToml);
  const existing = await readExistingMap();
  const next = { ...existing };
  const files = existsSync(CONTENT_DIR) ? await walkMarkdown(CONTENT_DIR) : [];

  const missing = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const frontmatter = extractFrontmatter(source);
    if (!frontmatter || parseBool(frontmatter, "draft")) continue;
    const pagePath = pagePathForFile(file, frontmatter, languageCodes);
    if (next[pagePath]) continue;
    missing.push({ pagePath, url: `${baseUrl}${pagePath}` });
  }

  if (!token) {
    console.log(
      `NOSTALGIC_TOKEN is not set; kept existing ${Object.keys(existing).length} BBS ids, skipped ${missing.length} missing posts.`
    );
    return;
  }

  await provisionMissing(missing, next);
  console.log(`Wrote ${DATA_FILE}: ${Object.keys(next).length} ids (${missing.length} new).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
