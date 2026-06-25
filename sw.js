const CACHE_NAME = 'vaulted-roots-v1';
const ASSETS = [
  './',
  './data-tree.html',
  './vaulted-roots-shield.png'
];

// Install: cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches, claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app shell, network-first for external
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // External requests (Gemini, Venice, etc.) — go straight to network
  if (url.origin !== self.location.origin) {
    return;
  }

  // App shell assets — serve from cache, fall back to network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        // Update cache
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      });
    }).catch(() => {
      // If fetch fails and no cache, serve index as fallback
      return caches.match('./data-tree.html');
    })
  );
});
