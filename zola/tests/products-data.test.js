import { describe, it, expect } from "vitest";
// JSON はテストファイル基準で Vite が解決・パースする（jsdom 下では import.meta.url が
// file:// にならず fs+URL が使えないため、直接 import が確実）。
import products from "../data/products.json";

// products.json は4言語サイト（en/ja/zh/es）のデータ正本。
// #14 で日本語(ja)を master にした。en/zh/es の title/description は省略可で、
// テンプレ（index.html / app.html）は表示言語のキーが欠けると **ja にフォールバック**する。
// draft:true のエントリは「公開予定だが未完成」の記録で、説明文を持たず描画もされない（grid/詳細ページ対象外）。
//
// 契約:
//   - 全エントリが非空の文字列 id を持ち、id は一意。
//   - 公開エントリ（!draft）は **title.ja / description.ja を非空**で必ず持つ
//     （master が欠けると、その言語にフォールバックする先が無く表示が空になる）。

const released = products.filter((p) => !p.draft);

describe("products.json", () => {
  it("配列で1件以上ある", () => {
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
  });

  it("全エントリが文字列の id を持つ", () => {
    const bad = products.filter((p) => typeof p.id !== "string" || !p.id.trim());
    expect(bad.map((p) => JSON.stringify(p))).toEqual([]);
  });

  it("id は重複しない", () => {
    const ids = products.map((p) => p.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect([...new Set(dup)]).toEqual([]);
  });

  it("アプリ一覧の先頭は注目4件を指定順で並べる", () => {
    expect(products.slice(0, 4).map((p) => p.id)).toEqual([
      "orber",
      "machigai-salad",
      "avel",
      "osaka-kenpo",
    ]);
  });

  it("注目フラグは指定4件だけに立てる", () => {
    expect(products.filter((p) => p.featured).map((p) => p.id)).toEqual([
      "orber",
      "machigai-salad",
      "avel",
      "osaka-kenpo",
    ]);
  });

  it("公開エントリ（!draft）が1件以上ある", () => {
    expect(released.length).toBeGreaterThan(0);
  });

  // ja マスター: 公開エントリは title.ja / description.ja を非空で持つ。
  for (const field of ["title", "description"]) {
    it(`公開エントリは全件 ${field}.ja を非空文字列で持つ`, () => {
      const missing = released
        .filter(
          (p) =>
            !(
              p[field] &&
              typeof p[field].ja === "string" &&
              p[field].ja.trim()
            )
        )
        .map((p) => p.id);
      expect(missing, `欠落 (${field}.ja): ${missing.join(", ")}`).toEqual([]);
    });
  }
});
