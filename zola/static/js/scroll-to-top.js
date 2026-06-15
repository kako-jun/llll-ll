// scroll-to-top.js — ブログ（記事/一覧）の「上へ戻る」ボタンの島（vanilla JS・依存なし）。
//
// 設計:
//   - 黒×緑の btop パネルと同パレットの小さな四角ボタンを右下に固定する（CSS 変数で light/dark に追従）。
//   - 長文記事を下まで読んだときだけ出す。既定は非表示で、閾値より下へスクロールしたら .is-visible を付ける。
//   - PE: マークアップは素の <a href="#top">。JS 無しでも <noscript> でボタンを出し、押せば #top へ飛ぶ。
//     JS 有りのときは preventDefault して scrollTo({behavior:"smooth"}) で URL にハッシュを残さず滑らかに上る。
//   - prefers-reduced-motion のときは smooth をやめて即時ジャンプにする。

// ── 純粋ロジック（DOM 非依存・テストから import 可能）──

/** 現在のスクロール量が閾値を超えていればボタンを出す（true）。 */
function shouldShow(scrollY, threshold) {
  return scrollY > threshold;
}

// テスト用に export（ブラウザでは module ではないので typeof ガード）。
if (typeof module !== "undefined" && module.exports) {
  module.exports = { shouldShow };
}

// ── DOM 配線 ──
(function () {
  if (typeof document === "undefined") return;

  var THRESHOLD = 320; // px。これより下へスクロールしたら出す（長文の途中以降）。

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    var btn = document.querySelector(".to-top-btn");
    if (!btn) return;

    function sync() {
      var y = window.scrollY || window.pageYOffset || 0;
      btn.classList.toggle("is-visible", shouldShow(y, THRESHOLD));
    }

    // 初期表示を決める（リロード位置が下方のこともある）。
    sync();
    window.addEventListener("scroll", sync, { passive: true });

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var reduce =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      btn.blur();
    });
  });
})();
