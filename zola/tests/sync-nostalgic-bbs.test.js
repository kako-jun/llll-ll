import { describe, it, expect } from "vitest";
import { tmpdir } from "node:os";
import { mkdtemp, rm, readFile, readdir } from "node:fs/promises";
import path from "node:path";

// avel #20 還流: scripts/sync-nostalgic-bbs.mjs の堅牢化（リトライ/アトミック書き込み/
// ネット例外/重複BBS防止）を回帰で押さえる。avel の node:test 版（pure/retry/provision）を
// vitest へ翻案。ネット・実待機ゼロ（偽 fetch / 偽 sleep を注入）。.mjs を vitest から import する。
import {
  // pure
  normalizePath,
  parseScalar,
  parseBool,
  extractFrontmatter,
  readLanguageCodes,
  splitLanguageSuffix,
  pagePathForFile,
  readBaseUrl,
  parseExistingMap,
  toToml,
  // retry / network
  withRetry,
  backoffMs,
  isRetryableStatus,
  createBbs,
  batchLookupBbs,
  postJson,
  clampLookupLimit,
  clampCreateDelay,
  clampRetryBase,
  clampMaxRetries,
  // provision / IO
  provisionMissing,
  writeMapAtomic,
} from "../scripts/sync-nostalgic-bbs.mjs";

// =============================================================================
// 純粋関数（A: 解析・パス導出・TOML ラウンドトリップ）
// =============================================================================

describe("normalizePath: wraps in slashes, collapses surrounding ones, trims", () => {
  it("bare path gains leading and trailing slash", () => {
    expect(normalizePath("foo/bar")).toBe("/foo/bar/");
  });
  it("already-slashed path is idempotent", () => {
    expect(normalizePath("/foo/bar/")).toBe("/foo/bar/");
  });
  it("collapses repeated leading/trailing slashes", () => {
    expect(normalizePath("///foo///")).toBe("/foo/");
  });
  it("trims surrounding whitespace", () => {
    expect(normalizePath("  foo  ")).toBe("/foo/");
  });
});

describe("parseScalar: strips quotes, anchors per line", () => {
  it("strips double quotes from value", () => {
    expect(parseScalar('title = "Hello"', "title")).toBe("Hello");
  });
  it("strips single quotes from value", () => {
    expect(parseScalar("title = 'Hello'", "title")).toBe("Hello");
  });
  it("returns bare unquoted value", () => {
    expect(parseScalar("slug = my-post", "slug")).toBe("my-post");
  });
  it("missing key yields empty string", () => {
    expect(parseScalar('title = "Hello"', "slug")).toBe("");
  });
  it("line anchor prevents partial-key mismatch", () => {
    expect(parseScalar('subtitle = "Sub"', "title")).toBe("");
  });
});

describe("parseBool: only literal true, anchored", () => {
  it("true literal is true", () => {
    expect(parseBool("draft = true", "draft")).toBe(true);
  });
  it("false literal is false", () => {
    expect(parseBool("draft = false", "draft")).toBe(false);
  });
  it("missing key is false", () => {
    expect(parseBool('title = "x"', "draft")).toBe(false);
  });
  it("uppercase TRUE is not matched", () => {
    expect(parseBool("draft = TRUE", "draft")).toBe(false);
  });
  it("partial-key does not falsely match", () => {
    expect(parseBool("undraft = true", "draft")).toBe(false);
  });
});

describe("extractFrontmatter: +++ delimited block", () => {
  it("extracts content between +++ fences", () => {
    const src = '+++\ntitle = "x"\nslug = "y"\n+++\nbody';
    expect(extractFrontmatter(src)).toBe('title = "x"\nslug = "y"');
  });
  it("source not starting with +++ yields empty", () => {
    expect(extractFrontmatter('title = "x"\n+++\n')).toBe("");
  });
  it("unterminated frontmatter yields empty", () => {
    expect(extractFrontmatter('+++\ntitle = "x"\nno closing fence')).toBe("");
  });
});

