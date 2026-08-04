# naveenb.dev

Personal site for Naveen Busiraju — Gen AI engineer, full-stack developer, cloud architect.

## Quick start

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- **Frontend**: hand-written HTML + CSS + vanilla JS. No framework, no CDN, no build step.
- **Backend**: Node.js + Express, with helmet (CSP), compression, and rate limiting.
- **Content**: everything below the hero renders from `public/data/profile.json`.

## Structure

```
public/
  index.html          landing page — hero is static HTML, the rest is rendered
  about.html          plain entity page for search engines
  css/site.css        the entire stylesheet
  js/main.js          theme, nav, scroll behaviour, and the renderers
  data/profile.json   single source of truth for CV content
index.js              Express server
```

## Editing content

Change `public/data/profile.json` and reload — projects, experience, skills,
education, and certifications all re-render from it, and the hero metrics
(years of experience, project count, live-app count, cert count) are derived
rather than hard-coded. The hero headline and section intros are prose and live
in `index.html`.

Set `"featured": true` on a project to give it the wide highlighted card at the
top of the work grid.

## Notes

- Theme is applied before first paint from `localStorage`, defaulting to the OS
  preference, so there is no flash of the wrong theme.
- The hero, navigation, and contact details are static markup, so the page is
  meaningful before `main.js` runs. The CV lists below them are rendered from
  the JSON and do need JavaScript; `about.html` covers that case for crawlers.
- All motion respects `prefers-reduced-motion`.
