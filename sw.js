/**
 * sw.js - Service Worker
 *
 * Implements a "Stale-While-Revalidate" caching strategy for core assets,
 * and a "Network First" strategy for dynamic data (if any API calls were made).
 */

const CACHE_NAME = 'notes-app-cache-v1.0'; // Change version to force update

// Assets that are critical for the app's shell to function
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/app/assets/css/main.css',
    'https://cdn.jsdelivr.net/npm/alpinejs@3.13.10/dist/cdn.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm',
    // Add app icons and fonts here
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'
];

// On install, cache all core assets
self.addEventListener('install', (event) => {
    console.log('SW: Install event');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Caching core assets');
            return cache.addAll(CORE_ASSETS);
        })
    );
    self.skipWaiting();
});

// On activate, clean up old caches
self.addEventListener('activate', (event) => {
    console.log('SW: Activate event');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('SW: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// On fetch, apply the caching strategy
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);

    // Stale-While-Revalidate for assets we control (and CDNs)
    if (CORE_ASSETS.includes(url.pathname) || url.hostname.includes('cdn') || url.hostname.includes('googleapis')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        // If the fetch is successful, update the cache
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });

                    // Return the cached response immediately if available, otherwise wait for the network
                    return cachedResponse || fetchPromise;
                });
            })
        );
    } else {
        // For other requests (e.g., fetching partials), go network first
        event.respondWith(
            fetch(event.request).catch(() => {
                // If network fails, try to find a match in the cache
                return caches.match(event.request);
            })
        );
    }
});

