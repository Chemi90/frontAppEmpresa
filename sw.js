self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('mi-app-cache').then(cache => {
        return cache.addAll([
          '/',
    '/index.html',
    '/css/main.css',
    '/js/api.js',
    '/js/login.js',
    '/js/tabs.js'
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  });
