// Service Worker - LGG Cleaning Ops
// Met en cache l'app elle-meme pour un lancement rapide et un usage
// hors-ligne partiel. Les appels API (fids.liegeairport.com, val.run,
// proxys) ne sont JAMAIS mis en cache : on veut toujours des donnees
// de vols fraiches quand le reseau est disponible.

const CACHE_NAME = 'lgg-ops-v1';
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

  // Ne jamais intercepter/mettre en cache les appels API ou proxys :
  // on veut toujours les donnees de vols les plus recentes.
  if (
    url.includes('fids.liegeairport.com') ||
    url.includes('.web.val.run') ||
    url.includes('workers.dev') ||
    url.includes('allorigins.win') ||
    url.includes('codetabs.com')
  ) {
    return; // laisse passer normalement vers le reseau
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        // met a jour le cache pour la prochaine visite
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      }).catch(() => cached);
    })
  );
});
