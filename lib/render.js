/* Renders the site to HTML strings, once, at boot.
 *
 * profile.json is the single source of truth. Nothing on the page is fetched
 * at runtime — every project, role and credential below ships inside the
 * document, so the page is complete for crawlers, for people with JavaScript
 * off, and for anyone the motion layers decide to skip.
 *
 * Text that gets choreographed is emitted pre-split into masked words. The
 * mask is inert until the type layer arms it, so the same markup reads
 * normally with no JavaScript at all.
 */

const SITE = 'https://naveenb.dev';

function esc(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* Safe to drop inside <script type="application/json">. */
function jsonBlock(value) {
    return JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

/* What the browser is allowed to see.
 *
 * profile.json lives outside public/ and is never served, so this is the only
 * copy of the CV that reaches a visitor. The phone number is dropped on the
 * way out: it would otherwise sit in the markup of every page load waiting to
 * be scraped, and nothing the page does needs it. Email, LinkedIn and GitHub
 * are the contact routes. */
function clientProfile(data) {
    const { phone, ...personal } = data.personal;
    return { ...data, personal };
}

/* One word, wrapped so it can be wiped up from behind a mask. Splitting on
 * words rather than lines is deliberate: line breaks depend on the font
 * metrics and the viewport, neither of which exist on the server. */
function words(text) {
    return String(text).split(/\s+/).filter(Boolean)
        .map(word => `<span class="mask"><span class="mask__in">${esc(word)}</span></span>`)
        .join(' ');
}

function hostLabel(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch { return 'Live'; }
}

function repoLabel(url) {
    try { return new URL(url).pathname.replace(/^\/|\/$/g, ''); }
    catch { return 'GitHub'; }
}

const ICON = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M9 7h8v8"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 110-4.125 2.062 2.062 0 010 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
};

/* ------------------------------------------------------------------ pieces */

function head(data, { title, description, canonical, ldJson }) {
    return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(data.personal.name)}">
<meta name="theme-color" content="#06070a">
<meta name="color-scheme" content="dark">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta property="og:type" content="profile">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${SITE}/naveen-busiraju.jpg">
<meta property="profile:first_name" content="Naveen">
<meta property="profile:last_name" content="Busiraju">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@naveenbusiraju1">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}/naveen-busiraju.jpg">
<script type="application/ld+json">${jsonBlock(ldJson)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/css/site.css">
<script src="/js/boot.js"></script>`;
}

function personLd(data) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: data.personal.name,
        alternateName: data.personal.shortName,
        url: SITE,
        image: `${SITE}/naveen-busiraju.jpg`,
        jobTitle: data.personal.title,
        worksFor: { '@type': 'Organization', name: data.personal.company },
        alumniOf: { '@type': 'CollegeOrUniversity', name: 'University of East London' },
        homeLocation: [
            { '@type': 'Place', name: 'London, United Kingdom' },
            { '@type': 'Place', name: 'Chennai, India' },
        ],
        knowsAbout: [
            'Generative AI', 'Large Language Models', 'Retrieval-Augmented Generation',
            'LangChain', 'LangGraph', 'Multi-agent systems', 'Cloud Architecture',
        ],
        sameAs: [data.social.linkedin, data.social.github, data.social.twitter],
    };
}

/* Each project is emitted once. With the type layer active the section pins
 * and the title crops the frame; without it the same markup is an editorial
 * row in a list. */
function projectSection(project, i, total) {
    const links = [];
    if (project.liveUrl) {
        links.push(`<a class="lnk lnk--live" href="${esc(project.liveUrl)}" target="_blank" rel="noopener noreferrer">${ICON.arrow}<span>${esc(hostLabel(project.liveUrl))}</span></a>`);
    }
    if (project.githubUrl) {
        links.push(`<a class="lnk" href="${esc(project.githubUrl)}" target="_blank" rel="noopener noreferrer">${ICON.github}<span>${esc(repoLabel(project.githubUrl))}</span></a>`);
    }

    const n = String(i + 1).padStart(2, '0');
    const tier = project.scene && project.scene.tier === 1 ? 1 : 2;

    return `<section class="scene" id="${esc(project.id)}" data-scene="${esc(project.id)}" data-tier="${tier}" aria-labelledby="${esc(project.id)}-t">
  <div class="scene__inner">
    <p class="scene__idx">
      <span class="scene__n">${n}</span>
      <span class="scene__rule" aria-hidden="true"></span>
      <span class="scene__of">${String(total).padStart(2, '0')}</span>
      ${project.liveUrl ? '<span class="live">live</span>' : ''}
    </p>

    <h2 class="scene__title" id="${esc(project.id)}-t">${words(project.title)}</h2>

    <div class="scene__foot">
      <div class="scene__text">
        <p class="scene__kicker">${esc(project.kicker)}</p>
        <p class="scene__desc">${esc(project.description)}</p>
      </div>
      <div class="scene__meta">
        <ul class="stack">${project.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        <div class="scene__links">${links.join('')}</div>
      </div>
    </div>
  </div>
</section>`;
}

function cv(data) {
    const outcomes = data.outcomes.map(o => `<div class="outcome">
    <p class="outcome__value" data-count="${esc(o.value)}">${esc(o.value)}</p>
    <p class="outcome__label">${esc(o.label)}</p>
    <p class="outcome__note">${esc(o.note)}</p>
  </div>`).join('');

    const roles = data.experience.map(job => `<article class="role">
    <header class="role__head">
      <h3 class="role__title">${esc(job.title)}</h3>
      <p class="role__meta">${esc(job.company)} · ${esc(job.location)}</p>
      <p class="role__dates${job.isCurrent ? ' is-current' : ''}">${esc(job.startDate)} – ${esc(job.endDate)}</p>
    </header>
    <ul class="role__points">${job.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
  </article>`).join('');

    const skills = data.skills.map(g => `<div class="skill">
    <p class="skill__name">${esc(g.name)}</p>
    <ul class="stack">${g.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
  </div>`).join('');

    const education = data.education.map(e =>
        `<li><span class="cred__name">${esc(e.degree)}</span><span class="cred__org">${esc(e.institution)}</span><span class="cred__when">${esc(e.startDate)} – ${esc(e.endDate)}</span></li>`
    ).join('');

    const certs = data.certifications.map(c => {
        const name = c.credentialUrl
            ? `<a href="${esc(c.credentialUrl)}" target="_blank" rel="noopener noreferrer">${esc(c.name)} ${ICON.arrow}</a>`
            : esc(c.name);
        const when = c.expiryDate ? `${esc(c.issueDate)} – ${esc(c.expiryDate)}` : esc(c.issueDate);
        return `<li><span class="cred__name">${name}</span><span class="cred__org">${esc(c.issuer)}</span><span class="cred__when">${when}</span></li>`;
    }).join('');

    return `<section class="cv" id="cv">
  <div class="wrap">
    <p class="eyebrow">What it added up to</p>
    <div class="outcomes">${outcomes}</div>

    <div class="cv__grid">
      <div class="cv__main">
        <h2 class="display display--sm">${words('Experience')}</h2>
        ${roles}
      </div>
      <aside class="cv__side">
        <div class="cv__portrait">
          <img src="/naveen-busiraju.jpg" alt="${esc(data.personal.shortName)}" width="220" height="264" loading="lazy" decoding="async">
        </div>
        <p class="cv__bio">${esc(data.about.profile)}</p>

        <h3 class="h3">Toolkit</h3>
        <div class="skills">${skills}</div>

        <h3 class="h3">Education</h3>
        <ul class="creds">${education}</ul>

        <h3 class="h3">Certifications</h3>
        <ul class="creds">${certs}</ul>
      </aside>
    </div>
  </div>
</section>`;
}

function contact(data) {
    return `<section class="contact" id="contact">
  <div class="wrap">
    <h2 class="display display--md contact__title">${words('Something you want built?')}</h2>
    <p class="contact__text">${esc(data.personal.availability)}. Send a note — I read all of them.</p>
    <div class="contact__links">
      <a class="lnk lnk--big" href="mailto:${esc(data.personal.email)}?subject=Hello%20from%20naveenb.dev">${ICON.mail}<span>${esc(data.personal.email)}</span></a>
      <a class="lnk lnk--big" href="${esc(data.social.github)}" target="_blank" rel="noopener noreferrer">${ICON.github}<span>github.com/vnaveenb</span></a>
      <a class="lnk lnk--big" href="${esc(data.social.linkedin)}" target="_blank" rel="noopener noreferrer">${ICON.linkedin}<span>linkedin.com/in/naveenbusiraju</span></a>
      <button type="button" class="lnk lnk--big" data-copy-resume><span data-copy-label>Copy résumé as Markdown</span></button>
    </div>
  </div>
</section>`;
}

/* -------------------------------------------------------------------- home */

function renderHome(data) {
    const p = data.personal;
    const title = `${p.shortName} — ${p.title}`;
    const description = `${p.shortName} is a ${p.title} at ${p.company}. RAG pipelines, multi-agent workflows, and the routers, queues and budgets that keep LLM systems running. ${data.projects.filter(x => x.liveUrl).length} of them are live.`;
    const [first, ...rest] = p.shortName.split(' ');

    const rail = data.projects.map((project, i) =>
        `<li><a href="#${esc(project.id)}" data-rail="${esc(project.id)}"><span class="rail__n">${String(i + 1).padStart(2, '0')}</span><span class="rail__label">${esc(project.title)}</span></a></li>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
${head(data, { title, description, canonical: `${SITE}/`, ldJson: personLd(data) })}
</head>
<body>
<a href="#work" class="skip">Skip to the work</a>

<div class="stage" id="stage" aria-hidden="true">
  <canvas id="gl"></canvas>
  <div class="stage__labels" id="labels"></div>
</div>

<header class="hdr" id="hdr">
  <div class="hdr__bar">
    <a class="brand" href="#top"><span class="brand__dot" aria-hidden="true"></span><span class="brand__name" id="brand-name">${esc(p.shortName)}</span></a>
    <nav class="hdr__nav" aria-label="Sections">
      <a href="#work">Work</a>
      <a href="#cv">CV</a>
      <a href="#contact">Contact</a>
      <a href="${esc(data.social.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>
    </nav>
    <button type="button" class="motion" id="motion" hidden aria-pressed="true">
      <span class="motion__dot" aria-hidden="true"></span><span id="motion-label">Motion on</span>
    </button>
  </div>
</header>

<main id="top">
  <section class="hero" id="hero">
    <div class="wrap hero__wrap">
      <p class="hero__meta">
        <span class="mask"><span class="mask__in">${esc(p.title)}</span></span>
        <span class="mask"><span class="mask__in">${esc(p.company)}</span></span>
        <span class="mask"><span class="mask__in">${esc(p.location)}</span></span>
      </p>

      <h1 class="hero__name" id="hero-name" aria-label="${esc(p.shortName)}">
        <span class="hero__line"><span class="mask"><span class="mask__in">${esc(first)}</span></span></span>
        <span class="hero__line"><span class="mask"><span class="mask__in">${esc(rest.join(' '))}</span></span></span>
      </h1>

      <p class="hero__lede">${words(p.intro)}</p>

      <div class="hero__actions">
        <a class="lnk lnk--big" href="#work"><span>See the work</span></a>
        <a class="lnk lnk--big" href="mailto:${esc(p.email)}?subject=Hello%20from%20naveenb.dev">${ICON.mail}<span>Email me</span></a>
      </div>
    </div>
    <p class="cue" aria-hidden="true"><span class="cue__line"></span>scroll</p>
  </section>

  <nav class="rail" id="rail" aria-label="Projects"><ol>${rail}</ol></nav>

  <div class="scenes" id="work">
    <h2 class="sr-only">Selected work</h2>
    ${data.projects.map((project, i) => projectSection(project, i, data.projects.length)).join('\n')}
  </div>

  ${cv(data)}
  ${contact(data)}
</main>

<footer class="ftr">
  <div class="wrap ftr__inner">
    <p>© <span id="year">2026</span> ${esc(data.personal.name)}</p>
    <nav class="ftr__links" aria-label="Footer">
      <a href="/about">About</a>
      <a href="${esc(data.social.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="${esc(data.social.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <a href="#top">Back to top</a>
    </nav>
  </div>
</footer>

<script type="application/json" id="profile">${jsonBlock(clientProfile(data))}</script>
<script src="/js/main.js" type="module"></script>
</body>
</html>`;
}

/* ------------------------------------------------------------------- about */

function renderAbout(data) {
    const p = data.personal;
    const title = `About ${p.shortName} — ${p.title}`;
    const description = `${p.shortName} (${p.name}) is a ${p.title} at ${p.company}, working between ${p.location}.`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
${head(data, { title, description, canonical: `${SITE}/about`, ldJson: personLd(data) })}
</head>
<body class="is-doc">
<main class="wrap doc" id="main">
  <div class="doc__head">
    <img src="/naveen-busiraju.jpg" alt="${esc(p.shortName)}" width="88" height="88" decoding="async">
    <div>
      <h1 class="display display--sm">${esc(p.shortName)}</h1>
      <p class="mono muted">${esc(p.title)} at ${esc(p.company)} · ${esc(p.location)}</p>
    </div>
  </div>

  <p class="doc__lede">${esc(data.about.profile)}</p>

  <h2 class="h3">Elsewhere</h2>
  <ul class="creds">
    <li><span class="cred__name"><a href="${SITE}">naveenb.dev</a></span><span class="cred__org">Portfolio and live projects</span></li>
    <li><span class="cred__name"><a href="${esc(data.social.github)}">github.com/vnaveenb</a></span><span class="cred__org">Source for everything on the site</span></li>
    <li><span class="cred__name"><a href="${esc(data.social.linkedin)}">linkedin.com/in/naveenbusiraju</a></span><span class="cred__org">Work history</span></li>
    <li><span class="cred__name"><a href="${esc(data.social.twitter)}">x.com/naveenbusiraju1</a></span><span class="cred__org">Occasional notes</span></li>
    <li><span class="cred__name"><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></span><span class="cred__org">Best way to reach me</span></li>
  </ul>

  <p class="doc__back"><a class="lnk lnk--big" href="/"><span>← Back to naveenb.dev</span></a></p>
</main>
</body>
</html>`;
}

module.exports = { renderHome, renderAbout };
