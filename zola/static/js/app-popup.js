// app-popup.js — llll-ll ポータルの「アプリ詳細ポップアップ」の島（vanilla JS・依存なし）。
//
// 設計（Issue #13 / Phase 1・案F=fetch）:
//   - 詳細描画は app.html（/apps/{id}/）の1箇所だけ。この島はそのページを fetch して
//     .app-detail フラグメントを抜き出し、モーダルに差し込んで見せる（DRY）。
//   - PE: この島が読めない/失敗してもカードタイトルは素の /apps/{id}/ へ遷移する（deep-link）。
//     モーダルの器は hidden のまま。JS は「開く/閉じる」だけを足す。
//
// 履歴モデル（正準のモーダル履歴パターン）:
//   - 開く（カードクリック・閉→開）: history.pushState で /apps/{id}/ を「1エントリだけ」積む。
//   - 別アプリへ切替（開→開・別 href）: history.replaceState で URL を差し替え（履歴は積まない）。
//   - 同一アプリで既に開いている（連打）: 早期 return（fetch も history 操作もしない）。
//   - 閉じる（× / Esc / 背景クリック）: history.back() を呼ぶだけ。開く時に積んだ1エントリを
//     巻き戻す → popstate が発火 → そこで実際に overlay を隠す（hideOverlay）。これで
//     「開く+1 / back で-1 相当」となり1サイクルあたり history.length の増分は 0（汚染ゼロ）。
//   - popstate: location.pathname が /apps/{id}/ なら openPopup(href, {pushHistory:false}) で
//     フラグメントだけ注入（history 操作なし）、そうでなければ hideOverlay()（DOM を閉じるだけ）。
//     → ブラウザ「戻る」で閉じる、「進む」で再オープン、が成立し履歴が増えない。

// i18n（#5）で詳細ページは4言語に出る。既定言語(en)は接頭辞なし（/apps/{id}/）、
// ja/zh/es は言語接頭辞付き（/{lang}/apps/{id}/）。ポップアップは「今いる言語のまま」開く必要があるため、
// appHrefFromPath は接頭辞ごと正規化して返す（fetch・pushState がその言語の詳細ページを指すように）。
const LANG_PREFIXES = ["ja", "zh", "es"];

/**
 * パス（location.pathname）がアプリ詳細（/apps/{id}/ または /{lang}/apps/{id}/）かを判定し、
 * 接頭辞込みで正規化した href を返す純粋関数。DOM 非依存。
 * popstate ハンドラがブラウザ履歴の現在地から「ポップアップを開くべきか／どの言語の詳細か」を決めるのに使う。
 *
 * @param {string} pathname - location.pathname（例 "/apps/sasso/", "/ja/apps/sasso/", "/"）。
 * @returns {string|null} アプリ詳細なら正規化した href（先頭/末尾スラッシュ付き。
 *                        en は "/apps/{id}/"、他は "/{lang}/apps/{id}/"）、そうでなければ null。
 */
