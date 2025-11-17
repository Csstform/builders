const CACHE_NAME = 'tetro-builders-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/game.js',
  './js/constants.js',
  './js/gameState.js',
  './js/physics.js',
  './js/pieces.js',
  './js/collision.js',
  './js/controls.js',
  './js/ui.js',
  './js/tutorial.js',
  './js/audio.js',
  'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache resources individually to handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map((url) => {
            return fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response);
                }
                console.warn('Failed to cache:', url, response.status);
              })
              .catch((error) => {
                console.warn('Error caching:', url, error);
                // Continue even if some resources fail to cache
              });
          })
        );
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
        // Don't fail the service worker installation if caching fails
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Try to fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch((error) => {
                  console.warn('Failed to cache response:', error);
                });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.warn('Fetch failed:', event.request.url, error);
            // Return a basic error response for failed fetches
            // This prevents the "Failed to fetch" error from propagating
            return new Response('Network error', {
              status: 408,
              statusText: 'Request Timeout',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
      .catch((error) => {
        console.error('Cache match failed:', error);
        // Try to fetch from network as fallback
        return fetch(event.request).catch(() => {
          return new Response('Service unavailable', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('Cache activation failed:', error);
      })
  );
});
