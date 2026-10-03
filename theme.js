// Theme management (light / dark mode)
(function () {
    'use strict';

    const STORAGE_KEY = 'pcb-theme';
    const LABELS = {
        light: 'Activar modo oscuro',
        dark: 'Activar modo claro'
    };

    function getStoredTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch {
            return null;
        }
    }

    function storeTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // Ignore storage errors (private mode, disabled storage, etc.)
        }
    }

    function getSystemTheme() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function getInitialTheme() {
        const stored = getStoredTheme();
        return stored === 'dark' || stored === 'light' ? stored : getSystemTheme();
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
            btn.setAttribute('aria-pressed', String(theme === 'dark'));
            btn.setAttribute('aria-label', LABELS[theme]);
            btn.title = LABELS[theme];
        });
    }

    function toggleTheme() {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        storeTheme(next);
        applyTheme(next);
    }

    function bindToggles() {
        document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
            if (btn.dataset.themeBound === 'true') return;
            btn.dataset.themeBound = 'true';
            btn.addEventListener('click', toggleTheme);
        });
    }

    function watchSystemTheme() {
        if (!window.matchMedia) return;

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (e) => {
            if (getStoredTheme()) return;
            applyTheme(e.matches ? 'dark' : 'light');
        };

        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else if (mq.addListener) mq.addListener(onChange);
    }

    function init() {
        applyTheme(getInitialTheme());
        bindToggles();
        watchSystemTheme();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.Theme = {
        applyTheme,
        toggleTheme,
        getTheme: () => document.documentElement.getAttribute('data-theme')
    };
})();
