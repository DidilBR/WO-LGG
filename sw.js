// Service Worker - LGG Cleaning Ops
// v3 : Mise à jour avec Shifts dynamiques, Swipe et Custom Fleet

const CACHE_NAME = 'lgg-ops-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (
    url.includes('fids.liegeairport.com') ||
    url.includes('.web.val.run') ||
    url.includes('workers.dev') ||
    url.includes('allorigins.win') ||
    url.includes('codetabs.com')
  ) {
    return;
  }

  const isAppHTML =
    event.request.mode === 'navigate' ||
    url.endsWith('/') ||
    url.endsWith('index.html');

  if (isAppHTML) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      }).catch(() => cached);
    })
  );
});
