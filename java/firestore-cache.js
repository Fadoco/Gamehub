/**
 * GameHub - Firestore Cache Manager
 * Implements intelligent caching to reduce Firestore reads
 * Strategies: Query caching, local persistence, listener reuse
 * 
 * @module FirestoreCache
 * @version 1.0.0
 * @date 2026-06-13
 */

(function() {
    'use strict';

    /**
     * FirestoreCache Manager
     * Reduces Firestore reads through intelligent caching
     */
    window.FirestoreCache = {
        /**
         * Cache storage
         */
        cache: new Map(),
        listeners: new Map(),
        queries: new Map(),
        expirations: new Map(),

        /**
         * Configuration
         */
        config: {
            defaultTTL: 5 * 60 * 1000, // 5 minutes
            userTTL: 10 * 60 * 1000,   // 10 minutes for user data
            gameTTL: 30 * 60 * 1000,   // 30 minutes for game data
            listenerReuse: true,
            persistToLocalStorage: true,
            debug: false
        },

        /**
         * Subscribe to a document with caching
         * Reuses listener if already subscribed
         */
        subscribe(collection, docId, callback) {
            const key = `${collection}/${docId}`;
            
            // Return existing listener if reuse enabled
            if (this.config.listenerReuse && this.listeners.has(key)) {
                this.log(`Reusing listener for ${key}`);
                const cached = this.cache.get(key);
                if (cached && !this.isExpired(key)) {
                    callback(cached);
                }
                return this.listeners.get(key);
            }

            // Create new listener
            const unsubscribe = window.db
                .collection(collection)
                .doc(docId)
                .onSnapshot((doc) => {
                    if (doc.exists) {
                        const data = doc.data();
                        this.set(collection, docId, data);
                        callback(data);
                    } else {
                        this.log(`Document not found: ${key}`);
                    }
                }, (error) => {
                    console.error(`Firestore error for ${key}:`, error);
                });

            // Store listener for reuse
            if (this.config.listenerReuse) {
                this.listeners.set(key, unsubscribe);
            }

            return unsubscribe;
        },

        /**
         * Subscribe to a query with caching
         */
        subscribeQuery(collection, whereConditions, callback) {
            const queryKey = this.generateQueryKey(collection, whereConditions);

            // Return cached results if valid
            if (this.queries.has(queryKey) && !this.isExpired(queryKey)) {
                this.log(`Using cached query results for ${queryKey}`);
                callback(this.queries.get(queryKey));
                // Still setup listener for real-time updates
            }

            // Create listener
            let query = window.db.collection(collection);

            if (Array.isArray(whereConditions)) {
                whereConditions.forEach((condition) => {
                    query = query.where(...condition);
                });
            }

            const unsubscribe = query.onSnapshot((snapshot) => {
                const results = [];
                snapshot.forEach((doc) => {
                    results.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                // Cache results
                this.queries.set(queryKey, results);
                this.setExpiration(queryKey, this.config.gameTTL);

                callback(results);
            });

            // Store listener
            this.listeners.set(queryKey, unsubscribe);

            return unsubscribe;
        },

        /**
         * Get cached value (doesn't set up listener)
         */
        getCached(collection, docId) {
            const key = `${collection}/${docId}`;
            
            if (this.cache.has(key) && !this.isExpired(key)) {
                this.log(`Cache hit: ${key}`);
                return this.cache.get(key);
            }

            this.log(`Cache miss: ${key}`);
            return null;
        },

        /**
         * Get cached query results
         */
        getCachedQuery(collection, whereConditions) {
            const queryKey = this.generateQueryKey(collection, whereConditions);
            
            if (this.queries.has(queryKey) && !this.isExpired(queryKey)) {
                this.log(`Query cache hit: ${queryKey}`);
                return this.queries.get(queryKey);
            }

            this.log(`Query cache miss: ${queryKey}`);
            return null;
        },

        /**
         * Manually cache a value
         */
        set(collection, docId, data, ttl = null) {
            const key = `${collection}/${docId}`;
            this.cache.set(key, data);
            
            const duration = ttl || (collection === 'users' ? this.config.userTTL : this.config.defaultTTL);
            this.setExpiration(key, duration);

            // Persist to localStorage if enabled
            if (this.config.persistToLocalStorage) {
                this.persistToStorage(key, data);
            }

            this.log(`Cached ${key}`);
        },

        /**
         * Manually invalidate cache
         */
        invalidate(collection, docId) {
            const key = `${collection}/${docId}`;
            this.cache.delete(key);
            this.expirations.delete(key);
            
            // Remove from localStorage
            if (this.config.persistToLocalStorage) {
                localStorage.removeItem(`cache_${key}`);
            }

            this.log(`Cache invalidated: ${key}`);
        },

        /**
         * Invalidate all queries for a collection
         */
        invalidateCollection(collection) {
            const keysToDelete = [];
            
            this.queries.forEach((_, key) => {
                if (key.startsWith(collection)) {
                    keysToDelete.push(key);
                }
            });

            keysToDelete.forEach((key) => {
                this.queries.delete(key);
                this.expirations.delete(key);
            });

            this.log(`Invalidated all queries for ${collection}`);
        },

        /**
         * Set expiration timer for cache entry
         */
        setExpiration(key, duration) {
            // Clear existing timer
            if (this.expirations.has(key)) {
                clearTimeout(this.expirations.get(key).timeout);
            }

            const timeout = setTimeout(() => {
                this.cache.delete(key);
                this.queries.delete(key);
                this.expirations.delete(key);
                this.log(`Cache expired: ${key}`);
            }, duration);

            this.expirations.set(key, {
                timeout,
                expireTime: Date.now() + duration
            });
        },

        /**
         * Check if cache entry is expired
         */
        isExpired(key) {
            if (!this.expirations.has(key)) {
                return false;
            }

            const { expireTime } = this.expirations.get(key);
            return Date.now() > expireTime;
        },

        /**
         * Generate unique key for query
         */
        generateQueryKey(collection, conditions) {
            if (!Array.isArray(conditions)) {
                return `${collection}:query`;
            }

            const conditionStr = JSON.stringify(conditions);
            return `${collection}:${hashString(conditionStr)}`;
        },

        /**
         * Persist data to localStorage
         */
        persistToStorage(key, data) {
            try {
                const storageKey = `cache_${key}`;
                const storageData = {
                    data,
                    timestamp: Date.now()
                };
                localStorage.setItem(storageKey, JSON.stringify(storageData));
            } catch (error) {
                console.warn('Failed to persist to localStorage:', error);
            }
        },

        /**
         * Restore data from localStorage
         */
        restoreFromStorage(key) {
            try {
                const storageKey = `cache_${key}`;
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const { data, timestamp } = JSON.parse(stored);
                    // Only restore if less than 1 hour old
                    if (Date.now() - timestamp < 60 * 60 * 1000) {
                        this.cache.set(key, data);
                        return data;
                    }
                }
            } catch (error) {
                console.warn('Failed to restore from localStorage:', error);
            }
            return null;
        },

        /**
         * Unsubscribe from a listener
         */
        unsubscribe(collection, docId) {
            const key = `${collection}/${docId}`;
            
            if (this.listeners.has(key)) {
                const unsubscribe = this.listeners.get(key);
                unsubscribe();
                this.listeners.delete(key);
                this.log(`Unsubscribed from ${key}`);
            }
        },

        /**
         * Unsubscribe all listeners
         */
        unsubscribeAll() {
            this.listeners.forEach((unsubscribe) => {
                try {
                    unsubscribe();
                } catch (error) {
                    console.error('Error unsubscribing:', error);
                }
            });
            
            this.listeners.clear();
            this.log('Unsubscribed from all listeners');
        },

        /**
         * Batch subscribe to multiple documents
         */
        subscribeMultiple(subscriptions, callback) {
            let completed = 0;
            const results = new Map();

            subscriptions.forEach((sub) => {
                this.subscribe(sub.collection, sub.docId, (data) => {
                    results.set(`${sub.collection}/${sub.docId}`, data);
                    completed++;

                    if (completed === subscriptions.length) {
                        callback(results);
                    }
                });
            });
        },

        /**
         * Warmup cache with critical data
         */
        warmupCache() {
            this.log('Warming up cache with critical data');

            // Cache current user
            if (window.auth && window.auth.currentUser) {
                this.subscribe('users', window.auth.currentUser.uid, (userData) => {
                    this.log('User data cached');
                });
            }

            // Cache games list (limited for performance)
            if (window.allGamesData && window.allGamesData.length > 0) {
                const slicedGames = window.allGamesData.slice(0, 20);
                this.queries.set('games:popular', slicedGames);
                this.setExpiration('games:popular', this.config.gameTTL);
            }
        },

        /**
         * Get cache statistics
         */
        getStats() {
            return {
                cacheSize: this.cache.size,
                listenerCount: this.listeners.size,
                queryCount: this.queries.size,
                memory: {
                    cache: JSON.stringify([...this.cache]).length,
                    queries: JSON.stringify([...this.queries]).length
                }
            };
        },

        /**
         * Clear entire cache
         */
        clearCache() {
            this.cache.clear();
            this.queries.clear();
            this.expirations.clear();
            
            // Clear localStorage
            if (this.config.persistToLocalStorage) {
                Object.keys(localStorage).forEach((key) => {
                    if (key.startsWith('cache_')) {
                        localStorage.removeItem(key);
                    }
                });
            }

            this.log('Cache cleared completely');
        },

        /**
         * Log messages (debug mode)
         */
        log(message) {
            if (this.config.debug && window.SecurityModule?.DEBUG_MODE) {
                console.log(`[FirestoreCache] ${message}`);
            }
        }
    };

    /**
     * Simple string hashing function
     */
    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Auto-initialize cache on app load
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.FirestoreCache.config.debug = window.SecurityModule?.DEBUG_MODE || false;
            window.FirestoreCache.log('FirestoreCache initialized');
        });
    } else {
        window.FirestoreCache.config.debug = window.SecurityModule?.DEBUG_MODE || false;
        window.FirestoreCache.log('FirestoreCache initialized');
    }

})();
