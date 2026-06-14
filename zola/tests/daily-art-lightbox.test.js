import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// 日替わり絵ライトボックス（#24）の回帰テスト（jsdom）。
//
// daily-art.js の末尾 IIFE は `typeof document !== "undefined"` のとき import 時に1回だけ走り、
// DOM に開閉を配線する。よって各テストは「DOM を組む → vi.resetModules() → 動的 import（IIFE 実行）
// → 操作 → 検証」の順にし、テストごとに再配線する（モジュールキャッシュ回避）。
//
// トリガは **画像自体（.daily-art-img）**。figure は figcaption（『タイトル』）を含むので button 化に不適。
// markup は zola/templates/index.html の実テンプレに合わせた最小再現:
//   <figure class="daily-art" data-lightbox-label="..."><img class="daily-art-img" ...>
//     <figcaption class="daily-art-title">...</figcaption></figure>
//   <script type="application/json" id="daily-data">[...]</script>
//   <div class="lightbox-overlay" hidden>
//     <div class="lightbox" role="dialog"><button class="lightbox-close">×</button>
//       <img class="lightbox-img"></div></div>
//
// 注意: jsdom は getComputedStyle で `.lightbox-overlay[hidden]{display:none}` の CSS cascade を
// 評価しない。実描画の可視 cascade（#4/#13 の再発防止 CSS）は Playwright 実機で確認済み。
// ここでは可視判定を overlay.hidden（属性/プロパティ）と DOM 状態で行う（jsdom 制約）。

const MODULE_PATH = "../static/js/daily-art.js";

// IIFE が早期 return しないために必要な最小 DOM（#daily-data に非空配列・トリガ img・overlay 一式）。
// daily-art.js は #daily-data を読んで img.src を /images/daily/<file> に差し替えるので、
// file を "01.webp" にして差し替え後の src を予測可能にする。
function fullMarkup() {
  return `
    <figure class="daily-art" data-lightbox-label="拡大して見る">
      <img class="daily-art-img" src="/images/daily/01.webp" alt="情報化社会" />
      <figcaption class="daily-art-title">『情報化社会』</figcaption>
    </figure>
    <script type="application/json" id="daily-data">[{"file":"01.webp","title":"情報化社会"}]</script>
    <div class="lightbox-overlay" hidden>
      <div class="lightbox" role="dialog" aria-modal="true" tabindex="-1" aria-label="拡大表示">
        <button type="button" class="lightbox-close" aria-label="閉じる">×</button>
        <img class="lightbox-img" src="" alt="" />
      </div>
    </div>
  `;
}

// DOM を body に流し込み、モジュールを再 import して IIFE を走らせる（＝再配線）。
async function setupAndImport(html) {
  document.body.innerHTML = html;
  vi.resetModules();
  await import(MODULE_PATH);
}

function getEls() {
  return {
    figure: document.querySelector(".daily-art"),
    triggerImg: document.querySelector(".daily-art-img"),
    overlay: document.querySelector(".lightbox-overlay"),
    lightboxImg: document.querySelector(".lightbox-img"),
    closeBtn: document.querySelector(".lightbox-close"),
    inner: document.querySelector(".lightbox"),
  };
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.body.classList.remove("modal-open");
});

afterEach(() => {
  document.body.innerHTML = "";
  document.body.classList.remove("modal-open");
});

