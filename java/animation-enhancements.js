/**
 * GameHub - Animation Enhancements System
 * Implements skeleton loading, smooth card animations, glow effects
 * 
 * @module AnimationEnhancements
 * @version 1.0.0
 * @date 2026-06-13
 */

(function() {
    'use strict';

    /**
     * Animation Enhancements Manager
     * Handles skeleton loading, animations, and visual effects
     */
    window.AnimationEnhancements = {
        /**
         * Configuration
         */
        config: {
            skeletonDuration: 500,      // ms - how long skeleton shows before real content
            cardAnimationDuration: 300,  // ms - card entrance animation
            glowDuration: 2000,          // ms - glow pulse cycle
            debug: false
        },

        /**
         * Skeleton Loading Template
         * Creates placeholder loaders for cards while data loads
         */
        createSkeletonCard() {
            const skeleton = document.createElement('div');
            skeleton.className = 'card-skeleton';
            skeleton.innerHTML = `
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text skeleton-text--short"></div>
                    <div class="skeleton-actions">
                        <div class="skeleton-button"></div>
                        <div class="skeleton-button"></div>
                    </div>
                </div>
            `;
            return skeleton;
        },

        /**
         * Load Card Animation
         * Smooth entrance animation for game cards
         */
        animateCardLoad(card, delay = 0) {
            if (!card) return;

            card.style.animation = `cardFadeInScale 0.6s ease-out ${delay}ms forwards`;
            card.style.opacity = '0';
            
            return new Promise(resolve => {
                setTimeout(resolve, 600 + delay);
            });
        },

        /**
         * Batch Animate Cards
         * Stagger animation for multiple cards
         */
        animateCardsBatch(cards, staggerDelay = 50) {
            const promises = [];
            
            cards.forEach((card, index) => {
                promises.push(this.animateCardLoad(card, index * staggerDelay));
            });

            return Promise.all(promises);
        },

        /**
         * Replace Skeleton with Content
         * Smooth transition from skeleton to real content
         */
        replaceSkeletonWithContent(skeletonElement, contentElement) {
            return new Promise(resolve => {
                // Fade out skeleton
                skeletonElement.style.animation = 'fadeOut 0.3s ease-in forwards';
                
                setTimeout(() => {
                    skeletonElement.remove();
                    
                    // Fade in content
                    contentElement.style.opacity = '0';
                    contentElement.style.animation = 'fadeIn 0.3s ease-out forwards';
                    
                    skeletonElement.parentNode?.appendChild(contentElement);
                    
                    setTimeout(resolve, 300);
                }, 300);
            });
        },

        /**
         * Add Loading State to Container
         * Shows skeleton loaders while fetching data
         */
        showSkeletonLoader(container, count = 6) {
            container.innerHTML = '';
            container.classList.add('loading-state');

            for (let i = 0; i < count; i++) {
                const skeleton = this.createSkeletonCard();
                container.appendChild(skeleton);
            }

            return () => container.classList.remove('loading-state');
        },

        /**
         * Glow Effect on Element
         * Adds pulsing glow to highlight important elements
         */
        addGlowEffect(element, color = '#00d4ff') {
            if (!element) return;

            const glowElement = document.createElement('div');
            glowElement.className = 'glow-effect';
            glowElement.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
            
            element.style.position = 'relative';
            element.appendChild(glowElement);

            return () => glowElement.remove();
        },

        /**
         * Pulse Animation on Element
         * Creates a pulse/heartbeat effect
         */
        addPulseEffect(element) {
            if (!element) return;

            element.classList.add('pulse-effect');

            return () => element.classList.remove('pulse-effect');
        },

        /**
         * Shimmer Effect
         * Creates a loading shimmer effect
         */
        createShimmerElement() {
            const shimmer = document.createElement('div');
            shimmer.className = 'shimmer-effect';
            shimmer.innerHTML = `
                <div class="shimmer-gradient"></div>
            `;
            return shimmer;
        },

        /**
         * Add Flip Animation to Element
         * Rotates element with 3D flip effect
         */
        flipElement(element, duration = 600) {
            return new Promise(resolve => {
                element.style.animation = `flip3D ${duration}ms ease-in-out forwards`;
                setTimeout(resolve, duration);
            });
        },

        /**
         * Add Bounce Animation
         * Bouncing entrance effect
         */
        addBounceAnimation(element, duration = 600) {
            return new Promise(resolve => {
                element.style.animation = `bounce ${duration}ms ease-out forwards`;
                setTimeout(resolve, duration);
            });
        },

        /**
         * Add Slide Animation
         * Slides element from one side
         */
        slideElement(element, from = 'left', duration = 400) {
            return new Promise(resolve => {
                const animationName = from === 'left' ? 'slideInLeft' : 
                                     from === 'right' ? 'slideInRight' :
                                     from === 'up' ? 'slideInUp' : 'slideInDown';
                
                element.style.animation = `${animationName} ${duration}ms ease-out forwards`;
                setTimeout(resolve, duration);
            });
        },

        /**
         * Stagger Show Effect
         * Shows multiple elements with staggered timing
         */
        staggerShow(elements, delay = 100, duration = 300) {
            const promises = [];

            elements.forEach((element, index) => {
                element.style.opacity = '0';
                element.style.animation = `fadeIn ${duration}ms ease-out ${index * delay}ms forwards`;
                
                promises.push(new Promise(resolve => {
                    setTimeout(resolve, index * delay + duration);
                }));
            });

            return Promise.all(promises);
        },

        /**
         * Add Loading Bar Animation
         * Creates an animated loading progress bar
         */
        createLoadingBar() {
            const bar = document.createElement('div');
            bar.className = 'loading-bar';
            bar.innerHTML = `<div class="loading-bar-progress"></div>`;
            
            document.body.appendChild(bar);

            return () => {
                bar.style.animation = 'fadeOut 0.3s ease-in forwards';
                setTimeout(() => bar.remove(), 300);
            };
        },

        /**
         * Add Gradient Animation
         * Creates animated gradient background
         */
        addGradientAnimation(element, colors = ['#00d4ff', '#f39c12']) {
            const gradient = colors.map((color, i) => 
                `${color} ${(i / (colors.length - 1)) * 100}%`
            ).join(', ');

            element.style.background = `linear-gradient(45deg, ${gradient})`;
            element.style.backgroundSize = '400% 400%';
            element.style.animation = 'gradientShift 3s ease infinite';

            return () => {
                element.style.animation = 'none';
                element.style.background = '';
            };
        },

        /**
         * Typewriter Effect
         * Animates text character by character
         */
        typewriterEffect(element, text, speed = 50) {
            return new Promise(resolve => {
                element.innerHTML = '';
                let index = 0;

                const type = () => {
                    if (index < text.length) {
                        element.innerHTML += text[index];
                        index++;
                        setTimeout(type, speed);
                    } else {
                        resolve();
                    }
                };

                type();
            });
        },

        /**
         * Counter Animation
         * Animates number counting up
         */
        countUp(element, target, duration = 1000) {
            return new Promise(resolve => {
                const start = parseInt(element.textContent) || 0;
                const increment = (target - start) / (duration / 16);
                let current = start;

                const counter = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        element.textContent = target;
                        clearInterval(counter);
                        resolve();
                    } else {
                        element.textContent = Math.floor(current);
                    }
                }, 16);
            });
        },

        /**
         * Wiggle Animation
         * Shakes element side to side
         */
        wiggle(element, duration = 400) {
            return new Promise(resolve => {
                element.style.animation = `wiggle ${duration}ms ease-in-out forwards`;
                setTimeout(resolve, duration);
            });
        },

        /**
         * Rotate Animation
         * Spins element
         */
        rotate(element, degrees = 360, duration = 600) {
            return new Promise(resolve => {
                element.style.animation = `spin ${duration}ms linear forwards`;
                setTimeout(resolve, duration);
            });
        },

        /**
         * Scale Animation
         * Grows or shrinks element
         */
        scale(element, targetScale = 1.2, duration = 400) {
            return new Promise(resolve => {
                element.style.transform = `scale(${targetScale})`;
                element.style.transition = `transform ${duration}ms ease-out`;
                
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                    setTimeout(resolve, duration);
                }, 100);
            });
        },

        /**
         * Rainbow Text Effect
         * Applies rainbow colors to text
         */
        rainbowText(element) {
            const text = element.textContent;
            const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
            
            element.innerHTML = text
                .split('')
                .map((char, i) => {
                    const color = colors[i % colors.length];
                    return `<span style="color: ${color}; transition: color 0.3s">${char}</span>`;
                })
                .join('');

            return () => {
                element.innerHTML = text;
            };
        },

        /**
         * Parallax Effect
         * Creates depth illusion with scroll
         */
        addParallaxEffect(element, speed = 0.5) {
            const parallaxMove = () => {
                const scrolled = window.scrollY;
                element.style.transform = `translateY(${scrolled * speed}px)`;
            };

            window.addEventListener('scroll', parallaxMove);

            return () => {
                window.removeEventListener('scroll', parallaxMove);
            };
        },

        /**
         * Hover Scale Effect
         * Scales element on hover
         */
        addHoverScale(element, scale = 1.05, duration = 200) {
            element.addEventListener('mouseenter', () => {
                element.style.transform = `scale(${scale})`;
                element.style.transition = `transform ${duration}ms ease-out`;
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = 'scale(1)';
            });
        },

        /**
         * Log messages (debug mode)
         */
        log(message) {
            if (this.config.debug) {
                console.log(`[AnimationEnhancements] ${message}`);
            }
        }
    };

    /**
     * Auto-initialize on page load
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.AnimationEnhancements.config.debug = window.SecurityModule?.DEBUG_MODE || false;
            window.AnimationEnhancements.log('Animation enhancements initialized');
        });
    } else {
        window.AnimationEnhancements.config.debug = window.SecurityModule?.DEBUG_MODE || false;
        window.AnimationEnhancements.log('Animation enhancements initialized');
    }

})();
