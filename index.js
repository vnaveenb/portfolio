const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { renderHome, renderAbout } = require('./lib/render');

const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const isProduction = process.env.NODE_ENV === 'production';

/* Render once, at boot. profile.json is the only content source, so the
 * pages are plain strings in memory from here on — no filesystem or JSON
 * work on the request path, and no way for the page to disagree with the
 * data. Editing profile.json means restarting the container. */
const profile = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'profile.json'), 'utf8'));
const pages = {
    home: renderHome(profile),
    about: renderAbout(profile),
};

// Trust Proxy (Required for Cloudflare/Docker)
app.set('trust proxy', 1);

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // the vendored 3D bundle makes a single visit chattier than before
    standardHeaders: true,
    legacyHeaders: false,
});

// Security & Performance Middleware
app.use(limiter);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // Three.js, GSAP and Lenis are vendored under /vendor, so scripts
            // never leave the origin. 'unsafe-inline' is gone with the
            // pre-paint theme script it used to cover.
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            /* Only in production. This rewrites every http:// subresource to
             * https://, which is what we want behind Cloudflare — but a
             * browser applies it to same-origin requests too, and a LAN
             * address is not a trustworthy origin the way localhost is. Left
             * on, hitting the container directly over http://<lan-ip>:port
             * upgrades every asset to a port with no TLS on it and the page
             * arrives with no CSS, no JS and no images.
             *
             * null rather than omitted: helmet merges these over its own
             * defaults, and its defaults switch this on. */
            upgradeInsecureRequests: isProduction ? [] : null,
        },
    },
}));
app.use(compression());

const sendPage = (html) => (req, res) => res.type('html').send(html);

app.get('/', sendPage(pages.home));
app.get('/about', sendPage(pages.about));

/* The vendored libraries are pinned to a version, so they can cache hard.
 * index:false stops express.static from shadowing the rendered "/" above. */
app.use('/vendor', express.static(path.join(publicDir, 'vendor'), {
    maxAge: '30d',
    immutable: true,
}));
app.use(express.static(publicDir, { index: false, maxAge: '1h' }));

app.use((req, res) => res.status(404).type('html').send(pages.home));

const server = app.listen(port, () => {
    console.log(`Portfolio running at http://localhost:${port}`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received');
    server.close();
});
