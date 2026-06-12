// keyvisual-lightbox.js — ヘッダ右上のキービジュアル（アバター）をクリックで拡大表示する島（#14）。
//
// 設計:
//   - 「今日の絵」（daily-art.js）と同じ共有ライトボックス（.lightbox-overlay / .lightbox-img）を流用する。
//   - 開く側だけをここで足し、閉じる（×・背景クリック・Escape）はこの島でも独立に張る（daily-art.js が
//     無い/走らない構成でも閉じられるよう・idempotent。両方張っても hidden=true を立てるだけで無害）。
//   - app-popup.js（.modal-overlay＝履歴を積む）とは別系統。ここは ephemeral で URL も履歴も変えない。
//   - PE: JS 無しではアバターは単なる装飾画像（非クリック）。
(function () {
  if (typeof document === "undefined") return;

  const avatar = document.querySelector(".header-keyvisual");
  const overlay = document.querySelector(".lightbox-overlay");
  if (!avatar || !overlay) return;

  const img = overlay.querySelector(".lightbox-img");
  const closeBtn = overlay.querySelector(".lightbox-close");
  if (!img) return;

  function open() {
    img.src = avatar.currentSrc || avatar.src;
    img.alt = avatar.alt || "";
    overlay.hidden = false;
  }
  function close() {
    overlay.hidden = true;
  }

  // アバターをクリック可能に（JS 配線時のみ pointer/role を付ける＝no-JS で嘘の操作感を出さない・PE）。
  avatar.style.cursor = "pointer";
  avatar.setAttribute("role", "button");
  avatar.setAttribute("tabindex", "0");

  avatar.addEventListener("click", open);
  avatar.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  });

  if (closeBtn) closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });
})();