describe("daily-art lightbox wiring (jsdom)", () => {
  describe("opening", () => {
    it("opens the overlay on trigger (image) click", async () => {
      await setupAndImport(fullMarkup());
      const { triggerImg, overlay } = getEls();
      expect(overlay.hidden).toBe(true); // 既定は隠れている
      triggerImg.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(overlay.hidden).toBe(false);
    });

    it("opens on Enter key on the trigger", async () => {
      await setupAndImport(fullMarkup());
      const { triggerImg, overlay } = getEls();
      triggerImg.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );
      expect(overlay.hidden).toBe(false);
    });

    it("opens on Space key on the trigger", async () => {
      await setupAndImport(fullMarkup());
      const { triggerImg, overlay } = getEls();
      triggerImg.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: " ", bubbles: true })
      );
      expect(overlay.hidden).toBe(false);
    });

    it("syncs the lightbox image src to the current daily-art img src when opened", async () => {
      await setupAndImport(fullMarkup());
      const { triggerImg, lightboxImg } = getEls();
      // daily-art.js が今日のエントリ（01.webp）に差し替えた後の src を拡大側へ同期する。
      triggerImg.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(lightboxImg.src).toBe(triggerImg.src);
      expect(lightboxImg.src).toContain("/images/daily/01.webp");
    });
  });

  describe("closing", () => {
    it("closes when the close (×) button is clicked", async () => {
      await setupAndImport(fullMarkup());
      const { triggerImg, overlay, closeBtn } = getEls();
      triggerImg.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(overlay.hidden).toBe(false);
      closeBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(overlay.hidden).toBe(true);
    });

    it("closes on Escape keydown while open", async () => {
      await setupAndImport(fullMarkup());
      const { triggerImg, overlay } = getEls();
      triggerImg.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(overlay.hidden).toBe(false);
      document.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
      expect(overlay.hidden).toBe(true);
    });

    it("closes when the overlay background itself is clicked", async () => {
      await setupAndImport(fullMarkup());
      const { triggerImg, overlay } = getEls();
      triggerImg.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(overlay.hidden).toBe(false);
      // e.target === overlay のときだけ閉じる（背景クリック）。
      overlay.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(overlay.hidden).toBe(true);
    });

    it("does NOT close when the inner .lightbox is clicked (event bubbles but target isn't the overlay)", async () => {
      await setupAndImport(fullMarkup());
      const { triggerImg, overlay, inner } = getEls();
      triggerImg.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(overlay.hidden).toBe(false);
      // 内側クリックは overlay まで伝播するが e.target が overlay でないので閉じない。
      inner.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(overlay.hidden).toBe(false);
    });
  });

  describe("focus management", () => {
    it("moves focus to the dialog body (.lightbox) on open（× へ直接 focus せず初回枠を防ぐ・#52）", async () => {
      await setupAndImport(fullMarkup());
      const { triggerImg, inner } = getEls();
      triggerImg.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(document.activeElement).toBe(inner);
    });

    it("returns focus to the trigger on close (keyboard path)", async () => {
      await setupAndImport(fullMarkup());
      const { triggerImg, closeBtn } = getEls();
      // トリガに focus を置いてから開く → 閉じたら focus がトリガへ戻ること。
      triggerImg.focus();
      expect(document.activeElement).toBe(triggerImg);
      triggerImg.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );
      closeBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(document.activeElement).toBe(triggerImg);
    });
  });

  describe("ephemeral (no history pollution)", () => {
    it("keeps history.length and location.pathname unchanged across open and close", async () => {
      await setupAndImport(fullMarkup());
      const { triggerImg, overlay, closeBtn } = getEls();
      const lenBefore = window.history.length;
      const pathBefore = window.location.pathname;

      triggerImg.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(overlay.hidden).toBe(false);
      expect(window.history.length).toBe(lenBefore);
      expect(window.location.pathname).toBe(pathBefore);

      closeBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(overlay.hidden).toBe(true);
      expect(window.history.length).toBe(lenBefore);
      expect(window.location.pathname).toBe(pathBefore);
    });
  });

  describe("background scroll suppression", () => {
    it("adds body.modal-open on open and removes it on close", async () => {
      await setupAndImport(fullMarkup());
      const { triggerImg, closeBtn } = getEls();
      expect(document.body.classList.contains("modal-open")).toBe(false);
      triggerImg.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(document.body.classList.contains("modal-open")).toBe(true);
      closeBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      expect(document.body.classList.contains("modal-open")).toBe(false);
    });
  });

  describe("progressive enhancement / guards", () => {
    it("does not throw when imported against a DOM without the overlay (trigger only)", async () => {
      // overlay が無い → IIFE は overlay ガードで return（トリガは interactive 化されない）。例外を投げない。
      const html = `
        <figure class="daily-art" data-lightbox-label="拡大して見る">
          <img class="daily-art-img" src="/images/daily/01.webp" alt="情報化社会" />
        </figure>
        <script type="application/json" id="daily-data">[{"file":"01.webp","title":"情報化社会"}]</script>
      `;
      await expect(setupAndImport(html)).resolves.not.toThrow();
      const triggerImg = document.querySelector(".daily-art-img");
      // overlay 無しでは配線されない＝トリガは button 化されていない（PE）。
      expect(triggerImg.getAttribute("role")).toBe(null);
      expect(() =>
        triggerImg.dispatchEvent(new window.MouseEvent("click", { bubbles: true }))
      ).not.toThrow();
    });

    it("does not throw when imported against an empty DOM (no daily-data at all)", async () => {
      await expect(setupAndImport("<div></div>")).resolves.not.toThrow();
    });
  });

  describe("interactive enhancement of the trigger", () => {
    it("upgrades the trigger image to role=button, tabindex=0, cursor:pointer and an aria-label", async () => {
      await setupAndImport(fullMarkup());
      const { triggerImg } = getEls();
      expect(triggerImg.getAttribute("role")).toBe("button");
      expect(triggerImg.getAttribute("tabindex")).toBe("0");
      expect(triggerImg.style.cursor).toBe("pointer");
      // aria-label は figure[data-lightbox-label] から取る（trans() 由来の表示言語ラベル）。
      expect(triggerImg.getAttribute("aria-label")).toBe("拡大して見る");
    });

    it("does NOT upgrade the figure itself (avoids role=button on a figcaption-bearing element)", async () => {
      await setupAndImport(fullMarkup());
      const { figure } = getEls();
      expect(figure.getAttribute("role")).toBe(null);
      expect(figure.getAttribute("tabindex")).toBe(null);
    });
  });
});
