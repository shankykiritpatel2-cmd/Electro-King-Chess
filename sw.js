const CACHE_NAME = 'electro-king-v17';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './game.js',
  './manifest.json',
  './icon_192.png',
  './icon_512.png',
  './launchericon-48x48.png',
  './launchericon-72x72.png',
  './launchericon-96x96.png',
  './launchericon-144x144.png',
  './screenshot_phone.png',
  './screenshot_wide.png'
];

// Install Event - cache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - clean old caches immediately
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache...', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First with Cache Fallback for instant updates
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).then((response) => {
      if (response && response.status === 200 && e.request.method === 'GET') {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseClone);
        });
      }
      return response;
    }).catch(() => {
      return caches.match(e.request);
    })
  );
});
