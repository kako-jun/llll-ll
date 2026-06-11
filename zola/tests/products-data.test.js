import { describe, it, expect } from "vitest";
// JSON はテストファイル基準で Vite が解決・パースする（jsdom 下では import.meta.url が
// file:// にならず fs+URL が使えないため、直接 import が確実）。
import products from "../data/products.json";

// products.json は4言語サイト（en/ja/zh/es）のデータ正本。
// テンプレ（index.html / app.html）は表示言語のキーが欠けると en にフォールバックするため、
// 最低でも全エントリが title/description の **en を非空で持つ**ことがビルド成立の前提。
// （en 欠落 → 全言語ビルドが落ちる。zh/es 欠落 → その言語で en が出る＝多言語の意味が消える。）
// ここで4言語完備を機械的に保証し、データ追加時の取りこぼしを test 時点で大きな声で落とす。

const LANGS = ["en", "ja", "zh", "es"];

describe("products.json i18n completeness", () => {
  it("配列で1件以上ある", () => {
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
  });

  it("全エントリが文字列の id を持つ", () => {
    const bad = products.filter((p) => typeof p.id !== "string" || !p.id.trim());
    expect(bad.map((p) => JSON.stringify(p))).toEqual([]);
  });

  for (const field of ["title", "description"]) {
    describe(field, () => {
      for (const lang of LANGS) {
        it(`全エントリが ${field}.${lang} を非空文字列で持つ`, () => {
          const missing = products
            .filter(
              (p) =>
                !(
                  p[field] &&
                  typeof p[field][lang] === "string" &&
                  p[field][lang].trim()
                )
            )
            .map((p) => p.id);
          expect(missing, `欠落 (${field}.${lang}): ${missing.join(", ")}`).toEqual(
            []
          );
        });
      }
    });
  }
});
