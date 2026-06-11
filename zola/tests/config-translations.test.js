import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// config.toml の翻訳キー網羅。Zola は欠落キーをエラーにせずキー名をそのまま素出しするため、
// en の [translations] にあるキーが ja/zh/es の [languages.xx.translations] に全て揃っているかを守る。
// （依存追加を避けるため簡易パース。値は見ず、各セクション内の `key = ...` の左辺だけ集める。）

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, "..", "config.toml");
const config = readFileSync(configPath, "utf8");

/** TOML 本文から、指定ヘッダ（[section]）直後〜次のヘッダ手前までのキー左辺集合を取り出す。 */
function translationKeys(toml, header) {
  const lines = toml.split(/\r?\n/);
  const keys = new Set();
  let inSection = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("[")) {
      inSection = line === header;
      continue;
    }
    if (!inSection) continue;
    if (line === "" || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z0-9_]+)\s*=/);
    if (m) keys.add(m[1]);
  }
  return keys;
}

const baseKeys = translationKeys(config, "[translations]");

describe("config.toml translation key coverage", () => {
  it("既定言語(en) の [translations] にキーが存在する（パースの健全性）", () => {
    expect(baseKeys.size).toBeGreaterThan(0);
    // 代表キーが拾えていること。
    expect(baseKeys.has("welcome")).toBe(true);
  });

  for (const lang of ["ja", "zh", "es"]) {
    it(`${lang} は en の全翻訳キーを揃えている（欠落でキー名素出し事故を防ぐ）`, () => {
      const langKeys = translationKeys(config, `[languages.${lang}.translations]`);
      const missing = [...baseKeys].filter((k) => !langKeys.has(k));
      expect(missing).toEqual([]);
    });
  }
});
