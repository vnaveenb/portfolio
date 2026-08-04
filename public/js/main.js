/* naveenb.dev — progressive enhancement.
 *
 * The hero is static HTML, so the page is complete and readable before this
 * file runs (and if it never runs at all). Everything below either wires up an
 * interaction or renders a list from /data/profile.json, which is the single
 * source of truth for the CV content.
 */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------------------------------------------------------------- helpers */

function esc(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function truncate(str, max) {
    const s = String(str || '');
    if (s.length <= max) return s;
    // Cut on a word boundary so descriptions never end mid-word.
    return s.slice(0, s.lastIndexOf(' ', max)).replace(/[,;:.\s]+$/, '') + '…';
}

function repoLabel(url) {
    try { return new URL(url).pathname.replace(/^\/|\/$/g, ''); }
    catch { return 'GitHub'; }
}

function hostLabel(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch { return 'Live'; }
}

const ICON = {
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5h5v5M19 5l-8 8M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>',
};

/* ------------------------------------------------------------------ theme */

function initTheme() {
    const root = document.documentElement;
    const toggles = $$('[data-theme-toggle]');

    const paint = (theme) => {
        const light = theme === 'light';
        root.classList.toggle('light', light);
        $$('[data-icon-dark]').forEach(el => { el.hidden = light; });
        $$('[data-icon-light]').forEach(el => { el.hidden = !light; });
        toggles.forEach(btn => {
            btn.setAttribute('aria-pressed', String(light));
            btn.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
        });
    };

    // The inline script in <head> already applied the stored/system theme;
    // sync the icons and ARIA state to whatever it decided.
    paint(root.classList.contains('light') ? 'light' : 'dark');

    toggles.forEach(btn => btn.addEventListener('click', () => {
        const next = root.classList.contains('light') ? 'dark' : 'light';
        try { localStorage.setItem('theme', next); } catch { /* private mode */ }
        paint(next);
    }));

    // Follow the OS while the visitor has not made an explicit choice.
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        let stored = null;
        try { stored = localStorage.getItem('theme'); } catch { /* ignore */ }
        if (!stored) paint(e.matches ? 'light' : 'dark');
    });
}

/* ------------------------------------------------------------- navigation */

function initNav() {
    const toggle = $('#nav-toggle');
    const drawer = $('#drawer');
    if (!toggle || !drawer) return;

    const setOpen = (open) => {
        drawer.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    toggle.addEventListener('click', () => setOpen(!drawer.classList.contains('is-open')));
    $$('a', drawer).forEach(link => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
            setOpen(false);
            toggle.focus();
        }
    });
}

function initHeaderState() {
    const header = $('#header');
    if (!header) return;
    const sync = () => header.classList.toggle('is-stuck', window.scrollY > 8);
    window.addEventListener('scroll', sync, { passive: true });
    sync();
}

/* Highlight the section currently on screen in the desktop nav. */
function initSectionSpy() {
    const links = $$('.nav__link[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const sections = Array.from(byId.keys())
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

    sections.forEach(s => spy.observe(s));
}

function initReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
        items.forEach(el => el.classList.add('is-visible'));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(el => io.observe(el));
}

/* ------------------------------------------------------------------ stats */

function monthsBetween(startStr, endStr) {
    const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const parse = (str) => {
        if (!str || str === 'Present') return new Date();
        const [month, year] = String(str).split(' ');
        return new Date(Number(year), MONTHS[month] ?? 0, 1);
    };
    const start = parse(startStr);
    const end = parse(endStr);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    return Math.max(0, months);
}

function renderMetrics(data) {
    const projects = data.projects || [];
    // Sums actual employed periods so the career break is not counted.
    const totalMonths = (data.experience || [])
        .reduce((sum, job) => sum + monthsBetween(job.startDate, job.endDate), 0);
    const years = Math.floor(totalMonths / 12);

    const values = {
        experience: years >= 1 ? `${years}+` : `${totalMonths}mo`,
        projects: String(projects.length),
        live: String(projects.filter(p => p.liveUrl).length),
        certs: String((data.certifications || []).length),
    };

    Object.entries(values).forEach(([key, value]) => {
        const el = $(`[data-metric="${key}"]`);
        if (el) el.textContent = value;
    });
}

/* ------------------------------------------------------------------- work */

