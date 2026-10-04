const CACHE_NAME = 'genghis-tiers-v1';
const SHELL_URLS = [
  '/genghis-tiers/',
  '/genghis-tiers/index.html',
  '/genghis-tiers/manifest.json',
  '/genghis-tiers/icon-192.png',
  '/genghis-tiers/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first for the app shell, so visitors on a working connection
// always get the latest deploy. Only when the network is unreachable do we
// fall back to whatever was last cached, so the site still loads offline.
// Supabase/API requests are left alone entirely (different origin) — the
// app's own loadPlayers() handles its offline fallback via localStorage.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('/genghis-tiers/index.html')))
  );
});