describe("readLanguageCodes", () => {
  it("collects all [languages.X] codes", () => {
    const toml = "[languages.en]\nfoo = 1\n[languages.ja]\nbar = 2";
    expect(readLanguageCodes(toml)).toEqual(new Set(["en", "ja"]));
  });
  it("no language tables yields empty set", () => {
    expect(readLanguageCodes('base_url = "x"')).toEqual(new Set());
  });
  it("allows hyphen in code", () => {
    expect(readLanguageCodes("[languages.zh-Hans]")).toEqual(new Set(["zh-Hans"]));
  });
  it("subkey table does not add a separate code", () => {
    const toml = '[languages.en]\n[languages.en.translations]\nfoo = "bar"';
    expect(readLanguageCodes(toml)).toEqual(new Set(["en"]));
  });
});

describe("splitLanguageSuffix", () => {
  const LANGS = new Set(["en", "ja"]);
  it("separates registered language suffix", () => {
    expect(splitLanguageSuffix("posts/hello.en", LANGS)).toEqual({ rel: "posts/hello", lang: "en" });
  });
  it("no dot leaves rel untouched", () => {
    expect(splitLanguageSuffix("posts/hello", LANGS)).toEqual({ rel: "posts/hello", lang: "" });
  });
  it("unregistered suffix is not split off", () => {
    expect(splitLanguageSuffix("posts/hello.de", LANGS)).toEqual({ rel: "posts/hello.de", lang: "" });
  });
  it("dots in directory names are ignored", () => {
    expect(splitLanguageSuffix("v1.0/hello", LANGS)).toEqual({ rel: "v1.0/hello", lang: "" });
  });
});

describe("pagePathForFile", () => {
  const LANGS = new Set(["en", "ja"]);
  it("explicit path takes precedence", () => {
    expect(pagePathForFile("content/posts/hello.md", 'path = "custom/page"', LANGS)).toBe("/custom/page/");
  });
  it("bare relative path when no slug or lang", () => {
    expect(pagePathForFile("content/posts/hello.md", "", LANGS)).toBe("/posts/hello/");
  });
  it("slug replaces the final segment", () => {
    expect(pagePathForFile("content/posts/hello.md", 'slug = "world"', LANGS)).toBe("/posts/world/");
  });
  it("language suffix becomes a path prefix", () => {
    expect(pagePathForFile("content/posts/hello.en.md", "", LANGS)).toBe("/en/posts/hello/");
  });
  it("language prefix combined with slug", () => {
    expect(pagePathForFile("content/posts/hello.en.md", 'slug = "world"', LANGS)).toBe("/en/posts/world/");
  });
  it("empty slug falls back to bare rel", () => {
    expect(pagePathForFile("content/posts/hello.md", 'slug = ""', LANGS)).toBe("/posts/hello/");
  });
  it("empty explicit path falls back to bare rel", () => {
    expect(pagePathForFile("content/posts/hello.md", 'path = ""', LANGS)).toBe("/posts/hello/");
  });
  it("nested directories are preserved", () => {
    expect(pagePathForFile("content/posts/2026/hello.md", "", LANGS)).toBe("/posts/2026/hello/");
  });
});

describe("readBaseUrl", () => {
  it("strips trailing slash", () => {
    expect(readBaseUrl('base_url = "https://example.com/"')).toBe("https://example.com");
  });
  it("missing base_url throws", () => {
    expect(() => readBaseUrl('title = "x"')).toThrow(/base_url/);
  });
  it("empty base_url throws", () => {
    expect(() => readBaseUrl('base_url = ""')).toThrow(/base_url/);
  });
});

describe("parseExistingMap <-> toToml", () => {
  it("extracts only [posts] table entries", () => {
    const src = '[posts]\n"/a/" = "id1"\n"/b/" = "id2"';
    expect(parseExistingMap(src)).toEqual({ "/a/": "id1", "/b/": "id2" });
  });
  it("leaves [posts] when another table begins", () => {
    const src = '[posts]\n"/a/" = "id1"\n[other]\n"/b/" = "id2"';
    expect(parseExistingMap(src)).toEqual({ "/a/": "id1" });
  });
  it("handles CRLF line endings", () => {
    const src = '[posts]\r\n"/a/" = "id1"\r\n"/b/" = "id2"\r\n';
    expect(parseExistingMap(src)).toEqual({ "/a/": "id1", "/b/": "id2" });
  });
  it("toToml sorts keys and JSON-quotes them", () => {
    const out = toToml({ "/b/": "id2", "/a/": "id1" });
    const aIdx = out.indexOf('"/a/"');
    const bIdx = out.indexOf('"/b/"');
    expect(aIdx).not.toBe(-1);
    expect(bIdx).not.toBe(-1);
    expect(aIdx).toBeLessThan(bIdx);
    expect(out).toMatch(/^"\/a\/" = "id1"$/m);
  });
  it("toToml empty map still emits the [posts] header", () => {
    expect(toToml({})).toMatch(/\[posts\]/);
  });
  it("parseExistingMap(toToml(x)) round-trips the mapping", () => {
    const original = { "/en/posts/hello/": "abc", "/posts/world/": "def" };
    expect(parseExistingMap(toToml(original))).toEqual(original);
  });
});

