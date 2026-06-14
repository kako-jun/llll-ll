// visits-counter.js — llll-ll ポータルの「訪問カウンタ」の島（vanilla JS・依存なし）。
//
// 設計（Issue #8 / Phase 2・カウンタのみ）:
//   - visits バーの 5つの .stat-num は Tera が「---」プレースホルダで描画済み。
//     この島は Nostalgic API を increment で叩き、返ってきた数値を該当 .stat-num に注入するだけ。
//   - JS が読めない / 無効 / API 失敗でも「---」が見えたまま壊れない（PE）。例外も投げず無言で握りつぶす。
//   - 整形 formatCount() は DOM 非依存の純粋関数として切り出し、テストから import できる。
//
// 仕様:
//   - [data-visit-id] を持つ visits セクションから ID を読む。無ければ何もしない。
//   - GET /visit?action=increment&id=... を叩く（訪問を数える趣旨。サーバ側で重複排除）。
//   - res.ok かつ json.success かつ json.data を確認し、total/today/yesterday/week/month を
//     対応する [data-visit-stat="..."] の textContent へ注入する。
//   - 数値は固定 "," 3桁区切り（toLocaleString はロケール揺れがあるので使わない）。
//     不正値（非数値・負・NaN・非有限）は注入せず「---」のまま残す。

var VISITS_API_BASE = "https://api.nostalgic.llll-ll.com";

/**
 * 数値を固定 "," 区切り（3桁）に整形する純粋関数。DOM・ロケール非依存。
 *
 * @param {unknown} n - 整形対象。number もしくは数値文字列を想定。
 * @returns {string|null} 整形済み文字列（例: 1234 -> "1,234"）。不正値（非数値・負・非有限）は null。
 */
function formatCount(n) {
  // 数値文字列も受けるが、ロケールや空文字に依存しないよう厳格に判定する。
  var num = typeof n === "number" ? n : typeof n === "string" && n.trim() !== "" ? Number(n) : NaN;
  if (typeof num !== "number" || !isFinite(num) || num < 0) return null;
  // 整数部だけを 3桁区切り（カウンタは整数。小数は来ない想定だが念のため切り捨て）。
  var int = Math.floor(num);
  var s = String(int);
  // 後ろから3桁ごとに "," を挿入。
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// テスト用に export（ブラウザでは module ではないので typeof ガード）。
if (typeof module !== "undefined" && module.exports) {
  module.exports = { formatCount };
}

var STAT_KEYS = ["total", "today", "yesterday", "week", "month"];

(function () {
  // テスト時（module 環境）は DOM 配線を走らせない。
  if (typeof document === "undefined") return;

  var section = document.querySelector("[data-visit-id]");
  if (!section) return;
  var id = (section.getAttribute("data-visit-id") || "").trim();
  if (!id) return; // PE: ID 未設定/空白のみなら何もしない（空白だけの id を API に送らない）。

  // fetch 非対応環境（PE）。
  if (typeof fetch !== "function") return;

  // ロード中は各スロットの "---" を動くローダ（.visit-load）に差し替える（#48・kako-jun 指示）。
  // JS 有効時のみ＝no-JS は "---" のまま（PE）。見た目は CSS の離散セル（単色の四角＋境界ギャップ）で、
  // 明るいセルが左→右へ流れる＝フォント非依存。span に 5 セル(<i>)を挿す（描画は CSS）。
  function showLoading() {
    for (var i = 0; i < STAT_KEYS.length; i++) {
      var el = section.querySelector('[data-visit-stat="' + STAT_KEYS[i] + '"]');
      if (!el) continue;
      el.textContent = ""; // "---" を消す。
      var bar = document.createElement("span");
      bar.className = "visit-load";
      bar.setAttribute("aria-hidden", "true");
      for (var c = 0; c < 5; c++) bar.appendChild(document.createElement("i")); // 離散セル（四角）
      el.appendChild(bar);
    }
  }

  // 失敗時は全スロットを "---" に戻す（ローダを回し続けない＝「読み込み中」の嘘をつかない・PE）。
  function resetToDash() {
    for (var i = 0; i < STAT_KEYS.length; i++) {
      var el = section.querySelector('[data-visit-stat="' + STAT_KEYS[i] + '"]');
      if (el) el.textContent = "---";
    }
  }

  var url = VISITS_API_BASE + "/visit?action=increment&id=" + encodeURIComponent(id);

  showLoading();

  fetch(url)
    .then(function (res) {
      if (!res || !res.ok) return null; // 非200 は握りつぶす。
      return res.json();
    })
    .then(function (json) {
      if (!json || json.success !== true || !json.data) {
        resetToDash(); // success:false / data 欠落 はローダを止めて "---" へ。
        return;
      }
      var data = json.data;
      for (var i = 0; i < STAT_KEYS.length; i++) {
        var key = STAT_KEYS[i];
        var el = section.querySelector('[data-visit-stat="' + key + '"]');
        if (!el) continue; // 注入対象が無い stat はスキップ。
        var formatted = formatCount(data[key]);
        el.textContent = formatted === null ? "---" : formatted; // 不正値は "---"（ローダを残さない）。
      }
    })
    .catch(function () {
      // fetch 失敗・JSON パース失敗など全て握りつぶす（PE）。console を汚さない。
      resetToDash();
    });
})();
