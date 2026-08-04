/* naveenb.dev — entry point.
 *
 * The document that arrives from the server is already the finished page:
 * every project, role and credential is in the HTML. Nothing here is load
 * bearing for reading the site.
 *
 * What this file does do is decide whether the visitor gets the WebGL layer,
 * and only then fetch it. If the answer is no — a phone, reduced motion, no
 * WebGL, an old GPU, or someone who switched it off — Three.js, GSAP and
 * Lenis are never requested at all, and the page costs what a text page
 * costs.
 */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const PROFILE = (() => {
    try { return JSON.parse($('#profile').textContent); }
    catch { return null; }
})();

/* -------------------------------------------------------- capability gate */

function hasWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return Boolean(
            canvas.getContext('webgl2') ||
            canvas.getContext('webgl') ||
            canvas.getContext('experimental-webgl')
        );
    } catch {
        return false;
    }
}

function fxPreference() {
    try { return localStorage.getItem('fx'); }
    catch { return null; }
}

/* Can this machine run the type layer? Deliberately only hard limits.
 *
 * WebGL is *not* tested here any more. The design — pinned spreads, masked
 * word reveals, the hero name docking into the header — is transforms and
 * opacity, and wants no GPU at all. motion.js checks for WebGL separately
 * and only to decide whether to add the schematics on top.
 *
 * A `(hover: hover)` test also used to live here as a proxy for "desktop".
 * It was wrong: a Windows laptop with a touchscreen reports `hover: none`
 * and was silently refused the whole feature despite a 1080p viewport. */
function fxIsPossible() {
    return window.matchMedia('(min-width: 1024px)').matches
        && !(navigator.deviceMemory && navigator.deviceMemory < 4);
}

/* Does this visitor want it?
 *
 * prefers-reduced-motion decides the *default*, not the outcome. Treating it
 * as an outright veto meant anyone who had ever turned off animations in
 * Windows or macOS got no motion and no way to ask for it — the switch in
 * the header was hidden too, so the feature simply did not exist for them.
 * An explicit click, or ?motion=on, is a stronger signal than an OS-wide
 * default, and it is the visitor's to give. */
function fxIsWanted() {
    const query = new URLSearchParams(window.location.search).get('motion');
    if (query === 'on') return true;
    if (query === 'off') return false;

    const stored = fxPreference();
    if (stored === 'on') return true;
    if (stored === 'off') return false;

    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* Says out loud why the page is static. Silent feature detection is only
 * kind until it is wrong, and then it is impossible to debug. */
function explain(possible, wanted) {
    if (possible && wanted) return;
    const why = [];
    if (!window.matchMedia('(min-width: 1024px)').matches) why.push('viewport under 1024px');
    if (navigator.deviceMemory && navigator.deviceMemory < 4) why.push(`deviceMemory ${navigator.deviceMemory}GB`);
    if (!wanted) {
        why.push(fxPreference() === 'off' || new URLSearchParams(window.location.search).get('motion') === 'off'
            ? 'switched off by you'
            : 'prefers-reduced-motion is set');
    }
    console.info(
        `naveenb.dev: motion layer off (${why.join(', ')}). ` +
        'Force it with ?motion=on, or use the Motion switch in the header.'
    );
}

/* Put every masked word back on screen, unconditionally.
 *
 * Dropping the .fx classes is not enough on its own. By the time the motion
 * layer can fail, GSAP has usually already written `transform: translateY(110%)`
 * as an *inline* style on each word — and inline beats the stylesheet, so
 * removing the class would leave the text hidden with no rule left to blame.
 * This is the difference between a degraded page and a blank one. */
function unmask() {
    document.documentElement.classList.remove('fx', 'fx-pending', 'fx-gl');
    document.querySelectorAll('.mask__in').forEach(el => {
        el.style.transform = '';
        el.style.opacity = '';
    });
}

/* ------------------------------------------------------------------ chrome */

function initHeader() {
    const header = $('#hdr');
    if (!header) return;
    const sync = () => header.classList.toggle('is-stuck', window.scrollY > 8);
    window.addEventListener('scroll', sync, { passive: true });
    sync();
}

function initSectionSpy() {
    const links = $$('.hdr__nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const targets = Array.from(byId.keys())
        .map(id => document.getElementById(id))
        .filter(Boolean);

    const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            links.forEach(a => a.removeAttribute('aria-current'));
            const active = byId.get(entry.target.id);
            if (active) active.setAttribute('aria-current', 'true');
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    targets.forEach(t => spy.observe(t));
}

/* The static page still deserves some life, but nothing that moves layout
 * or delays reading — opacity and a few pixels, once, then unobserved. */
function initStaticReveal() {
    if (document.documentElement.classList.contains('fx')) return;
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const items = $$('.panel, .outcome, .role, .contact__title');
    items.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(14px)';
        el.style.transition = 'opacity .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1)';
    });

    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.style.opacity = '';
            entry.target.style.transform = '';
            io.unobserve(entry.target);
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    items.forEach(el => io.observe(el));
}

