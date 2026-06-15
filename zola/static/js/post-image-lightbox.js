// post-image-lightbox.js — Blog post images use the same ephemeral lightbox as the portal images.
(function () {
  if (typeof document === "undefined") return;

  const overlay = document.querySelector(".lightbox-overlay");
  if (!overlay || !window.llllLightbox) return;

  function isImageUrl(url) {
    try {
      const pathname = new URL(url, window.location.href).pathname.toLowerCase();
      return /\.(avif|gif|jpe?g|png|svg|webp)$/.test(pathname);
    } catch (_) {
      return false;
    }
  }

  const images = Array.from(document.querySelectorAll(".post-body img")).filter((img) => {
    const link = img.closest("a");
    return !link || isImageUrl(link.href);
  });
  if (!images.length) return;

  images.forEach((img) => {
    const link = img.closest("a");
    window.llllLightbox.bindImageTrigger({
      trigger: img,
      overlay,
      getSrc: () => (link && isImageUrl(link.href) ? link.href : img.currentSrc || img.src),
      getAlt: () => img.alt || "",
      preventDefault: Boolean(link),
    });
  });
})();
