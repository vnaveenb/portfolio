/* naveenb.dev — the motion layer.
 *
 * Loaded only when main.js has decided the visitor can and wants to render
 * it. Everything here is additive: if this module never runs, the page is
 * unchanged and complete.
 *
 * What it draws is deliberately not decoration. Each project section pins,
 * and behind the text the actual mechanism of that project plays out — a
 * circuit breaker tripping, a queue applying backpressure, four agents
 * looping until the tests pass. Two kinds of scene share one renderer:
 *
 *   tier 1   hand-choreographed sequences (builder, router, queue)
 *   tier 2   one parametric engine driven by the topology in profile.json
 *
 * The whole thing is one Points cloud and one LineSegments per project,
 * with per-vertex brightness written from the CPU each frame. That keeps
 * the shaders trivial and the choreography readable as plain JavaScript,
 * which matters more here than shaving a few hundred microseconds.
 */

import * as THREE from '/vendor/three.module.min.js';

/* GSAP and Lenis ship as UMD, so they arrive as classic scripts and hang off
 * window. Same origin either way — nothing here touches a CDN. */
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

/* ------------------------------------------------------------------ maths */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* Normalised progress through the window [a, b] of a 0..1 timeline. */
const ramp = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

/* A value that rises and falls again inside [a, b]. */
const bump = (p, a, b) => {
    const t = ramp(p, a, b);
    return Math.sin(t * Math.PI);
};

const ease = (t) => t * t * (3 - 2 * t);

/* --------------------------------------------------------------- topology */

/* Node positions per scene. Coordinates are in world units with the camera
 * about 11 out on Z, so roughly ±4 fills the frame. */
const LAYOUTS = {
    builder(spec) {
        return {
            nodes: [
                { p: [-3.6, 0, 0], label: 'idea' },
                { p: [-0.6, 1.7, 0.3], label: 'planner' },
                { p: [1.3, 0.6, -0.4], label: 'developer' },
                { p: [0.8, -1.5, 0.4], label: 'tester' },
                { p: [-1.3, -0.9, -0.3], label: 'reviewer' },
                { p: [3.9, 0.2, 0], label: 'app' },
            ],
            edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1], [3, 5]],
        };
    },

    router(spec) {
        return {
            nodes: [
                { p: [-3.8, 0, 0], label: 'request' },
                { p: [-1.2, 0, 0], label: 'router' },
                { p: [1.4, 1.8, -0.2], label: 'primary' },
                { p: [1.4, 0, 0.2], label: 'fallback' },
                { p: [1.4, -1.8, -0.2], label: 'last resort' },
                { p: [4.0, 0, 0], label: '200 ok' },
            ],
            edges: [[0, 1], [1, 2], [1, 3], [1, 4], [2, 5], [3, 5], [4, 5]],
        };
    },

    queue(spec) {
        const nodes = [
            { p: [-4.0, 1.5, 0], label: '' },
            { p: [-4.0, 0.1, 0.3], label: 'producers' },
            { p: [-4.0, -1.3, 0], label: '' },
        ];
        // The lane itself: six slots the jobs sit in.
        for (let i = 0; i < 6; i++) {
            nodes.push({ p: [-2.2 + i * 0.95, 0.55, 0], label: i === 2 ? 'queue' : '' });
        }
        nodes.push({ p: [4.0, 1.4, 0], label: 'workers' });
        nodes.push({ p: [4.0, -0.2, 0.2], label: '' });
        nodes.push({ p: [2.4, -2.1, 0], label: 'dead letter' });

        const lane = [3, 4, 5, 6, 7, 8];
        const edges = [
            [0, 3], [1, 3], [2, 3],
            [8, 9], [8, 10],
            [6, 11],
        ];
        for (let i = 0; i < lane.length - 1; i++) edges.push([lane[i], lane[i + 1]]);

        return { nodes, edges, lane };
    },

    /* --- parametric shapes, tier 2 --- */

    ledger(spec) {
        const n = spec.nodes.length;
        return {
            nodes: spec.nodes.map((label, i) => ({
                p: [-3.4 + (i / (n - 1)) * 6.8, (i % 2 ? -0.7 : 0.7), (i % 3 - 1) * 0.35],
                label,
            })),
            edges: spec.edges,
        };
    },

    fan(spec) {
        const nodes = [
            { p: [-3.7, 0, 0], label: spec.nodes[0] },
            { p: [-1.7, 0, 0.2], label: spec.nodes[1] },
            { p: [0.3, 0, 0], label: spec.nodes[2] },
        ];
        const leaves = spec.nodes.slice(3);
        leaves.forEach((label, i) => {
            const a = ((i - (leaves.length - 1) / 2) / leaves.length) * 2.1;
            nodes.push({ p: [3.1, Math.sin(a) * 2.5, Math.cos(a) * 0.5 - 0.5], label });
        });
        return { nodes, edges: spec.edges };
    },

    loop(spec) {
        const n = spec.nodes.length;
        return {
            nodes: spec.nodes.map((label, i) => {
                const a = (i / n) * Math.PI * 2 - Math.PI / 2;
                return { p: [Math.cos(a) * 3.0, Math.sin(a) * 2.1, Math.sin(a * 2) * 0.6], label };
            }),
            edges: spec.edges,
        };
    },

    stack(spec) {
        return {
            nodes: [
                { p: [-3.4, 1.6, 0.2], label: spec.nodes[0] },
                { p: [-3.4, -1.6, -0.2], label: spec.nodes[1] },
                { p: [0, 0, 0], label: spec.nodes[2] },
                { p: [3.4, 1.5, 0.2], label: spec.nodes[3] },
                { p: [3.4, -1.5, -0.2], label: spec.nodes[4] },
            ],
            edges: spec.edges,
        };
    },

    path(spec) {
        const n = spec.nodes.length;
        return {
            nodes: spec.nodes.map((label, i) => {
                const t = i / (n - 1);
                return { p: [-3.6 + t * 7.2, -1.6 + t * 2.9, Math.sin(t * Math.PI) * 0.9], label };
            }),
            edges: spec.edges,
        };
    },
};

