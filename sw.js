// Service Worker - LGG Cleaning Ops
// v2 : passage en strategie "reseau d'abord" pour l'HTML de l'app.
// Avant (v1), l'app etait mise en cache et servie telle quelle indefiniment,
// meme apres une mise a jour deployee sur GitHub Pages -> bug corrige ici.
//
// Les appels API (fids.liegeairport.com, val.run, proxys) ne sont JAMAIS
// mis en cache : on veut toujours des donnees de vols fraiches.

const CACHE_NAME = 'lgg-ops-v2';
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

  const isAppHTML =
    event.request.mode === 'navigate' ||
    url.endsWith('/') ||
    url.endsWith('index.html');

  if (isAppHTML) {
    // RESEAU D'ABORD : on va toujours chercher la derniere version en ligne.
    // Le cache ne sert que de secours si le telephone est hors-ligne.
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

  // Pour le reste (icones, manifest...) : cache d'abord, c'est statique et sans risque.
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
