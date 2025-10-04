// GSAP Animations
import { gsap } from '/node_modules/gsap/index.js';
import { ScrollTrigger } from '/node_modules/gsap/ScrollTrigger.js';

gsap.registerPlugin(ScrollTrigger);

class Animations {
    constructor() {
        this.init();
    }

    init() {
        this.heroAnimations();
        this.scrollAnimations();
        this.cardAnimations();
        this.skillsAnimations();
        this.navbarAnimation();
        this.scrollProgress();
    }

    heroAnimations() {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        tl.from('.hero-content h1', {
            y: 100,
            opacity: 0,
            duration: 0.5,
            delay: 0.3
        })
        .from('.hero-content .lead', {
            y: 50,
            opacity: 0,
            duration: 0.4
        }, '-=0.3')
        .from('.hero-content .btn', {
            y: 30,
            opacity: 0,
            duration: 0.3,
            stagger: 0.1
        }, '-=0.2')
        .from('.hero-content .text-white-50', {
            opacity: 0,
            duration: 0.25
        }, '-=0.15');
    }

    scrollAnimations() {
        // Fade in elements on scroll
        const fadeElements = document.querySelectorAll('.fade-in');
        fadeElements.forEach((element) => {
            gsap.from(element, {
                scrollTrigger: {
                    trigger: element,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                },
                y: 50,
                opacity: 0,
                duration: 0.4,
                ease: 'power2.out'
            });
        });

        // Section titles animation
        const sectionTitles = document.querySelectorAll('.section-title');
        sectionTitles.forEach((title) => {
            gsap.from(title, {
                scrollTrigger: {
                    trigger: title,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                y: 30,
                opacity: 0,
                duration: 0.3
            });

            // Animate the underline
            gsap.from(title.querySelector('::after'), {
                scrollTrigger: {
                    trigger: title,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                width: 0,
                duration: 0.4,
                delay: 0.15
            });
        });
    }

    cardAnimations() {
        const cards = document.querySelectorAll('.card');

        cards.forEach((card, index) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                y: 60,
                opacity: 0,
                duration: 0.4,
                delay: index * 0.05,
                ease: 'power2.out'
            });

            // Add hover animation
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    scale: 1.05,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    scale: 1,
                    duration: 0.2,
                    ease: 'power2.in'
                });
            });
        });
    }

    skillsAnimations() {
        const skillBadges = document.querySelectorAll('.badge');

        skillBadges.forEach((badge, index) => {
            gsap.from(badge, {
                scrollTrigger: {
                    trigger: badge.closest('.card'),
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                },
                scale: 0,
                opacity: 0,
                duration: 0.2,
                delay: index * 0.02,
                ease: 'back.out(1.7)'
            });

            // Interactive hover
            badge.addEventListener('mouseenter', () => {
                gsap.to(badge, {
                    scale: 1.2,
                    y: -5,
                    duration: 0.15,
                    ease: 'power2.out'
                });
            });

            badge.addEventListener('mouseleave', () => {
                gsap.to(badge, {
                    scale: 1,
                    y: 0,
                    duration: 0.15,
                    ease: 'power2.in'
                });
            });
        });
    }

    navbarAnimation() {
        const navbar = document.querySelector('.navbar');

        ScrollTrigger.create({
            start: 'top -80',
            end: 99999,
            toggleClass: {
                targets: navbar,
                className: 'scrolled'
            }
        });

        // Smooth scroll for nav links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));

                if (target) {
                    gsap.to(window, {
                        duration: 1,
                        scrollTo: {
                            y: target,
                            offsetY: 70
                        },
                        ease: 'power3.inOut'
                    });
                }
            });
        });
    }

    scrollProgress() {
        const progressBar = document.getElementById('scroll-progress');

        gsap.to(progressBar, {
            scaleX: 1,
            transformOrigin: 'left',
            ease: 'none',
            scrollTrigger: {
                start: 'top top',
                end: 'max',
                scrub: 0.3
            }
        });
    }
}

// Parallax effect for sections
class ParallaxEffect {
    constructor() {
        this.elements = document.querySelectorAll('[data-speed]');
        this.init();
    }

    init() {
        this.elements.forEach(element => {
            const speed = element.getAttribute('data-speed');

            gsap.to(element, {
                y: () => -(1 - speed) * ScrollTrigger.maxScroll(window),
                ease: 'none',
                scrollTrigger: {
                    start: 0,
                    end: 'max',
                    invalidateOnRefresh: true,
                    scrub: 0
                }
            });
        });
    }
}

// Button ripple effect
class ButtonRipple {
    constructor() {
        this.buttons = document.querySelectorAll('.btn');
        this.init();
    }

    init() {
        this.buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const x = e.clientX - e.target.offsetLeft;
                const y = e.clientY - e.target.offsetTop;

                const ripple = document.createElement('span');
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');

                button.appendChild(ripple);

                gsap.to(ripple, {
                    scale: 10,
                    opacity: 0,
                    duration: 0.6,
                    ease: 'power2.out',
                    onComplete: () => ripple.remove()
                });
            });
        });
    }
}

// Typewriter effect for hero text
class TypewriterEffect {
    constructor(element, text, speed = 50) {
        this.element = element;
        this.text = text;
        this.speed = speed;
        this.index = 0;
        this.type();
    }

    type() {
        if (this.index < this.text.length) {
            this.element.textContent += this.text.charAt(this.index);
            this.index++;
            setTimeout(() => this.type(), this.speed);
        }
    }
}

// Initialize animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Animations();
    new ParallaxEffect();
    new ButtonRipple();

    // Optional: Add typewriter effect to subtitle
    // const subtitle = document.querySelector('.lead');
    // if (subtitle) {
    //     const originalText = subtitle.textContent;
    //     subtitle.textContent = '';
    //     setTimeout(() => {
    //         new TypewriterEffect(subtitle, originalText, 30);
    //     }, 1500);
    // }
});

export { Animations, ParallaxEffect, ButtonRipple, TypewriterEffect };