// =============================================================================
// リトライ / バックオフ / ネットワーク（A・B・D）
// =============================================================================

// 実待機しない偽 sleep。要求された待機 ms を記録してバックオフ列を検証する。
function makeSleepSpy() {
  const calls = [];
  return {
    calls,
    sleep: async (ms) => {
      calls.push(ms);
    },
  };
}

function retryableError(message = "temporary") {
  const e = new Error(message);
  e.retryable = true;
  return e;
}

// postJson が使う Web fetch 契約を模した fetchImpl。
function fakeFetch({ ok = true, status = 200, body = {}, jsonThrows = false, fetchThrows = false } = {}) {
  return async () => {
    if (fetchThrows) throw new Error("network down");
    return {
      ok,
      status,
      json: async () => {
        if (jsonThrows) throw new Error("bad json");
        return body;
      },
    };
  };
}

describe("withRetry", () => {
  it("resolves on first try without sleeping", async () => {
    const { calls, sleep } = makeSleepSpy();
    let fnCalls = 0;
    const result = await withRetry(
      async () => {
        fnCalls += 1;
        return "value";
      },
      { label: "x", sleepImpl: sleep }
    );
    expect(result).toBe("value");
    expect(fnCalls).toBe(1);
    expect(calls.length).toBe(0);
  });

  it("retryable error then success retries exactly once", async () => {
    const { calls, sleep } = makeSleepSpy();
    let fnCalls = 0;
    const result = await withRetry(
      async () => {
        fnCalls += 1;
        if (fnCalls === 1) throw retryableError();
        return "ok";
      },
      { label: "x", baseMs: 2000, sleepImpl: sleep }
    );
    expect(result).toBe("ok");
    expect(fnCalls).toBe(2);
    expect(calls).toEqual([backoffMs(0, 2000)]);
  });

  it("non-retryable error throws immediately without retry", async () => {
    const { calls, sleep } = makeSleepSpy();
    let fnCalls = 0;
    await expect(
      withRetry(
        async () => {
          fnCalls += 1;
          throw new Error("fatal");
        },
        { label: "x", sleepImpl: sleep }
      )
    ).rejects.toThrow(/fatal/);
    expect(fnCalls).toBe(1);
    expect(calls.length).toBe(0);
  });

  it("exhausts maxRetries=2 with linear ascending backoff schedule", async () => {
    const { calls, sleep } = makeSleepSpy();
    let fnCalls = 0;
    const err = retryableError("still failing");
    await expect(
      withRetry(
        async () => {
          fnCalls += 1;
          throw err;
        },
        { label: "x", maxRetries: 2, baseMs: 1000, sleepImpl: sleep }
      )
    ).rejects.toBe(err);
    expect(fnCalls).toBe(3);
    // [baseMs*1, baseMs*2] — linear, ascending。*attempt 取り違えを捕まえる。
    expect(calls).toEqual([1000, 2000]);
  });

  it("maxRetries=0 throws on first retryable error (boundary)", async () => {
    const { calls, sleep } = makeSleepSpy();
    let fnCalls = 0;
    await expect(
      withRetry(
        async () => {
          fnCalls += 1;
          throw retryableError();
        },
        { label: "x", maxRetries: 0, sleepImpl: sleep }
      )
    ).rejects.toThrow(/temporary/);
    expect(fnCalls).toBe(1);
    expect(calls.length).toBe(0);
  });

  it("backoff is driven by injected baseMs alone (independent of createDelay)", async () => {
    const { calls, sleep } = makeSleepSpy();
    let fnCalls = 0;
    await expect(
      withRetry(
        async () => {
          fnCalls += 1;
          throw retryableError();
        },
        { label: "x", maxRetries: 2, baseMs: 100, sleepImpl: sleep }
      )
    ).rejects.toThrow();
    expect(calls).toEqual([100, 200]);
  });
});

