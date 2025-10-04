// User Interactions and Custom Cursor
import Lenis from '/node_modules/lenis/dist/lenis.mjs';

class SmoothScroll {
    constructor() {
        this.lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            smooth: true,
            smoothTouch: false,
            touchMultiplier: 2
        });

        this.init();
    }

    init() {
        const raf = (time) => {
            this.lenis.raf(time);
            requestAnimationFrame(raf);
        };

        requestAnimationFrame(raf);

        // Stop scroll on anchor click
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', () => {
                this.lenis.scrollTo(anchor.getAttribute('href'));
            });
        });
    }

    scrollTo(target) {
        this.lenis.scrollTo(target);
    }
}

class CustomCursor {
    constructor() {
        this.cursor = null;
        this.cursorDot = null;
        this.init();
    }

    init() {
        // Check if device supports hover (not touch device)
        if (!window.matchMedia('(hover: hover)').matches) {
            return;
        }

        // Create cursor elements
        this.cursor = document.createElement('div');
        this.cursor.classList.add('custom-cursor');
        document.body.appendChild(this.cursor);

        this.cursorDot = document.createElement('div');
        this.cursorDot.classList.add('cursor-dot');
        document.body.appendChild(this.cursorDot);

        this.addEventListeners();
    }

    addEventListeners() {
        let mouseX = 0, mouseY = 0;
        let cursorX = 0, cursorY = 0;
        let dotX = 0, dotY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // Smooth cursor following
        const animateCursor = () => {
            // Cursor ring follows slower
            cursorX += (mouseX - cursorX) * 0.1;
            cursorY += (mouseY - cursorY) * 0.1;

            // Cursor dot follows faster
            dotX += (mouseX - dotX) * 0.15;
            dotY += (mouseY - dotY) * 0.15;

            this.cursor.style.left = cursorX + 'px';
            this.cursor.style.top = cursorY + 'px';
            this.cursorDot.style.left = dotX + 'px';
            this.cursorDot.style.top = dotY + 'px';

            requestAnimationFrame(animateCursor);
        };

        animateCursor();

        // Expand cursor on hover over interactive elements
        const interactiveElements = document.querySelectorAll('a, button, .btn, .card, .badge');
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                this.cursor.classList.add('expand');
            });

            element.addEventListener('mouseleave', () => {
                this.cursor.classList.remove('expand');
            });
        });
    }
}

class ScrollToTop {
    constructor() {
        this.button = null;
        this.createButton();
        this.addEventListeners();
    }

    createButton() {
        this.button = document.createElement('div');
        this.button.id = 'scroll-top';
        this.button.innerHTML = '<i class="bi bi-arrow-up"></i>';
        document.body.appendChild(this.button);
    }

    addEventListeners() {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                this.button.classList.add('visible');
            } else {
                this.button.classList.remove('visible');
            }
        });

        this.button.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

class ScrollProgress {
    constructor() {
        this.progressBar = null;
        this.createProgressBar();
        this.addEventListeners();
    }

    createProgressBar() {
        this.progressBar = document.createElement('div');
        this.progressBar.id = 'scroll-progress';
        document.body.appendChild(this.progressBar);
    }

    addEventListeners() {
        window.addEventListener('scroll', () => {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.scrollY / windowHeight) * 100;
            this.progressBar.style.width = scrolled + '%';
        });
    }
}

class FormHandler {
    constructor() {
        this.form = document.querySelector('#contact form');
        if (this.form) {
            this.init();
        }
    }

    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(e);
        });
    }

    async handleSubmit(e) {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // Show loading state
        const submitButton = this.form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Sending...';
        submitButton.disabled = true;

        // Simulate form submission (replace with actual endpoint)
        setTimeout(() => {
            console.log('Form data:', data);

            // Show success message
            submitButton.innerHTML = '<i class="bi bi-check-circle"></i> Message Sent!';
            submitButton.classList.remove('btn-primary');
            submitButton.classList.add('btn-success');

            // Reset form
            this.form.reset();

            // Reset button after 3 seconds
            setTimeout(() => {
                submitButton.innerHTML = originalText;
                submitButton.classList.remove('btn-success');
                submitButton.classList.add('btn-primary');
                submitButton.disabled = false;
            }, 3000);
        }, 1500);
    }
}

class ActiveNavLinks {
    constructor() {
        this.sections = document.querySelectorAll('section[id]');
        this.navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => {
            let current = '';

            this.sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;

                if (window.scrollY >= sectionTop - 100) {
                    current = section.getAttribute('id');
                }
            });

            this.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }
}

class ParallaxCards {
    constructor() {
        this.cards = document.querySelectorAll('.card');
        this.init();
    }

    init() {
        this.cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Reduced parallax effect (divided by 50 instead of 10 for more subtle movement)
                const rotateX = (y - centerY) / 50;
                const rotateY = (centerX - x) / 50;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            });
        });
    }
}

class IntersectionObserverAnimations {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, this.observerOptions);

        // Observe elements with animation classes
        const elements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
        elements.forEach(element => observer.observe(element));
    }
}

// Magnetic Buttons Effect
class MagneticButtons {
    constructor() {
        this.buttons = document.querySelectorAll('.btn');
        this.init();
    }

    init() {
        this.buttons.forEach(button => {
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                button.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translate(0, 0)';
            });
        });
    }
}

// Initialize all interactions when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
        new SmoothScroll();
        new CustomCursor();
        new MagneticButtons();
        new ParallaxCards();
    }

    new ScrollToTop();
    new ScrollProgress();
    new FormHandler();
    new ActiveNavLinks();
    new IntersectionObserverAnimations();

    // Add fade-in class to cards for scroll animations
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('fade-in');
    });
});

export {
    SmoothScroll,
    CustomCursor,
    ScrollToTop,
    ScrollProgress,
    FormHandler,
    ActiveNavLinks,
    ParallaxCards,
    IntersectionObserverAnimations,
    MagneticButtons
};
