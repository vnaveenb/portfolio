# naveenb.dev

Personal site for Naveen Busiraju — Gen AI Consultant at Atos.

## Quick start

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

Three layers over one set of markup.

**Layer 0 — the static page.** Every project, role and credential is rendered
into the HTML by the server. Complete for crawlers, for JavaScript-off, and for
phones. Not a fallback — it is the page.

**Layer 1 — the type.** Smooth scroll, pinned spreads, words wiping up from
behind masks, and the hero name flying into the header slot as one continuous
move. Transforms and opacity only: **no GPU required.** This is where the art
direction lives.

**Layer 2 — the schematics.** WebGL behind the type. Each project section plays
its own mechanism: a circuit breaker tripping, a queue applying backpressure,
four agents looping until the tests pass.

Layers 1 and 2 are deliberately separate. They used to be one, and the result
was that a machine whose WebGL would not start showed a plain text page — the
entire design lost to a GPU check. Now losing layer 2 costs texture, not design.

`public/js/main.js` gates layer 1 on viewport ≥1024px, ≥4GB reported device
memory, and the visitor's wishes. `prefers-reduced-motion` sets the *default*,
not a veto — the **Motion** switch in the header and `?motion=on|off` both
override it. `public/js/motion.js` checks WebGL separately, only to decide
whether to add layer 2.

If neither layer runs, GSAP, Lenis and Three.js are never requested at all.

### Not leaving text hidden

Masked words start hidden, which means every failure path has to be able to put
them back. Three independent guards:

- `public/js/boot.js` runs synchronously in `<head>` so nothing flashes in
  before it can animate — and arms a CSS keyframe that reveals everything after
  3s if no module ever loads.
- A watchdog in `motion.js` snaps the entrance open if the ticker is starved.
- `unmask()` in `main.js` strips the inline transforms GSAP wrote. Dropping the
  CSS class alone is not enough, because inline styles outlive it.

## Stack

- **Server**: Node.js + Express, with helmet (CSP), compression, rate limiting.
- **Rendering**: `lib/render.js` turns `data/profile.json` into HTML once, at
  boot, and the result is cached in memory. No build step, no generated files
  in git, and no way for the page to disagree with the data.
- **Frontend**: hand-written CSS and vanilla ES modules. No framework, no
  bundler.
- **Type**: Archivo (variable, with its 62–125 width axis, which is what lets
  the headlines go wide and tight at display size) and JetBrains Mono for every
  label, index and piece of data.
- **Motion**: GSAP + ScrollTrigger and Lenis for layer 1; Three.js for layer 2.
  All vendored under `public/vendor/` because the CSP is `script-src 'self'`.
  Nothing loads from a CDN.

## Structure

```
data/profile.json      single source of truth — deliberately outside public/
lib/render.js          profile.json -> HTML, run once at boot
index.js               Express server
public/
  css/site.css         one stylesheet, all three layers
  js/boot.js           sync, in <head> — arms the masks before first paint
  js/main.js           chrome, résumé copy, the capability gate, unmask()
  js/motion.js         layer 1 — type choreography, owns scroll, no GPU
  js/scenes.js         layer 2 — 8 WebGL scenes, 3 bespoke + 5 parametric
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
- `prefers-reduced-motion` sets the default rather than vetoing motion — see
  the gate above. Anyone can still turn it on explicitly.
- The project rail on the right of the motion layer jumps straight to any
  project, so nobody has to scroll through the scenes to reach a repo link.
