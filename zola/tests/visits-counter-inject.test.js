import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// visits-counter.js の「fetch → 注入」の島の振る舞いテスト（jsdom）。
//
// visits-counter.js の末尾 IIFE は `typeof document !== "undefined"` のとき import 時に1回だけ走り、
// [data-visit-id] から ID を読んで GET /visit?action=increment&id=... を fetch し、
// 返ってきた data.{total,today,yesterday,week,month} を該当 [data-visit-stat] へ formatCount 経由で注入する。
// 失敗系（非200 / success:false / data 欠落 / fetch reject / 不正値）は無言で握りつぶし「---」を残す（PE）。
//
// よって daily-art-lightbox.test.js と同じく各テストは
//   「DOM を組む → vi.resetModules() → グローバル fetch を vi.fn() で差し替え → 動的 import（IIFE 実行）
//    → fetch の Promise 解決（settle）を待つ → 検証」
// の順にする。IIFE は import 時に同期的に fetch を呼ぶが、注入は .then 内（マイクロタスク後）なので
// settle を確実に待ってからアサートする（fetch → res.json → 注入 の2段 then ＋ catch）。
//
// markup は zola/templates/index.html の visits-bar の最小再現:
//   <section class="visits-bar" data-visit-id="...">
//     <span class="stat-num" data-visit-stat="total">---</span> ... (total/today/yesterday/week/month)
//   </section>
// 他島（daily-art 等）の DOM は用意しない＝それらの IIFE は import しない（このテストは visits-counter.js だけ import）。

const MODULE_PATH = "../static/js/visits-counter.js";
const API_PREFIX = "https://api.nostalgic.llll-ll.com/visit";

const STAT_KEYS = ["total", "today", "yesterday", "week", "month"];

// visits-bar の最小再現。id を引数で差し込めるようにし、無 id ケースは visitId=null で属性ごと出さない。
function visitsMarkup(visitId) {
  const idAttr = visitId === null ? "" : ` data-visit-id="${visitId}"`;
  const stats = STAT_KEYS.map(
    (k) => `<span class="stat-num" data-visit-stat="${k}">---</span>`
  ).join("");
  return `<section class="visits-bar"${idAttr}><div class="visits-stats">${stats}</div></section>`;
}

// res.ok=true の JSON レスポンスモックを作る。
function okResponse(json) {
  return { ok: true, json: () => Promise.resolve(json) };
}

// DOM を流し込み、fetch を差し替え、モジュールを再 import して IIFE を走らせる。
async function setupAndImport(html, fetchMock) {
  document.body.innerHTML = html;
  if (fetchMock !== undefined) {
    vi.stubGlobal("fetch", fetchMock);
  }
  vi.resetModules();
  await import(MODULE_PATH);
}

// fetch チェーン（fetch → res.json → 注入 ＋ catch）の settle を確実に待つ。
// マイクロタスクを複数回フラッシュする（then 2段ぶん余裕を持って 0ms タイマを数回挟む）。
async function flush() {
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 0));
  }
}

