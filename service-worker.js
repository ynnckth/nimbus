const CACHE_NAME = 'horizone-v5';
const URLS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './sketch.js',
  './assets/plane.png',
  './manifest.json',
  './lib/p5.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((resp) => resp || fetch(event.request)));
});