// post-image-lightbox.js — Blog post images use the same ephemeral lightbox as the portal images.
(function () {
  if (typeof document === "undefined") return;

  const overlay = document.querySelector(".lightbox-overlay");
  if (!overlay || !window.llllLightbox) return;

  const images = Array.from(document.querySelectorAll(".post-body img")).filter(
    (img) => !img.closest("a")
  );
  if (!images.length) return;

  images.forEach((img) => {
    window.llllLightbox.bindImageTrigger({
      trigger: img,
      overlay,
      getSrc: () => img.currentSrc || img.src,
      getAlt: () => img.alt || "",
    });
  });
})();
