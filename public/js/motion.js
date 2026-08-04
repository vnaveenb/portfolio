/* naveenb.dev — layer 1, the type.
 *
 * This is where the design lives, and it deliberately needs no GPU. Smooth
 * scroll, pinned spreads, words wiping up from behind masks, and the hero
 * name flying into the header slot — all of it is transforms and opacity.
 *
 * Layer 2 (the WebGL schematics in scenes.js) is attached at the end, if the
 * machine can do it. It is optional by construction: this module owns scroll
 * and tells the stage what to draw, so losing the stage costs texture, not
 * the art direction. That split is the whole point — the previous version
 * coupled them, and a GPU that would not start left the visitor with a plain
 * text page.
 */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ramp = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src;
        el.async = false;
        el.onload = resolve;
        el.onerror = () => reject(new Error(`failed to load ${src}`));
        document.head.appendChild(el);
    });
}

function hasWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
        return false;
    }
}

export async function start(profile) {
    /* GSAP and Lenis ship as UMD, so they arrive as classic scripts and hang
     * off window. Same origin either way — nothing here touches a CDN. */
    await Promise.all([
        loadScript('/vendor/gsap.min.js'),
        loadScript('/vendor/lenis.min.js'),
    ]);
    await loadScript('/vendor/ScrollTrigger.min.js');

    const { gsap, ScrollTrigger, Lenis } = window;
    if (!gsap || !ScrollTrigger || !Lenis) throw new Error('motion libraries missing');
    gsap.registerPlugin(ScrollTrigger);

    const root = document.documentElement;

    /* Take ownership of the masks from CSS before promoting the class, so
     * there is never a frame where the text is visible and unanimated. */
    gsap.set('.mask__in', { yPercent: 110 });
    root.classList.add('fx');
    root.classList.remove('fx-pending');

    /* ------------------------------------------------------ smooth scroll */

    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (event) => {
            const target = document.getElementById(link.getAttribute('href').slice(1));
            if (!target) return;
            event.preventDefault();
            lenis.scrollTo(target, { offset: -1 });
        });
    });

    /* ---------------------------------------------------------- entrance */

    const heroName = document.getElementById('hero-name');
    const brandName = document.getElementById('brand-name');

    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
    intro
        .to('.hero__meta .mask__in', { yPercent: 0, duration: 0.9, stagger: 0.06 }, 0.05)
        .to('.hero__name .mask__in', { yPercent: 0, duration: 1.25, stagger: 0.1 }, 0.1)
        .to('.hero__lede .mask__in', { yPercent: 0, duration: 0.8, stagger: 0.012 }, 0.45)
        .from('.hero__actions', { autoAlpha: 0, y: 18, duration: 0.8 }, 0.7)
        .from('.cue', { autoAlpha: 0, duration: 0.8 }, 0.95);

    /* Watchdog. Once .fx is on, the masks are held shut by CSS and only the
     * timeline above opens them — so anything that starves the ticker (a
     * backgrounded tab at load, a stalled rAF, a browser that throttles
     * animation) would leave the visitor's name invisible on their own site.
     * Six seconds is far longer than the 2s entrance ever takes; if we are
     * still not finished by then, snap to the end. */
    const introWatchdog = setTimeout(() => {
        if (intro.progress() < 1) {
            console.warn('naveenb.dev: entrance stalled, snapping it open.');
            intro.progress(1);
        }
    }, 6000);
    intro.eventCallback('onComplete', () => clearTimeout(introWatchdog));

    /* --------------------------------------------------------- the dock */

    /* The giant name scales and travels into the header slot as one
     * continuous move, then hands over to the real header brand. Same string
     * in the same face, so the swap is invisible.
     *
     * Measured rather than guessed: the target is wherever the header
     * actually put its text, at whatever the viewport is. */
    let dock = null;
    function measureDock() {
        gsap.set(heroName, { clearProps: 'transform' });
        const from = heroName.getBoundingClientRect();
        const to = brandName.getBoundingClientRect();
        const fromSize = parseFloat(getComputedStyle(heroName).fontSize);
        const toSize = parseFloat(getComputedStyle(brandName).fontSize);
        return {
            x: to.left - from.left,
            y: to.top - from.top,
            scale: toSize / fromSize,
        };
    }
    // Recompute on every refresh: font loading and resizing both move the target.
    ScrollTrigger.addEventListener('refreshInit', () => { dock = null; });

    ScrollTrigger.create({
        trigger: '.hero',
        start: 'top top',
        end: () => `+=${window.innerHeight}`,
        pin: true,
        pinSpacing: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
            if (!dock) dock = measureDock();
            const p = self.progress;
            const handover = ramp(p, 0.86, 1);

            gsap.set(heroName, {
                x: dock.x * p,
                y: dock.y * p,
                scale: 1 + (dock.scale - 1) * p,
                opacity: 1 - handover,
            });
            // Everything else in the hero clears out of the way first.
            gsap.set('.hero__meta, .hero__lede, .hero__actions, .cue', {
                opacity: 1 - ramp(p, 0, 0.4),
                y: -ramp(p, 0, 0.6) * 40,
            });
            gsap.set(brandName, { opacity: handover });
        },
    });

    /* ----------------------------------------------------- layer 2, maybe */

    let stage = null;
    if (hasWebGL()) {
        try {
            const mod = await import('/js/scenes.js');
            stage = mod.createStage({
                profile,
                canvas: document.getElementById('gl'),
                labelHost: document.getElementById('labels'),
            });
            root.classList.add('fx-gl');
            gsap.ticker.add((time) => stage.render(time));
        } catch (err) {
            console.warn('naveenb.dev: schematics unavailable, type layer continues.', err);
            stage = null;
        }
    } else {
        console.info('naveenb.dev: no WebGL, running the type layer only.');
    }

    /* ------------------------------------------------------------ scenes */

    const railLinks = new Map(
        Array.from(document.querySelectorAll('[data-rail]')).map(a => [a.dataset.rail, a])
    );

    document.querySelectorAll('.scene').forEach(section => {
        const id = section.dataset.scene;
        const tier = Number(section.dataset.tier);
        const hold = tier === 1 ? 1.5 : 0.85; // viewport-heights of pinned scroll

        const titleWords = section.querySelectorAll('.scene__title .mask__in');
        const supporting = [
            section.querySelector('.scene__idx'),
            section.querySelector('.scene__text'),
            section.querySelector('.scene__meta'),
        ].filter(Boolean);

        gsap.set(supporting, { autoAlpha: 0, y: 22 });

        /* One scrubbed timeline per spread. Units are arbitrary and get
         * stretched across the pin: reveal, hold, exit. */
        const tl = gsap.timeline({
            defaults: { ease: 'expo.out' },
            scrollTrigger: {
                trigger: section,
                start: 'top top',
                end: () => `+=${window.innerHeight * hold}`,
                pin: true,
                pinSpacing: true,
                scrub: true,
                invalidateOnRefresh: true,
                onToggle: (self) => {
                    if (!self.isActive) return;
                    railLinks.forEach((el, key) => el.classList.toggle('is-active', key === id));
                    if (stage) stage.setActive(id);
                },
                onUpdate: (self) => {
                    if (stage) stage.setProgress(id, self.progress);
                },
            },
        });

        tl.to(titleWords, { yPercent: 0, duration: 1, stagger: 0.14 }, 0)
            .to(supporting, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 }, 0.45)
            .to(section.querySelector('.scene__inner'), {
                autoAlpha: 0, y: -34, duration: 0.9, ease: 'power2.in',
            }, 4.3)
            // Nothing animates here; it just holds the spread on screen.
            .to({}, { duration: 0.2 }, 5.2);
    });

    /* -------------------------------------------------- the rest of the page */

    gsap.utils.toArray('.outcome, .role, .contact__title, .cv__side').forEach(el => {
        gsap.from(el, {
            autoAlpha: 0,
            y: 26,
            duration: 0.9,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
        });
    });

    /* ------------------------------------------------------------ upkeep */

    let resizeTimer;
    window.addEventListener('resize', () => {
        if (stage) stage.resize();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 180);
    }, { passive: true });

    /* Web fonts change the height of every headline, which changes where
     * every pin starts and where the dock lands. Measure again once they
     * have actually arrived. */
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
    }

    ScrollTrigger.refresh();

    /* A deep link has to wait for pinning to rewrite the document height. */
    if (window.location.hash) {
        const target = document.getElementById(window.location.hash.slice(1));
        if (target) requestAnimationFrame(() => lenis.scrollTo(target, { immediate: true }));
    }
}
