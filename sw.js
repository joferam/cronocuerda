// Service Worker — Cronocuerda v3
// Estrategia: network-first para HTML (siempre fresco), cache-first para íconos

const CACHE_NAME = 'cronocuerda-v3';
const STATIC_ASSETS = [
  './icon-48x48.png',
  './icon-72x72.png',
  './icon-96x96.png',
  './icon-128x128.png',
  './icon-144x144.png',
  './icon-152x152.png',
  './icon-192x192.png',
  './icon-256x256.png',
  './icon-384x384.png',
  './icon-512x512.png',
  './manifest.json'
];

// Instalación: cachea solo los íconos y manifest (NO el HTML)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpia cachés viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first para HTML, cache-first para el resto
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isHTML = event.request.destination === 'document' ||
                 url.pathname.endsWith('.html') ||
                 url.pathname.endsWith('/');

  if (isHTML) {
    // HTML: siempre intenta la red primero para tener la versión más reciente
    event.respondWith(
      fetch(event.request)
        .then(networkRes => {
          // Guarda una copia fresca en caché por si se va la red
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return networkRes;
        })
        .catch(() => caches.match(event.request)) // sin red: usa caché
    );
  } else {
    // Íconos y otros estáticos: cache-first (raramente cambian)
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(networkRes => {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return networkRes;
        });
      })
    );
  }
});
