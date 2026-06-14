// theme-toggle.js — llll-ll ポータルの「テーマトグル」の島（vanilla JS・依存なし・#9）。
//
// 設計:
//   - 既定はダーク固定（#60）。OS の prefers-color-scheme には追従しない（btop 黒×緑が初回ダークで開く）。
//     手動トグルでライト/ダークを上書きし localStorage('llll-theme') に保持する。
//   - 白フラッシュ防止の「paint 前に data-theme を当てる」処理は _theme.html のインライン script が担当。
//     この島は「トグル UI の配線」＋「初期表示で正しいアイコン/aria/BBS テーマに合わせる」だけ。
//   - パレット切替自体は CSS（:root[data-theme="light"] のときだけライト上書き）。JS は data-theme を出し入れするのみ。
//   - **BBS テーマ連動**（kako-jun）: ライト時は <nostalgic-bbs theme="light">、ダーク時は "retro"。
//   - PE: JS 無効なら四角ボタン（既定=塗り＝ダーク）が無反応で残るだけ（既定ダークのまま）で壊れない。

var STORAGE_KEY = "llll-theme";

// ── 純粋ロジック（DOM 非依存・テストから import 可能）──

/** 保存値から適用すべきテーマ('light'|'dark')を決める。保存が 'light' のときだけライト、
 *  それ以外（'dark'・null・不正値）は既定ダーク（#60・OS の prefers-color-scheme には追従しない）。 */
function resolveTheme(stored) {
  return stored === "light" ? "light" : "dark";
}

/** トグル先のテーマ。 */
function nextTheme(current) {
  return current === "light" ? "dark" : "light";
}

/** テーマに対応する <nostalgic-bbs> の theme 属性値。ライト=light / ダーク=retro（btop 同系）。 */
function bbsThemeFor(theme) {
  return theme === "light" ? "light" : "retro";
}

// トグルボタンのアイコンは CSS 描画の四角（塗り=dark / 白抜き=light・#55）。表示は aria-pressed で CSS が切替えるので、
// JS は文字アイコンを持たない（旧 iconFor は廃止）。

// テスト用に export（ブラウザでは module ではないので typeof ガード）。
if (typeof module !== "undefined" && module.exports) {
  module.exports = { resolveTheme, nextTheme, bbsThemeFor, STORAGE_KEY };
}

// ── DOM 配線 ──

(function () {
  if (typeof document === "undefined") return;

  function storedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  // テーマを適用: <html data-theme> を出し入れし、UI（アイコン/aria）と BBS テーマを同期する。
  function apply(theme, persist) {
    var root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {}
    }
    // トグルボタンの aria-pressed（a11y・トグル状態）を更新。四角の塗り/白抜きは data-theme で CSS が描く（#55）。
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
    }
    // BBS テーマ連動（要素があれば。bbs.js が後から upgrade しても属性値は引き継がれる）。
    var bbs = document.querySelector("nostalgic-bbs");
    if (bbs) bbs.setAttribute("theme", bbsThemeFor(theme));
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    // 初期表示: 保存値から現テーマを確定し（無ければ既定ダーク）、アイコン/aria/BBS を合わせる（persist しない）。
    var current = resolveTheme(storedTheme());
    apply(current, false);

    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        // 現在の実効テーマ（data-theme を最優先・無ければ保存値・無ければ既定ダーク）から反転。
        var now = resolveTheme(document.documentElement.getAttribute("data-theme") || storedTheme());
        apply(nextTheme(now), true);
      });
    }
  });
})();
