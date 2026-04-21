// Minimal service worker to enable PWA installability
const CACHE_NAME = 'jetamp-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle standard fetching
  event.respondWith(fetch(event.request));
});
