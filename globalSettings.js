document.addEventListener('DOMContentLoaded', () => {
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    const applyStyleOverrides = () => {
        const styleOverride = document.createElement('style');
        styleOverride.textContent = `
            *, *:before, *:after {
                transition: none !important;
                animation: none !important;
            }
            body, html {
                overflow-x: hidden !important;
            }
            .collapse, .collapsing {
                transition: none !important;
            }
            .navbar-collapse {
                display: none;
            }
            .navbar-collapse.show {
                display: block;
            }
        `;
        document.head.appendChild(styleOverride);
    };

    const loadSettings = () => {
        const defaults = {
            theme: 'Light',
            fontSize: '16',
            primaryColor: '#28a745',
            highContrast: false,
            notificationSound: 'On',
            tts: 'Disabled'
        };
        const settings = {};
        Object.keys(defaults).forEach(key => {
            settings[key] = localStorage.getItem(key) ?? defaults[key];
        });
        return settings;
    };

    const applySettings = (settings) => {
        document.body.className = `theme-${settings.theme.toLowerCase()}${settings.highContrast ? ' high-contrast' : ''}`;
        document.documentElement.setAttribute('data-theme', settings.theme.toLowerCase());
        document.documentElement.style.fontSize = `${settings.fontSize}px`;
        document.documentElement.style.setProperty('--primary-color', settings.primaryColor);

        const elements = {
            theme: document.getElementById('theme'),
            fontSize: document.getElementById('fontSize'),
            colorPicker: document.getElementById('colorPicker'),
            highContrast: document.getElementById('highContrast'),
            notification: document.getElementById('notification'),
            tts: document.getElementById('tts')
        };

        if (elements.theme) elements.theme.value = settings.theme;
        if (elements.fontSize) elements.fontSize.value = settings.fontSize;
        if (elements.colorPicker) elements.colorPicker.value = settings.primaryColor;
        if (elements.highContrast) elements.highContrast.checked = settings.highContrast;
        if (elements.notification) elements.notification.value = settings.notificationSound;
        if (elements.tts) elements.tts.value = settings.tts;
    };

    const saveSetting = (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error(`Error saving ${key}:`, e);
        }
    };

    const setupEventListeners = () => {
        const elements = {
            theme: document.getElementById('theme'),
            fontSize: document.getElementById('fontSize'),
            colorPicker: document.getElementById('colorPicker'),
            highContrast: document.getElementById('highContrast'),
            notification: document.getElementById('notification'),
            tts: document.getElementById('tts')
        };

        if (elements.theme) {
            elements.theme.addEventListener('change', (e) => {
                const newTheme = e.target.value;
                const highContrast = elements.highContrast?.checked ?? false;
                document.body.className = `theme-${newTheme.toLowerCase()}${highContrast ? ' high-contrast' : ''}`;
                document.documentElement.setAttribute('data-theme', newTheme.toLowerCase());
                saveSetting('theme', newTheme);
            });
        }

        if (elements.fontSize) {
            elements.fontSize.addEventListener('change', (e) => {
                const newSize = e.target.value;
                document.documentElement.style.fontSize = `${newSize}px`;
                saveSetting('fontSize', newSize);
            });
        }

        if (elements.colorPicker) {
            elements.colorPicker.addEventListener('input', debounce((e) => {
                const newColor = e.target.value;
                document.documentElement.style.setProperty('--primary-color', newColor);
                saveSetting('primaryColor', newColor);
            }, 200));
        }

        if (elements.highContrast) {
            elements.highContrast.addEventListener('change', (e) => {
                const isHighContrast = e.target.checked;
                const theme = elements.theme?.value ?? 'Light';
                document.body.className = `theme-${theme.toLowerCase()}${isHighContrast ? ' high-contrast' : ''}`;
                saveSetting('highContrast', isHighContrast);
                const alertContainer = document.getElementById('alertContainer');
                if (alertContainer) {
                    alertContainer.innerHTML = `<div class="visually-hidden">High contrast mode ${isHighContrast ? 'enabled' : 'disabled'}</div>`;
                }
            });
        }

        if (elements.notification) {
            elements.notification.addEventListener('change', (e) => {
                saveSetting('notificationSound', e.target.value);
            });
        }

        if (elements.tts) {
            elements.tts.addEventListener('change', (e) => {
                saveSetting('tts', e.target.value);
            });
        }
    };

    try {
        applyStyleOverrides();
        const settings = loadSettings();
        applySettings(settings);
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing global settings:', error);
        const alertContainer = document.getElementById('alertContainer');
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    Error loading settings. Using defaults.
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
        }
    }
});