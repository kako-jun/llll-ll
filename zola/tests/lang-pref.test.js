import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// langbar クリック保存（#41）の配線テスト（jsdom）。
//
// static/js/lang-pref.js は import 時に1回だけ走り、`.langbar a.lang[data-lang]` を全部拾って
// click で data-lang を localStorage('llll-lang') に保存する。これにより英語ルート(/) の自動転送が
// 次回その言語を尊重する（例: ja の人が en を押す → en 保存 → 以後ルートは英語のまま留まれる）。
//
// daily-art-lightbox.test.js / visits-counter-inject.test.js に倣い、各テストは
//   「DOM を組む → localStorage を差し替え → vi.resetModules() → 動的 import（IIFE 実行＝再配線）
//    → click を dispatch → setItem を検証」
// の順にする。現在言語は <span class="lang active">（data-lang 無し）なのでセレクタが拾わないことも固定する。

const MODULE_PATH = "../static/js/lang-pref.js";

// 実テンプレ index.html の nav 最小再現。active（現在言語）は span で data-lang を持たない。
//   <nav class="langbar"><span class="lang active">en</span>
//     <a class="lang" data-lang="ja" href="/ja/">ja</a> ...
// active を引数で選べるようにする（その言語だけ span 化）。
function langbarMarkup(active = "en") {
  const langs = ["en", "ja", "zh", "es"];
  const items = langs
    .map((l) =>
      l === active
        ? `<span class="lang active" aria-current="true">${l}</span>`
        : `<a class="lang" data-lang="${l}" href="/${l === "en" ? "" : l + "/"}">${l}</a>`
    )
    .join("");
  return `<nav class="langbar" aria-label="language">${items}</nav>`;
}

// Map ベースのフェイク localStorage。setItem を throw 化できる。
function makeStorage(opts = {}) {
  const map = new Map();
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
    removeItem: vi.fn((k) => map.delete(k)),
    clear: vi.fn(() => map.clear()),
    _map: map,
  };
}

let store;

// DOM を流し込み localStorage を差し替え、モジュールを再 import して IIFE を走らせる（＝再配線）。
async function setupAndImport(html, storage) {
  document.body.innerHTML = html;
  store = storage || makeStorage();
  vi.stubGlobal("localStorage", store);
  vi.resetModules();
  await import(MODULE_PATH);
}

// data-lang を持つリンクを取得して click する。
function clickLang(lang) {
  const el = document.querySelector(`.langbar a.lang[data-lang="${lang}"]`);
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  return el;
}

// 実 <a href> は jsdom が遷移を試みて "Not implemented: navigation" を console.error に吐く。
// それは code under test の振る舞いでなくテスト配線のノイズなので、document の capture 段で
// preventDefault して遷移を抑える（lang-pref.js の保存リスナーは bubble 段で別途走るので影響しない）。
function suppressNav(e) {
  e.preventDefault();
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.addEventListener("click", suppressNav, true);
});

afterEach(() => {
  document.removeEventListener("click", suppressNav, true);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("langbar クリック保存 (jsdom)", () => {
  describe("言語リンクのクリックで保存", () => {
    it("ja リンクのクリックで llll-lang=ja を保存", async () => {
      await setupAndImport(langbarMarkup("en"));
      clickLang("ja");
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "ja");
    });

    it("en リンクのクリックで llll-lang=en を保存（英語に居続けられる主経路）", async () => {
      // active を ja にして en をリンク（クリック可能）にする。
      await setupAndImport(langbarMarkup("ja"));
      clickLang("en");
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "en");
    });

    it("zh リンクのクリックで llll-lang=zh を保存", async () => {
      await setupAndImport(langbarMarkup("en"));
      clickLang("zh");
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "zh");
    });

    it("es リンクのクリックで llll-lang=es を保存", async () => {
      await setupAndImport(langbarMarkup("en"));
      clickLang("es");
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "es");
    });
  });

  describe("現在言語（active span）は拾わない", () => {
    it("<span class='lang active'>（data-lang 無し）のクリックでは保存しない", async () => {
      await setupAndImport(langbarMarkup("en"));
      const activeSpan = document.querySelector(".langbar .lang.active");
      expect(activeSpan.tagName).toBe("SPAN");
      expect(activeSpan.getAttribute("data-lang")).toBe(null);
      activeSpan.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(store.setItem).not.toHaveBeenCalled();
    });
  });

  describe("異常系（localStorage.setItem が throw）", () => {
    it("クリックで setItem が throw しても例外を投げない・console を汚さない", async () => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      await setupAndImport(langbarMarkup("en"), makeStorage({ throwOnSet: true }));
      expect(() => clickLang("ja")).not.toThrow();
      expect(store.setItem).toHaveBeenCalledWith("llll-lang", "ja");
      expect(errSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("progressive enhancement / ガード", () => {
    it(".langbar が無い DOM に import → 例外を投げず1件もバインドしない", async () => {
      // langbar markup を含まない DOM。import 時に querySelectorAll が空 → ループ0回。
      await expect(
        setupAndImport("<main><p>no langbar here</p></main>")
      ).resolves.not.toThrow();
      // 念のため: 仮に lang リンクを後付けで置いてクリックしても、バインドされていないので保存されない。
      document.body.innerHTML +=
        '<nav class="langbar"><a class="lang" data-lang="ja" href="#">ja</a></nav>';
      document
        .querySelector('.langbar a.lang[data-lang="ja"]')
        .dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
      expect(store.setItem).not.toHaveBeenCalled();
    });
  });
});
