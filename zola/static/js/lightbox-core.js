// lightbox-core.js — shared ephemeral image lightbox wiring.
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const controllers = new WeakMap();

  function controllerFor(overlay) {
    if (controllers.has(overlay)) return controllers.get(overlay);

    const lightboxImg = overlay.querySelector(".lightbox-img");
    const closeBtn = overlay.querySelector(".lightbox-close");
    const lightbox = overlay.querySelector(".lightbox");
    let isOpen = false;
    let lastTrigger = null;

    function open(trigger, src, alt) {
      if (!lightboxImg || isOpen) return;
      lastTrigger = document.activeElement;
      lightboxImg.hidden = true;

      function reveal() {
        lightboxImg.hidden = false;
      }
      lightboxImg.onload = reveal;
      lightboxImg.onerror = reveal;
      lightboxImg.src = src;
      lightboxImg.alt = alt || "";
      if (lightboxImg.complete) reveal();

      overlay.hidden = false;
      document.body.classList.add("modal-open");
      isOpen = true;
      if (lightbox && typeof lightbox.focus === "function") {
        lightbox.focus({ preventScroll: true });
      }
    }

    function close() {
      if (!isOpen) return;
      overlay.hidden = true;
      document.body.classList.remove("modal-open");
      isOpen = false;
      const target = lastTrigger;
      lastTrigger = null;
      if (target && typeof target.focus === "function" && document.contains(target)) {
        target.focus();
      }
    }

    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", (e) => {
      if (isOpen && e.key === "Escape") close();
    });

    const controller = { open, close };
    controllers.set(overlay, controller);
    return controller;
  }

  function bindImageTrigger(options) {
    const trigger = options && options.trigger;
    const overlay = (options && options.overlay) || document.querySelector(".lightbox-overlay");
    if (!trigger || !overlay) return false;

    const controller = controllerFor(overlay);
    const getSrc = options.getSrc || (() => trigger.currentSrc || trigger.src);
    const getAlt = options.getAlt || (() => trigger.alt || "");
    const label = options.label || trigger.getAttribute("data-lightbox-label") || trigger.alt || "Enlarge image";

    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.style.cursor = "pointer";
    if (label) trigger.setAttribute("aria-label", label);

    function open(event) {
      if (options.preventDefault && event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      controller.open(trigger, getSrc(), getAlt());
    }

    trigger.addEventListener("click", open);
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(e);
      }
    });

    return true;
  }

  window.llllLightbox = { bindImageTrigger };
})();
