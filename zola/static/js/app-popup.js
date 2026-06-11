// app-popup.js — llll-ll ポータルの「アプリ詳細ポップアップ」の島（vanilla JS・依存なし）。
//
// 設計（Issue #13 / Phase 1・案F=fetch）:
//   - 詳細描画は app.html（/apps/{id}/）の1箇所だけ。この島はそのページを fetch して
//     .app-detail フラグメントを抜き出し、モーダルに差し込んで見せる（DRY）。
//   - PE: この島が読めない/失敗してもカードタイトルは素の /apps/{id}/ へ遷移する（deep-link）。
//     モーダルの器は hidden のまま。JS は「開く/閉じる」だけを足す。
//
// 挙動:
//   - index 上の a[href^="/apps/"] クリックを委譲捕捉 → preventDefault → openPopup(href)。
//   - openPopup: overlay を表示 → fetch(href) → DOMParser → .app-detail を modal-body へ →
//     history.pushState で URL を /apps/{id}/ に。fetch 失敗時は location.href=href にフォールバック。
//   - 閉じる: × / Esc / 背景クリック → closePopup() → overlay を hidden・URL を / に戻す。
//   - popstate: URL が /apps/ で始まれば該当 popup を開く、それ以外は閉じる（戻る/進むで同期）。

/**
 * パス（location.pathname）が /apps/{id}/ 形式のアプリ詳細かを判定し、href を返す純粋関数。DOM 非依存。
 * popstate ハンドラがブラウザ履歴の現在地から「ポップアップを開くべきか」を決めるのに使う。
 *
 * @param {string} pathname - location.pathname（例 "/apps/sasso/" や "/"）。
 * @returns {string|null} アプリ詳細なら正規化した href（先頭/末尾スラッシュ付き "/apps/{id}/"）、
 *                        そうでなければ null。
 */
function appHrefFromPath(pathname) {
  if (typeof pathname !== "string") return null;
  // "/apps/" 直後に1文字以上（id）があるものだけ対象。"/apps" や "/apps/" 自体は対象外。
  const m = pathname.match(/^\/apps\/([^/]+)\/?$/);
  if (!m) return null;
  return "/apps/" + m[1] + "/";
}

// テスト用に export（ブラウザでは module ではないので typeof ガード）。
if (typeof module !== "undefined" && module.exports) {
  module.exports = { appHrefFromPath };
}

(function () {
  // テスト時（module 環境）は DOM 配線を走らせない。
  if (typeof document === "undefined") return;

  const overlay = document.querySelector(".modal-overlay");
  if (!overlay) return;
  const modal = overlay.querySelector(".modal");
  const modalBody = overlay.querySelector(".modal-body");
  const closeBtn = overlay.querySelector(".modal-close");

  let isOpen = false;

  function showOverlay() {
    overlay.hidden = false;
    document.body.classList.add("modal-open");
    isOpen = true;
  }

  function hideOverlay() {
    overlay.hidden = true;
    document.body.classList.remove("modal-open");
    modalBody.innerHTML = "";
    isOpen = false;
  }

  // 詳細ページ HTML から .app-detail を抜き出して modal-body に流し込む。
  // 取れなければ false（呼び出し側で素の遷移にフォールバックする）。
  function injectFragment(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const detail = doc.querySelector(".app-detail");
    if (!detail) return false;
    modalBody.innerHTML = "";
    modalBody.appendChild(document.importNode(detail, true));
    return true;
  }

  // href の詳細を取得してポップアップを開く。pushHistory=false のときは pushState しない
  // （popstate からの再現時に履歴を二重に積まないため）。
  function openPopup(href, pushHistory) {
    showOverlay();
    fetch(href)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then((html) => {
        if (!injectFragment(html)) throw new Error("no .app-detail");
        if (pushHistory) history.pushState({ app: href }, "", href);
        if (closeBtn) closeBtn.focus();
      })
      .catch(() => {
        // fetch / parse 失敗 → 素のページ遷移にフォールバック（PE）。
        window.location.href = href;
      });
  }

  // ポップアップを閉じる。restoreHistory=true のとき URL を / に戻す
  // （popstate 起点で閉じるときは履歴がもう動いているので戻さない）。
  function closePopup(restoreHistory) {
    if (!isOpen) return;
    hideOverlay();
    if (restoreHistory) history.pushState({}, "", "/");
  }

  // ── 配線 ──

  // カードのタイトル/サムネ等、index 上の /apps/ リンクのクリックを委譲捕捉。
  document.addEventListener("click", (e) => {
    // 修飾キー・中クリックは素の挙動（新規タブ等）に任せる。
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest('a[href^="/apps/"]');
    if (!link) return;
    // モーダル内のリンク（外部 demo/repo 等）は対象外。
    if (overlay.contains(link)) return;
    const path = new URL(link.href, window.location.origin).pathname;
    if (!appHrefFromPath(path)) return;
    e.preventDefault();
    openPopup(link.getAttribute("href"), true);
  });

  if (closeBtn) closeBtn.addEventListener("click", () => closePopup(true));

  // 背景（オーバーレイ）クリックで閉じる。modal 本体クリックは透過させない。
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup(true);
  });

  // Esc で閉じる。
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closePopup(true);
  });

  // 戻る/進むでモーダル状態を URL に同期。
  window.addEventListener("popstate", () => {
    const href = appHrefFromPath(window.location.pathname);
    if (href) {
      openPopup(href, false); // 履歴は既に動いているので積まない
    } else if (isOpen) {
      hideOverlay();
    }
  });

  // 直リンクで /apps/{id}/ に来た場合は app.html がそのまま素のページを出すので、ここでは何もしない
  // （index 上で動く島であり、初期 URL は常に "/"）。
})();