// 現在の各スロットの textContent をオブジェクトで取る。
function readStats() {
  const out = {};
  for (const k of STAT_KEYS) {
    const el = document.querySelector(`[data-visit-stat="${k}"]`);
    out[k] = el ? el.textContent : undefined;
  }
  return out;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("visits-counter inject (jsdom)", () => {
  describe("正常注入", () => {
    it("increment が success:true + 5値を返すと、5スロットが整形値に置き換わる", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(
          okResponse({
            success: true,
            data: { total: 1234, today: 8, yesterday: 15, week: 27, month: 32 },
          })
        )
      );
      await setupAndImport(visitsMarkup("orber"), fetchMock);
      await flush();
      expect(readStats()).toEqual({
        total: "1,234",
        today: "8",
        yesterday: "15",
        week: "27",
        month: "32",
      });
    });
  });

  describe("increment を1回だけ呼ぶ", () => {
    it("fetch がちょうど1回・URL は action=increment と encodeURIComponent 済み id を含む", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(okResponse({ success: true, data: { total: 1 } }))
      );
      // encodeURIComponent で変化する id（空白）を使い、生 id でなくエンコード済みが乗ることを検証する。
      const rawId = "my visit id";
      await setupAndImport(visitsMarkup(rawId), fetchMock);
      await flush();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain(API_PREFIX);
      expect(url).toContain("action=increment");
      expect(url).not.toContain("action=get");
      expect(url).toContain("id=" + encodeURIComponent(rawId));
      // 生の空白がそのまま乗っていない（エンコードされている）こと。
      expect(url).not.toContain("id=my visit id");
    });
  });

  describe("部分データ（部分耐性）", () => {
    it("data に total だけある → total スロットだけ注入・残り4つは '---'", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(okResponse({ success: true, data: { total: 4096 } }))
      );
      await setupAndImport(visitsMarkup("orber"), fetchMock);
      await flush();
      expect(readStats()).toEqual({
        total: "4,096",
        today: "---",
        yesterday: "---",
        week: "---",
        month: "---",
      });
    });
  });

  describe("res.ok=false（非200）", () => {
    it("全スロット '---' のまま・例外なし", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve({ ok: false, json: () => Promise.resolve({ success: true, data: { total: 1 } }) })
      );
      await setupAndImport(visitsMarkup("orber"), fetchMock);
      await flush();
      expect(readStats()).toEqual({
        total: "---",
        today: "---",
        yesterday: "---",
        week: "---",
        month: "---",
      });
    });
  });

  describe("success:false", () => {
    it("全スロット '---' のまま・例外なし", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(okResponse({ success: false, data: { total: 99 } }))
      );
      await setupAndImport(visitsMarkup("orber"), fetchMock);
      await flush();
      expect(readStats()).toEqual({
        total: "---",
        today: "---",
        yesterday: "---",
        week: "---",
        month: "---",
      });
    });
  });

  describe("data 欠落（{success:true}）", () => {
    it("全スロット '---' のまま・例外なし", async () => {
      const fetchMock = vi.fn(() => Promise.resolve(okResponse({ success: true })));
      await setupAndImport(visitsMarkup("orber"), fetchMock);
      await flush();
      expect(readStats()).toEqual({
        total: "---",
        today: "---",
        yesterday: "---",
        week: "---",
        month: "---",
      });
    });
  });

  describe("fetch reject（ネットワーク失敗）", () => {
    it("全スロット '---' のまま・.catch で握りつぶし test が落ちない", async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error("network down")));
      await setupAndImport(visitsMarkup("orber"), fetchMock);
      await flush();
      expect(readStats()).toEqual({
        total: "---",
        today: "---",
        yesterday: "---",
        week: "---",
        month: "---",
      });
    });
  });

  describe("data-visit-id 不在（PE）", () => {
    it("data-visit-id 属性が無い → fetch を呼ばない・例外なし", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(okResponse({ success: true, data: { total: 1 } }))
      );
      await setupAndImport(visitsMarkup(null), fetchMock);
      await flush();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(readStats()).toEqual({
        total: "---",
        today: "---",
        yesterday: "---",
        week: "---",
        month: "---",
      });
    });

    it("data-visit-id が空文字 → fetch を呼ばない・例外なし", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(okResponse({ success: true, data: { total: 1 } }))
      );
      await setupAndImport(visitsMarkup(""), fetchMock);
      await flush();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("data-visit-id が空白のみ → trim で弾き fetch を呼ばない（空白 id を API に送らない）", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(okResponse({ success: true, data: { total: 1 } }))
      );
      await setupAndImport(visitsMarkup("   "), fetchMock);
      await flush();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("不正値スキップ", () => {
    it("total が負/非数値 → そのスロットは '---'・他の正常値スロットは注入される", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(
          okResponse({
            success: true,
            data: { total: -5, today: "oops", yesterday: 15, week: 27, month: 32 },
          })
        )
      );
      await setupAndImport(visitsMarkup("orber"), fetchMock);
      await flush();
      expect(readStats()).toEqual({
        total: "---", // 負数 → formatCount null → スキップ
        today: "---", // 非数値文字列 → formatCount null → スキップ
        yesterday: "15",
        week: "27",
        month: "32",
      });
    });
  });

  describe("console を汚さない", () => {
    it("失敗系（fetch reject）で console.error / console.warn が呼ばれない", async () => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const fetchMock = vi.fn(() => Promise.reject(new Error("network down")));
      await setupAndImport(visitsMarkup("orber"), fetchMock);
      await flush();
      expect(errSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("ロード中の濃淡ブロック（#48）", () => {
    it("fetch 未解決の間は各スロットが .visit-load ローダ（'---' でも数字でもない）", async () => {
      // 永遠に解決しない fetch でロード中状態を固定する。
      const fetchMock = vi.fn(() => new Promise(() => {}));
      await setupAndImport(visitsMarkup("orber"), fetchMock);
      await flush();
      for (const k of STAT_KEYS) {
        const el = document.querySelector(`[data-visit-stat="${k}"]`);
        const loader = el.querySelector(".visit-load");
        expect(loader).not.toBeNull(); // ローダが注入されている
        expect(loader.getAttribute("aria-hidden")).toBe("true");
        expect(loader.querySelectorAll("i").length).toBe(5); // 離散セル（四角）5個
        // セルは CSS 背景で描くので、要素自体の textContent は空（"---" でも数字でもない）。
        expect(el.textContent).toBe("");
      }
    });

    it("ロード中ローダは成功で数字に置き換わる（ローダが残らない）", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(
          okResponse({
            success: true,
            data: { total: 1234, today: 8, yesterday: 15, week: 27, month: 32 },
          })
        )
      );
      await setupAndImport(visitsMarkup("orber"), fetchMock);
      await flush();
      expect(document.querySelector(".visit-load")).toBeNull(); // ローダは残らない
      expect(readStats()).toEqual({
        total: "1,234",
        today: "8",
        yesterday: "15",
        week: "27",
        month: "32",
      });
    });

    it("ロード中ローダは失敗で '---' に戻る（ローダが残らない）", async () => {
      const fetchMock = vi.fn(() => Promise.reject(new Error("network down")));
      await setupAndImport(visitsMarkup("orber"), fetchMock);
      await flush();
      expect(document.querySelector(".visit-load")).toBeNull(); // ローダは残らない
      expect(readStats()).toEqual({
        total: "---",
        today: "---",
        yesterday: "---",
        week: "---",
        month: "---",
      });
    });
  });
});
