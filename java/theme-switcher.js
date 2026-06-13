/**
 * GameHub - Theme Switcher (Dark/Light Mode)
 * Provides seamless dark and light theme switching
 * Supports system preference detection and manual override
 * 
 * @module ThemeSwitcher
 * @version 1.0.0
 * @date 2026-06-13
 */

(function() {
    'use strict';

    /**
     * Theme Switcher Manager
     * Handles dark/light mode with persistence and system preference detection
     */
    window.ThemeSwitcher = {
        /**
         * Configuration
         */
        config: {
            storageKey: 'gamehub-theme-preference',
            defaultTheme: 'light',
            autoDetectSystem: true,
            animationDuration: 300 // ms
        },

        /**
         * Current theme state
         */
        state: {
            currentTheme: 'light',
            isSystemPreference: false,
            supportsDarkMode: true
        },

        /**
         * Color schemes for themes
         */
        themes: {
            light: {
                name: 'Light Mode',
                icon: 'fas fa-sun',
                colors: {
                    primary: '#00d4ff',
                    secondary: '#f39c12',
                    background: '#ffffff',
                    surface: '#f5f5f5',
                    text: '#1a1a2e',
                    textSecondary: '#666666',
                    border: '#e0e0e0',
                    hover: '#f0f0f0'
                }
            },
            dark: {
                name: 'Dark Mode',
                icon: 'fas fa-moon',
                colors: {
                    primary: '#00d4ff',
                    secondary: '#f39c12',
                    background: '#0f0f1e',
                    surface: '#1a1a2e',
                    text: '#ffffff',
                    textSecondary: '#b0b0b0',
                    border: '#333333',
                    hover: '#2a2a3e'
                }
            }
        },

        /**
         * Initialize theme switcher
         */
        init() {
            this.detectSystemPreference();
            this.loadSavedTheme();
            this.applyTheme(this.state.currentTheme);
            this.setupEventListeners();
            this.log('Theme switcher initialized');
        },

        /**
         * Detect system theme preference
         */
        detectSystemPreference() {
            if (!window.matchMedia) {
                this.state.supportsDarkMode = false;
                return;
            }

            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.state.supportsDarkMode = darkModeQuery.matches;

            // Listen for system preference changes
            darkModeQuery.addEventListener('change', (e) => {
                if (this.config.autoDetectSystem && !this.getSavedTheme()) {
                    this.applyTheme(e.matches ? 'dark' : 'light', true);
                }
            });

            this.log(`System prefers ${darkModeQuery.matches ? 'dark' : 'light'} mode`);
        },

        /**
         * Load saved theme preference
         */
        loadSavedTheme() {
            const saved = this.getSavedTheme();

            if (saved) {
                this.state.currentTheme = saved;
                this.state.isSystemPreference = false;
            } else if (this.config.autoDetectSystem) {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.state.currentTheme = prefersDark ? 'dark' : 'light';
                this.state.isSystemPreference = true;
            }

            this.log(`Loaded theme: ${this.state.currentTheme}`);
        },

        /**
         * Get saved theme from localStorage
         */
        getSavedTheme() {
            try {
                return localStorage.getItem(this.config.storageKey);
            } catch (error) {
                console.warn('Failed to read theme from localStorage:', error);
                return null;
            }
        },

        /**
         * Save theme preference
         */
        saveTheme(theme) {
            try {
                localStorage.setItem(this.config.storageKey, theme);
                this.state.isSystemPreference = false;
            } catch (error) {
                console.warn('Failed to save theme:', error);
            }
        },

        /**
         * Apply theme to the document
         */
        applyTheme(theme, isSystemPreference = false) {
            if (!this.themes[theme]) {
                console.error(`Theme "${theme}" not found`);
                return;
            }

            const colors = this.themes[theme].colors;
            const root = document.documentElement;

            // Animate theme transition
            root.style.transition = `background-color ${this.config.animationDuration}ms ease, color ${this.config.animationDuration}ms ease`;

            // Apply CSS custom properties
            Object.entries(colors).forEach(([key, value]) => {
                root.style.setProperty(`--theme-${key}`, value);
            });

            // Update document attributes
            root.setAttribute('data-theme', theme);
            document.body.className = document.body.className
                .replace(/\btheme-light\b|\btheme-dark\b/g, '')
                .concat(` theme-${theme}`)
                .trim();

            // Update meta theme-color
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', colors.primary);
            }

            // Update favicon if needed
            this.updateFavicon(theme);

            // Store preference
            this.state.currentTheme = theme;
            this.state.isSystemPreference = isSystemPreference;

            if (!isSystemPreference) {
                this.saveTheme(theme);
            }

            // Dispatch event for other modules
            window.dispatchEvent(new CustomEvent('theme-changed', {
                detail: { theme, colors, isSystemPreference }
            }));

            this.log(`Applied theme: ${theme}`);
        },

        /**
         * Update favicon for theme
         */
        updateFavicon(theme) {
            const favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) return;

            // You can have theme-specific favicons if needed
            // For now, just update the background color behind the favicon
            const colors = this.themes[theme].colors;
            
            // Create a canvas to generate theme-aware favicon
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');

            // Draw background
            ctx.fillStyle = colors.background;
            ctx.fillRect(0, 0, 32, 32);

            // Draw border
            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 2;
            ctx.strokeRect(2, 2, 28, 28);

            // Update favicon
            favicon.href = canvas.toDataURL('image/png');
        },

        /**
         * Toggle between light and dark themes
         */
        toggle() {
            const newTheme = this.state.currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(newTheme);
            return newTheme;
        },

        /**
         * Set specific theme
         */
        set(theme) {
            if (!this.themes[theme]) {
                console.error(`Theme "${theme}" not found`);
                return false;
            }
            this.applyTheme(theme);
            return true;
        },

        /**
         * Get current theme
         */
        getCurrent() {
            return this.state.currentTheme;
        },

        /**
         * Get available themes
         */
        getAvailable() {
            return Object.keys(this.themes);
        },

        /**
         * Get theme info
         */
        getThemeInfo(theme) {
            return this.themes[theme] || null;
        },

        /**
         * Reset to system preference
         */
        useSystemPreference() {
            localStorage.removeItem(this.config.storageKey);
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light', true);
        },

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Keyboard shortcut: Ctrl+Shift+D to toggle dark mode
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                    e.preventDefault();
                    this.toggle();
                }
            });
        },

        /**
         * Create theme switcher button
         */
        createButton() {
            const button = document.createElement('button');
            button.id = 'theme-switcher-btn';
            button.className = 'theme-switcher-btn';
            button.setAttribute('aria-label', 'Toggle dark/light mode');
            button.innerHTML = `<i class="${this.themes[this.state.currentTheme].icon}"></i>`;

            button.addEventListener('click', () => {
                this.toggle();
                button.innerHTML = `<i class="${this.themes[this.state.currentTheme].icon}"></i>`;
            });

            return button;
        },

        /**
         * Create full theme menu
         */
        createMenu() {
            const menu = document.createElement('div');
            menu.className = 'theme-menu';
            menu.innerHTML = `
                <div class="theme-menu__header">
                    <span>Tema</span>
                    <button class="theme-menu__close" aria-label="Close">&times;</button>
                </div>
                <div class="theme-menu__options">
                    ${Object.entries(this.themes)
                        .map(([key, theme]) => `
                            <button class="theme-option ${key === this.state.currentTheme ? 'active' : ''}"
                                    data-theme="${key}"
                                    aria-pressed="${key === this.state.currentTheme}">
                                <i class="${theme.icon}"></i>
                                <span>${theme.name}</span>
                            </button>
                        `)
                        .join('')}
                </div>
                <div class="theme-menu__footer">
                    <button class="theme-system-btn" id="theme-system-preference">
                        <i class="fas fa-cog"></i>
                        Usar Preferência do Sistema
                    </button>
                </div>
            `;

            // Event handlers
            menu.querySelectorAll('.theme-option').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const theme = e.currentTarget.getAttribute('data-theme');
                    this.set(theme);

                    // Update button states
                    menu.querySelectorAll('.theme-option').forEach(b => {
                        b.classList.toggle('active', b === e.currentTarget);
                        b.setAttribute('aria-pressed', b === e.currentTarget);
                    });
                });
            });

            menu.querySelector('.theme-menu__close').addEventListener('click', () => {
                menu.remove();
            });

            menu.querySelector('#theme-system-preference').addEventListener('click', () => {
                this.useSystemPreference();
                menu.remove();
            });

            return menu;
        },

        /**
         * Log messages (debug mode)
         */
        log(message) {
            if (window.SecurityModule?.DEBUG_MODE) {
                console.log(`[ThemeSwitcher] ${message}`);
            }
        }
    };

    /**
     * Auto-initialize on page load
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ThemeSwitcher.init();
        });
    } else {
        window.ThemeSwitcher.init();
    }

})();