/* The motion switch only appears for visitors who actually have the choice.
 * A reload is the honest way to apply it: ScrollTrigger's pinning rewrites
 * the document's scroll height, and unwinding that live is a worse bug farm
 * than one navigation. */
function initMotionToggle(possible, on) {
    const btn = $('#motion');
    const label = $('#motion-label');
    // Shown whenever the machine could render it, including when it is
    // currently off — otherwise turning it back on is unreachable.
    if (!btn || !possible) return;

    btn.hidden = false;
    btn.setAttribute('aria-pressed', String(on));
    label.textContent = on ? 'Motion on' : 'Motion off';

    btn.addEventListener('click', () => {
        try { localStorage.setItem('fx', on ? 'off' : 'on'); } catch { /* private mode */ }
        window.location.reload();
    });
}

/* --------------------------------------------------------- résumé to clipboard */

function toMarkdown(data) {
    const { personal, social, about, outcomes, projects, experience, skills, education, certifications } = data;
    const out = [];

    out.push(`# ${personal.name}`, '', `**${personal.title} — ${personal.company}**`, '');
    // No phone: the server strips it from the payload rather than shipping it
    // to every visitor, so there is nothing to print here.
    out.push(
        `- Email: ${personal.email}`,
        `- Location: ${personal.location}`,
        `- LinkedIn: ${social.linkedin}`,
        `- GitHub: ${social.github}`,
        ''
    );

    out.push('## Profile', '', about.profile, '');

    out.push('## Selected outcomes', '');
    outcomes.forEach(o => out.push(`- **${o.value}** ${o.label} — ${o.note}`));
    out.push('');

    out.push('## Experience', '');
    experience.forEach(job => {
        out.push(`### ${job.title} — ${job.company}`);
        out.push(`${job.location} | ${job.startDate} – ${job.endDate}`, '');
        job.points.forEach(point => out.push(`- ${point}`));
        out.push('');
    });

    out.push('## Projects', '');
    projects.forEach(p => {
        const links = [p.liveUrl && `Live: ${p.liveUrl}`, p.githubUrl && `Code: ${p.githubUrl}`]
            .filter(Boolean).join(' | ');
        out.push(`### ${p.title}`, p.description, links, '');
    });

    out.push('## Skills', '');
    skills.forEach(group => out.push(`- **${group.name}**: ${group.items.join(', ')}`));
    out.push('');

    out.push('## Education', '');
    education.forEach(e => out.push(`- **${e.degree}**, ${e.institution} (${e.startDate} – ${e.endDate})`));
    out.push('');

    out.push('## Certifications', '');
    certifications.forEach(c => {
        out.push(`- **${c.name}** — ${c.issuer}, ${c.issueDate}${c.credentialUrl ? ` (${c.credentialUrl})` : ''}`);
    });

    return out.join('\n') + '\n';
}

function initCopyResume(data) {
    if (!data) return;
    $$('[data-copy-resume]').forEach(btn => {
        const label = $('[data-copy-label]', btn) || btn;
        const original = label.textContent;

        btn.addEventListener('click', async () => {
            let ok = false;
            try {
                await navigator.clipboard.writeText(toMarkdown(data));
                ok = true;
            } catch { /* no clipboard permission, or an insecure origin */ }
            label.textContent = ok ? 'Copied — paste anywhere' : 'Copy failed';
            setTimeout(() => { label.textContent = original; }, 2400);
        });
    });
}

/* -------------------------------------------------------------------- boot */

function boot() {
    initHeader();
    initSectionSpy();
    initCopyResume(PROFILE);

    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    const possible = fxIsPossible();
    const wanted = fxIsWanted();
    initMotionToggle(possible, wanted);
    explain(possible, wanted);

    if (possible && wanted && PROFILE) {
        import('/js/motion.js')
            .then(mod => mod.start(PROFILE))
            .catch(err => {
                // A failed motion layer must never cost anyone the page — and
                // must never leave the masked text hidden.
                console.error('naveenb.dev: motion layer failed, staying static.', err);
                unmask();
                initStaticReveal();
            });
    } else {
        unmask();
        initStaticReveal();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
