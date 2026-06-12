import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// 言語自動転送の判定ロジック（#41）の振る舞いテスト（jsdom）。
//
// 対象は zola/templates/index.html の <head> 冒頭インライン script の IIFE。
// 英語ルート(/) でのみ発火し、保存言語(localStorage 'llll-lang')を優先、未設定/未対応値のときは
// navigator.language で判定して保存し、en 以外なら location.replace('/<lang>/') で転送する。
// 保存値はホワイトリスト(en/ja/zh/es)で検証し、破損・改変値で /fr/ 等の404へ飛ぶのを防ぐ（ハードニングの肝）。
//
// jsdom の location は不変・navigator も差し替えにくいので、実テンプレからスクリプト本体を文字列抽出し、
// new Function で location/localStorage/navigator を**引数注入**して評価する（replace/保存の副作用を検証できる）。
// posts-content.test.js / products-data.test.js の readFileSync 作法、visits-counter-inject.test.js の
// vi.fn モック作法に倣う。

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexHtml = join(__dirname, "..", "templates", "index.html");

// 実テンプレの最初の <script>...</script> ブロック（＝言語転送 IIFE）を抜き出す。
// このブロックに Tera 補間 {{ }} は無いので、生 JS として new Function に渡して安全。
function extractRedirectScript() {
  const raw = readFileSync(indexHtml, "utf8");
  const m = raw.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("index.html に <script> ブロックが見つからない");
  return m[1];
}

const SCRIPT_BODY = extractRedirectScript();

// 抽出した IIFE を location/localStorage/navigator 注入で実行できる関数にラップする。
const runScript = new Function("location", "localStorage", "navigator", SCRIPT_BODY);

// Map ベースのフェイク localStorage。setItem を throw 化できるようにフックを持つ。
function makeStorage(initial, opts = {}) {
  const map = new Map();
  if (initial !== undefined && initial !== null) map.set("llll-lang", initial);
  const setItem = opts.throwOnSet
    ? vi.fn(() => {
        throw new Error("quota exceeded");
      })
    : vi.fn((k, v) => {
        map.set(k, String(v));
      });
  return {
    getItem: vi.fn((k) => (map.has(k) ? map.get(k) : null)),
    setItem,
    _map: map,
  };
}

// pathname / replace を持つフェイク location。
function makeLocation(pathname = "/") {
  return { pathname, replace: vi.fn() };
}

let errSpy;
let warnSpy;

