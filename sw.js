// Offline: όλα τα αρχεία μπαίνουν στην cache στην εγκατάσταση.
// Αλλάξτε το VERSION σε κάθε νέα έκδοση ώστε οι συσκευές να πάρουν τα καινούργια αρχεία.
const VERSION = 'ssq-v4';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/fonts.css',
  'css/app.css',
  'fonts/geologica-greek.woff2',
  'fonts/geologica-latin.woff2',
  'fonts/manrope-greek.woff2',
  'fonts/manrope-latin.woff2',
  'js/app.js',
  'js/content.js',
  'img/skg-logo.png',
  'img/favicon.png',
  'img/icon-192.png',
  'img/icon-512.png',
  'img/icon-maskable-512.png',
  'img/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Πρώτα το δίκτυο (για να φαίνονται οι ενημερώσεις), αλλιώς η cache.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))),
  );
});