function workCard(project) {
    const featured = Boolean(project.featured);
    const tags = (project.tags || []).slice(0, featured ? 6 : 4);
    const limit = featured ? 320 : 150;

    const links = [];
    if (project.liveUrl) {
        links.push(
            `<a class="work__link" href="${esc(project.liveUrl)}" target="_blank" rel="noopener noreferrer">
                ${ICON.external}<span>${esc(hostLabel(project.liveUrl))}</span>
            </a>`
        );
    }
    if (project.githubUrl) {
        links.push(
            `<a class="work__link" href="${esc(project.githubUrl)}" target="_blank" rel="noopener noreferrer">
                ${ICON.github}<span>${esc(repoLabel(project.githubUrl))}</span>
            </a>`
        );
    }

    return `
        <article class="card card--lift work reveal${featured ? ' work--feature' : ''}">
            <div class="work__top">
                <h3 class="work__title">${esc(project.title)}</h3>
                ${project.liveUrl ? '<span class="pill">Live</span>' : ''}
            </div>
            <p class="work__desc">${esc(truncate(project.description, limit))}</p>
            <ul class="tag-row">
                ${tags.map(tag => `<li class="tag">${esc(tag)}</li>`).join('')}
            </ul>
            <div class="work__links">${links.join('')}</div>
        </article>
    `;
}

function renderWork(projects) {
    const grid = $('#work-grid');
    if (!grid || !projects) return;

    // Featured first, then anything with a live demo, then the rest.
    const rank = (p) => (p.featured ? 0 : p.liveUrl ? 1 : 2);
    const ordered = [...projects].sort((a, b) => rank(a) - rank(b));

    grid.innerHTML = ordered.map(workCard).join('');
}

/* ------------------------------------------------------------- experience */

function renderExperience(experience) {
    const timeline = $('#timeline');
    if (!timeline || !experience) return;

    timeline.innerHTML = experience.map(job => `
        <article class="card role reveal">
            <header class="role__head">
                <div>
                    <h3 class="role__title">${esc(job.title)}</h3>
                    <p class="role__meta">
                        <span class="role__company">${esc(job.company)}</span>
                        ${job.location ? `<span aria-hidden="true">·</span><span>${esc(job.location)}</span>` : ''}
                    </p>
                </div>
                <p class="role__dates${job.isCurrent ? ' role__dates--current' : ''}">
                    ${esc(job.startDate)} – ${esc(job.endDate)}
                </p>
            </header>
            ${(job.responsibilities || []).map(group => `
                <div class="role__group">
                    ${group.category && group.category !== 'General'
                        ? `<h4 class="role__group-title">${esc(group.category)}</h4>` : ''}
                    <ul class="role__points">
                        ${(group.items || []).map(item => `<li>${esc(item)}</li>`).join('')}
                    </ul>
                </div>
            `).join('')}
        </article>
    `).join('');
}

/* ----------------------------------------------------------------- skills */

