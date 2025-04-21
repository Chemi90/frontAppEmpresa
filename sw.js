const CACHE_NAME='app-v1';
const ASSETS=[
  '/',
  '/index.html',
  '/css/main.css',
  '/css/nav.css',
  '/js/api.js',
  '/js/login.js',
  '/js/tabs.js',
  '/js/sw-register.js',
  '/js/desplazamientos.js',
  '/js/tickets.js',
  '/js/facturas.js',
  '/js/gastos.js',
  '/js/nominas.js',
  '/partials/login.html',
  '/partials/desplazamientos.html',
  '/partials/tickets.html',
  '/partials/facturas.html',
  '/partials/gastos.html',
  '/partials/nominas.html'
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const {request}=e;const url=new URL(request.url);
  if(request.method!=='GET'||url.pathname.startsWith('/api/'))return;
  e.respondWith(caches.match(request).then(r=>r||fetch(request).then(res=>caches.open(CACHE_NAME).then(c=>(c.put(request,res.clone()),res)))));
});