beforeEach(() => {
  errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("言語自動転送 判定ロジック (jsdom)", () => {
  describe("初回判定（saved 未設定 → navigator で判定して保存）", () => {
    it("navigator=ja-JP → replace('/ja/') し ja を保存する", () => {
      const loc = makeLocation("/");
      const store = makeStorage(null);
      runScript(loc, store, { language: "ja-JP" });
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "ja");
      expect(loc.replace).toHaveBeenCalledWith("/ja/");
    });

    it("navigator=zh-CN → replace('/zh/') し zh を保存する", () => {
      const loc = makeLocation("/");
      const store = makeStorage(null);
      runScript(loc, store, { language: "zh-CN" });
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "zh");
      expect(loc.replace).toHaveBeenCalledWith("/zh/");
    });

    it("navigator=zh-TW → slice(0,2) で zh に丸め replace('/zh/')（境界）", () => {
      const loc = makeLocation("/");
      const store = makeStorage(null);
      runScript(loc, store, { language: "zh-TW" });
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "zh");
      expect(loc.replace).toHaveBeenCalledWith("/zh/");
    });

    it("navigator=es-ES → replace('/es/') し es を保存する", () => {
      const loc = makeLocation("/");
      const store = makeStorage(null);
      runScript(loc, store, { language: "es-ES" });
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "es");
      expect(loc.replace).toHaveBeenCalledWith("/es/");
    });

    it("navigator=en-US → replace を呼ばず en を保存しルートに留まる", () => {
      const loc = makeLocation("/");
      const store = makeStorage(null);
      runScript(loc, store, { language: "en-US" });
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "en");
      expect(loc.replace).not.toHaveBeenCalled();
    });

    it("navigator=fr（未対応言語）→ replace を呼ばず en を保存する", () => {
      const loc = makeLocation("/");
      const store = makeStorage(null);
      runScript(loc, store, { language: "fr" });
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "en");
      expect(loc.replace).not.toHaveBeenCalled();
    });

    it("navigator.language=undefined → 既定 en を保存・留まる", () => {
      const loc = makeLocation("/");
      const store = makeStorage(null);
      runScript(loc, store, { language: undefined });
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "en");
      expect(loc.replace).not.toHaveBeenCalled();
    });

    it("navigator.language='' → 既定 en を保存・留まる", () => {
      const loc = makeLocation("/");
      const store = makeStorage(null);
      runScript(loc, store, { language: "" });
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "en");
      expect(loc.replace).not.toHaveBeenCalled();
    });

    it("navigator=ZH-TW（大文字）→ toLowerCase で zh に正規化し replace('/zh/')", () => {
      const loc = makeLocation("/");
      const store = makeStorage(null);
      runScript(loc, store, { language: "ZH-TW" });
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "zh");
      expect(loc.replace).toHaveBeenCalledWith("/zh/");
    });
  });

  describe("saved 尊重（保存値が有効なら navigator を見ない）", () => {
    it("saved=en + navigator=ja → en を尊重しルートに留まる（保存し直さない）", () => {
      const loc = makeLocation("/");
      const store = makeStorage("en");
      runScript(loc, store, { language: "ja-JP" });
      expect(loc.replace).not.toHaveBeenCalled();
      expect(store.setItem).not.toHaveBeenCalled();
    });

    it("saved=ja + navigator=en → ja を優先し replace('/ja/')（保存し直さない）", () => {
      const loc = makeLocation("/");
      const store = makeStorage("ja");
      runScript(loc, store, { language: "en-US" });
      expect(loc.replace).toHaveBeenCalledWith("/ja/");
      expect(store.setItem).not.toHaveBeenCalled();
    });

    it("saved=zh → replace('/zh/')", () => {
      const loc = makeLocation("/");
      const store = makeStorage("zh");
      runScript(loc, store, { language: "en-US" });
      expect(loc.replace).toHaveBeenCalledWith("/zh/");
      expect(store.setItem).not.toHaveBeenCalled();
    });

    it("saved=es → replace('/es/')", () => {
      const loc = makeLocation("/");
      const store = makeStorage("es");
      runScript(loc, store, { language: "en-US" });
      expect(loc.replace).toHaveBeenCalledWith("/es/");
      expect(store.setItem).not.toHaveBeenCalled();
    });
  });

  describe("ホワイトリスト救済（破損・改変 saved 値で未対応パスへ飛ばない）", () => {
    it("saved=fr（不正・非空）+ navigator=ja-JP → 再判定で replace('/ja/')・ja を保存（/fr/ へ飛ばない）", () => {
      const loc = makeLocation("/");
      const store = makeStorage("fr");
      runScript(loc, store, { language: "ja-JP" });
      // 肝: 不正な saved=fr を信用して replace('/fr/') してはいけない。
      expect(loc.replace).not.toHaveBeenCalledWith("/fr/");
      expect(loc.replace).toHaveBeenCalledWith("/ja/");
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "ja");
    });

    it("saved=xx（任意ゴミ）+ navigator=en-US → 再判定で en を保存・留まる", () => {
      const loc = makeLocation("/");
      const store = makeStorage("xx");
      runScript(loc, store, { language: "en-US" });
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "en");
      expect(loc.replace).not.toHaveBeenCalled();
    });

    it("saved='' （空文字）+ navigator=ja-JP → 未設定扱いで再判定 replace('/ja/')・ja を保存", () => {
      const loc = makeLocation("/");
      const store = makeStorage("");
      runScript(loc, store, { language: "ja-JP" });
      expect(loc.replace).not.toHaveBeenCalledWith("/fr/");
      expect(loc.replace).toHaveBeenCalledWith("/ja/");
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "ja");
    });
  });

  describe("pathname ガード（ルート以外では何もしない）", () => {
    it("pathname=/ja/ + saved 未設定 → replace も setItem も呼ばない", () => {
      const loc = makeLocation("/ja/");
      const store = makeStorage(null);
      runScript(loc, store, { language: "ja-JP" });
      expect(loc.replace).not.toHaveBeenCalled();
      expect(store.setItem).not.toHaveBeenCalled();
      expect(store.getItem).not.toHaveBeenCalled();
    });

    it("pathname=/apps/x/ + saved=ja → replace を呼ばない（ルートでないので発火しない）", () => {
      const loc = makeLocation("/apps/x/");
      const store = makeStorage("ja");
      runScript(loc, store, { language: "en-US" });
      expect(loc.replace).not.toHaveBeenCalled();
      expect(store.setItem).not.toHaveBeenCalled();
    });
  });

  describe("異常系（localStorage.setItem が throw）", () => {
    it("saved 未設定 + setItem throw → 例外を投げず replace は呼ばれない（catch に落ちる）", () => {
      const loc = makeLocation("/");
      const store = makeStorage(null, { throwOnSet: true });
      expect(() => runScript(loc, store, { language: "ja-JP" })).not.toThrow();
      // 保存(setItem)が throw する経路では replace まで到達しない（保存→転送の順なので）。
      expect(loc.replace).not.toHaveBeenCalled();
      expect(errSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("saved=ja（既存値あり・setItem を通らない経路）+ throw 環境 → replace('/ja/') に到達する", () => {
      const loc = makeLocation("/");
      // saved=ja は有効なので setItem を踏まずに replace へ進む。throwOnSet でも転送できる。
      const store = makeStorage("ja", { throwOnSet: true });
      expect(() => runScript(loc, store, { language: "en-US" })).not.toThrow();
      expect(loc.replace).toHaveBeenCalledWith("/ja/");
      expect(errSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("冪等（同じ条件で複数回評価しても安定）", () => {
    it("saved=ja で2回評価 → 2回とも replace('/ja/')", () => {
      const store = makeStorage("ja");
      const loc1 = makeLocation("/");
      const loc2 = makeLocation("/");
      runScript(loc1, store, { language: "en-US" });
      runScript(loc2, store, { language: "en-US" });
      expect(loc1.replace).toHaveBeenCalledWith("/ja/");
      expect(loc2.replace).toHaveBeenCalledWith("/ja/");
    });
  });
});
