#!/usr/bin/env node
// gen-app-pages.mjs — products.json から per-app の Zola ページ stub を生成する（Issue #13 / #5）。
//
// 役割:
//   - `zola/data/products.json` を読み、各アプリ × 4言語（en/ja/zh/es）の content stub を生成する。
//   - frontmatter は最小スタブのみ。詳細描画は app.html が load_data で products.json から引く（DRY）。
//   - `path` を明示して URL を確定する:
//       en  → `apps/{id}`      = /apps/{id}/
//       ja  → `ja/apps/{id}`   = /ja/apps/{id}/
//       zh  → `zh/apps/{id}`   = /zh/apps/{id}/
//       es  → `es/apps/{id}`   = /es/apps/{id}/
//     ※ path を明示すると Zola は言語接頭辞を自動付与しないため、ja/zh/es は path 側に接頭辞を含める。
//
// ファイル名規約（重要）:
//   - Zola は default_language + 多言語設定下で `{name}.{lang}.md` の `.{lang}` を言語コードとして解釈する。
//     そのため id に "." を含む（chillout.nvim）と `chillout.nvim.md` の `.nvim` が言語コード扱いになり
//     ビルドが落ちる。よって content のファイル名は id の "." を "-" に置換した slug を使う:
//       chillout.nvim → chillout-nvim.md / chillout-nvim.ja.md / ...
//     URL（path）は id のまま（apps/chillout.nvim）なので公開 URL は変わらない。
//   - 先頭数字 id（3min）はファイル名・path とも問題なし（slugify は path 明示で回避済み）。
//
// 運用:
//   - 依存なし（Node ESM 標準のみ）。`node zola/scripts/gen-app-pages.mjs` で走る。
//   - 冪等。products.json を変えたら再実行し、生成された content/apps/*.md をコミットする。
//   - products.json に無くなった id の古い *.md（全言語）は掃除する（_index*.md は残す）。

import { readFileSync, writeFileSync, readdirSync, unlinkSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const zolaRoot = join(__dirname, ".."); // scripts/ の親 = zola/
const productsPath = join(zolaRoot, "data", "products.json");
const appsDir = join(zolaRoot, "content", "apps");

// 既定言語(en)は接頭辞なし、それ以外は path に接頭辞を付ける。config.toml と一致させること。
export const DEFAULT_LANG = "en";
export const EXTRA_LANGS = ["ja", "zh", "es"];

/** TOML 文字列リテラル用にエスケープする（basic string 内）。 */
export function tomlStr(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/** id → content ファイル名の slug（"." を "-" に。Zola の言語コード誤認を避ける）。 */
export function fileSlug(id) {
  return String(id).replace(/\./g, "-");
}

/** 1アプリ × 1言語分の frontmatter スタブを組み立てる。
 *  lang が既定言語なら path に接頭辞なし、それ以外は "/{lang}" を前置する。 */
export function renderPage(app, lang) {
  const title = (app.title && (app.title[lang] || app.title.en || app.title.ja)) || app.id;
  const urlPath = lang === DEFAULT_LANG ? `apps/${app.id}` : `${lang}/apps/${app.id}`;
  return [
    "+++",
    `title = "${tomlStr(title)}"`,
    `path = "${tomlStr(urlPath)}"`, // ← URL を確定（slugify 回避＋言語接頭辞）
    `template = "app.html"`,
    "",
    "[extra]",
    `app_id = "${tomlStr(app.id)}"`,
    "+++",
    "",
  ].join("\n");
}

/** app × lang のファイル名（en は無印、他は .lang を挟む）。 */
export function fileName(slug, lang) {
  return lang === DEFAULT_LANG ? `${slug}.md` : `${slug}.${lang}.md`;
}

/** products から「生成されるべきファイル名」の集合を作る（slug × 全言語）。
 *  !app || !app.id はスキップ（_index 系はここには含めない・別管理）。 */
export function computeWantedFiles(products) {
  const wanted = new Set();
  for (const app of products) {
    if (!app || !app.id) continue;
    const slug = fileSlug(app.id);
    for (const lang of [DEFAULT_LANG, ...EXTRA_LANGS]) {
      wanted.add(fileName(slug, lang));
    }
  }
  return wanted;
}

/** 掃除対象から除外すべき _index 系ファイルか（_index.md / _index.{lang}.md）。 */
export function isProtectedIndex(filename) {
  return filename === "_index.md" || /^_index\.[a-z]{2}\.md$/.test(filename);
}

function main() {
  const products = JSON.parse(readFileSync(productsPath, "utf8"));
  mkdirSync(appsDir, { recursive: true });

  // apps セクション（リスト頁は不要。子ページ /apps/{id}/ だけ出したい）。
  // render = false でも子ページは生成される。言語別 _index も用意し ja/zh/es 配下のセクションを成立させる。
  const indexMd = ["+++", "render = false", "+++", ""].join("\n");
  writeFileSync(join(appsDir, "_index.md"), indexMd);
  for (const lang of EXTRA_LANGS) {
    writeFileSync(join(appsDir, `_index.${lang}.md`), indexMd);
  }

  const wanted = computeWantedFiles(products);
  let count = 0;
  for (const app of products) {
    if (!app || !app.id) continue;
    const slug = fileSlug(app.id);
    for (const lang of [DEFAULT_LANG, ...EXTRA_LANGS]) {
      writeFileSync(join(appsDir, fileName(slug, lang)), renderPage(app, lang));
    }
    count++;
  }

  // products.json から消えた古いページを掃除（全言語・_index 系は残す）。
  for (const f of readdirSync(appsDir)) {
    if (!f.endsWith(".md")) continue;
    if (isProtectedIndex(f)) continue;
    if (!wanted.has(f)) unlinkSync(join(appsDir, f));
  }

  console.log(`generated ${count} apps × ${1 + EXTRA_LANGS.length} languages into content/apps/`);
}

// エントリガード: 直接実行された時だけ main() を走らせる（import 時は I/O を起こさない）。
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
