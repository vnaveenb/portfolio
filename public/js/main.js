// Portfolio Main JavaScript
// Loads data from profile.json and handles all interactions

let globalProfileData = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Load profile data
    const profileData = await loadProfileData();
    globalProfileData = profileData;
    
    if (profileData) {
        renderHero(profileData.hero);
        calculateExperience(profileData.experience);
        renderStats(profileData);
        renderTrustRow(profileData.skills);
        renderProjects(profileData.projects);
        renderApps(profileData.projects);
        renderExperience(profileData.experience);
        renderSkills(profileData.skills);
        renderOpenSource(profileData.projects);
        renderEducation(profileData.education);
        renderCertifications(profileData.certifications);
        initCopyMarkdown();
    }

    // Initialize interactions
    initThemeToggle();
    initMobileMenu();
    initScrollReveal();
    initSmoothScroll();
    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});

// Load profile data from JSON
async function loadProfileData() {
    try {
        const response = await fetch('/data/profile.json');
        return await response.json();
    } catch (error) {
        console.error('Error loading profile data:', error);
        return null;
    }
}

// Calculate and display experience (sums only actual working periods, excluding gaps)
function calculateExperience(experienceEntries) {
    const monthNames = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    function parseDate(dateStr) {
        if (dateStr === 'Present') return new Date();
        const parts = dateStr.split(' ');
        const month = monthNames[parts[0]];
        const year = parseInt(parts[1]);
        return new Date(year, month, 1);
    }

    let totalMonths = 0;

    experienceEntries.forEach(job => {
        const start = parseDate(job.startDate);
        const end = parseDate(job.endDate);
        // +1 to include both start and end months
        let diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
        if (diffMonths < 0) diffMonths = 0;
        totalMonths += diffMonths;
    });

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    
    let experienceText = '';
    if (years > 0) {
        experienceText += `${years} Year${years > 1 ? 's' : ''}`;
    }
    if (months > 0) {
        if (years > 0) experienceText += ' ';
        experienceText += `${months} Month${months > 1 ? 's' : ''}`;
    }

    const statExp = document.getElementById('stat-experience');
    if (statExp) statExp.textContent = years >= 1 ? `${years}+ yrs` : `${months} mo`;
}

// ---- Small HTML helpers (data is trusted local JSON, escaped defensively) ----
function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeAttr(str) { return escapeHtml(str); }
function truncate(str, n) {
    const s = String(str || '');
    return s.length > n ? s.slice(0, n).trimEnd() + '\u2026' : s;
}
function shortRepo(url) {
    try { const u = new URL(url); return 'github.com' + u.pathname.replace(/\/$/, ''); }
    catch (e) { return url; }
}

// Render hero copy
function renderHero(hero) {
    if (!hero) return;
    const greeting = document.getElementById('hero-greeting');
    if (greeting) greeting.textContent = hero.greeting || '';

    const headline = document.getElementById('hero-headline');
    if (headline && Array.isArray(hero.headline)) {
        const last = hero.headline.length - 1;
        headline.innerHTML = hero.headline.map((word, i) =>
            i === last
                ? `<span class="accent-word">${escapeHtml(word)}</span>`
                : `<span class="block sm:inline">${escapeHtml(word)} </span>`
        ).join('');
    }

    const tagline = document.getElementById('hero-tagline');
    if (tagline) tagline.textContent = hero.tagline || '';

    const spec = document.getElementById('hero-specializing');
    if (spec && Array.isArray(hero.specializing)) {
        spec.innerHTML = hero.specializing.map(s => `<li class="chip">${escapeHtml(s)}</li>`).join('');
    }

    const cta = document.getElementById('hero-cta');
    if (cta) {
        const primary = hero.ctaPrimary || { label: 'View Projects', href: '#projects' };
        const secondary = hero.ctaSecondary || { label: 'Book a Call', href: 'mailto:naveenbusiraju@gmail.com' };
        cta.innerHTML =
            `<a href="${escapeAttr(primary.href)}" class="btn btn-primary">${escapeHtml(primary.label)}</a>` +
            `<a href="${escapeAttr(secondary.href)}" class="btn btn-ghost">${escapeHtml(secondary.label)}</a>`;
    }
}