describe("backoffMs", () => {
  it("base*(attempt+1) at attempt 0", () => {
    expect(backoffMs(0, 2000)).toBe(2000);
  });
  it("base*(attempt+1) at attempt 1", () => {
    expect(backoffMs(1, 2000)).toBe(4000);
  });
  it("base*(attempt+1) at attempt 4", () => {
    expect(backoffMs(4, 2000)).toBe(10000);
  });
  it("uses attempt+1 not attempt (base 1, attempt 3 => 4)", () => {
    expect(backoffMs(3, 1)).toBe(4);
  });
});

describe("isRetryableStatus", () => {
  it("429 is retryable", () => expect(isRetryableStatus(429)).toBe(true));
  it("503 is retryable", () => expect(isRetryableStatus(503)).toBe(true));
  it("200 is not retryable", () => expect(isRetryableStatus(200)).toBe(false));
  it("400 is not retryable", () => expect(isRetryableStatus(400)).toBe(false));
  it("404 is not retryable", () => expect(isRetryableStatus(404)).toBe(false));
  it("500 is not retryable", () => expect(isRetryableStatus(500)).toBe(false));
  it("502 is not retryable", () => expect(isRetryableStatus(502)).toBe(false));
  it("0 is not retryable", () => expect(isRetryableStatus(0)).toBe(false));
});

describe("createBbs", () => {
  it("200 with success+id returns the id", async () => {
    const id = await createBbs("https://x/a/", {
      fetchImpl: fakeFetch({ status: 200, body: { success: true, id: "abc" } }),
    });
    expect(id).toBe("abc");
  });

  it("429 throws retryable error", async () => {
    await expect(
      createBbs("https://x/a/", { fetchImpl: fakeFetch({ ok: false, status: 429, body: {} }) })
    ).rejects.toMatchObject({ retryable: true });
  });

  it("503 throws retryable error", async () => {
    await expect(
      createBbs("https://x/a/", { fetchImpl: fakeFetch({ ok: false, status: 503, body: {} }) })
    ).rejects.toMatchObject({ retryable: true });
  });

  it("network failure throws retryable error", async () => {
    await expect(
      createBbs("https://x/a/", { fetchImpl: fakeFetch({ fetchThrows: true }) })
    ).rejects.toMatchObject({ retryable: true });
  });

  it("200 with success:false throws non-retryable", async () => {
    await expect(
      createBbs("https://x/a/", { fetchImpl: fakeFetch({ status: 200, body: { success: false } }) })
    ).rejects.toSatisfy((e) => e instanceof Error && e.retryable === undefined);
  });

  it("200 with success but no id throws non-retryable", async () => {
    await expect(
      createBbs("https://x/a/", { fetchImpl: fakeFetch({ status: 200, body: { success: true } }) })
    ).rejects.toSatisfy((e) => e instanceof Error && e.retryable === undefined);
  });

  it("400 throws non-retryable", async () => {
    await expect(
      createBbs("https://x/a/", { fetchImpl: fakeFetch({ ok: false, status: 400, body: {} }) })
    ).rejects.toSatisfy((e) => e instanceof Error && e.retryable === undefined);
  });

  it("429 with success+id returns the id (no retry — prevents duplicate create)", async () => {
    // ゲートウェイが BBS 作成済みのレスポンスに 429 を被せても、id を捨てずに返す。
    // ここで捨てるとリトライが同 URL に重複 BBS を作ってしまう。
    const id = await createBbs("https://x/a/", {
      fetchImpl: fakeFetch({ ok: false, status: 429, body: { success: true, id: "x" } }),
    });
    expect(id).toBe("x");
  });

  it("503 with success+id returns the id (no retry — prevents duplicate create)", async () => {
    const id = await createBbs("https://x/a/", {
      fetchImpl: fakeFetch({ ok: false, status: 503, body: { success: true, id: "y" } }),
    });
    expect(id).toBe("y");
  });
});