function appHrefFromPath(pathname) {
  if (typeof pathname !== "string") return null;
  // 言語接頭辞ありを先に判定（/{lang}/apps/{id}/）。lang は ja/zh/es に限る。
  const ml = pathname.match(/^\/([a-z]{2})\/apps\/([^/]+)\/?$/);
  if (ml && LANG_PREFIXES.indexOf(ml[1]) !== -1) {
    return "/" + ml[1] + "/apps/" + ml[2] + "/";
  }
  // 接頭辞なし（既定言語 en）。"/apps/" 直後に1文字以上（id）があるものだけ対象。
  // "/apps" や "/apps/" 自体、ネスト（/apps/{id}/x/）は対象外。
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

  // 状態: isOpen は overlay が表示中か、currentHref は表示中アプリの href（未表示なら null）。
  let isOpen = false;
  let currentHref = null;
  // 閉じる時に focus を戻すトリガ（開いた瞬間の document.activeElement）。
  let lastTrigger = null;

  function showOverlay() {
    overlay.hidden = false;
    document.body.classList.add("modal-open");
    isOpen = true;
  }

  // overlay を DOM 上で閉じるだけ（history は触らない）。popstate 経由・初期同期から呼ぶ。
  function hideOverlay() {
    if (!isOpen) return;
    overlay.hidden = true;
    document.body.classList.remove("modal-open");
    modalBody.innerHTML = "";
    isOpen = false;
    currentHref = null;
    restoreFocus();
  }

  // 開く時に保持したトリガへ focus を戻す。トリガが消えていれば body にフォールバック。
  function restoreFocus() {
    const target = lastTrigger;
    lastTrigger = null;
    if (target && typeof target.focus === "function" && document.contains(target)) {
      target.focus();
      return;
    }
    // トリガが消えている → 背景（body）へ focus を返す。body は既定で focusable でないので
    // tabindex を一時付与して focus し、blur 後に外す（DOM を汚さない）。
    const body = document.body;
    if (!body) return;
    body.setAttribute("tabindex", "-1");
    body.focus();
    body.addEventListener("blur", function onBlur() {
      body.removeAttribute("tabindex");
      body.removeEventListener("blur", onBlur);
    });
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

  // モーダル内の focusable 要素を文書順で返す（focus trap / 初期 focus 用）。
  function getFocusable() {
    const sel = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(modal.querySelectorAll(sel)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
  }

  // href の詳細を取得してポップアップを開く/差し替える。
  //   opts.pushHistory: true=クリック経路（履歴を pushState/replaceState で操作）, false=popstate 経路（操作しない）。
  // クリック経路の履歴操作:
  //   閉→開 … pushState（1エントリ積む）/ 開→開（別 href）… replaceState（差し替え・積まない）/ 同一 href … 早期 return。
  function openPopup(href, opts) {
    const pushHistory = !!(opts && opts.pushHistory);

    // 連打・再オープン抑止: 既に同じ href を表示中なら何もしない（fetch も history も走らせない）。
    if (isOpen && currentHref === href) return;

    // クリック経路では、開く前にトリガ（クリックしたタイトルリンク等）を保持して focus 復帰に使う。
    // popstate 経路では activeElement を保持しない（戻る/進むはトリガが無い）。
    if (pushHistory && !isOpen) {
      lastTrigger = document.activeElement;
    }

    // 履歴操作は fetch 前に同期的に行う（pushState=閉→開で1エントリ, replaceState=開→開で差し替え）。
    if (pushHistory) {
      if (isOpen) {
        history.replaceState({ app: href }, "", href);
      } else {
        history.pushState({ app: href }, "", href);
      }
    }

    showOverlay();
    currentHref = href;

    fetch(href)
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then((html) => {
        if (!injectFragment(html)) throw new Error("no .app-detail");
        // 注入後に先頭 focusable（閉じるボタン優先）へ focus を移す。
        if (closeBtn) closeBtn.focus();
      })
      .catch(() => {
        // fetch / parse 失敗 → 素のページ遷移にフォールバック（PE）。
        window.location.href = href;
      });
  }

  // 閉じる（× / Esc / 背景クリック）。history.back() で開く時に積んだ1エントリを巻き戻す。
  // 実際の overlay 非表示は popstate ハンドラ（hideOverlay）が行う。
  function closePopup() {
    if (!isOpen) return;
    // 現在 URL が /apps/{id}/ なら開いた時の pushState が残っているので back で巻き戻す。
    // 万一そうでなければ（直リンク等で history に開エントリが無い）DOM だけ閉じる。
    if (appHrefFromPath(window.location.pathname)) {
      history.back();
    } else {
      hideOverlay();
    }
  }

  // ── 配線 ──

  // カードのタイトル/サムネ等、index 上のアプリ詳細リンクのクリックを委譲捕捉。
  // i18n（#5）で href は /apps/{id}/（en）または /{lang}/apps/{id}/（ja/zh/es）の2形。
  // 緩い selector（"a[href]"）で拾い、最終判定は appHrefFromPath（接頭辞対応）に委ねる。
  document.addEventListener("click", (e) => {
    // 修飾キー・中クリックは素の挙動（新規タブ等）に任せる。
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // カード内のタグは apps-filter.js がフィルタとして処理する。ここでは何もしない（#14 kako-jun）。
    if (e.target.closest("[data-card-tag], [data-card-featured]")) return;
    const link = e.target.closest("a[href]");
    if (link) {
      // モーダル内のリンク（外部 demo/repo 等）は対象外。
      if (overlay.contains(link)) return;
      const normalized = appHrefFromPath(new URL(link.href, window.location.origin).pathname);
      if (!normalized) return; // 外部リンク（demo/repo 等）は素の遷移に任せる。
      e.preventDefault();
      // 正規化した接頭辞込み href を使う（getAttribute の生値だと相対表記の揺れがありうるため）。
      openPopup(normalized, { pushHistory: true });
      return;
    }
    // 青リンク・タグ以外をカード内でクリック → そのカードのポップアップを開く（#14 kako-jun）。
    const card = e.target.closest(".card");
    if (!card || overlay.contains(card)) return;
    const titleLink = card.querySelector(".card-title-link[href]");
    if (!titleLink) return;
    const normalized = appHrefFromPath(new URL(titleLink.href, window.location.origin).pathname);
    if (!normalized) return;
    e.preventDefault();
    openPopup(normalized, { pushHistory: true });
  });

  if (closeBtn) closeBtn.addEventListener("click", () => closePopup());

  // 背景（オーバーレイ）クリックで閉じる。modal 本体クリックは透過させない。
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });

  // キーボード: Esc で閉じる、Tab で focus trap（モーダル内でループ）。
  document.addEventListener("keydown", (e) => {
    if (!isOpen) return;
    if (e.key === "Escape") {
      closePopup();
      return;
    }
    if (e.key === "Tab") {
      const focusable = getFocusable();
      if (focusable.length === 0) {
        // focusable が無ければ背景へ抜けさせないよう modal 自体に留める。
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      // モーダル外に focus がある場合も内側へ引き戻す。
      if (!modal.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // 戻る/進むでモーダル状態を URL に同期。history 操作はしない（pushHistory:false）。
  window.addEventListener("popstate", () => {
    const href = appHrefFromPath(window.location.pathname);
    if (href) {
      // /apps/{id}/ に居る → そのアプリを開く（既に同 href 表示中なら openPopup 側で no-op）。
      openPopup(href, { pushHistory: false });
    } else {
      // 詳細から外れた（"/" 等）→ DOM を閉じるだけ。
      hideOverlay();
    }
  });

  // 直リンクで /apps/{id}/ に来た場合は app.html がそのまま素のページを出すので、ここでは何もしない
  // （index 上で動く島であり、初期 URL は常に "/"）。
})();