// Render hero stat cards (derived from data)
function renderStats(data) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const projects = data.projects || [];
    set('stat-projects', `${projects.length}+`);
    set('stat-apps', `${projects.filter(p => p.liveUrl).length}`);
    set('stat-certs', `${(data.certifications || []).length}`);
}

// Render the "building with" trust row from cloud + devops skills
function renderTrustRow(skills) {
    const row = document.getElementById('trust-row');
    if (!row || !skills) return;
    const cloud = (skills.cloud && skills.cloud.items) || [];
    const devops = (skills.devops && skills.devops.items) || [];
    const items = [...cloud, ...devops].slice(0, 8);
    row.innerHTML = items.map(name => `<li class="font-mono text-sm text-muted">${escapeHtml(name)}</li>`).join('');
}

// Render experience timeline
function renderExperience(experience) {
    const container = document.getElementById('experience-list');
    if (!container || !experience) return;

    container.innerHTML = experience.map(job => `
        <div class="timeline-item">
            <div class="surface-card p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-ink">${escapeHtml(job.title)}</h3>
                        <p class="text-accent font-mono">${escapeHtml(job.company)}</p>
                        ${job.location ? `<p class="text-muted text-sm mt-1">${escapeHtml(job.location)}</p>` : ''}
                    </div>
                    <span class="text-sm font-mono ${job.isCurrent ? 'text-accent' : 'text-muted'} mt-2 md:mt-0">
                        ${escapeHtml(job.startDate)} \u2014 ${escapeHtml(job.endDate)}
                    </span>
                </div>
                ${job.responsibilities.map(resp => `
                    <div class="mt-4">
                        <h4 class="text-accent2 font-mono text-sm mb-3">// ${escapeHtml(resp.category)}</h4>
                        <ul class="space-y-2 list-none p-0 m-0">
                            ${resp.items.map(item => `
                                <li class="flex items-start gap-3 text-muted text-sm">
                                    <span class="text-accent mt-1.5 shrink-0" aria-hidden="true">\u25B9</span>
                                    <span>${escapeHtml(item)}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Render skills section
function renderSkills(skills) {
    const container = document.getElementById('skills-grid');
    if (!container || !skills) return;

    let html = '';
    for (const [, skill] of Object.entries(skills)) {
        if (skill.categories) {
            html += `
                <div class="md:col-span-2 surface-card p-6">
                    <h3 class="font-mono text-accent mb-4">// ${escapeHtml(skill.title)}</h3>
                    <div class="grid md:grid-cols-2 gap-4">
                        ${skill.categories.map(cat => `
                            <div>
                                <p class="text-muted text-sm mb-2">${escapeHtml(cat.name)}</p>
                                <div class="flex flex-wrap gap-2">
                                    ${cat.items.map(item => `<span class="chip">${escapeHtml(item)}</span>`).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (skill.items) {
            html += `
                <div class="surface-card p-6">
                    <h3 class="font-mono text-accent mb-4">// ${escapeHtml(skill.title)}</h3>
                    <div class="flex flex-wrap gap-2">
                        ${skill.items.map(item => `<span class="chip">${escapeHtml(item)}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    }

    container.innerHTML = html;
}

// Render education
function renderEducation(education) {
    const container = document.getElementById('education-list');
    if (!container || !education) return;

    container.innerHTML = `
        <h3 class="font-mono text-accent mb-4">// Education</h3>
        ${education.map(edu => `
            <div class="surface-card p-5 mb-4">
                <h4 class="font-semibold text-ink mb-1">${escapeHtml(edu.degree)}</h4>
                <p class="text-accent text-sm">${escapeHtml(edu.institution)}</p>
                <p class="text-muted text-sm font-mono mt-2">${escapeHtml(edu.startDate)} \u2014 ${escapeHtml(edu.endDate)}</p>
            </div>
        `).join('')}
    `;
}

// Render certifications
function renderCertifications(certifications) {
    const container = document.getElementById('certifications-list');
    if (!container || !certifications) return;

    container.innerHTML = `
        <h3 class="font-mono text-accent2 mb-4">// Certifications</h3>
        ${certifications.map(cert => `
            <div class="surface-card p-5 mb-4">
                <h4 class="font-semibold text-ink text-sm">${escapeHtml(cert.name)}</h4>
                <p class="text-muted text-sm">${escapeHtml(cert.issuer)}</p>
                <p class="text-muted text-xs font-mono mt-1">Issued: ${escapeHtml(cert.issueDate)}${cert.expiryDate ? ` \u2022 Expires: ${escapeHtml(cert.expiryDate)}` : ''}</p>
                ${cert.credentialUrl ? `<a href="${escapeAttr(cert.credentialUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-accent text-sm mt-2 hover:underline">View Credential</a>` : ''}
            </div>
        `).join('')}
    `;
}

// Render projects section
function renderProjects(projects) {
    const container = document.getElementById('projects-list');
    if (!container || !projects) return;

    container.innerHTML = projects.map(project => `
        <div class="surface-card p-6 flex flex-col group">
            <div class="flex flex-wrap gap-2 mb-4">
                ${(project.tags || []).slice(0, 4).map(tag => `<span class="chip">${escapeHtml(tag)}</span>`).join('')}
            </div>
            <h3 class="text-xl font-bold text-ink mb-2 group-hover:text-accent transition-colors">${escapeHtml(project.title)}</h3>
            <p class="text-muted text-sm mb-5 leading-relaxed flex-1">${escapeHtml(truncate(project.description, 160))}</p>
            <div class="flex flex-wrap gap-3">
                ${project.liveUrl ? `<a href="${escapeAttr(project.liveUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary !py-2 !px-4 text-sm">Live Demo</a>` : ''}
                ${project.githubUrl ? `<a href="${escapeAttr(project.githubUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost !py-2 !px-4 text-sm">GitHub</a>` : ''}
            </div>
        </div>
    `).join('');
}

// Render featured apps (projects that have a live URL)
function renderApps(projects) {
    const container = document.getElementById('apps-list');
    if (!container || !projects) return;
    const apps = projects.filter(p => p.liveUrl);
    container.innerHTML = apps.map(app => `
        <div class="surface-card p-6 flex flex-col">
            <div class="flex items-center justify-between mb-3 gap-3">
                <h3 class="text-lg font-bold text-ink">${escapeHtml(app.title)}</h3>
                <span class="chip" style="color:#15803d;background:rgba(34,197,94,0.14);border-color:rgba(34,197,94,0.35)">Live</span>
            </div>
            <p class="text-muted text-sm mb-5 leading-relaxed flex-1">${escapeHtml(truncate(app.description, 120))}</p>
            <div class="flex flex-wrap gap-3">
                <a href="${escapeAttr(app.liveUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary !py-2 !px-4 text-sm">Open App</a>
                ${app.githubUrl ? `<a href="${escapeAttr(app.githubUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost !py-2 !px-4 text-sm">GitHub</a>` : ''}
            </div>
        </div>
    `).join('');
}

// Render open-source list (projects that have a GitHub URL)
function renderOpenSource(projects) {
    const list = document.getElementById('opensource-list');
    if (!list || !projects) return;
    const repos = projects.filter(p => p.githubUrl);
    list.innerHTML = repos.map(p => `
        <li class="surface-card p-5">
            <a href="${escapeAttr(p.githubUrl)}" target="_blank" rel="noopener noreferrer" class="flex items-start gap-3 text-ink hover:text-accent transition-colors">
                <svg class="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                <span>
                    <span class="block font-semibold">${escapeHtml(p.title)}</span>
                    <span class="block text-xs text-muted font-mono mt-1">${escapeHtml(shortRepo(p.githubUrl))}</span>
                </span>
            </a>
        </li>
    `).join('');
}

// Mobile menu toggle
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
        const isHidden = menu.classList.toggle('hidden');
        btn.setAttribute('aria-expanded', String(!isHidden));
        btn.setAttribute('aria-label', isHidden ? 'Open menu' : 'Close menu');
    });

    // Close menu when clicking a link
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.add('hidden');
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-label', 'Open menu');
        });
    });
}

// Light / dark theme toggle
function initThemeToggle() {
    const root = document.documentElement;
    const toggles = [
        document.getElementById('theme-toggle'),
        document.getElementById('theme-toggle-mobile')
    ].filter(Boolean);
    const moon = document.getElementById('icon-moon');
    const sun = document.getElementById('icon-sun');

    function apply(theme) {
        const isLight = theme === 'light';
        root.classList.toggle('light', isLight);
        if (moon) moon.classList.toggle('hidden', isLight);
        if (sun) sun.classList.toggle('hidden', !isLight);
        toggles.forEach(t => {
            t.setAttribute('aria-pressed', String(isLight));
            t.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
        });
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    apply(root.classList.contains('light') ? 'light' : 'dark');

    toggles.forEach(t => t.addEventListener('click', () => {
        const next = root.classList.contains('light') ? 'dark' : 'light';
        try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
        apply(next);
    }));
}

// Scroll reveal animation
function initScrollReveal() {
    const elements = document.querySelectorAll('.scroll-reveal');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(el => observer.observe(el));
}

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Copy as Markdown functionality
function initCopyMarkdown() {
    const buttons = [
        { btn: document.getElementById('copy-markdown-btn'), text: document.getElementById('copy-btn-text') },
        { btn: document.getElementById('copy-markdown-btn-mobile'), text: document.getElementById('copy-btn-text-mobile') }
    ];
    
    buttons.forEach(({ btn, text }) => {
        if (btn && text && globalProfileData) {
            btn.addEventListener('click', async () => {
                const markdown = generateMarkdown(globalProfileData);
                try {
                    await navigator.clipboard.writeText(markdown);
                    text.textContent = '\u2713 Copied!';
                    setTimeout(() => { text.textContent = 'Resume'; }, 2000);
                } catch (err) {
                    text.textContent = '\u2717 Failed';
                    setTimeout(() => { text.textContent = 'Resume'; }, 2000);
                }
            });
        }
    });
}

// Generate Markdown from profile data
function generateMarkdown(data) {
    const { personal, social, about, experience, skills, education, certifications, interests } = data;
    
    let md = '';
    
    // Header
    md += `# ${personal.name}\n\n`;
    md += `**${personal.title}**\n\n`;
    
    // Contact Info
    md += `## Contact\n\n`;
    md += `- 📧 Email: [${personal.email}](mailto:${personal.email})\n`;
    md += `- 📱 Phone: ${personal.phone}\n`;
    md += `- 📍 Location: ${personal.location}\n`;
    if (social.linkedin) md += `- 💼 LinkedIn: [${social.linkedin}](${social.linkedin})\n`;
    if (social.twitter) md += `- 🐦 Twitter: [${social.twitter}](${social.twitter})\n`;
    if (social.github) md += `- 💻 GitHub: [${social.github}](${social.github})\n`;
    md += `\n`;
    
    // About / Profile
    md += `## Profile\n\n`;
    md += `${about.profile}\n\n`;
    
    // Experience
    md += `## Work Experience\n\n`;
    experience.forEach(job => {
        md += `### ${job.title}\n`;
        md += `**${job.company}**${job.location ? ` | 📍 ${job.location}` : ''} | ${job.startDate} - ${job.endDate}\n\n`;
        
        job.responsibilities.forEach(resp => {
            if (resp.category !== 'General') {
                md += `#### ${resp.category}\n\n`;
            }
            resp.items.forEach(item => {
                md += `- ${item}\n`;
            });
            md += `\n`;
        });
    });
    
    // Skills
    md += `## Technical Skills\n\n`;
    for (const [key, skill] of Object.entries(skills)) {
        md += `### ${skill.title}\n\n`;
        if (skill.categories) {
            skill.categories.forEach(cat => {
                md += `**${cat.name}:** ${cat.items.join(', ')}\n\n`;
            });
        } else if (skill.items) {
            md += `${skill.items.join(', ')}\n\n`;
        }
    }
    
    // Education
    md += `## Education\n\n`;
    education.forEach(edu => {
        md += `### ${edu.degree}\n`;
        md += `**${edu.institution}** | ${edu.startDate} - ${edu.endDate}\n\n`;
    });
    
    // Certifications
    md += `## Certifications\n\n`;
    certifications.forEach(cert => {
        md += `- **${cert.name}** - ${cert.issuer} (${cert.issueDate})`;
        if (cert.credentialUrl) md += ` [View Credential](${cert.credentialUrl})`;
        md += `\n`;
    });
    md += `\n`;
    
    // Interests
    if (interests && interests.length > 0) {
        md += `## Interests\n\n`;
        md += interests.join(' | ') + `\n`;
    }
    
    return md;
}