describe("batchLookupBbs", () => {
  it("200 with success+data array returns data", async () => {
    const data = [{ url: "https://x/a/", exists: false }];
    const out = await batchLookupBbs([{ url: "https://x/a/" }], {
      fetchImpl: fakeFetch({ status: 200, body: { success: true, data } }),
    });
    expect(out).toEqual(data);
  });

  it("429 throws retryable error", async () => {
    await expect(
      batchLookupBbs([{ url: "https://x/a/" }], { fetchImpl: fakeFetch({ ok: false, status: 429, body: {} }) })
    ).rejects.toMatchObject({ retryable: true });
  });

  it("503 throws retryable error", async () => {
    await expect(
      batchLookupBbs([{ url: "https://x/a/" }], { fetchImpl: fakeFetch({ ok: false, status: 503, body: {} }) })
    ).rejects.toMatchObject({ retryable: true });
  });

  it("network failure throws retryable error", async () => {
    await expect(
      batchLookupBbs([{ url: "https://x/a/" }], { fetchImpl: fakeFetch({ fetchThrows: true }) })
    ).rejects.toMatchObject({ retryable: true });
  });

  it("non-array data throws non-retryable", async () => {
    await expect(
      batchLookupBbs([{ url: "https://x/a/" }], {
        fetchImpl: fakeFetch({ status: 200, body: { success: true, data: "x" } }),
      })
    ).rejects.toSatisfy((e) => e instanceof Error && e.retryable === undefined);
  });

  it("success:false throws non-retryable", async () => {
    await expect(
      batchLookupBbs([{ url: "https://x/a/" }], { fetchImpl: fakeFetch({ status: 200, body: { success: false } }) })
    ).rejects.toSatisfy((e) => e instanceof Error && e.retryable === undefined);
  });

  it("429 with success+data array returns data (no retry — consistent with createBbs)", async () => {
    const data = [{ url: "https://x/a/", exists: false }];
    const out = await batchLookupBbs([{ url: "https://x/a/" }], {
      fetchImpl: fakeFetch({ ok: false, status: 429, body: { success: true, data } }),
    });
    expect(out).toEqual(data);
  });
});

describe("postJson (network exception handling)", () => {
  it("fetch throwing yields networkError sentinel", async () => {
    const res = await postJson("create", {}, { fetchImpl: fakeFetch({ fetchThrows: true }) });
    expect(res).toEqual({ ok: false, status: 0, networkError: true, json: {} });
  });

  it("response.json() rejecting falls back to empty json", async () => {
    const res = await postJson("create", {}, { fetchImpl: fakeFetch({ status: 200, jsonThrows: true }) });
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(res.networkError).toBe(false);
    expect(res.json).toEqual({});
  });

  it("success path returns parsed json with status", async () => {
    const res = await postJson("create", {}, { fetchImpl: fakeFetch({ status: 200, body: { success: true, id: "z" } }) });
    expect(res).toEqual({ ok: true, status: 200, networkError: false, json: { success: true, id: "z" } });
  });
});

describe("clamp helpers", () => {
  it("clampLookupLimit: 0 falls back to 50", () => expect(clampLookupLimit(0)).toBe(50));
  it("clampLookupLimit: 1 is accepted (boundary)", () => expect(clampLookupLimit(1)).toBe(1));
  it("clampLookupLimit: finite 1.5 is accepted", () => expect(clampLookupLimit(1.5)).toBe(1.5));
  it("clampLookupLimit: NaN falls back to 50", () => expect(clampLookupLimit(NaN)).toBe(50));
  it("clampLookupLimit: -5 falls back to 50", () => expect(clampLookupLimit(-5)).toBe(50));

  it("clampCreateDelay: 0 is valid (boundary, pacing disabled)", () => expect(clampCreateDelay(0)).toBe(0));
  it("clampCreateDelay: -1 falls back to 1200", () => expect(clampCreateDelay(-1)).toBe(1200));
  it("clampCreateDelay: NaN falls back to 1200", () => expect(clampCreateDelay(NaN)).toBe(1200));
  it("clampCreateDelay: 500 is accepted", () => expect(clampCreateDelay(500)).toBe(500));

  it("clampRetryBase: NaN falls back to 2000", () => expect(clampRetryBase(NaN)).toBe(2000));
  it("clampRetryBase: 0 is floored to 500", () => expect(clampRetryBase(0)).toBe(500));
  it("clampRetryBase: 100 is floored to 500", () => expect(clampRetryBase(100)).toBe(500));
  it("clampRetryBase: 800 is accepted above floor", () => expect(clampRetryBase(800)).toBe(800));
  it('clampRetryBase: "" -> Number("") is 0 floored to 500', () => expect(clampRetryBase(Number(""))).toBe(500));

  it("clampMaxRetries: 0 falls back to 5", () => expect(clampMaxRetries(0)).toBe(5));
  it("clampMaxRetries: 1 is accepted (boundary)", () => expect(clampMaxRetries(1)).toBe(1));
  it("clampMaxRetries: NaN falls back to 5", () => expect(clampMaxRetries(NaN)).toBe(5));
  it("clampMaxRetries: finite 2.5 is accepted", () => expect(clampMaxRetries(2.5)).toBe(2.5));
});

