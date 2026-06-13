/**
 * GameHub Service Worker
 * Enables offline functionality, caching strategy, and PWA capabilities
 * 
 * Caching Strategy: Cache-First for static assets, Network-First for APIs
 * 
 * @version 2.0.1
 * @date 2026-06-13
 */

const CACHE_VERSION = 'gamehub-v2.0.1';
const CRITICAL_CACHE = 'gamehub-critical-v2.0.1';
const RUNTIME_CACHE = 'gamehub-runtime-v2.0.1';

/**
 * Critical resources that must be cached for offline support
 * These are loaded immediately on install
 */
const URLS_TO_CACHE_CRITICAL = [
    '/',
    '/index.html',
    '/css/variables.css',
    '/css/reset.css',
    '/css/style-global.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/animations.css',
    '/css/utilities.css',
    '/css/responsive.css',
    '/css/header-footer.css',
    '/css/home.css',
    '/java/firebase-config.js',
    '/java/validators.js',
    '/java/security.js',
    '/java/global.js',
    '/java/lazy-image-loader.js'
];

/**
 * Optional resources to cache on-demand
 * These are cached when first accessed
 */
const URLS_TO_CACHE_OPTIONAL = [
    '/html/biblioteca.html',
    '/html/carrinho.html',
    '/html/lista-jogos.html',
    '/html/ranking.html',
    '/html/login.html',
    '/html/perfil.html'
];

/**
 * Service Worker Install Event
 * Pre-caches critical resources for offline functionality
 */
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing version:', CACHE_VERSION);
    
    event.waitUntil(
        caches.open(CRITICAL_CACHE).then((cache) => {
            console.log('[ServiceWorker] Caching critical assets');
            return cache.addAll(URLS_TO_CACHE_CRITICAL);
        }).catch((error) => {
            console.error('[ServiceWorker] Install failed:', error);
        })
    );
    
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

/**
 * Service Worker Activate Event
 * Cleans up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating version:', CACHE_VERSION);
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old cache versions
                    if (cacheName !== CACHE_VERSION && 
                        cacheName !== CRITICAL_CACHE && 
                        cacheName !== RUNTIME_CACHE &&
                        cacheName.startsWith('gamehub-')) {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Claim all clients immediately
    self.clients.claim();
});

/**
 * Service Worker Fetch Event
 * Implements intelligent caching strategy:
 * - Cache-First: for static assets (CSS, JS, images)
 * - Network-First: for API calls and dynamic content
 * - Stale-While-Revalidate: for non-critical resources
 */
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip external requests (Firebase, fonts, etc)
    if (url.origin !== self.location.origin) {
        return;
    }
    
    // Route to appropriate handler
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirstStrategy(event.request));
    } else if (isApiCall(url.pathname)) {
        event.respondWith(networkFirstStrategy(event.request));
    } else if (isHtmlPage(url.pathname)) {
        event.respondWith(networkFirstStrategy(event.request));
    } else {
        event.respondWith(networkFallbackStrategy(event.request));
    }
});

/**
 * Cache-First Strategy
 * Tries cache first, falls back to network
 * Best for: CSS, JS, static images that rarely change
 */
function cacheFirstStrategy(request) {
    return caches.match(request).then((response) => {
        if (response) {
            // Return cached version immediately
            // But update cache in background
            updateCacheInBackground(request);
            return response;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
            .then((response) => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                
                // Cache successful response
                const responseToCache = response.clone();
                caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(request, responseToCache);
                });
                
                return response;
            })
            .catch((error) => {
                console.error('[ServiceWorker] Fetch error:', error);
                // Return offline page or empty response
                return new Response('Offline - resource not available', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                        'Content-Type': 'text/plain'
                    })
                });
            });
    });
}

/**
 * Network-First Strategy
 * Tries network first, falls back to cache
 * Best for: HTML pages, API responses that need to be current
 */
function networkFirstStrategy(request) {
    return fetch(request)
        .then((response) => {
            // Success - cache it and return
            if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(request, responseToCache);
                });
            }
            return response;
        })
        .catch((error) => {
            // Network failed, try cache
            console.log('[ServiceWorker] Network failed, checking cache');
            return caches.match(request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    
                    // No cached version either
                    return new Response('Offline - content not available', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                            'Content-Type': 'text/plain'
                        })
                    });
                });
        });
}

/**
 * Network with Fallback Strategy
 * Try network, then cache, then offline response
 */
function networkFallbackStrategy(request) {
    return fetch(request)
        .catch(() => {
            return caches.match(request)
                .then((response) => {
                    return response || new Response('Offline', { status: 503 });
                });
        });
}

/**
 * Update cache in background (Stale-While-Revalidate)
 */
function updateCacheInBackground(request) {
    fetch(request)
        .then((response) => {
            if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(request, responseToCache);
                });
            }
        })
        .catch(() => {
            // Fail silently - we already have cached version
        });
}

/**
 * Check if URL is a static asset
 */
function isStaticAsset(pathname) {
    const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf'];
    return staticExtensions.some((ext) => pathname.endsWith(ext));
}

/**
 * Check if URL is an API call
 */
function isApiCall(pathname) {
    return pathname.includes('/api/') || pathname.includes('/firestore/');
}

/**
 * Check if URL is an HTML page
 */
function isHtmlPage(pathname) {
    return pathname.endsWith('.html') || pathname === '/' || pathname === '';
}

/**
 * Background Sync for offline actions
 * Queues failed requests and retries when online
 */
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Background sync event:', event.tag);
    
    if (event.tag === 'sync-offline-actions') {
        event.waitUntil(syncOfflineActions());
    }
});

/**
 * Process queued offline actions
 */
async function syncOfflineActions() {
    try {
        // Get queued actions from IndexedDB
        const db = await openDatabase();
        const queue = await getAllFromDatabase(db, 'offline-queue');
        
        // Retry each action
        for (const action of queue) {
            try {
                await fetch(action.request);
                await removeFromDatabase(db, 'offline-queue', action.id);
            } catch (error) {
                console.error('[ServiceWorker] Sync action failed:', error);
            }
        }
    } catch (error) {
        console.error('[ServiceWorker] Sync failed:', error);
        throw error; // Retry by browser
    }
}

/**
 * Open IndexedDB database for offline queue
 */
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('gamehub-offline', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('offline-queue')) {
                db.createObjectStore('offline-queue', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

/**
 * Message handler for client communication
 */
self.addEventListener('message', (event) => {
    console.log('[ServiceWorker] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        clearAllCaches();
    }
});

/**
 * Clear all caches
 */
function clearAllCaches() {
    return caches.keys().then((cacheNames) => {
        return Promise.all(
            cacheNames.map((cacheName) => {
                if (cacheName.startsWith('gamehub-')) {
                    return caches.delete(cacheName);
                }
            })
        );
    });
}

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
    console.log('[ServiceWorker] Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'Você tem uma nova notificação!',
        icon: '/images/gamehub-icon.png',
        badge: '/images/gamehub-badge.png',
        vibrate: [100, 50, 100],
        tag: 'gamehub-notification',
        requireInteraction: false
    };
    
    event.waitUntil(
        self.registration.showNotification('GameHub', options)
    );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[ServiceWorker] Notification clicked');
    
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then((clientList) => {
                // Check if already open
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].url === '/' && 'focus' in clientList[i]) {
                        return clientList[i].focus();
                    }
                }
                // Not open, open new window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

console.log('[ServiceWorker] Loaded - Version:', CACHE_VERSION);
