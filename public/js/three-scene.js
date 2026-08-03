// three-scene.js — decorative Three.js layer for the portfolio hero.
//
// Three effects, all progressively enhanced and guarded:
//   1. #hero-canvas         — a slowly drifting particle / geometric network background
//   2. #hero-object-canvas  — a mouse-reactive rotating wireframe object near the portrait
//   3. scroll reactivity    — the background parallax/rotation responds to page scroll
//
// Guards:
//   - Skips all animation when `prefers-reduced-motion: reduce` (renders a single static frame).
//   - Caps devicePixelRatio at 2 to avoid over-rendering on high-DPI screens.
//   - Pauses the RAF loop when the hero is off-screen (IntersectionObserver) or the tab is hidden.
//   - Falls back silently (CSS gradient remains) if WebGL context creation fails.
//   - Colors follow the active theme and update live on the `themechange` event from main.js.

import * as THREE from '/js/vendor/three.module.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Resolve accent colors from CSS custom properties so Three.js matches the theme.
function themeColors() {
  const styles = getComputedStyle(document.documentElement);
  const accent = (styles.getPropertyValue('--accent-rgb') || '96,165,250').trim();
  const accent2 = (styles.getPropertyValue('--accent2-rgb') || '167,139,250').trim();
  const toColor = (rgb) => {
    const [r, g, b] = rgb.split(',').map(n => parseInt(n, 10) / 255);
    return new THREE.Color(r, g, b);
  };
  return { accent: toColor(accent), accent2: toColor(accent2) };
}

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Effect 1 + 3: particle network background + scroll reactivity
// ---------------------------------------------------------------------------
function initBackground() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.z = 60;

  const colors = themeColors();

  // Particle field
  const COUNT = 140;
  const positions = new Float32Array(COUNT * 3);
  const velocities = [];
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    velocities.push({
      x: (Math.random() - 0.5) * 0.04,
      y: (Math.random() - 0.5) * 0.04,
    });
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    color: colors.accent,
    size: 1.4,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // Connecting lines (network look)
  const lineGeo = new THREE.BufferGeometry();
  const lineMat = new THREE.LineBasicMaterial({
    color: colors.accent2,
    transparent: true,
    opacity: 0.18,
  });
  const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineSegments);

  const MAX_DIST = 22;
  const MAX_DIST_SQ = MAX_DIST * MAX_DIST;

  function rebuildLines() {
    const pts = [];
    for (let i = 0; i < COUNT; i++) {
      const ax = positions[i * 3], ay = positions[i * 3 + 1], az = positions[i * 3 + 2];
      for (let j = i + 1; j < COUNT; j++) {
        const dx = ax - positions[j * 3];
        const dy = ay - positions[j * 3 + 1];
        const dz = az - positions[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < MAX_DIST_SQ) {
          pts.push(ax, ay, az, positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
        }
      }
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    lineGeo.attributes.position.needsUpdate = true;
  }

  let scrollY = window.scrollY;
  const onScroll = () => { scrollY = window.scrollY; };
  window.addEventListener('scroll', onScroll, { passive: true });

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  function renderFrame() {
    // Effect 3: scroll reactivity — parallax rotation driven by page scroll.
    const scrollFactor = scrollY * 0.0004;
    points.rotation.y = scrollFactor + performance.now() * 0.00002;
    points.rotation.x = scrollFactor * 0.5;
    lineSegments.rotation.copy(points.rotation);
    renderer.render(scene, camera);
  }

  function animate() {
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] += velocities[i].x;
      positions[i * 3 + 1] += velocities[i].y;
      if (positions[i * 3] > 60 || positions[i * 3] < -60) velocities[i].x *= -1;
      if (positions[i * 3 + 1] > 40 || positions[i * 3 + 1] < -40) velocities[i].y *= -1;
    }
    pGeo.attributes.position.needsUpdate = true;
    rebuildLines();
    renderFrame();
  }

  window.addEventListener('themechange', () => {
    const c = themeColors();
    pMat.color.copy(c.accent);
    lineMat.color.copy(c.accent2);
  });

  rebuildLines();

  return {
    render: renderFrame,
    step: animate,
    resize,
    canvas,
    dispose() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      pGeo.dispose(); pMat.dispose(); lineGeo.dispose(); lineMat.dispose();
      renderer.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Effect 2: mouse-reactive wireframe object near the portrait
// ---------------------------------------------------------------------------
function initObject() {
  const canvas = document.getElementById('hero-object-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 4;

  const colors = themeColors();

  const geo = new THREE.IcosahedronGeometry(1.4, 1);
  const mat = new THREE.MeshBasicMaterial({
    color: colors.accent,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.7, 0),
    new THREE.MeshBasicMaterial({ color: colors.accent2, wireframe: true, transparent: true, opacity: 0.5 })
  );
  scene.add(inner);

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };

  const onPointerMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    // Normalize pointer position around the object center to [-1, 1].
    target.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    target.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  function resize() {
    const size = Math.min(canvas.clientWidth || 360, canvas.clientHeight || 360) || 360;
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  function renderFrame() {
    current.x += (target.y * 0.6 - current.x) * 0.06;
    current.y += (target.x * 0.6 - current.y) * 0.06;
    mesh.rotation.x = current.x;
    mesh.rotation.y = current.y + performance.now() * 0.0002;
    inner.rotation.x = -current.x * 1.5;
    inner.rotation.y = -current.y * 1.5;
    renderer.render(scene, camera);
  }

  window.addEventListener('themechange', () => {
    const c = themeColors();
    mat.color.copy(c.accent);
    inner.material.color.copy(c.accent2);
  });

  return {
    render: renderFrame,
    step: renderFrame,
    resize,
    canvas,
    dispose() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', resize);
      geo.dispose(); mat.dispose();
      inner.geometry.dispose(); inner.material.dispose();
      renderer.dispose();
    },
  };
}

// ---------------------------------------------------------------------------
// Bootstrapping + shared RAF loop with visibility/viewport guards
// ---------------------------------------------------------------------------
function boot() {
  if (!supportsWebGL()) return; // CSS gradient fallback stays in place.

  let background, object;
  try {
    background = initBackground();
    object = initObject();
  } catch (e) {
    console.warn('three-scene: initialization failed, using static fallback.', e);
    return;
  }

  const scenes = [background, object].filter(Boolean);
  if (scenes.length === 0) return;

  // Reduced motion: render a single static frame and stop. No RAF loop.
  if (prefersReducedMotion) {
    scenes.forEach(s => s.render());
    return;
  }

  let visible = true;
  let rafId = null;

  function loop() {
    if (!visible || document.hidden) { rafId = null; return; }
    scenes.forEach(s => s.step());
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (rafId == null && visible && !document.hidden) {
      rafId = requestAnimationFrame(loop);
    }
  }

  // Pause when the hero scrolls out of view.
  const hero = document.getElementById('home') || background.canvas;
  if (hero && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      visible = entries.some(en => en.isIntersecting);
      if (visible) start();
    }, { threshold: 0.01 });
    io.observe(hero);
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) start();
  });

  start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