// =============================================================================
// provisionMissing（C: 逐次/アトミック書き込み・中途throwでも作成済みid永続・
// 空でも1回書く）+ writeMapAtomic 実 I/O
// =============================================================================

// 実待機しない sleep。provisionMissing は pacing + backoff を sleepImpl に通すので、
// これを注入すると全フローが実待機ゼロで同期的に流れる。
const noWaitSleep = async () => {};

// batchLookup を固定表から、create を url 別レスポンス表から答える fetchImpl。
function makeFetch({ lookupData, createResponder }) {
  return async (url, opts) => {
    const action = new URL(url).searchParams.get("action");
    const body = JSON.parse(opts.body);
    if (action === "batchLookup") {
      return { ok: true, status: 200, json: async () => ({ success: true, data: lookupData(body.urls) }) };
    }
    if (action === "create") {
      return createResponder(body.url);
    }
    throw new Error(`unexpected action ${action}`);
  };
}

function okCreate(id) {
  return { ok: true, status: 200, json: async () => ({ success: true, id }) };
}

function badCreate(status) {
  return { ok: false, status, json: async () => ({ success: false, error: "nope" }) };
}

// 各呼び出し時点の map をスナップショットする writeMap スパイ（アトミック書き込み契約の検証用）。
function makeWriteSpy() {
  const snapshots = [];
  return {
    snapshots,
    writeMap: async (m) => {
      snapshots.push({ ...m });
    },
  };
}

