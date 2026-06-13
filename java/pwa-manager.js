/**
 * GameHub - Service Worker Registration & PWA Module
 * Handles service worker lifecycle, PWA features, and offline functionality
 * 
 * @module PWAManager
 * @version 1.0.0
 */

(function() {
    'use strict';

    /**
     * PWA Manager - Handles Progressive Web App functionality
     */
    window.PWAManager = {
        /**
         * Service worker registration object
         */
        swRegistration: null,

        /**
         * Configuration
         */
        config: {
            swPath: '/java/service-worker.js',
            checkInterval: 6 * 60 * 60 * 1000, // 6 hours
            enableDebug: false
        },

        /**
         * Initialize PWA functionality
         */
        init() {
            if (!('serviceWorker' in navigator)) {
                this.log('Service Workers not supported');
                return;
            }

            this.registerServiceWorker();
            this.setupUpdateCheck();
            this.setupInstallPrompt();
            this.setupAppShortcuts();
        },

        /**
         * Register the service worker
         */
        registerServiceWorker() {
            navigator.serviceWorker.register(this.config.swPath)
                .then((registration) => {
                    this.swRegistration = registration;
                    this.log('Service Worker registered successfully');

                    // Check for updates periodically
                    registration.addEventListener('updatefound', () => {
                        this.onUpdateFound(registration);
                    });

                    // Check for updates immediately
                    registration.update();
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        },

        /**
         * Handle when a new service worker is found
         */
        onUpdateFound(registration) {
            const newWorker = registration.installing;

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker is ready to be used
                    this.showUpdateNotification(registration);
                }
            });
        },

        /**
         * Show update notification to user
         */
        showUpdateNotification(registration) {
            // Check if notification system is available
            if (window.NotificationSystem) {
                window.NotificationSystem.showPersistent(
                    '🔄 Nova versão do GameHub disponível! Recarregue para atualizar.',
                    'info'
                );
            } else {
                // Fallback alert
                console.log('New GameHub version available - refresh to update');
            }

            // Auto-update option: uncomment to enable auto-update
            // this.updateServiceWorker(registration);
        },

        /**
         * Force update to new service worker
         */
        updateServiceWorker(registration) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });

            navigator.serviceWorker.addEventListener('controllerchange', () => {
                this.log('Service Worker updated - page reloading');
                // Optional: auto-reload page
                // window.location.reload();
            });
        },

        /**
         * Setup periodic update checks
         */
        setupUpdateCheck() {
            setInterval(() => {
                if (this.swRegistration) {
                    this.swRegistration.update();
                    this.log('Checking for Service Worker updates');
                }
            }, this.config.checkInterval);
        },

        /**
         * Setup install prompt handling
         */
        setupInstallPrompt() {
            let deferredPrompt = null;

            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                this.showInstallPrompt(deferredPrompt);
            });

            window.addEventListener('appinstalled', () => {
                this.log('PWA installed successfully');
                deferredPrompt = null;
                if (window.SecurityModule) {
                    window.SecurityModule.logger.security('PWA_INSTALLED', 'User installed app');
                }
            });
        },

        /**
         * Show install prompt
         */
        showInstallPrompt(deferredPrompt) {
            const installButton = document.getElementById('btn-install-pwa');
            
            if (installButton) {
                installButton.style.display = 'flex';
                installButton.addEventListener('click', async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        this.log(`User response to the install prompt: ${outcome}`);
                        deferredPrompt = null;
                    }
                });
            } else {
                this.log('Install button not found - PWA install prompt available via browser');
            }
        },

        /**
         * Setup app shortcuts for quick access
         */
        setupAppShortcuts() {
            if ('shortcuts' in navigator) {
                this.log('App Shortcuts supported');
            }
        },

        /**
         * Check if app is installed
         */
        isAppInstalled() {
            return window.matchMedia('(display-mode: standalone)').matches ||
                   navigator.standalone === true;
        },

        /**
         * Get online status
         */
        isOnline() {
            return navigator.onLine;
        },

        /**
         * Setup online/offline listeners
         */
        setupConnectivityListeners() {
            window.addEventListener('online', () => {
                this.log('App is now online');
                if (window.NotificationSystem) {
                    window.NotificationSystem.show('🌐 Conexão restaurada', 'success', 3000);
                }
            });

            window.addEventListener('offline', () => {
                this.log('App is now offline');
                if (window.NotificationSystem) {
                    window.NotificationSystem.show('📵 Modo offline ativado', 'warning', 5000);
                }
            });
        },

        /**
         * Clear all caches
         */
        clearCache() {
            if (this.swRegistration && this.swRegistration.active) {
                this.swRegistration.active.postMessage({ type: 'CLEAR_CACHE' });
            }
            return caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName.startsWith('gamehub-')) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            });
        },

        /**
         * Get cache statistics
         */
        async getCacheStats() {
            const cacheNames = await caches.keys();
            const stats = {
                total_caches: cacheNames.length,
                cache_names: cacheNames,
                total_size: 0,
                caches: {}
            };

            for (const cacheName of cacheNames) {
                if (cacheName.startsWith('gamehub-')) {
                    const cache = await caches.open(cacheName);
                    const keys = await cache.keys();
                    const cacheSize = keys.length;
                    stats.caches[cacheName] = {
                        entries: cacheSize,
                        last_updated: new Date().toISOString()
                    };
                    stats.total_size += cacheSize;
                }
            }

            return stats;
        },

        /**
         * Enable offline mode simulation
         */
        enableOfflineMode() {
            this.log('Offline mode enabled (simulated)');
            // Intercept all requests to return offline response
        },

        /**
         * Request notification permission
         */
        requestNotificationPermission() {
            if (!('Notification' in window)) {
                this.log('Notifications not supported');
                return false;
            }

            if (Notification.permission === 'granted') {
                return true;
            }

            if (Notification.permission !== 'denied') {
                Notification.requestPermission().then((permission) => {
                    if (permission === 'granted') {
                        this.log('Notification permission granted');
                        return true;
                    }
                });
            }
            return false;
        },

        /**
         * Send notification
         */
        sendNotification(title, options = {}) {
            if (Notification.permission === 'granted' && this.swRegistration) {
                this.swRegistration.showNotification(title, options);
            }
        },

        /**
         * Debug logging
         */
        log(message) {
            if (this.config.enableDebug && window.SecurityModule?.DEBUG_MODE) {
                console.log(`[PWAManager] ${message}`);
            }
        },

        /**
         * Get offline queue
         */
        async getOfflineQueue() {
            return new Promise((resolve) => {
                const request = indexedDB.open('gamehub-offline', 1);
                
                request.onsuccess = () => {
                    const db = request.result;
                    const transaction = db.transaction('offline-queue', 'readonly');
                    const store = transaction.objectStore('offline-queue');
                    const getRequest = store.getAll();
                    
                    getRequest.onsuccess = () => {
                        resolve(getRequest.result);
                    };
                };

                request.onerror = () => {
                    resolve([]);
                };
            });
        }
    };

    /**
     * Auto-initialize PWA on DOM ready
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.PWAManager.init();
            window.PWAManager.setupConnectivityListeners();
        });
    } else {
        window.PWAManager.init();
        window.PWAManager.setupConnectivityListeners();
    }

    // Expose for manual control
    window.PWAManager.DEBUG_MODE = false;

})();
