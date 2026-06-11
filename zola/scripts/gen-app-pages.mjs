#!/usr/bin/env node
// gen-app-pages.mjs — products.json から per-app の Zola ページ stub を生成する（Issue #13）。
//
// 役割:
//   - `zola/data/products.json` を読み、各アプリにつき `zola/content/apps/{id}.md` を生成する。
//   - frontmatter は最小スタブのみ。詳細描画は app.html が load_data で products.json から引く（DRY）。
//   - `path` を明示して URL を /apps/{id}/ に確定する。id の "."（chillout.nvim）や
//     先頭数字（3min）が slugify で化けないよう、ここで固定する。
//   - apps セクション化のため `zola/content/apps/_index.md` も生成する。
//
// 運用:
//   - 依存なし（Node ESM 標準のみ）。`node zola/scripts/gen-app-pages.mjs` で走る。
//   - 冪等。products.json を変えたら再実行し、生成された content/apps/*.md をコミットする。
//   - products.json に無くなった id の古い *.md は掃除する（_index.md は残す）。

import { readFileSync, writeFileSync, readdirSync, unlinkSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const zolaRoot = join(__dirname, ".."); // scripts/ の親 = zola/
const productsPath = join(zolaRoot, "data", "products.json");
const appsDir = join(zolaRoot, "content", "apps");

/** TOML 文字列リテラル用にエスケープする（basic string 内）。 */
function tomlStr(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/** 1アプリ分の frontmatter スタブを組み立てる。 */
function renderPage(app) {
  const title = (app.title && app.title.ja) || app.id;
  return [
    "+++",
    `title = "${tomlStr(title)}"`,
    `path = "apps/${app.id}"`, // ← URL を /apps/{id}/ に確定（slugify を回避）
    `template = "app.html"`,
    "",
    "[extra]",
    `app_id = "${tomlStr(app.id)}"`,
    "+++",
    "",
  ].join("\n");
}

function main() {
  const products = JSON.parse(readFileSync(productsPath, "utf8"));
  mkdirSync(appsDir, { recursive: true });

  // apps セクション（リスト頁は不要。子ページ /apps/{id}/ だけ出したい）。
  // render = false でも子ページは生成される（zola build で検証済み）。
  const indexMd = ["+++", "render = false", "+++", ""].join("\n");
  writeFileSync(join(appsDir, "_index.md"), indexMd);

  const wanted = new Set();
  for (const app of products) {
    if (!app || !app.id) continue;
    const file = `${app.id}.md`;
    wanted.add(file);
    writeFileSync(join(appsDir, file), renderPage(app));
  }

  // products.json から消えた古いページを掃除（_index.md は残す）。
  for (const f of readdirSync(appsDir)) {
    if (f === "_index.md") continue;
    if (!f.endsWith(".md")) continue;
    if (!wanted.has(f)) unlinkSync(join(appsDir, f));
  }

  console.log(`generated ${wanted.size} app pages into content/apps/`);
}

main();