function renderSkills(skills) {
    const grid = $('#skills-grid');
    if (!grid || !skills) return;

    grid.innerHTML = Object.values(skills).map(group => {
        if (group.categories) {
            return `
                <section class="card skill skill--wide reveal">
                    <h3 class="skill__title">${esc(group.title)}</h3>
                    <div class="skill__sub">
                        ${group.categories.map(cat => `
                            <div>
                                <p class="skill__sub-title">${esc(cat.name)}</p>
                                <ul class="tag-row">
                                    ${cat.items.map(item => `<li class="tag">${esc(item)}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
        }
        if (group.items) {
            return `
                <section class="card skill reveal">
                    <h3 class="skill__title">${esc(group.title)}</h3>
                    <ul class="tag-row">
                        ${group.items.map(item => `<li class="tag">${esc(item)}</li>`).join('')}
                    </ul>
                </section>
            `;
        }
        return '';
    }).join('');
}

/* ------------------------------------------------------------ credentials */

function renderEducation(education) {
    const list = $('#education-list');
    if (!list || !education) return;
    list.innerHTML = education.map(edu => `
        <article class="card cred reveal">
            <div class="cred__body">
                <h3 class="cred__name">${esc(edu.degree)}</h3>
                <p class="cred__org">${esc(edu.institution)}</p>
                <span class="cred__dates">${esc(edu.startDate)} – ${esc(edu.endDate)}</span>
            </div>
        </article>
    `).join('');
}

function renderCertifications(certs) {
    const list = $('#certifications-list');
    if (!list || !certs) return;
    list.innerHTML = certs.map(cert => `
        <article class="card cred reveal">
            <div class="cred__body">
                <h3 class="cred__name">${esc(cert.name)}</h3>
                <p class="cred__org">${esc(cert.issuer)}</p>
                <span class="cred__dates">
                    Issued ${esc(cert.issueDate)}${cert.expiryDate ? ` · Expires ${esc(cert.expiryDate)}` : ''}
                </span>
                ${cert.credentialUrl
                    ? `<a class="cred__link" href="${esc(cert.credentialUrl)}" target="_blank" rel="noopener noreferrer">Verify ${ICON.external}</a>`
                    : ''}
            </div>
        </article>
    `).join('');
}

/* ------------------------------------------------------- résumé to clipboard */

function toMarkdown(data) {
    const { personal, social, about, experience, skills, education, certifications } = data;
    const lines = [];

    lines.push(`# ${personal.name}`, '', `**${personal.title}**`, '');
    lines.push(
        `- Email: ${personal.email}`,
        `- Phone: ${personal.phone}`,
        `- Location: ${personal.location}`,
        `- LinkedIn: ${social.linkedin}`,
        `- GitHub: ${social.github}`,
        ''
    );

    lines.push('## Profile', '', about.profile, '');

    lines.push('## Experience', '');
    experience.forEach(job => {
        lines.push(`### ${job.title} — ${job.company}`);
        lines.push(`${job.location ? job.location + ' | ' : ''}${job.startDate} – ${job.endDate}`, '');
        (job.responsibilities || []).forEach(group => {
            if (group.category && group.category !== 'General') lines.push(`**${group.category}**`, '');
            (group.items || []).forEach(item => lines.push(`- ${item}`));
            lines.push('');
        });
    });

    lines.push('## Projects', '');
    (data.projects || []).forEach(p => {
        const links = [p.liveUrl && `Live: ${p.liveUrl}`, p.githubUrl && `Code: ${p.githubUrl}`]
            .filter(Boolean).join(' | ');
        lines.push(`### ${p.title}`, p.description, links, '');
    });

    lines.push('## Skills', '');
    Object.values(skills).forEach(group => {
        if (group.categories) {
            lines.push(`**${group.title}**`);
            group.categories.forEach(cat => lines.push(`- ${cat.name}: ${cat.items.join(', ')}`));
        } else if (group.items) {
            lines.push(`**${group.title}**: ${group.items.join(', ')}`);
        }
        lines.push('');
    });

    lines.push('## Education', '');
    education.forEach(edu => lines.push(`- **${edu.degree}**, ${edu.institution} (${edu.startDate} – ${edu.endDate})`));
    lines.push('');

    lines.push('## Certifications', '');
    certifications.forEach(cert => {
        lines.push(`- **${cert.name}** — ${cert.issuer}, ${cert.issueDate}${cert.credentialUrl ? ` (${cert.credentialUrl})` : ''}`);
    });

    return lines.join('\n') + '\n';
}

function initCopyResume(data) {
    const buttons = $$('[data-copy-resume]');
    if (!buttons.length || !data) return;

    buttons.forEach(btn => {
        const label = $('[data-copy-label]', btn) || btn;
        const original = label.textContent;

        btn.addEventListener('click', async () => {
            let ok = false;
            try {
                await navigator.clipboard.writeText(toMarkdown(data));
                ok = true;
            } catch {
                ok = false;
            }
            label.textContent = ok ? 'Copied as Markdown' : 'Copy failed';
            setTimeout(() => { label.textContent = original; }, 2200);
        });
    });
}

/* ------------------------------------------------------------------- boot */

async function boot() {
    initTheme();
    initNav();
    initHeaderState();
    initSectionSpy();

    const year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    let data = null;
    try {
        const res = await fetch('/data/profile.json');
        if (!res.ok) throw new Error(`profile.json responded ${res.status}`);
        data = await res.json();
    } catch (err) {
        console.error('Could not load profile data:', err);
    }

    if (data) {
        renderMetrics(data);
        renderWork(data.projects);
        renderExperience(data.experience);
        renderSkills(data.skills);
        renderEducation(data.education);
        renderCertifications(data.certifications);
        initCopyResume(data);
    }

    // Runs last so it also picks up the nodes rendered above.
    initReveal();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
