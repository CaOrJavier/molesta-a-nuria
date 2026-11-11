// Permite jugar sin conexión después de la primera visita.
// La página se pide siempre a la red primero (así llegan las actualizaciones)
// y solo se usa la copia guardada si no hay internet.
const CACHE = 'nuria-v1';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const url = new URL(req.url);
  // three.js y las fuentes no cambian: primero la copia guardada
  const fijo = url.hostname === 'cdn.jsdelivr.net' || url.hostname.endsWith('gstatic.com');
  if (fijo) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return res;
    })));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    if (res.ok && (url.origin === location.origin || url.hostname === 'fonts.googleapis.com')) {
      const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia));
    }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true })));
});
