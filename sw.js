const CACHE_NAME = 'app-v1';
const ASSETS = [
  '/', '/index.html',
  '/css/main.css',
  '/js/api.js', '/js/login.js', '/js/tabs.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 1) Dejar pasar TODO lo que NO sea GET
  if (request.method !== 'GET') {
    return;
  }

  // 2) Dejar pasar las peticiones a tu API (cualquier ruta que incluya /api/)
  if (url.pathname.startsWith('/api/') || request.url.includes('/api/')) {
    return;
  }

  // 3) Solo cachear GET de assets
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(resp => {
        // opcional: cachear nuevas respuestas
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(request, resp.clone());
          return resp;
        });
      });
    })
  );
});
