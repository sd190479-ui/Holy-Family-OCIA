// Holy Family OCIA — Service Worker
const CACHE = 'hf-ocia-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clear ALL old caches immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('Deleting old cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first for HTML, cache first for assets
self.addEventListener('fetch', e => {
  // Never cache API calls
  if (e.request.url.includes('/api/')) return;

  // For HTML pages — always go to network first so updates are immediate
  if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
    e.respondWith(
      fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // For other assets — cache first, fall back to network
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