/* ---------------------------------------------------------- choreography */

/* Each step function receives the graph and a 0..1 scroll progress, and
 * writes node/edge state. Node state: v = brightness 0..1, tint 0 accent,
 * 1 amber, 2 red. Edge state: v = brightness, pulse = position of the
 * travelling highlight (or -1), tint as above. */

const STEPS = {
    /* Idea in. Four agents pass it around. Tests fail once, the loop runs
     * again, and only then does an app exist. */
    builder(g, p) {
        const [idea, planner, dev, tester, reviewer, app] = g.nodes;
        const E = g.edges;

        idea.v = ramp(p, 0.00, 0.10);
        planner.v = Math.max(ramp(p, 0.14, 0.22), ramp(p, 0.60, 0.66));
        dev.v = Math.max(ramp(p, 0.26, 0.34), ramp(p, 0.66, 0.72));
        tester.v = Math.max(ramp(p, 0.38, 0.46), ramp(p, 0.72, 0.78));
        reviewer.v = ramp(p, 0.50, 0.58);
        app.v = ease(ramp(p, 0.84, 0.96));

        // The failing pass: the tester goes red and the loop back through the
        // reviewer carries the failure with it.
        const failing = bump(p, 0.46, 0.62);
        tester.tint = failing * 1.9;
        reviewer.tint = failing * 1.4;

        E[0].pulse = window_(p, 0.06, 0.16);
        E[1].pulse = Math.max(window_(p, 0.18, 0.28), window_(p, 0.62, 0.67));
        E[2].pulse = Math.max(window_(p, 0.30, 0.40), window_(p, 0.67, 0.73));
        E[3].pulse = window_(p, 0.44, 0.52);
        E[4].pulse = window_(p, 0.52, 0.60);
        E[5].pulse = window_(p, 0.78, 0.88);

        E[3].tint = failing * 1.9;
        E[4].tint = failing * 1.9;

        E.forEach((e, i) => { e.v = Math.max(e.v, i === 5 ? ramp(p, 0.78, 0.9) : ramp(p, 0.1, 0.35) * 0.5); });
        E[5].v = ramp(p, 0.76, 0.86);

        g.camera = { z: lerp(11.5, 13.5, ease(ramp(p, 0.7, 1))), tilt: p * 0.12 };
    },

    /* A request arrives, the primary model starts failing its SLA, the
     * breaker trips, and traffic moves down the chain. */
    router(g, p) {
        const [req, router, primary, fallback, last, ok] = g.nodes;
        const E = g.edges;

        req.v = ramp(p, 0.00, 0.10);
        router.v = ramp(p, 0.10, 0.18);
        primary.v = Math.max(ramp(p, 0.20, 0.28), 0.25) * (1 - ramp(p, 0.56, 0.68) * 0.75);
        fallback.v = ramp(p, 0.62, 0.72);
        last.v = 0.18;
        ok.v = ease(ramp(p, 0.82, 0.94));

        // Latency climbs, then the breaker trips: amber into red.
        const strain = ramp(p, 0.30, 0.46);
        const dead = ramp(p, 0.46, 0.58);
        primary.tint = strain + dead;

        E[0].pulse = window_(p, 0.04, 0.14);
        E[1].pulse = window_(p, 0.18, 0.30);
        E[2].pulse = window_(p, 0.64, 0.76);
        E[5].pulse = window_(p, 0.78, 0.90);

        E[1].tint = strain + dead;
        E[1].v = Math.max(0.35 * (1 - dead), ramp(p, 0.18, 0.3) * (1 - dead));
        E[2].v = ramp(p, 0.6, 0.72);
        E[5].v = ramp(p, 0.76, 0.88);
        E[3].v = 0.1;
        E[4].v = 0.06;
        E[6].v = 0.06;
        E[0].v = ramp(p, 0.02, 0.14);

        g.camera = { z: lerp(12.2, 11.2, ease(ramp(p, 0.4, 0.85))), tilt: -p * 0.1 };
    },

    /* Jobs stream in, the lane fills, backpressure throttles the producers,
     * and one job that never succeeds falls out into the dead-letter queue. */
    queue(g, p) {
        const N = g.nodes;
        const E = g.edges;
        const lane = g.lane;

        const inflow = ramp(p, 0.02, 0.18) * (1 - ramp(p, 0.52, 0.66) * 0.85);
        N[0].v = inflow; N[1].v = inflow; N[2].v = inflow;

        // The lane fills slot by slot, then holds.
        lane.forEach((idx, i) => {
            const t = 0.12 + i * 0.05;
            N[idx].v = ramp(p, t, t + 0.12);
        });

        // Backpressure: the lane saturates and goes amber before it runs away.
        const pressure = bump(p, 0.46, 0.70);
        lane.forEach(idx => { N[idx].tint = pressure * 0.95; });
        N[0].tint = pressure * 0.6; N[1].tint = pressure * 0.6; N[2].tint = pressure * 0.6;

        N[9].v = ramp(p, 0.30, 0.44);
        N[10].v = ramp(p, 0.34, 0.48);

        // The dead letter: one job gives up and diverts.
        const dlq = ramp(p, 0.70, 0.82);
        N[11].v = dlq;
        N[11].tint = 2 * dlq;

        E.forEach(e => { e.v = 0.08; e.pulse = -1; });
        E[0].pulse = window_(p, 0.02, 0.14);
        E[1].pulse = window_(p, 0.06, 0.18);
        E[2].pulse = window_(p, 0.10, 0.22);
        E[0].v = E[1].v = E[2].v = inflow * 0.8;

        E[3].pulse = window_(p, 0.32, 0.46);
        E[4].pulse = window_(p, 0.36, 0.50);
        E[3].v = E[4].v = ramp(p, 0.28, 0.44);

        E[5].pulse = window_(p, 0.70, 0.82);
        E[5].v = dlq;
        E[5].tint = 2 * dlq;

        for (let i = 6; i < E.length; i++) {
            const k = i - 6;
            E[i].v = Math.max(0.1, ramp(p, 0.14 + k * 0.05, 0.28 + k * 0.05));
            E[i].tint = pressure * 0.95;
            E[i].pulse = window_(p, 0.16 + k * 0.045, 0.30 + k * 0.045);
        }

        g.camera = { z: lerp(12.8, 12.0, ease(ramp(p, 0.2, 0.9))), tilt: p * 0.08 };
    },

    /* Tier 2. Signal enters at the first node and sweeps the graph in index
     * order, with each edge lighting behind it. Same visual grammar as the
     * bespoke scenes, driven entirely by the topology in profile.json. */
    generic(g, p) {
        const n = g.nodes.length;
        const span = 0.62;

        g.nodes.forEach((node, i) => {
            const t0 = 0.08 + (i / n) * span;
            node.v = ramp(p, t0, t0 + 0.16);
            node.tint = 0;
        });

        g.edges.forEach((edge, i) => {
            const src = edge.a;
            const t0 = 0.08 + (src / n) * span;
            edge.v = ramp(p, t0 + 0.02, t0 + 0.18) * 0.85;
            edge.pulse = window_(p, t0 + 0.01, t0 + 0.17);
            edge.tint = 0;
        });

        // A last settle where the whole graph is lit at once.
        const settle = ease(ramp(p, 0.78, 0.95));
        g.nodes.forEach(node => { node.v = Math.max(node.v, settle * 0.85); });
        g.edges.forEach(edge => { edge.v = Math.max(edge.v, settle * 0.55); });

        g.camera = { z: lerp(12.6, 11.6, ease(ramp(p, 0, 1))), tilt: (p - 0.5) * 0.22 };
    },
};

