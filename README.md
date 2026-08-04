# naveenb.dev

Personal site for Naveen Busiraju — Gen AI Consultant at Atos.

## Quick start

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

The site is one page with two layouts built from the same markup.

**The static page** is what actually ships. Every project, role and credential
is rendered into the HTML by the server, so the page is complete for crawlers,
for anyone with JavaScript off, and for every visitor who does not get the
motion layer. It is not a fallback — it is the page.

**The motion layer** is added on top only when the visitor can and wants to
render it. Each project section pins, and behind the text a WebGL scene plays
out the mechanism of that project: a circuit breaker tripping, a queue applying
backpressure, four agents looping until the tests pass.

`public/js/main.js` decides between them. The motion layer requires a viewport
of at least 1024px, a hover-capable pointer, WebGL, at least 4GB of reported
device memory, and no `prefers-reduced-motion`. There is also a **Motion**
switch in the header for anyone who would simply rather not. If any of those
say no, Three.js, GSAP and Lenis are never requested — the page costs what a
text page costs.

## Stack

- **Server**: Node.js + Express, with helmet (CSP), compression, rate limiting.
- **Rendering**: `lib/render.js` turns `data/profile.json` into HTML once, at
  boot, and the result is cached in memory. No build step, no generated files
  in git, and no way for the page to disagree with the data.
- **Frontend**: hand-written CSS and vanilla ES modules. No framework, no
  bundler.
- **Motion**: Three.js, GSAP + ScrollTrigger, and Lenis — vendored under
  `public/vendor/` because the CSP is `script-src 'self'`. Nothing loads from a
  CDN.

## Structure

```
data/profile.json      single source of truth — deliberately outside public/
lib/render.js          profile.json -> HTML, run once at boot
index.js               Express server
public/
  css/site.css         one stylesheet, both layouts
  js/main.js           chrome, résumé copy, and the capability gate
  js/scenes.js         the WebGL layer: 8 scenes, 3 bespoke + 5 parametric
  vendor/              three, gsap, ScrollTrigger, lenis
```

## Editing content

Change `data/profile.json` and restart. Projects, experience, skills, education
and certifications all come from it, as do the JSON-LD and the meta tags.

`data/profile.json` is **not** inside `public/`, so it is never served. The copy
embedded in the page for the "copy résumé" button has the phone number stripped
out of it — the site's contact routes are email, LinkedIn and GitHub.

### Scenes

Each project carries a `scene` block that decides what gets drawn.

Tier 1 is hand-choreographed; `kind` selects the sequence:

```json
"scene": { "tier": 1, "kind": "builder" }
```

`builder`, `router` and `queue` each have a bespoke layout in `LAYOUTS` and a
bespoke timeline in `STEPS` in `public/js/scenes.js`.

Tier 2 is generated from the topology, so a new project needs no new code —
just nodes, edges, and one of the shapes `ledger`, `fan`, `loop`, `stack`,
`path`:

```json
"scene": {
  "tier": 2,
  "shape": "loop",
  "nodes": ["prompt", "think", "tool", "observe", "retry", "answer"],
  "edges": [[0,1],[1,2],[2,3],[3,1],[2,4],[4,2],[1,5]]
}
```

## Deployment

GitHub Actions builds and pushes `ghcr.io/vnaveenb/portfolio:latest` on every
push to `main`; Watchtower pulls it. `docker-compose.yml` runs it on port 3529.

To try a build locally without touching that, use a different name and port:

```bash
docker build -t portfolio-dev:local .
docker run -d --name portfolio-local -p 3530:3000 portfolio-dev:local
```

## Notes

- Committed to dark. There is no theme toggle — the scenes are lit for one
  palette, and authoring a second would halve the quality of both.
- `prefers-reduced-motion` disables the motion layer outright rather than
  merely shortening it.
- The project rail on the right of the motion layer jumps straight to any
  project, so nobody has to scroll through the scenes to reach a repo link.
