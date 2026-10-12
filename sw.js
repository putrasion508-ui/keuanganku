/* Service worker v3 — cache app shell agar bisa dibuka offline.
   PERBAIKAN (B15): dulu pakai cache.addAll() yang bersifat
   all-or-nothing — satu ikon 404 membuat SELURUH instalasi gagal
   dan mode offline mati total tanpa pemberitahuan.
   Sekarang tiap file di-cache sendiri-sendiri. */
var CACHE = 'keuangan-v3';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (url) {
        return c.add(url).catch(function () { return null; });  // satu gagal, sisanya tetap jalan
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                             .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Stale-while-revalidate: tampil cepat dari cache, lalu segarkan
   di belakang layar. App akan memberi tahu kalau ada versi baru. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var live = fetch(e.request).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || live;
    })
  );
});

self.addEventListener('message', function (e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
