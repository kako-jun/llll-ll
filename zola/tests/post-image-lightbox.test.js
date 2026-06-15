import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const MODULE_PATH = "../static/js/post-image-lightbox.js";
const CORE_PATH = "../static/js/lightbox-core.js";

function markup() {
  return `
    <div class="post-body">
      <p><img src="/images/posts/sample.webp" alt="Sample image" /></p>
      <p><a href="/images/posts/full.webp"><img src="/images/posts/thumb.webp" alt="Linked image" /></a></p>
      <p><a href="/posts/other/"><img src="/images/posts/page-link.webp" alt="Page link image" /></a></p>
    </div>
    <div class="lightbox-overlay" hidden>
      <div class="lightbox" role="dialog" aria-modal="true" tabindex="-1" aria-label="Enlarged image">
        <button type="button" class="lightbox-close" aria-label="Close">×</button>
        <img class="lightbox-img" src="" alt="" />
      </div>
    </div>
  `;
}

async function setupAndImport(html = markup()) {
  document.body.innerHTML = html;
  vi.resetModules();
  await import(CORE_PATH);
  await import(MODULE_PATH);
}

function els() {
  return {
    image: document.querySelector(".post-body p:first-child img"),
    linkedImage: document.querySelector('.post-body a[href="/images/posts/full.webp"] img'),
    pageLinkedImage: document.querySelector('.post-body a[href="/posts/other/"] img'),
    overlay: document.querySelector(".lightbox-overlay"),
    lightbox: document.querySelector(".lightbox"),
    lightboxImg: document.querySelector(".lightbox-img"),
    closeBtn: document.querySelector(".lightbox-close"),
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

describe("post image lightbox", () => {
  it("upgrades plain post images and image links, but not page links", async () => {
    await setupAndImport();
    const { image, linkedImage, pageLinkedImage } = els();
    expect(image.getAttribute("role")).toBe("button");
    expect(image.getAttribute("tabindex")).toBe("0");
    expect(image.style.cursor).toBe("pointer");
    expect(linkedImage.getAttribute("role")).toBe("button");
    expect(pageLinkedImage.getAttribute("role")).toBe(null);
  });

  it("opens the overlay and syncs src/alt on click", async () => {
    await setupAndImport();
    const { image, overlay, lightboxImg } = els();
    image.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(overlay.hidden).toBe(false);
    expect(lightboxImg.src).toBe(image.src);
    expect(lightboxImg.alt).toBe("Sample image");
    expect(document.body.classList.contains("modal-open")).toBe(true);
  });

  it("opens full-size href for thumbnail image links and prevents navigation", async () => {
    await setupAndImport();
    const { linkedImage, overlay, lightboxImg } = els();
    const event = new window.MouseEvent("click", { bubbles: true, cancelable: true });
    const dispatchResult = linkedImage.dispatchEvent(event);
    expect(dispatchResult).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(overlay.hidden).toBe(false);
    expect(lightboxImg.src).toContain("/images/posts/full.webp");
    expect(lightboxImg.src).not.toContain("/images/posts/thumb.webp");
    expect(lightboxImg.alt).toBe("Linked image");
  });

  it("prevents default navigation for thumbnail image links on keyboard open", async () => {
    await setupAndImport();
    const { linkedImage, overlay, lightboxImg } = els();
    const event = new window.KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    const dispatchResult = linkedImage.dispatchEvent(event);
    expect(dispatchResult).toBe(false);
    expect(event.defaultPrevented).toBe(true);
    expect(overlay.hidden).toBe(false);
    expect(lightboxImg.src).toContain("/images/posts/full.webp");
  });

  it("opens on Enter and closes on Escape", async () => {
    await setupAndImport();
    const { image, overlay } = els();
    image.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(overlay.hidden).toBe(false);
    document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(overlay.hidden).toBe(true);
    expect(document.body.classList.contains("modal-open")).toBe(false);
  });

  it("closes by close button and restores focus to trigger", async () => {
    await setupAndImport();
    const { image, closeBtn } = els();
    image.focus();
    image.dispatchEvent(new window.KeyboardEvent("keydown", { key: " ", bubbles: true }));
    closeBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    expect(document.activeElement).toBe(image);
  });

  it("does not throw when overlay is missing", async () => {
    await expect(setupAndImport(`<div class="post-body"><img src="/x.webp" alt="x" /></div>`)).resolves.not.toThrow();
  });
});
