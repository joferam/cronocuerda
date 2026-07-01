// Service Worker — Cronocuerda
// Cachea el "app shell" (HTML, manifest, íconos) para que la app funcione offline
// y cumpla el requisito de instalabilidad de Chrome/Android.

const CACHE_NAME = 'cronocuerda-v2';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-48x48.png',
  './icon-72x72.png',
  './icon-96x96.png',
  './icon-128x128.png',
  './icon-144x144.png',
  './icon-152x152.png',
  './icon-192x192.png',
  './icon-256x256.png',
  './icon-384x384.png',
  './icon-512x512.png'
];

// Instalación: guarda los archivos del app shell en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpia versiones de caché antiguas
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

// Fetch: estrategia "cache first, network fallback"
// Sirve desde caché si existe; si no, va a la red y guarda la respuesta para la próxima vez
self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones GET (evita problemas con otras solicitudes)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Solo cacheamos respuestas válidas del mismo origen
        if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Si falla todo (sin red y sin caché), no hay nada más que ofrecer
        return cachedResponse;
      });
    })
  );
});
