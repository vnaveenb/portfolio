// Theme Toggle System
class ThemeManager {
    constructor() {
        this.theme = null;
        this.toggle = null;
        this.init();
    }

    init() {
        this.createToggleButton();
        this.detectSystemTheme();
        this.loadSavedTheme();
        this.applyTheme();
        this.addEventListeners();
    }

    createToggleButton() {
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'theme-toggle-container';
        toggleContainer.innerHTML = `
            <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
                <i class="bi bi-sun-fill sun-icon"></i>
                <i class="bi bi-moon-fill moon-icon"></i>
            </button>
        `;
        document.body.appendChild(toggleContainer);
        this.toggle = document.getElementById('theme-toggle');
    }

    detectSystemTheme() {
        // Check if user has a system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.systemTheme = prefersDark ? 'dark' : 'light';
    }

    loadSavedTheme() {
        // Check localStorage for saved theme preference
        const savedTheme = localStorage.getItem('portfolio-theme');

        if (savedTheme) {
            this.theme = savedTheme;
        } else {
            // Use system preference if no saved theme
            this.theme = this.systemTheme;
        }
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);

        if (this.theme === 'light') {
            this.toggle?.classList.add('light-mode');
        } else {
            this.toggle?.classList.remove('light-mode');
        }

        // Update Three.js scenes if needed
        this.updateThreeJsTheme();
    }

    updateThreeJsTheme() {
        // This will communicate with Three.js background to update colors
        const event = new CustomEvent('themeChange', {
            detail: { theme: this.theme }
        });
        window.dispatchEvent(event);
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('portfolio-theme', this.theme);
        this.applyTheme();
    }

    addEventListeners() {
        this.toggle?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (!localStorage.getItem('portfolio-theme')) {
                this.systemTheme = e.matches ? 'dark' : 'light';
                this.theme = this.systemTheme;
                this.applyTheme();
            }
        });
    }
}

// Initialize theme manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});

export { ThemeManager };
