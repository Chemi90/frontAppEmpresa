// sw.js

const CACHE_NAME = 'app-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/login.js',
  '/partials/login.html'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptamos GET de assets estáticos
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request).then(networkRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(request, networkRes.clone());
          return networkRes;
        });
      });
    })
  );
});
