class SettingsManager {
    constructor() {
        this.defaultSettings = {
            theme: 'Light',
            fontSize: '16',
            notificationSound: 'On',
            textToSpeech: 'Enabled',
            reminderAdvanced: false,
            primaryColor: '#28a745',
            primaryDark: '#218838',
            lightColor: '#eafbea',
            vibration: true,
            fontSizeCustom: 16,
            highContrast: false
        };
        this.currentColors = {};
        this.init();
    }

    init() {
        this.initSettingsPage();
        this.loadAndApplySettings();
        this.setupEventListeners();
    }

    initSettingsPage() {
        try {
            const footerText = document.querySelector('footer .bi-c-circle').nextElementSibling;
            if (footerText) {
                footerText.textContent = ` ${new Date().getFullYear()} Pill Reminder. All rights reserved.`;
            }
            this.initTooltips();
            document.querySelectorAll('button').forEach(button => {
                button.dataset.originalText = button.innerHTML;
            });
            this.initColorPicker();
        } catch (error) {
            console.error('Error in initSettingsPage:', error);
            throw error;
        }
    }

    initTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }

    initColorPicker() {
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                if (this.validateColor(e.target.value)) {
                    this.applyColorScheme(e.target.value);
                }
            });
        }
    }

    loadAndApplySettings() {
        let savedSettings = JSON.parse(localStorage.getItem('pillReminderSettings')) || this.defaultSettings;

        savedSettings.fontSize = parseInt(savedSettings.fontSize) || this.defaultSettings.fontSize;
        if (savedSettings.fontSize < 12) savedSettings.fontSize = 12;
        if (savedSettings.fontSize > 24) savedSettings.fontSize = 24;

        this.applyTheme(savedSettings.theme || this.defaultSettings.theme);
        this.applyFontSize(savedSettings.fontSize || this.defaultSettings.fontSize);
        this.toggleHighContrast(savedSettings.highContrast || this.defaultSettings.highContrast);
        this.applyColorScheme(savedSettings.primaryColor || this.defaultSettings.primaryColor);
        this.applyTextToSpeech(savedSettings.textToSpeech || this.defaultSettings.textToSpeech);
        this.applyNotificationSound(savedSettings.notificationSound || this.defaultSettings.notificationSound);

        if (document.getElementById('theme')) {
            this.populateSettingsForm(savedSettings);
            this.applyFormWidths();
        }

        localStorage.setItem('pillReminderSettings', JSON.stringify(savedSettings));
    }

    populateSettingsForm(settings) {
        document.getElementById('theme').value = settings.theme || this.defaultSettings.theme;
        document.getElementById('fontSize').value = settings.fontSize || this.defaultSettings.fontSize;
        document.getElementById('notification').value = settings.notificationSound || this.defaultSettings.notificationSound;
        document.getElementById('tts').value = settings.textToSpeech || this.defaultSettings.textToSpeech;
        document.getElementById('highContrast').checked = settings.highContrast || false;
        if (document.getElementById('colorPicker')) {
            document.getElementById('colorPicker').value = settings.primaryColor || this.defaultSettings.primaryColor;
        }
    }

    applyFormWidths() {
        const formSelects = document.querySelectorAll('.content-section .row .form-select');
        formSelects.forEach(select => {
            select.style.width = 'calc(100% - 2.5rem)';
            select.style.minWidth = 'calc(100% - 2.5rem)';
        });
    }

    setupEventListeners() {
        document.getElementById('theme').addEventListener('change', (e) => {
            this.applyTheme(e.target.value);
            this.saveSettings();
        });

        document.getElementById('fontSize').addEventListener('change', (e) => {
            this.applyFontSize(parseInt(e.target.value));
            this.saveSettings();
        });

        document.getElementById('colorPicker').addEventListener('input', (e) => {
            if (this.validateColor(e.target.value)) {
                this.applyColorScheme(e.target.value);
                this.saveSettings();
            }
        });

        document.getElementById('notification').addEventListener('change', (e) => {
            this.applyNotificationSound(e.target.value);
            this.saveSettings();
            if (e.target.value === 'On') {
                if (typeof initNotificationSystem === 'function') {
                    initNotificationSystem();
                }
            }
        });

        document.getElementById('tts').addEventListener('change', () => {
            this.applyTextToSpeech(document.getElementById('tts').value);
            this.saveSettings();
        });

        document.getElementById('highContrast').addEventListener('change', (e) => {
            this.toggleHighContrast(e.target.checked);
            this.saveSettings();
        });
    }

    saveSettings() {
        const settings = {
            theme: document.getElementById('theme')?.value || this.defaultSettings.theme,
            fontSize: parseInt(document.getElementById('fontSize')?.value) || this.defaultSettings.fontSize,
            notificationSound: document.getElementById('notification')?.value || this.defaultSettings.notificationSound,
            textToSpeech: document.getElementById('tts')?.value || this.defaultSettings.textToSpeech,
            highContrast: document.getElementById('highContrast')?.checked || this.defaultSettings.highContrast,
            primaryColor: document.getElementById('colorPicker')?.value || this.defaultSettings.primaryColor,
            reminderAdvanced: this.defaultSettings.reminderAdvanced,
            primaryDark: this.currentColors.primaryDark || this.defaultSettings.primaryDark,
            lightColor: this.currentColors.light || this.defaultSettings.lightColor,
            vibration: this.defaultSettings.vibration,
            fontSizeCustom: this.defaultSettings.fontSizeCustom
        };
        localStorage.setItem('pillReminderSettings', JSON.stringify(settings));
    }

    applyTheme(theme) {
        const root = document.documentElement;
        if (theme === 'Dark') {
            document.body.classList.add('theme-dark');
            document.body.classList.remove('theme-light');
            root.style.setProperty('--text-color', '#ffffff');
            root.style.setProperty('--bg-color', '#121212');
            root.style.setProperty('--card-bg', '#1e1e1e');
            root.style.setProperty('--border-color', '#333');
            root.style.setProperty('--form-control-bg', '#333');
            root.style.setProperty('--form-control-border', '#555');
            root.style.setProperty('--form-control-text', '#ffffff');
            root.style.setProperty('--btn-text', '#ffffff');
            root.style.setProperty('--btn-border', '#444');
            root.style.setProperty('--link-color', '#4dabf7');
            root.style.setProperty('--link-hover-color', '#74c0fc');
            root.style.setProperty('--placeholder-color', '#adb5bd');
        } else {
            document.body.classList.add('theme-light');
            document.body.classList.remove('theme-dark');
            root.style.removeProperty('--text-color');
            root.style.removeProperty('--bg-color');
            root.style.removeProperty('--card-bg');
            root.style.removeProperty('--border-color');
            root.style.removeProperty('--form-control-bg');
            root.style.removeProperty('--form-control-border');
            root.style.removeProperty('--form-control-text');
            root.style.removeProperty('--btn-text');
            root.style.removeProperty('--btn-border');
            root.style.removeProperty('--link-color');
            root.style.removeProperty('--link-hover-color');
            root.style.removeProperty('--placeholder-color');
        }
    }

    applyFontSize(size) {
        document.documentElement.style.fontSize = `${size}px`;
    }

    toggleHighContrast(enabled) {
        if (enabled) {
            document.body.classList.add('high-contrast');
            document.documentElement.style.setProperty('--text-color', '#000000');
            document.documentElement.style.setProperty('--bg-color', '#ffffff');
        } else {
            document.body.classList.remove('high-contrast');
            document.documentElement.style.removeProperty('--text-color');
            document.documentElement.style.removeProperty('--bg-color');
        }
    }

    applyColorScheme(color) {
        try {
            const darkerColor = this.darkenColor(color, 15);
            const lighterColor = this.lightenColor(color, 90);
            document.documentElement.style.setProperty('--primary-color', color);
            document.documentElement.style.setProperty('--primary-dark', darkerColor);
            document.documentElement.style.setProperty('--light-green', lighterColor);
            this.currentColors = {
                primary: color,
                primaryDark: darkerColor,
                light: lighterColor
            };
        } catch (error) {
            console.error('Error applying color scheme:', error);
        }
    }

    applyTextToSpeech(enabled) {
        if (enabled === 'Enabled') {
            document.body.classList.add('tts-enabled');
        } else {
            document.body.classList.remove('tts-enabled');
        }
    }

    applyNotificationSound(sound) {
        // Placeholder for notification sound logic
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
    }

    validateColor(color) {
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        return colorRegex.test(color);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});