/* Position of a travelling pulse inside a window, or -1 when it is not
 * running. Kept as a free function so the step definitions stay dense. */
function window_(p, a, b) {
    if (p < a || p > b) return -1;
    return (p - a) / (b - a);
}

/* ------------------------------------------------------------- materials */

const POINT_VERT = `
attribute float aVal;
attribute float aTint;
attribute float aSeed;
uniform float uTime;
uniform float uScale;
varying float vVal;
varying float vTint;
varying float vFade;
void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vVal = aVal;
    vTint = aTint;
    vFade = smoothstep(30.0, 7.0, -mv.z);
    // Nodes shimmer in size rather than drifting in space: the edges are
    // static geometry, so moving a node would visibly detach it from the
    // lines that are supposed to be attached to it.
    float breathe = 0.92 + 0.08 * sin(uTime * 1.25 + aSeed * 6.2831);
    gl_PointSize = uScale * (0.5 + aVal * 1.6) * breathe * (11.0 / max(-mv.z, 0.001));
    gl_Position = projectionMatrix * mv;
}`;

const POINT_FRAG = `
uniform vec3 uIdle;
uniform vec3 uHot;
uniform vec3 uWarn;
uniform vec3 uBad;
varying float vVal;
varying float vTint;
varying float vFade;
void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    vec3 accent = vTint < 1.0 ? mix(uHot, uWarn, vTint) : mix(uWarn, uBad, vTint - 1.0);
    vec3 col = mix(uIdle, accent, clamp(vVal * 1.3, 0.0, 1.0));
    float alpha = (pow(core, 2.6) * 0.7 + pow(core, 9.0) * 1.0) * vFade * (0.22 + vVal * 0.95);
    gl_FragColor = vec4(col * (0.55 + vVal * 1.5), alpha);
}`;

