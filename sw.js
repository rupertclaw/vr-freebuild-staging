const CACHE_NAME = "vaultedroots-v41";

// Cache icons for offline use; also cache HTML as offline fallback
const ASSETS = [
  './',
  './index.html',
  './data-tree.html',
  './family-builder.html',
  './families.html',
  './heritage-poster.html',
  './branch-tree.html',
  './html2canvas.min.js',
  './fonts.css',
  './fonts/CinzelDecorative-400.ttf',
  './fonts/CinzelDecorative-700.ttf',
  './fonts/CormorantGaramond-400.ttf',
  './fonts/CormorantGaramond-600.ttf',
  './template-bg-v1.webp',
  './vaulted-roots-shield.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Only delete OLD caches, not the current one
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML (always get fresh content when online),
// cache-first for images. When offline, HTML falls back to cache.
self.addEventListener('fetch', (event) => {
  const isHTML = event.request.mode === 'navigate' ||
    event.request.url.endsWith('.html') ||
    event.request.url.endsWith('/');

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          // Cache a copy for offline use
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});