/**
 * GameHub - Lazy Image Loader
 * Loads images only when they become visible in the viewport
 * Uses Intersection Observer API for maximum performance
 * 
 * @module LazyImageLoader
 * @version 1.0.0
 */

(function() {
    'use strict';

    /**
     * LazyImageLoader - Handles lazy loading of images using Intersection Observer
     * @class
     */
    class LazyImageLoader {
        constructor() {
            this.observer = null;
            this.isSupported = 'IntersectionObserver' in window;
            this.loadedImages = new Set();
            this.initializeObserver();
        }

        /**
         * Initialize the Intersection Observer
         * Rootmargin adds 50px buffer to start loading before image becomes visible
         * @private
         */
        initializeObserver() {
            if (!this.isSupported) {
                if (window.SecurityModule?.DEBUG_MODE) {
                    console.warn('IntersectionObserver not supported, falling back to eager loading');
                }
                this.loadAllImagesEagerly();
                return;
            }

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px',
                threshold: 0.01
            });
        }

        /**
         * Load an individual image with fade-in animation
         * @param {HTMLImageElement} img - The image element to load
         * @private
         */
        loadImage(img) {
            if (this.loadedImages.has(img)) return;

            const src = img.dataset.src;
            const srcset = img.dataset.srcset;

            if (!src) return;

            // Start loading
            img.classList.add('image-loading');

            // Create a new image to preload
            const tempImg = new Image();

            tempImg.onload = () => {
                img.src = src;
                if (srcset) {
                    img.srcset = srcset;
                }
                img.classList.remove('image-loading');
                img.classList.add('image-loaded');
                this.loadedImages.add(img);

                // Log successful load if debug mode
                if (window.SecurityModule?.DEBUG_MODE) {
                    console.log(`[LazyLoader] Image loaded: ${src.substring(0, 40)}...`);
                }
            };

            tempImg.onerror = () => {
                img.classList.remove('image-loading');
                img.classList.add('image-error');

                if (window.SecurityModule?.DEBUG_MODE) {
                    console.warn(`[LazyLoader] Failed to load: ${src}`);
                }
            };

            // Start the actual load
            tempImg.src = src;
            if (srcset) {
                tempImg.srcset = srcset;
            }
        }

        /**
         * Observe all lazy images in the DOM
         * @param {NodeList|HTMLCollection|Array} images - Images to observe
         * @public
         */
        observe(images) {
            if (!this.isSupported) return;

            const imageArray = Array.from(images);
            imageArray.forEach((img) => {
                if (img.dataset.src && !this.loadedImages.has(img)) {
                    this.observer.observe(img);
                }
            });

            if (window.SecurityModule?.DEBUG_MODE) {
                console.log(`[LazyLoader] Observing ${imageArray.length} images`);
            }
        }

        /**
         * Load a specific image immediately
         * @param {HTMLImageElement} img - The image to load
         * @public
         */
        loadImmediate(img) {
            if (this.observer) {
                this.observer.unobserve(img);
            }
            this.loadImage(img);
        }

        /**
         * Load all images immediately (fallback for browsers without IntersectionObserver)
         * @private
         */
        loadAllImagesEagerly() {
            const lazyImages = document.querySelectorAll('[data-src]');
            lazyImages.forEach((img) => {
                this.loadImmediate(img);
            });
        }

        /**
         * Disconnect observer and cleanup
         * @public
         */
        disconnect() {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
        }

        /**
         * Get statistics about loaded images
         * @returns {Object} Stats including total observed and loaded count
         * @public
         */
        getStats() {
            return {
                loaded: this.loadedImages.size,
                supported: this.isSupported
            };
        }
    }

    // Export to window
    window.LazyImageLoader = new LazyImageLoader();

    // Auto-load images when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.LazyImageLoader.observe(document.querySelectorAll('[data-src]'));
        });
    } else {
        window.LazyImageLoader.observe(document.querySelectorAll('[data-src]'));
    }

    // Re-observe when new images are added dynamically
    const originalInsertAdjacentHTML = Element.prototype.insertAdjacentHTML;
    Element.prototype.insertAdjacentHTML = function(position, html) {
        const result = originalInsertAdjacentHTML.call(this, position, html);
        
        // Wait for DOM to update before observing
        setTimeout(() => {
            const newImages = this.querySelectorAll('[data-src]:not(.image-loaded):not(.image-error)');
            if (newImages.length > 0) {
                window.LazyImageLoader.observe(newImages);
            }
        }, 0);
        
        return result;
    };

})();
