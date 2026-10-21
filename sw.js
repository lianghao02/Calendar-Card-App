const CACHE_NAME = 'calendar-card-app-v4';
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './manifest.webmanifest',
    './icon-192.png',
    './icon-512.png',
    './firebase-config.js',
    './google_api_config.js',
    './js/api.js',
    './js/app.js',
    './js/calendar-data.js',
    './js/config.js',
    './js/dialogs.js',
    './js/family-controls.js',
    './js/firebase-calendar.js',
    './js/legacy-api.js',
    './js/logic.js',
    './js/smart-input.js',
    './js/state.js',
    './js/ui.js',
    './js/utils.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 跨域或 Google / Firebase API 請求直接略過，不攔截
    if (url.origin !== self.location.origin) {
        return;
    }

    // 導航請求（HTML）：Network-First，斷網時回退到快取
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // 其餘本機靜態資源：Stale-While-Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});
