const CACHE_NAME = 'nimbus-v1';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './sketch.js',
  './assets/plane.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((resp) => resp || fetch(event.request)));
});