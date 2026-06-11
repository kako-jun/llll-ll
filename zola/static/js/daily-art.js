// daily-art.js — llll-ll ポータルの「日替わりトップ絵」の島（vanilla JS・依存なし）。
//
// 設計（Issue #6 / Phase 2）:
//   - manifest 先頭（index 0）は Tera がサーバ側で描画済み。この島は「今日のエントリに差し替える」だけ。
//   - JS が読めない / 無効 / 失敗でも、サーバ既定（先頭=01・情報化社会）が見えたまま（PE）。
//   - インデックス算出 dailyIndexForDate() は DOM 非依存の純粋関数として切り出し、テストから import できる。
//
// 仕様:
//   - クライアントの日付（epoch からの日数）を枚数で mod して日替わりローテ。今は1枚なので常に 0。
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
  const closeBtn = overlay.querySelector(".lightbox-close");
  if (!lightboxImg) return;

  // トリガは figure（無ければ img 自体）。i18n ラベルは figure[data-lightbox-label] から読む。
  const figure = img.closest(".daily-art");
  const trigger = figure || img;
  const label = (figure && figure.getAttribute("data-lightbox-label")) || img.alt || "";

  // トリガを interactive 化（PE: JS が動いたときだけ button 化する。素の HTML は plain image）。
  trigger.setAttribute("role", "button");
  trigger.setAttribute("tabindex", "0");
  if (label) trigger.setAttribute("aria-label", label);

  let isOpen = false;
  let lastTrigger = null; // 開いた瞬間の activeElement（閉じたら focus を戻す）。

  function openLightbox() {
    if (isOpen) return;
    lastTrigger = document.activeElement;
    // 現在表示中（今日の絵に差し替わった後）の src/alt を拡大側へ同期。
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || "";
    overlay.hidden = false;
    document.body.classList.add("modal-open");
    isOpen = true;
    if (closeBtn && typeof closeBtn.focus === "function") closeBtn.focus();
  }

  function closeLightbox() {
    if (!isOpen) return;
    overlay.hidden = true;
    document.body.classList.remove("modal-open");
    isOpen = false;
    // 開く時に保持したトリガへ focus を戻す（消えていれば何もしない）。
    const target = lastTrigger;
    lastTrigger = null;
    if (target && typeof target.focus === "function" && document.contains(target)) {
      target.focus();
    }
  }

  // 開く: click と Enter/Space。Space はスクロール抑止のため preventDefault。
  trigger.addEventListener("click", openLightbox);
  trigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      openLightbox();
    }
  });

  // 閉じる: × / 背景クリック（モーダル本体クリックは透過させない）/ Esc。history は一切触らない。
  if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (isOpen && e.key === "Escape") closeLightbox();
  });
})();
