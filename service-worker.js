const CACHE_PREFIX = 'ficha-3dt-alpha-';
const CACHE_NAME = `${CACHE_PREFIX}v1.0.3`;
const SCOPE_URL = self.registration.scope;
const SHELL_URL = new URL('./', SCOPE_URL).href;
const APP_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
].map(path => new URL(path, SCOPE_URL).href);

async function cacheSuccessfulResponse(request, response) {
  if (!response || !response.ok || response.type !== 'basic') return response;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch (error) {
    // Keep the online response usable even if the browser denies cache storage.
  }
  return response;
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names
        .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        .map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => cacheSuccessfulResponse(request, response))
        .catch(async () => (await caches.match(request)) || caches.match(SHELL_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request).then(response => cacheSuccessfulResponse(request, response)))
  );
});
