// sw.js

const CACHE_NAME = 'app-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/api.js',
  '/js/login.js',
  '/js/tabs.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 1) NO interceptar nada que NO sea GET
  if (request.method !== 'GET') {
    return;
  }

  // 2) NO cachear llamadas a la API
  if (url.pathname.startsWith('/api/') || request.url.includes('/api/')) {
    return;
  }

  // 3) Para el resto, intentar servir de cache, y si no existe, pedir a red y cachearlo
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(networkRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(request, networkRes.clone());
          return networkRes;
        });
      });
    })
  );
});