const LINE_VERT = `
attribute float aVal;
attribute float aTint;
varying float vVal;
varying float vTint;
varying float vFade;
void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vVal = aVal;
    vTint = aTint;
    vFade = smoothstep(30.0, 7.0, -mv.z);
    gl_Position = projectionMatrix * mv;
}`;

const LINE_FRAG = `
uniform vec3 uIdle;
uniform vec3 uHot;
uniform vec3 uWarn;
uniform vec3 uBad;
varying float vVal;
varying float vTint;
varying float vFade;
void main() {
    vec3 accent = vTint < 1.0 ? mix(uHot, uWarn, vTint) : mix(uWarn, uBad, vTint - 1.0);
    vec3 col = mix(uIdle, accent, clamp(vVal * 1.4, 0.0, 1.0));
    gl_FragColor = vec4(col, (0.05 + vVal * 0.85) * vFade);
}`;

const COLORS = {
    uIdle: new THREE.Color('#3d4658'),
    uHot: new THREE.Color('#7dd3fc'),
    uWarn: new THREE.Color('#ffb454'),
    uBad: new THREE.Color('#ff6b6b'),
};

const SEGMENTS = 26; // per edge — enough for a smooth travelling pulse

/* ----------------------------------------------------------- graph build */

function buildGraph(project, THREEScene, labelHost) {
    const spec = project.scene;
    const layout = LAYOUTS[spec.tier === 1 ? spec.kind : spec.shape];
    if (!layout) return null;

    const { nodes: rawNodes, edges: rawEdges, lane } = layout(spec);

    const group = new THREE.Group();
    group.visible = false;

    /* --- nodes --- */
    const count = rawNodes.length;
    const positions = new Float32Array(count * 3);
    const vals = new Float32Array(count);
    const tints = new Float32Array(count);
    const seeds = new Float32Array(count);

    rawNodes.forEach((node, i) => {
        positions[i * 3] = node.p[0];
        positions[i * 3 + 1] = node.p[1];
        positions[i * 3 + 2] = node.p[2];
        seeds[i] = Math.random();
    });

    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointGeo.setAttribute('aVal', new THREE.BufferAttribute(vals, 1));
    pointGeo.setAttribute('aTint', new THREE.BufferAttribute(tints, 1));
    pointGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const pointMat = new THREE.ShaderMaterial({
        vertexShader: POINT_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: {
            uTime: { value: 0 },
            uScale: { value: 26 },
            ...Object.fromEntries(Object.entries(COLORS).map(([k, v]) => [k, { value: v }])),
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    group.add(new THREE.Points(pointGeo, pointMat));

    /* --- edges --- */
    const edgeCount = rawEdges.length;
    const vertsPerEdge = SEGMENTS * 2;
    const linePositions = new Float32Array(edgeCount * vertsPerEdge * 3);
    const lineVals = new Float32Array(edgeCount * vertsPerEdge);
    const lineTints = new Float32Array(edgeCount * vertsPerEdge);
    const lineTs = new Float32Array(edgeCount * vertsPerEdge);

    rawEdges.forEach(([a, b], e) => {
        const pa = rawNodes[a].p;
        const pb = rawNodes[b].p;
        for (let s = 0; s < SEGMENTS; s++) {
            const t0 = s / SEGMENTS;
            const t1 = (s + 1) / SEGMENTS;
            [t0, t1].forEach((t, k) => {
                const v = (e * vertsPerEdge + s * 2 + k);
                linePositions[v * 3] = lerp(pa[0], pb[0], t);
                linePositions[v * 3 + 1] = lerp(pa[1], pb[1], t);
                linePositions[v * 3 + 2] = lerp(pa[2], pb[2], t);
                lineTs[v] = t;
            });
        }
    });

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('aVal', new THREE.BufferAttribute(lineVals, 1));
    lineGeo.setAttribute('aTint', new THREE.BufferAttribute(lineTints, 1));

    const lineMat = new THREE.ShaderMaterial({
        vertexShader: LINE_VERT,
        fragmentShader: LINE_FRAG,
        uniforms: Object.fromEntries(Object.entries(COLORS).map(([k, v]) => [k, { value: v }])),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });

    group.add(new THREE.LineSegments(lineGeo, lineMat));
    THREEScene.add(group);

    /* --- labels --- */
    const labels = rawNodes.map(node => {
        if (!node.label) return null;
        const el = document.createElement('div');
        el.className = 'node-label';
        el.textContent = node.label;
        el.style.display = 'none';
        labelHost.appendChild(el);
        return el;
    });

    return {
        id: project.id,
        group,
        pointGeo, pointMat, lineGeo,
        vals, tints, lineVals, lineTints, lineTs,
        labels,
        vertsPerEdge,
        nodes: rawNodes.map(n => ({ p: n.p, v: 0, tint: 0 })),
        edges: rawEdges.map(([a, b]) => ({ a, b, v: 0, tint: 0, pulse: -1 })),
        lane,
        step: STEPS[spec.tier === 1 ? spec.kind : 'generic'],
        progress: 0,
        camera: { z: 12, tilt: 0 },
    };
}

/* Push the JS-side node/edge state into the GPU buffers. */
function syncGraph(g) {
    g.nodes.forEach((node, i) => {
        g.vals[i] = clamp(node.v, 0, 1);
        g.tints[i] = clamp(node.tint, 0, 2);
    });
    g.pointGeo.attributes.aVal.needsUpdate = true;
    g.pointGeo.attributes.aTint.needsUpdate = true;

    g.edges.forEach((edge, e) => {
        const base = e * g.vertsPerEdge;
        for (let v = 0; v < g.vertsPerEdge; v++) {
            const idx = base + v;
            let val = edge.v * 0.35;
            if (edge.pulse >= 0) {
                // A soft head with a tail behind it, so the pulse reads as
                // travelling rather than blinking.
                const d = g.lineTs[idx] - edge.pulse;
                const head = Math.exp(-(d * d) / 0.004);
                const tail = d < 0 ? Math.exp(d * 9) * 0.45 : 0;
                val = Math.max(val, head + tail);
            }
            g.lineVals[idx] = clamp(val, 0, 1);
            g.lineTints[idx] = clamp(edge.tint, 0, 2);
        }
    });
    g.lineGeo.attributes.aVal.needsUpdate = true;
    g.lineGeo.attributes.aTint.needsUpdate = true;
}

/* Reset per-frame state so a step function only has to set what it cares
 * about, and stale values from the previous frame never leak through. */
function resetGraph(g) {
    g.nodes.forEach(node => { node.v = 0.12; node.tint = 0; });
    g.edges.forEach(edge => { edge.v = 0.08; edge.tint = 0; edge.pulse = -1; });
}

/* -------------------------------------------------------------------- run */

export async function start(profile) {
    await Promise.all([
        loadScript('/vendor/gsap.min.js'),
        loadScript('/vendor/lenis.min.js'),
    ]);
    await loadScript('/vendor/ScrollTrigger.min.js');

    const { gsap, ScrollTrigger, Lenis } = window;
    if (!gsap || !ScrollTrigger || !Lenis) throw new Error('motion libraries missing');
    gsap.registerPlugin(ScrollTrigger);

    const canvas = document.getElementById('gl');
    const labelHost = document.getElementById('labels');
    if (!canvas || !labelHost) throw new Error('stage markup missing');

    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);
    camera.position.set(0, 0, 12);

    const graphs = new Map();
    profile.projects.forEach(project => {
        const g = buildGraph(project, scene, labelHost);
        if (g) graphs.set(project.id, g);
    });
    if (!graphs.size) throw new Error('no scenes could be built');

    /* Only now does the layout change, so nothing above has to measure a
     * document that is about to be rewritten by pinning. */
    document.documentElement.classList.add('fx');

    let active = graphs.get(profile.projects[0].id);
    active.group.visible = true;

    const railLinks = new Map(
        Array.from(document.querySelectorAll('[data-rail]'))
            .map(a => [a.dataset.rail, a])
    );

    function setActive(id) {
        const next = graphs.get(id);
        if (!next || next === active) return;
        active.group.visible = false;
        active.labels.forEach(el => { if (el) el.style.display = 'none'; });
        active = next;
        active.group.visible = true;
        railLinks.forEach((el, key) => el.classList.toggle('is-active', key === id));
    }

    /* --- smooth scroll --- */
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, touchMultiplier: 1.6 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (event) => {
            const id = link.getAttribute('href').slice(1);
            const target = document.getElementById(id);
            if (!target) return;
            event.preventDefault();
            lenis.scrollTo(target, { offset: -1 });
        });
    });

    /* --- pin one ScrollTrigger per project --- */
    document.querySelectorAll('.scene').forEach(section => {
        const id = section.dataset.scene;
        const g = graphs.get(id);
        if (!g) return;

        const tier = Number(section.dataset.tier);
        const panel = section.querySelector('.panel');
        const hold = tier === 1 ? 1.5 : 0.85; // viewport-heights of pinned scroll

        ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: () => `+=${window.innerHeight * hold}`,
            pin: true,
            pinSpacing: true,
            scrub: true,
            invalidateOnRefresh: true,
            onToggle: (self) => { if (self.isActive) setActive(id); },
            onUpdate: (self) => {
                g.progress = self.progress;
                if (panel) {
                    // Hand the frame over cleanly at both ends of the pin.
                    const inOpacity = ramp(self.progress, 0, 0.06);
                    const outOpacity = 1 - ramp(self.progress, 0.9, 1);
                    panel.style.opacity = String(Math.min(inOpacity, outOpacity));
                    panel.style.transform = `translateY(${(1 - inOpacity) * 18 - ramp(self.progress, 0.9, 1) * 18}px)`;
                }
            },
        });
    });

    /* --- pointer parallax --- */
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('pointermove', (event) => {
        pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
        pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    /* The panel occupies the left of the frame on wide screens, so the graph
     * is pushed right to sit in the space that is actually free. */
    function graphOffset() {
        if (window.innerWidth < 1100) return 0.4;
        return 1.9;
    }

    const projected = new THREE.Vector3();
    const clock = new THREE.Clock();

    function render() {
        const time = clock.getElapsedTime();

        resetGraph(active);
        active.step(active, active.progress);
        syncGraph(active);

        active.group.position.x = graphOffset();
        // The whole graph breathes as one, which keeps nodes and edges welded
        // together while still stopping a paused scene from looking frozen.
        active.group.position.y = Math.sin(time * 0.33) * 0.07;
        active.pointMat.uniforms.uTime.value = time;

        pointer.x = lerp(pointer.x, pointer.tx, 0.05);
        pointer.y = lerp(pointer.y, pointer.ty, 0.05);

        const target = active.camera || { z: 12, tilt: 0 };
        camera.position.z = lerp(camera.position.z, target.z, 0.06);
        camera.position.x = lerp(camera.position.x, pointer.x * 0.55, 0.08);
        camera.position.y = lerp(camera.position.y, -pointer.y * 0.4, 0.08);
        active.group.rotation.y = lerp(active.group.rotation.y, pointer.x * 0.08 + target.tilt, 0.05);
        active.group.rotation.x = lerp(active.group.rotation.x, -pointer.y * 0.05, 0.05);
        camera.lookAt(active.group.position.x * 0.35, 0, 0);

        // Project against this frame's matrices, not last frame's, or every
        // label trails its node by one frame during the camera moves.
        active.group.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

        // Labels ride along with the nodes they belong to.
        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;
        active.labels.forEach((el, i) => {
            if (!el) return;
            const node = active.nodes[i];
            if (node.v < 0.04) { el.style.display = 'none'; return; }
            projected.set(node.p[0], node.p[1], node.p[2]);
            active.group.localToWorld(projected);
            projected.project(camera);
            el.style.display = '';
            el.style.transform =
                `translate(-50%, 0) translate(${projected.x * halfW + halfW}px, ${-projected.y * halfH + halfH + 14}px)`;
            el.style.opacity = String(clamp(node.v * 1.2, 0, 1));
            el.classList.toggle('is-hot', node.tint < 0.5 && node.v > 0.5);
            el.classList.toggle('is-bad', node.tint > 1.2);
        });

        renderer.render(scene, camera);
    }

    gsap.ticker.add(render);

    /* --- resize --- */
    let resizeTimer;
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 180);
    }, { passive: true });

    /* Web fonts change the height of every panel, which changes where every
     * pin starts. Measure again once they have actually landed. */
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
    }

    ScrollTrigger.refresh();

    /* If the visitor arrived on a deep link, land them on it after pinning
     * has rewritten the document height. */
    if (window.location.hash) {
        const target = document.getElementById(window.location.hash.slice(1));
        if (target) requestAnimationFrame(() => lenis.scrollTo(target, { immediate: true }));
    }
}
