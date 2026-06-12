#!/usr/bin/env node
// import-lodestone.mjs — Lodestone export ZIP を Zola blog 記事へ変換する。
//
// 出力方針:
//   - 記事: content/posts/lodestone-ayumi-{n}.ja.md
//   - 画像: static/images/ff14/{original-name}
//   - 本文中の画像URL: /images/ff14/{original-name}
//   - tags: ["FF14"] に統一
//   - export 末尾のコメント欄は移植しない

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const zolaRoot = join(__dirname, "..");
const postsDir = join(zolaRoot, "content", "posts");
const staticImagesDir = join(zolaRoot, "static", "images", "ff14");
const defaultZip = join(
  zolaRoot,
  "..",
  "..",
  "..",
  "private",
  "freeza",
  "input",
  "lodestone_complete_export.zip"
);
const zipPath = process.argv[2] || defaultZip;

if (!existsSync(zipPath)) {
  throw new Error(`ZIP not found: ${zipPath}`);
}

function tomlStr(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    throw new Error("Missing YAML frontmatter");
  }

  const yaml = match[1];
  const data = {};
  let currentList = null;

  for (const line of yaml.split("\n")) {
    const listItem = line.match(/^\s*-\s*(.*)$/);
    if (listItem && currentList) {
      data[currentList].push(unquoteYaml(listItem[1].trim()));
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;

    const key = pair[1];
    const value = pair[2].trim();
    if (value === "") {
      data[key] = [];
      currentList = key;
    } else {
      data[key] = unquoteYaml(value);
      currentList = null;
    }
  }

  return {
    data,
    body: raw.slice(match[0].length),
  };
}

function unquoteYaml(value) {
  const trimmed = String(value).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseDate(value) {
  const match = String(value).match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (!match) {
    throw new Error(`Unsupported date: ${value}`);
  }
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function articleNumber(fileName) {
  const match = basename(fileName).match(/^(\d{3})_歩み(\d+)\./);
  if (!match) {
    throw new Error(`Unsupported article file name: ${fileName}`);
  }
  return Number(match[2]);
}

function stripComments(body) {
  return body
    .replace(/\n## Comments\n[\s\S]*$/u, "\n")
    .replace(/\n---\n\n### [^\n]+ \(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}\)[\s\S]*$/u, "\n");
}

function rewriteImages(body, referencedImages) {
  return body.replace(/\((?:\.\/)?images\/([^)]+)\)/g, (_match, imageName) => {
    referencedImages.add(imageName);
    return `(/images/ff14/${imageName})`;
  });
}

function renderPost({ title, date, body }) {
  return `+++\ntitle = "${tomlStr(title)}"\ndate = ${date}\n\n[extra]\ntags = ["FF14"]\n+++\n\n${body.trim()}\n`;
}

function walkFiles(root) {
  const files = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const st = statSync(path);
    if (st.isDirectory()) {
      files.push(...walkFiles(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

const tmp = mkdtempSync(join(tmpdir(), "lodestone-import-"));

try {
  execFileSync("unzip", ["-q", zipPath, "-d", tmp], { stdio: "inherit" });

  mkdirSync(postsDir, { recursive: true });
  rmSync(staticImagesDir, { recursive: true, force: true });
  mkdirSync(staticImagesDir, { recursive: true });

  const mdFiles = readdirSync(tmp)
    .filter((file) => /^\d{3}_歩み\d+\..*\.md$/u.test(file))
    .sort((a, b) => articleNumber(a) - articleNumber(b));

  const referencedImages = new Set();

  for (const file of mdFiles) {
    const raw = readFileSync(join(tmp, file), "utf8");
    const { data, body } = parseFrontmatter(raw);
    const number = articleNumber(file);
    const convertedBody = rewriteImages(stripComments(body), referencedImages);
    const output = renderPost({
      title: data.title,
      date: parseDate(data.date),
      body: convertedBody,
    });

    writeFileSync(join(postsDir, `lodestone-ayumi-${number}.ja.md`), output);
  }

  const imageFiles = walkFiles(join(tmp, "images"));
  const imageMap = new Map(imageFiles.map((path) => [basename(path), path]));
  for (const imageName of referencedImages) {
    const src = imageMap.get(imageName);
    if (!src) {
      throw new Error(`Referenced image not found in ZIP: ${imageName}`);
    }
    copyFileSync(src, join(staticImagesDir, imageName));
  }

  const copiedImages = readdirSync(staticImagesDir).filter((file) =>
    [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"].includes(extname(file).toLowerCase())
  );

  console.log(`Imported ${mdFiles.length} posts into ${postsDir}`);
  console.log(`Copied ${referencedImages.size} referenced images into ${staticImagesDir}`);
  console.log(`FF14 image directory now has ${copiedImages.length} image files`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
