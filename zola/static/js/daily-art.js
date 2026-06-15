// daily-art.js — llll-ll ポータルの「日替わりトップ絵」の島（vanilla JS・依存なし）。
//
// 設計（Issue #6 / Phase 2）:
//   - manifest 先頭（index 0）は Tera がサーバ側で描画済み。この島は「今日のエントリに差し替える」だけ。
//   - JS が読めない / 無効 / 失敗でも、サーバ既定（先頭=01・情報化社会）が見えたまま（PE）。
//   - インデックス算出 dailyIndexForDate() は DOM 非依存の純粋関数として切り出し、テストから import できる。
//
// 仕様:
//   - クライアントの日付（epoch からの日数）を枚数で mod して日替わりローテ（同じ日は同じ絵）。
//   - 表示は『タイトル』の形（鉤括弧つき）。画像は /images/daily/NN.webp。

/**
 * epoch ミリ秒と枚数から、今日の日替わりインデックスを返す純粋関数。DOM 非依存。
 *
 * @param {number} epochMs - Unix epoch からの経過ミリ秒（Date.now() を想定）。
 * @param {number} count - 画像の枚数（manifest の長さ）。
 * @returns {number|null} 0 以上 count 未満のインデックス。count <= 0 のときは null。
 */
function dailyIndexForDate(epochMs, count) {
  if (count <= 0) return null;
  // epoch からの「日数」を枚数で mod ＝ 日替わりローテ（同じ日は同じ絵）。
  return Math.floor(epochMs / 86400000) % count;
}

// テスト用に export（ブラウザでは module ではないので typeof ガード）。
if (typeof module !== "undefined" && module.exports) {
  module.exports = { dailyIndexForDate };
}

(function () {
  // テスト時（module 環境）は DOM 配線を走らせない。
  if (typeof document === "undefined") return;

  const dataEl = document.getElementById("daily-data");
  if (!dataEl) return;

  let list;
  try {
    list = JSON.parse(dataEl.textContent || "[]");
  } catch (e) {
    return; // パース失敗 → サーバ既定のまま（PE）。
  }
  if (!Array.isArray(list) || list.length === 0) return;

  const idx = dailyIndexForDate(Date.now(), list.length);
  if (idx === null) return;
  const entry = list[idx];
  if (!entry || !entry.file) return;

  const img = document.querySelector(".daily-art-img");
  if (img) {
    img.src = "/images/daily/" + entry.file;
    img.alt = entry.title || "";
  }
  const caption = document.querySelector(".daily-art-title");
  if (caption) {
    caption.textContent = "『" + (entry.title || "") + "』";
  }

  // ── ライトボックス（#24）── 日替わり絵タップ → 緑枠モーダルに拡大画像だけを出す。
  //   URL は変えず履歴も積まない（ephemeral）。app-popup.js（.modal-overlay）とは別系統（.lightbox-overlay）。
  //   PE: overlay / トリガ画像が無ければ何もしない。JS 無し/失敗時はサーバ既定の絵が見えたまま壊れない。
  const overlay = document.querySelector(".lightbox-overlay");
  if (!overlay || !img) return;
  const lightboxImg = overlay.querySelector(".lightbox-img");
  if (!lightboxImg || !window.llllLightbox) return;

  // トリガは画像自体。figure は figcaption（『タイトル』）を含むので button 化に不適。
  // i18n ラベルは figure[data-lightbox-label] から読む。
  const figure = img.closest(".daily-art");
  const trigger = img;
  const label = (figure && figure.getAttribute("data-lightbox-label")) || img.alt || "";

  // 拡大画像を配線時に先読みしておく（#46）。サムネ（.daily-art-img）と同 src なのでキャッシュ共有＝
  // 追加転送なし。クリック時には既にロード済みなので、overlay を出した瞬間に正寸で表示され、
  // 「空の緑枠が一瞬出てから縦に広がる」チラつきが起きない。
  lightboxImg.src = img.currentSrc || img.src;

  // 開閉・Escape・背景クリック・focus 復帰は lightbox-core.js に集約。
  window.llllLightbox.bindImageTrigger({
    trigger,
    overlay,
    label,
    getSrc: () => img.currentSrc || img.src,
    getAlt: () => img.alt || "",
  });
})();
