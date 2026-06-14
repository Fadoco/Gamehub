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

            // Fallback timeout - se não carregar em 8 segundos, carrega via src direto
            const timeoutId = setTimeout(() => {
                if (!this.loadedImages.has(img)) {
                    console.warn(`[LazyLoader] Timeout loading ${src}, usando fallback direto`);
                    img.src = src;
                    if (srcset) img.srcset = srcset;
                }
            }, 8000);

            // Create a new image to preload
            const tempImg = new Image();

            tempImg.onload = () => {
                clearTimeout(timeoutId);
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
                clearTimeout(timeoutId);
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
            const images = document.querySelectorAll('[data-src]');
            if (images.length > 0) {
                console.log(`[LazyImageLoader] DOMContentLoaded - Observando ${images.length} imagens`);
                window.LazyImageLoader.observe(images);
            }
        });
    } else {
        const images = document.querySelectorAll('[data-src]');
        if (images.length > 0) {
            console.log(`[LazyImageLoader] Documento já pronto - Observando ${images.length} imagens`);
            window.LazyImageLoader.observe(images);
        }
    }

    // Re-observe when new images are added dynamically
    const originalInsertAdjacentHTML = Element.prototype.insertAdjacentHTML;
    Element.prototype.insertAdjacentHTML = function(position, html) {
        const result = originalInsertAdjacentHTML.call(this, position, html);
        
        // Wait for DOM to update before observing
        setTimeout(() => {
            const newImages = this.querySelectorAll('[data-src]:not(.image-loaded):not(.image-error)');
            if (newImages.length > 0) {
                console.log(`[LazyImageLoader] insertAdjacentHTML override - Observando ${newImages.length} novas imagens`);
                window.LazyImageLoader.observe(newImages);
            }
        }, 0);
        
        return result;
    };

    // FALLBACK: Após 3 segundos, se ainda há imagens com data-src mas sem src, carrega tudo direto
    setTimeout(() => {
        const unloadedImages = document.querySelectorAll('img[data-src]:not([src])');
        if (unloadedImages.length > 0) {
            console.warn(`[LazyImageLoader] Fallback ativado - Carregando ${unloadedImages.length} imagens direto via src`);
            unloadedImages.forEach(img => {
                if (img.dataset.src && !img.src) {
                    img.src = img.dataset.src;
                    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
                }
            });
        }
    }, 3000);

})();
