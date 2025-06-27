// Service Worker for advanced caching
const CACHE_NAME = "llll-ll-v1";
const urlsToCache = [
  "/",
  "/icons/github.svg",
  "/icons/instagram.svg",
  "/icons/note.svg",
  "/icons/x-twitter.svg",
  "/icons/zenn.svg",
  "/favicon.ico",
];

/**
 * @param {ExtendableEvent} event - Service Worker install event
 */
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

/**
 * @param {FetchEvent} event - Service Worker fetch event
 */
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // キャッシュにあれば返す、なければネットワークからfetch
      return response || fetch(event.request);
    })
  );
});
