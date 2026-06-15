// keyvisual-lightbox.js — ヘッダ右上のキービジュアル（アバター）をクリックで拡大表示する島（#14）。
//
// 設計:
//   - 「今日の絵」（daily-art.js）と同じ共有ライトボックス（.lightbox-overlay / .lightbox-img）を流用する。
//   - 開閉（×・背景クリック・Escape）と focus 復帰は lightbox-core.js に集約する。
//   - app-popup.js（.modal-overlay＝履歴を積む）とは別系統。ここは ephemeral で URL も履歴も変えない。
//   - PE: JS 無しではアバターは単なる装飾画像（非クリック）。
(function () {
  if (typeof document === "undefined") return;

  const avatar = document.querySelector(".header-keyvisual");
  const overlay = document.querySelector(".lightbox-overlay");
  if (!avatar || !overlay) return;

  if (!window.llllLightbox) return;
  window.llllLightbox.bindImageTrigger({
    trigger: avatar,
    overlay,
    getSrc: () => avatar.currentSrc || avatar.src,
    getAlt: () => avatar.alt || "",
  });
})();