describe("provisionMissing", () => {
  it("existing + new resolves both and persists progressively", async () => {
    const missing = [
      { pagePath: "/posts/old/", url: "https://x/posts/old/" },
      { pagePath: "/posts/new/", url: "https://x/posts/new/" },
    ];
    const next = {};
    const { snapshots, writeMap } = makeWriteSpy();

    const fetchImpl = makeFetch({
      lookupData: (urls) =>
        urls.map((u) => (u.endsWith("/old/") ? { url: u, exists: true, id: "existing-id" } : { url: u, exists: false })),
      createResponder: () => okCreate("created-id"),
    });

    const result = await provisionMissing(missing, next, {
      fetchImpl,
      sleepImpl: noWaitSleep,
      writeMap,
      lookupLimit: 10,
    });

    expect(result["/posts/old/"]).toBe("existing-id");
    expect(result["/posts/new/"]).toBe("created-id");
    // create 後とチャンク末で少なくとも複数回永続化される。
    expect(snapshots.length).toBeGreaterThanOrEqual(2);
    const last = snapshots[snapshots.length - 1];
    expect(last["/posts/old/"]).toBe("existing-id");
    expect(last["/posts/new/"]).toBe("created-id");
  });

  it("progress is persisted before a later create fails (crash safety)", async () => {
    const missing = [
      { pagePath: "/posts/a/", url: "https://x/posts/a/" },
      { pagePath: "/posts/b/", url: "https://x/posts/b/" },
    ];
    const next = {};
    const { snapshots, writeMap } = makeWriteSpy();

    const fetchImpl = makeFetch({
      lookupData: (urls) => urls.map((u) => ({ url: u, exists: false })),
      createResponder: (url) => (url.endsWith("/a/") ? okCreate("id-a") : badCreate(400)),
    });

    await expect(
      provisionMissing(missing, next, { fetchImpl, sleepImpl: noWaitSleep, writeMap, lookupLimit: 10 })
    ).rejects.toThrow(/BBS create failed/);

    // 2件目の create で中断しても、1件目の id は既に永続スナップショットに入っている。
    expect(snapshots.some((snap) => snap["/posts/a/"] === "id-a")).toBe(true);
  });

  it("pre-seeded keys in next are retained in the result", async () => {
    const missing = [{ pagePath: "/posts/new/", url: "https://x/posts/new/" }];
    const next = { "/posts/seed/": "seed-id" };
    const { writeMap } = makeWriteSpy();

    const fetchImpl = makeFetch({
      lookupData: (urls) => urls.map((u) => ({ url: u, exists: false })),
      createResponder: () => okCreate("new-id"),
    });

    const result = await provisionMissing(missing, next, {
      fetchImpl,
      sleepImpl: noWaitSleep,
      writeMap,
      lookupLimit: 10,
    });

    expect(result["/posts/seed/"]).toBe("seed-id");
    expect(result["/posts/new/"]).toBe("new-id");
  });

  it("empty missing still writes once (always-write-once)", async () => {
    const next = { "/posts/seed/": "seed-id" };
    const { snapshots, writeMap } = makeWriteSpy();

    // missing が空のとき fetchImpl は決して呼ばれない。
    const fetchImpl = async () => {
      throw new Error("fetch must not be called for empty missing");
    };

    const result = await provisionMissing([], next, { fetchImpl, sleepImpl: noWaitSleep, writeMap, lookupLimit: 10 });

    expect(snapshots.length).toBe(1);
    expect(snapshots[0]).toEqual({ "/posts/seed/": "seed-id" });
    expect(result["/posts/seed/"]).toBe("seed-id");
  });

  it("lookup result order mismatch throws", async () => {
    const missing = [
      { pagePath: "/posts/a/", url: "https://x/posts/a/" },
      { pagePath: "/posts/b/", url: "https://x/posts/b/" },
    ];
    const { writeMap } = makeWriteSpy();

    const fetchImpl = makeFetch({
      // 結果を逆順で返す → result[0].url != item[0].url。
      lookupData: (urls) => [...urls].reverse().map((u) => ({ url: u, exists: false })),
      createResponder: () => okCreate("id"),
    });

    await expect(
      provisionMissing(missing, {}, { fetchImpl, sleepImpl: noWaitSleep, writeMap, lookupLimit: 10 })
    ).rejects.toThrow(/unexpected result order/);
  });

  it("existing BBS not owned (authorized:false) throws", async () => {
    const missing = [{ pagePath: "/posts/a/", url: "https://x/posts/a/" }];
    const { writeMap } = makeWriteSpy();

    const fetchImpl = makeFetch({
      lookupData: (urls) => urls.map((u) => ({ url: u, exists: true, authorized: false, id: "x" })),
      createResponder: () => okCreate("id"),
    });

    await expect(
      provisionMissing(missing, {}, { fetchImpl, sleepImpl: noWaitSleep, writeMap, lookupLimit: 10 })
    ).rejects.toThrow(/not its owner token/);
  });

  it("existing BBS without id throws", async () => {
    const missing = [{ pagePath: "/posts/a/", url: "https://x/posts/a/" }];
    const { writeMap } = makeWriteSpy();

    const fetchImpl = makeFetch({
      lookupData: (urls) => urls.map((u) => ({ url: u, exists: true })),
      createResponder: () => okCreate("id"),
    });

    await expect(
      provisionMissing(missing, {}, { fetchImpl, sleepImpl: noWaitSleep, writeMap, lookupLimit: 10 })
    ).rejects.toThrow(/without an id/);
  });
});

describe("writeMapAtomic (minimal real I/O)", () => {
  it("writes toToml output and leaves no .tmp behind", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "llll-bbs-"));
    try {
      const target = path.join(dir, "nested", "nostalgic_bbs.toml");
      const map = { "/posts/a/": "id1", "/posts/b/": "id2" };

      await writeMapAtomic(map, target);

      const written = await readFile(target, "utf8");
      expect(written).toBe(toToml(map));

      const entries = await readdir(path.dirname(target));
      expect(entries.some((e) => e.endsWith(".tmp"))).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
