// space3d view: drawing only. three.js (with OrbitControls and CSS2D labels) for the 3D stage and a
// Canvas 2D drawing sheet for the orthographic and descriptive setups. Every number drawn comes from
// the model snapshot; nothing here changes the geometry.
//
// three.js is loaded with dynamic import() inside createView, so Node can import index.js. Until it
// has loaded the stage shows a calm loading line, and updates are queued (only the latest is kept).
import { readPalette, stageFontPx, font, MAX_DPR } from '../../engine-kit.js';
import { formatNumber, formatPlain } from '../../format.js';
import { add, sub, scale, length, normalize, cross, dot, clipLine, RELATION } from './model.js';

const STYLE_ID = 'space3d-styles';
const CSS = `
.s3d { position: absolute; inset: 0; overflow: hidden; color: var(--k-ink); font-family: var(--f-body); --s3d-px: 18px; }
.s3d-3d { position: absolute; top: 0; left: 0; bottom: 0; outline: none; }
.s3d-3d canvas { display: block; }
.s3d-labels { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.s3d-tag { white-space: nowrap; pointer-events: none; }
.s3d-tag > span { display: inline-block; padding: 1px 5px; font: 500 var(--s3d-px) / 1.2 var(--f-body); color: var(--k-ink); background: color-mix(in srgb, var(--k-bg) 84%, transparent); }
.s3d-tag.is-n { padding-bottom: 8px; } .s3d-tag.is-s { padding-top: 8px; } .s3d-tag.is-e { padding-left: 10px; } .s3d-tag.is-w { padding-right: 10px; }
.s3d-tag.is-ne { padding: 0 0 6px 8px; } .s3d-tag.is-nw { padding: 0 8px 6px 0; } .s3d-tag.is-se { padding: 6px 0 0 8px; } .s3d-tag.is-sw { padding: 6px 8px 0 0; }
.s3d-tag.is-mono > span { font-family: var(--f-mono); font-variant-numeric: tabular-nums; }
.s3d-tag.is-tick > span { font: 500 calc(var(--s3d-px) * 0.95) / 1.1 var(--f-mono); color: var(--k-muted); background: none; padding: 0 2px; }
.s3d-tag.is-axis > span { font: italic 600 calc(var(--s3d-px) * 1.15) / 1 var(--f-body); background: none; }
.s3d-tag.is-accent > span { color: var(--k-accent-text); }
.s3d-tag.is-blue > span { color: var(--s2); }
.s3d-tag.is-green > span { color: var(--s3); }
.s3d-tag.is-muted > span { color: var(--k-muted); }
.s3d-tag.is-strong > span { font-weight: 600; }
.s3d-tag .s3d-mark { display: inline-block; width: 0.62em; height: 0.62em; margin-right: 0.3em; vertical-align: 0.02em; border: 2px solid currentColor; }
.s3d-tag .s3d-mark.is-ring { border-radius: 50%; } .s3d-tag .s3d-mark.is-dot { border-radius: 50%; background: currentColor; }
.s3d-tag .s3d-mark.is-diamond { transform: rotate(45deg) scale(0.85); background: currentColor; }
.s3d-card { position: absolute; top: 10px; left: 10px; max-width: min(46%, 620px); padding: 8px 12px; background: var(--k-panel); border: 1px solid var(--k-grid); font-size: var(--s3d-px); line-height: 1.35; color: var(--k-ink); }
.s3d-card:empty, .s3d-card.is-off { display: none; }
.s3d-card__title { font-weight: 600; }
.s3d-card__title.is-verdict { font-family: var(--f-display); font-stretch: 125%; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em; }
.s3d-card__note { color: var(--k-muted); }
.s3d-card__error { color: var(--k-accent-text); font-weight: 600; }
.s3d-card__line { margin: 6px 0; overflow-x: auto; overflow-y: hidden; }
.s3d-card .katex { font-size: 1.05em; }
.s3d-tools { position: absolute; left: 10px; bottom: 10px; display: flex; gap: 6px; }
.s3d-btn { min-height: 44px; min-width: 44px; padding: 0 12px; font: 500 calc(var(--s3d-px) * 0.9) var(--f-body); color: var(--k-ink); background: var(--k-panel); border: 1px solid var(--k-axis); border-radius: 0; cursor: pointer; }
.s3d-btn:hover { border-color: var(--k-ink); }
.s3d-btn:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; }
.s3d-btn[aria-pressed="true"] { border-color: var(--k-ink); box-shadow: none; }
.s3d-sheet { position: absolute; top: 0; right: 0; bottom: 0; border-left: 1px solid var(--k-grid); }
.s3d-sheet canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.s3d-loading { position: absolute; inset: 0; display: grid; place-items: center; color: var(--k-muted); font: 500 14px var(--f-mono); text-transform: uppercase; letter-spacing: 0.06em; }
`;

const NO_WEBGL =
  'This 3D view needs WebGL, which this browser or device has turned off. Try another browser or turn on hardware acceleration. The readouts are still correct.';

const SPLIT = { orthographic: 0.42, descriptive: 0.4 };
const Z_UP = { revolution: false };
const FOV = 35;

/** Camera direction (from the target towards the camera) in model coordinates for each setup and view. */
function viewDirection(setup, viewFrom) {
  if (setup === 'revolution') {
    // y is up in this setup (three.js coordinates directly).
    return { iso: [0.5, 0.55, 1.15], top: [0, 1, 0.002], front: [0, 0, 1], side: [1, 0, 0] }[viewFrom] ?? [0.5, 0.55, 1.15];
  }
  // Maths setups: the textbook view (x towards the viewer, y to the right, z up), kept well away from
  // small whole-number directions such as (2, 1, 1) so common vectors don't point at the camera.
  const iso = setup === 'vectors' || setup === 'lines-spheres' ? [1, 0.55, 0.9] : setup === 'trig3d' ? [0.9, -1.25, 0.85] : [1, -1.3, 0.9];
  return { iso, top: [0, -0.002, 1], front: [0, -1, 0], side: [1, 0, 0] }[viewFrom] ?? iso;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = (x, sf = 3) => formatNumber(x, { sigfigs: sf });
const plain = (x) => formatPlain(Number(Number(x).toPrecision(6)));
/** A number for KaTeX: whole numbers as they are, otherwise `sf` significant figures; ASCII minus. */
const isWhole = (x) => Math.abs(x - Math.round(x)) < 1e-9 * Math.max(1, Math.abs(x)) && Math.abs(x) < 1e6;
const tn = (x, sf = 4) => (!Number.isFinite(x) ? '\\text{undefined}' : isWhole(x) ? String(Math.round(x)) : tnum(x, sf));
/** Labels: whole numbers as they are (true minus sign), otherwise 3 significant figures. */
const ln = (x, sf = 3) => (!Number.isFinite(x) ? '—' : isWhole(x) ? String(Math.round(x)).replace('-', '−') : fmt(x, sf));
const tnum = (x, sf) => formatNumber(x, { sigfigs: sf }).replace(/−/g, '-').replace(/\u202F/g, '\\,');
const tp = (x) => plain(x).replace(/−/g, '-');

export function createView(stage, { setup, onError, onCamera }) {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.append(style);
  }
  const split = SPLIT[setup] ?? 0;
  const zUp = Z_UP[setup] ?? true;

  const root = document.createElement('div');
  root.className = 's3d';
  const host = document.createElement('div');
  host.className = 's3d-3d';
  const labelsHost = document.createElement('div');
  labelsHost.className = 's3d-labels';
  const card = document.createElement('div');
  card.className = 's3d-card';
  card.setAttribute('aria-hidden', 'true'); // the stage's aria-label (describe()) says the same
  const tools = document.createElement('div');
  tools.className = 's3d-tools';
  const loading = document.createElement('div');
  loading.className = 's3d-loading';
  loading.textContent = 'Loading 3D view…';
  host.append(labelsHost);
  root.append(host, card, tools, loading);
  let sheetHost = null;
  let sheetCanvas = null;
  if (split) {
    sheetHost = document.createElement('div');
    sheetHost.className = 's3d-sheet';
    sheetCanvas = document.createElement('canvas');
    sheetCanvas.setAttribute('aria-hidden', 'true');
    sheetHost.append(sheetCanvas);
    root.append(sheetHost);
  }
  stage.append(root);

  const mkButton = (text, title, onClick) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 's3d-btn';
    b.textContent = text;
    b.title = title;
    b.addEventListener('click', onClick);
    tools.append(b);
    return b;
  };
  const resetBtn = mkButton('', 'Reset the camera (Home)', () => resetView());
  const camBtn = mkButton('', 'Switch between perspective and orthographic cameras', () => {
    const next = cameraMode === 'perspective' ? 'orthographic' : 'perspective';
    setCamera(next);
    onCamera?.(next);
  });
  // The working card can cover a small stage, so it starts hidden there; this button shows it.
  const hasCard = !split;
  let cardOn = stage.getBoundingClientRect().width >= 700;
  const cardBtn = hasCard
    ? mkButton('', 'Show or hide the working', () => {
        cardOn = !cardOn;
        syncButtons();
      })
    : null;
  let compact = false; // short button labels on narrow stages
  function syncButtons() {
    const toOrtho = cameraMode === 'perspective';
    resetBtn.textContent = compact ? 'Reset' : 'Reset view';
    resetBtn.setAttribute('aria-label', 'Reset view');
    camBtn.textContent = toOrtho ? (compact ? 'Ortho' : 'Orthographic') : compact ? 'Persp' : 'Perspective';
    camBtn.setAttribute('aria-label', `Switch to the ${toOrtho ? 'orthographic' : 'perspective'} camera`);
    if (cardBtn) {
      cardBtn.textContent = compact ? 'Working' : cardOn ? 'Hide working' : 'Show working';
      cardBtn.setAttribute('aria-pressed', String(cardOn));
      cardBtn.setAttribute('aria-label', 'Show the working');
      card.classList.toggle('is-off', !cardOn);
    }
  }

  let T = null;
  let Orbit = null;
  let CSS2D = null;
  let katex = null;
  let renderer = null;
  let labelRenderer = null;
  let scene = null;
  let content = null;
  let persp = null;
  let ortho = null;
  let camera = null;
  let controls = null;
  let ambient = null;
  let keyLight = null;
  let ready = false;
  let destroyed = false;
  let pending = null; // { snap, params, opts } waiting for three.js
  let current = null;
  let pal = readPalette(stage);
  let cameraMode = 'perspective';
  let fit = null; // { center: Vector3, radius }
  let frameKey = '';
  let sizes = { w: 1, h: 1, sw: 0, px: 18 };
  let revealed = new Set();
  let revealKey = '';
  let sheetHits = [];
  let sheetPx = 18;

  // ── sizes ──────────────────────────────────────────────────────────────────────────────────────
  function measure() {
    const r = stage.getBoundingClientRect();
    const W = Math.max(1, Math.round(r.width));
    const H = Math.max(1, Math.round(r.height));
    const w3 = split ? Math.max(1, Math.round(W * split)) : W;
    sizes = { W, H, w: w3, h: H, sw: W - w3, px: stageFontPx(W) };
    root.style.setProperty('--s3d-px', `${sizes.px}px`);
    host.style.width = `${w3}px`;
    if (sheetHost) sheetHost.style.width = `${W - w3}px`;
    compact = w3 < 640;
    syncButtons();
  }

  // ── three.js start-up ──────────────────────────────────────────────────────────────────────────
  async function init() {
    try {
      const [three, orbit, css2d, k] = await Promise.all([
        import('/vendor/three/three.module.js'),
        import('/vendor/three/OrbitControls.js'),
        import('/vendor/three/CSS2DRenderer.js'),
        import('/vendor/katex/katex.mjs').catch(() => null),
      ]);
      if (destroyed) return;
      T = three;
      Orbit = orbit.OrbitControls;
      CSS2D = css2d;
      katex = k?.default ?? null;
      if (katex && !document.querySelector('link[href="/vendor/katex/katex.min.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/vendor/katex/katex.min.css';
        document.head.append(link);
      }
      try {
        renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'default' });
      } catch {
        throw new Error(NO_WEBGL);
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.prepend(renderer.domElement);
      labelRenderer = new CSS2D.CSS2DRenderer({ element: labelsHost });
      scene = new T.Scene();
      ambient = new T.AmbientLight(0xffffff, 2.1);
      keyLight = new T.DirectionalLight(0xffffff, 1.5);
      scene.add(ambient, keyLight, keyLight.target);
      persp = new T.PerspectiveCamera(FOV, 1, 0.01, 1000);
      ortho = new T.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
      camera = persp;
      controls = new Orbit(camera, renderer.domElement);
      controls.enableDamping = false;
      controls.screenSpacePanning = true;
      controls.rotateSpeed = 0.8;
      controls.addEventListener('change', render);
      stage.addEventListener('keydown', onKey);
      loading.remove();
      ready = true;
      measure();
      applySize();
      if (pending) {
        const p = pending;
        pending = null;
        build(p.snap, p.params, { snapView: true });
      }
    } catch (err) {
      if (destroyed) return;
      loading.textContent = 'The 3D view could not start.';
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  function applySize() {
    if (!ready) return;
    renderer.setSize(sizes.w, sizes.h);
    labelRenderer.setSize(sizes.w, sizes.h);
    persp.aspect = sizes.w / sizes.h;
    persp.updateProjectionMatrix();
    updateOrthoFrustum();
    if (sheetCanvas) {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      sheetCanvas.width = Math.max(1, Math.round(sizes.sw * dpr));
      sheetCanvas.height = Math.max(1, Math.round(sizes.h * dpr));
    }
  }

  function updateOrthoFrustum() {
    if (!fit || !ortho) return;
    const half = fit.radius * 1.1;
    const aspect = sizes.w / sizes.h;
    const hh = aspect >= 1 ? half : half / aspect;
    ortho.left = -hh * aspect;
    ortho.right = hh * aspect;
    ortho.top = hh;
    ortho.bottom = -hh;
    ortho.near = -fit.radius * 50;
    ortho.far = fit.radius * 50;
    ortho.updateProjectionMatrix();
  }

  function render() {
    if (!ready || destroyed) return;
    // Head light: from above and behind the camera, so whatever faces the viewer is lit.
    const offset = new T.Vector3(-0.4, 0.8, 0.3).applyQuaternion(camera.quaternion);
    keyLight.position.copy(camera.position).add(offset.multiplyScalar(fit ? fit.radius : 1));
    keyLight.target.position.copy(controls.target);
    keyLight.target.updateMatrixWorld();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────
  const toThree = (p) => (zUp ? new T.Vector3(p[0], p[2], -p[1]) : new T.Vector3(p[0], p[1], p[2]));

  function fitDistance(radius) {
    const v = (FOV * Math.PI) / 360;
    const aspect = sizes.w / sizes.h;
    const h = aspect >= 1 ? v : Math.atan(Math.tan(v) * aspect);
    return (radius * 1.08) / Math.sin(h);
  }

  function snapCamera(viewFrom) {
    const d = viewDirection(setup, viewFrom);
    const dir = toThree(d).normalize();
    const dist = fitDistance(fit.radius);
    controls.target.copy(fit.center);
    for (const cam of [persp, ortho]) {
      cam.position.copy(fit.center).addScaledVector(dir, dist);
      cam.zoom = 1;
      cam.lookAt(fit.center);
      cam.updateProjectionMatrix();
    }
    persp.near = Math.max(dist / 500, fit.radius / 1000);
    persp.far = dist * 20;
    persp.updateProjectionMatrix();
    updateOrthoFrustum();
    controls.update();
  }

  function setCamera(mode) {
    if (!ready) {
      cameraMode = mode;
      return;
    }
    if (mode === cameraMode && camera === (mode === 'orthographic' ? ortho : persp)) return;
    const from = camera;
    const to = mode === 'orthographic' ? ortho : persp;
    to.position.copy(from.position);
    to.quaternion.copy(from.quaternion);
    if (to === ortho) {
      // Same visible height at the target as the perspective view had.
      const dist = from.position.distanceTo(controls.target);
      const half = dist * Math.tan((FOV * Math.PI) / 360);
      const aspect = sizes.w / sizes.h;
      const hh = aspect >= 1 ? fit.radius * 1.1 : (fit.radius * 1.1) / aspect;
      ortho.zoom = hh / Math.max(half, 1e-9);
    } else {
      // Move to the distance that shows what the orthographic view showed.
      const dir = from.position.clone().sub(controls.target).normalize();
      const dist = fitDistance(fit.radius) / Math.max(ortho.zoom, 1e-6);
      persp.position.copy(controls.target).addScaledVector(dir, dist);
    }
    to.updateProjectionMatrix();
    camera = to;
    cameraMode = mode;
    controls.object = camera;
    controls.update();
    syncButtons();
    render();
  }

  function resetView() {
    if (!ready || !current) return;
    snapCamera(current.params.viewFrom);
    render();
  }

  function onKey(e) {
    if (!ready || e.target.closest?.('input, select, textarea, button')) return;
    const step = (15 * Math.PI) / 180;
    if (e.key === 'Home') {
      resetView();
      e.preventDefault();
      return;
    }
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const m = moves[e.key];
    if (!m || !controls.enableRotate) return;
    e.preventDefault();
    const offset = camera.position.clone().sub(controls.target);
    const sph = new T.Spherical().setFromVector3(offset);
    sph.theta += m[0];
    sph.phi = Math.min(Math.PI - 0.01, Math.max(0.01, sph.phi - m[1]));
    offset.setFromSpherical(sph);
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
    render();
  }

  // ── scene building ─────────────────────────────────────────────────────────────────────────────
  function disposeContent() {
    if (!content) return;
    content.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    });
    scene.remove(content); // CSS2D labels remove their own elements when removed from the scene
    content = null;
  }

  function build(snap, params, opts = {}) {
    current = { snap, params };
    pal = readPalette(stage);
    scene.background = new T.Color(pal.bg);
    const flat2d = setup === 'vectors' && params.dimension === '2d';
    controls.enableRotate = !flat2d;
    camBtn.hidden = flat2d;

    const b = boundsFor(snap, params);
    const center = new T.Vector3().addVectors(b.min, b.max).multiplyScalar(0.5);
    const radius = Math.max(1e-6, b.radius ?? b.max.clone().sub(b.min).length() / 2);
    const key = frameKeyFor(params);
    const first = !fit;
    const prev = fit;
    fit = { center, radius };
    if (first || opts.snapView || key !== frameKey || flat2d) snapCamera(flat2d ? 'top' : params.viewFrom);
    else if (prev && (radius > prev.radius * 1.35 || radius < prev.radius / 1.6 || center.distanceTo(prev.center) > prev.radius * 0.5)) {
      // The content grew, shrank or moved a lot: refit the distance, keep the direction.
      const dir = camera.position.clone().sub(controls.target).normalize();
      controls.target.copy(center);
      const dist = fitDistance(radius);
      persp.position.copy(center).addScaledVector(dir, dist);
      ortho.position.copy(persp.position);
      ortho.zoom = 1;
      persp.near = Math.max(dist / 500, radius / 1000);
      persp.far = dist * 20;
      persp.updateProjectionMatrix();
      updateOrthoFrustum();
      controls.update();
    } else updateOrthoFrustum();
    frameKey = key;
    // Camera mode from the params (the stage button updates the param too); 2D vectors are always orthographic.
    setCamera(flat2d ? 'orthographic' : params.camera);

    disposeContent();
    content = new T.Group();
    scene.add(content);
    const u = (2 * radius * 1.1) / Math.max(200, sizes.h); // world units per CSS pixel at the default fit
    const k = kit(content, u, params);
    const cardLines = [];
    try {
      if (setup === 'revolution') buildRevolution(k, snap, params, cardLines);
      else if (setup === 'trig3d') buildTrig(k, snap, params, cardLines);
      else if (setup === 'vectors') buildVectors(k, snap, params, cardLines);
      else if (setup === 'lines-spheres') buildLines(k, snap, params, cardLines);
      else if (setup === 'orthographic') buildOrtho(k, snap, params);
      else buildDescriptive(k, snap, params);
    } finally {
      setCard(cardLines);
      render();
      drawSheet();
    }
  }

  function frameKeyFor(p) {
    if (setup === 'revolution') return `${p.axis}`;
    if (setup === 'trig3d') return p.scene;
    if (setup === 'vectors') return p.dimension;
    if (setup === 'lines-spheres') return p.mode;
    if (setup === 'orthographic') return p.part;
    return p.feature;
  }

  function boundsFor(snap, p) {
    const pts = [];
    const push = (q) => {
      if (q && q.every(Number.isFinite)) pts.push(toThree(q));
    };
    if (setup === 'revolution') {
      if (snap.error || !snap.samples) {
        push([-1, -1, -1]);
        push([5, 5, 1]);
      } else {
        const R = Math.max(0.5, snap.maxRadius);
        // the solid, and the ruler for the axis of rotation just outside it
        if (snap.axis === 'x') {
          push([Math.min(0, snap.lo), -R * 1.3, -R]);
          push([Math.max(0, snap.hi), R, R]);
        } else {
          push([-R * 1.3, Math.min(0, snap.lo), -R]);
          push([R, Math.max(0, snap.hi), R]);
        }
      }
    } else if (setup === 'trig3d') {
      const s = snap;
      if (s.scene === 'tower') [s.O, s.T, s.A, s.B].forEach(push);
      else if (s.scene === 'pyramid') [...s.corners, s.V].forEach(push);
      else Object.values(s.v).forEach(push);
    } else if (setup === 'vectors') {
      const s = snap;
      // The axes run to La (see buildVectors), with their names just beyond: frame them.
      const La = vectorAxisLength(s);
      const r = La * (s.flat ? 1.12 : 1.2);
      return { min: new T.Vector3(-La, -La, -La), max: new T.Vector3(La, La, La), radius: r };
    } else if (setup === 'lines-spheres') {
      const s = snap;
      const extra = [s.a1, s.P];
      if (s.mode === 'sphere') {
        extra.push(add(s.c, [s.R, s.R, s.R]), sub(s.c, [s.R, s.R, s.R]));
      } else {
        extra.push(s.a2);
      }
      const L = Math.max(8, ...extra.filter((q) => q && q.every(Number.isFinite)).map((q) => Math.max(...q.map(Math.abs))));
      push([-L, -L, -L]);
      push([L, L, L]);
      return { min: new T.Vector3(-L, -L, -L), max: new T.Vector3(L, L, L), radius: L * 1.05 };
    } else if (setup === 'orthographic') {
      const s = snap;
      const big = Math.max(s.width, s.depth, s.height);
      // the part and the tails of the FRONT, TOP and RIGHT arrows
      push([0, 0, 0]);
      push([s.width, s.depth, s.height]);
      push([s.width / 2, -big * 0.75, s.height / 2]);
      push([s.width / 2, s.depth / 2, s.height + big * 0.7]);
      push([s.width + big * 0.75, s.depth / 2, s.height / 2]);
    } else {
      const s = snap;
      if (s.feature === 'line') {
        push([0, 0, 0]);
        push(s.A);
        push(s.B);
        push([Math.max(s.A[0], s.B[0]) * 1.15 + 5, Math.max(s.A[1], s.B[1]) * 1.15 + 5, Math.max(s.A[2], s.B[2]) * 1.15 + 5]);
      } else {
        push([0, 0, 0]);
        push([s.part.W, s.part.D, s.part.H]);
      }
    }
    const box = new T.Box3().setFromPoints(pts);
    // Room for the labels beside points near the edge of a narrow split view.
    const extra = setup === 'descriptive' ? 1.2 : 1;
    return { min: box.min, max: box.max, radius: (box.max.clone().sub(box.min).length() / 2) * extra };
  }

  function vectorAxisLength(s) {
    const pts = [s.a, s.b, s.result].filter((q) => q && q.every(Number.isFinite));
    return Math.max(3, Math.ceil(Math.max(0, ...pts.map((q) => Math.max(...q.map(Math.abs))))) + 1);
  }

  // ── drawing kit (three.js) ─────────────────────────────────────────────────────────────────────
  function kit(group, u, params) {
    const V = toThree;
    const Y = new T.Vector3(0, 1, 0);
    const col = (c) => new T.Color(c);
    const basic = (c, opacity = 1) => new T.MeshBasicMaterial({ color: col(c), transparent: opacity < 1, opacity, side: T.DoubleSide, depthWrite: opacity >= 1 });
    const lambert = (c, opacity = 1, flat = false) => new T.MeshLambertMaterial({ color: col(c), transparent: opacity < 1, opacity, side: T.DoubleSide, depthWrite: opacity >= 1, flatShading: flat });
    const add3 = (o) => {
      group.add(o);
      return o;
    };
    function cylinder(A, B, r, mat) {
      const d = new T.Vector3().subVectors(B, A);
      const L = d.length();
      if (L < 1e-9) return null;
      const m = new T.Mesh(new T.CylinderGeometry(r, r, L, 10, 1, false), mat);
      m.position.copy(A).addScaledVector(d, 0.5);
      m.quaternion.setFromUnitVectors(Y, d.normalize());
      return add3(m);
    }
    /** A line of `width` CSS px (a thin cylinder), optionally dashed. Model coordinates. */
    function line(a, b, { colour = pal.ink, width = 2, dashed = false, opacity = 1, dash = 10, gap = 7 } = {}) {
      const A = V(a);
      const B = V(b);
      const mat = basic(colour, opacity);
      const r = (width / 2) * u;
      if (!dashed) return cylinder(A, B, r, mat);
      const d = new T.Vector3().subVectors(B, A);
      const L = d.length();
      const dl = dash * u;
      const gl = gap * u;
      for (let s = 0; s < L - 1e-9; s += dl + gl) {
        const e = Math.min(L, s + dl);
        cylinder(A.clone().addScaledVector(d, s / L), A.clone().addScaledVector(d, e / L), r, mat);
      }
      return null;
    }
    function polyline(points, opts = {}) {
      for (let i = 0; i + 1 < points.length; i++) line(points[i], points[i + 1], opts);
    }
    /** Smooth tube along points (arcs). */
    function tube(points, { colour = pal.ink, width = 2.5 } = {}) {
      if (points.length < 2) return;
      const curve = new T.CatmullRomCurve3(points.map(V));
      add3(new T.Mesh(new T.TubeGeometry(curve, Math.max(8, points.length * 2), (width / 2) * u, 8, false), basic(colour)));
    }
    function arrow(a, b, { colour = pal.ink, width = 3, head = 18, dashed = false } = {}) {
      const A = V(a);
      const B = V(b);
      const d = new T.Vector3().subVectors(B, A);
      const L = d.length();
      if (L < 1e-9) return;
      const h = Math.min(head * u, L * 0.45);
      const dir = d.clone().normalize();
      const neck = B.clone().addScaledVector(dir, -h);
      const mat = basic(colour);
      if (dashed) {
        const back = (p) => (zUp ? [p.x, -p.z, p.y] : [p.x, p.y, p.z]);
        line(a, back(neck), { colour, width, dashed: true });
      } else cylinder(A, neck, (width / 2) * u, mat);
      const cone = new T.Mesh(new T.ConeGeometry(h * 0.42, h, 18), mat);
      cone.position.copy(neck).addScaledVector(dir, h / 2);
      cone.quaternion.setFromUnitVectors(Y, dir);
      add3(cone);
    }
    function sphere(p, rpx, colour, opacity = 1) {
      const m = new T.Mesh(new T.SphereGeometry(rpx * u, 18, 12), basic(colour, opacity));
      m.position.copy(V(p));
      return add3(m);
    }
    function diamond(p, rpx, colour) {
      const m = new T.Mesh(new T.OctahedronGeometry(rpx * u), basic(colour));
      m.position.copy(V(p));
      return add3(m);
    }
    function cube(p, rpx, colour) {
      const s = 2 * rpx * u;
      const m = new T.Mesh(new T.BoxGeometry(s, s, s), basic(colour));
      m.position.copy(V(p));
      return add3(m);
    }
    /** Flat convex polygon (model coordinates). `onTop` draws it over a coplanar face without z-fighting. */
    function fill(points, colour, opacity = 0.2, { onTop = false } = {}) {
      const pos = [];
      for (let i = 1; i + 1 < points.length; i++) pos.push(...V(points[0]).toArray(), ...V(points[i]).toArray(), ...V(points[i + 1]).toArray());
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      const mat = basic(colour, opacity);
      if (onTop) Object.assign(mat, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
      return add3(new T.Mesh(g, mat));
    }
    /** Solid flat faces, lit (Lambert), from triangles in model coordinates. */
    function faces(tris, colour, opacity = 1) {
      const pos = [];
      for (const t of tris) for (const p of t) pos.push(...V(p).toArray());
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      return add3(new T.Mesh(g, lambert(colour, opacity, true)));
    }
    /** Arc for the angle at vertex P from direction e1 towards e2 (model vectors), radius in world units. */
    function angleArc(P, e1, e2, radius, opts = {}) {
      const a = normalize(e1);
      let b = sub(normalize(e2), scale(a, dot(normalize(e2), a)));
      if (length(b) < 1e-9) return null;
      b = normalize(b);
      const theta = Math.atan2(length(cross(a, normalize(e2))), dot(a, normalize(e2)));
      const pts = [];
      const n = Math.max(6, Math.ceil(theta / 0.08));
      for (let i = 0; i <= n; i++) {
        const t = (theta * i) / n;
        pts.push(add(P, add(scale(a, radius * Math.cos(t)), scale(b, radius * Math.sin(t)))));
      }
      tube(pts, opts);
      const mid = theta / 2;
      return add(P, add(scale(a, radius * 1.35 * Math.cos(mid)), scale(b, radius * 1.35 * Math.sin(mid))));
    }
    function rightAngle(P, e1, e2, size, opts = {}) {
      const a = scale(normalize(e1), size);
      const b = scale(normalize(e2), size);
      polyline([add(P, a), add(add(P, a), b), add(P, b)], { width: 1.5, ...opts });
    }
    const ANCHOR = { c: [0.5, 0.5], n: [0.5, 1], s: [0.5, 0], e: [0, 0.5], w: [1, 0.5], ne: [0, 1], nw: [1, 1], se: [0, 0], sw: [1, 0] };
    /** A CSS2D label at a model point. `html` must be built from trusted pieces (use esc() for text). */
    function label(p, html, { at = 'c', cls = '' } = {}) {
      if (!p || !p.every(Number.isFinite)) return null;
      const el = document.createElement('div');
      el.className = `s3d-tag is-${at} ${cls}`;
      const span = document.createElement('span');
      span.innerHTML = html;
      el.append(span);
      const obj = new CSS2D.CSS2DObject(el);
      obj.position.copy(V(p));
      obj.center.set(...(ANCHOR[at] ?? ANCHOR.c));
      return add3(obj);
    }
    /** Axes through the origin with ticks every `step` and named ends. */
    function axes({ L, step, names = ['x', 'y', 'z'], show = [true, true, true], ticks = true, colour = pal.axis, neg = [L, L, L], noTicks = [], tickSide = [], tickAt = [] }) {
      const unit = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      unit.forEach((e, k) => {
        if (!show[k]) return;
        const len = Array.isArray(L) ? L[k] : L;
        const back = Array.isArray(neg) ? neg[k] : neg;
        line(scale(e, -back), scale(e, len), { colour, width: 1.5 });
        arrow(scale(e, len * 0.97), scale(e, len * 1.06), { colour, width: 1.5, head: 14 });
        label(scale(e, len * 1.1), esc(names[k]), { cls: 'is-axis' });
        if (!ticks || !step || noTicks[k]) return;
        // tick labels sit beside the axis, away from the others
        const side = tickSide[k] ?? (k === 2 ? (zUp ? [1, -1, 0] : [1, 0, 0]) : zUp ? [0, 0, -1] : k === 0 ? [0, -1, 0] : [-1, 0, 0]);
        const off = scale(normalize(side), 10 * u);
        for (let t = -Math.floor(back / step) * step; t <= len * 0.92 + 1e-9; t += step) {
          if (Math.abs(t) < 1e-9) continue;
          const p = scale(e, t);
          line(sub(p, scale(normalize(side), 4 * u)), add(p, scale(normalize(side), 4 * u)), { colour, width: 1.5 });
          label(add(p, off), esc(plain(t).replace('-', '−')), { cls: 'is-tick', at: tickAt[k] ?? (k === 2 ? 'e' : 'c') });
        }
      });
    }
    function grid(size, divisions, opacity = 0.9) {
      const g = new T.GridHelper(size, divisions, col(pal.grid), col(pal.grid));
      g.material.transparent = true;
      g.material.opacity = opacity;
      g.material.depthWrite = false;
      if (!zUp) g.rotation.x = Math.PI / 2;
      return add3(g);
    }
    const s = pal.series;
    return { V, u, basic, lambert, line, polyline, tube, arrow, sphere, diamond, cube, fill, faces, angleArc, rightAngle, label, axes, grid, add3, colours: { orange: s[0], blue: s[1], green: s[2], pink: s[3], ink: pal.ink, axis: pal.axis, muted: pal.muted, grid: pal.grid }, showLabels: params.showLabels !== false };
  }

  function niceStep(L, target = 6) {
    const raw = L / target;
    const mag = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 5, 10].map((m) => m * mag).find((x) => x >= raw) ?? 10 * mag;
  }

  // ── revolution ─────────────────────────────────────────────────────────────────────────────────
  function buildRevolution(k, r, p, card) {
    const { orange, ink, axis } = k.colours;
    const v = r.axis === 'y' ? 'y' : 'x';
    const other = v === 'x' ? 'y' : 'x';
    const R = r.samples ? Math.max(0.5, r.maxRadius || 0.5) : 4;
    const lo = Number.isFinite(r.lo) ? r.lo : Math.min(p.lower, p.upper);
    const hi = Number.isFinite(r.hi) ? r.hi : Math.max(p.lower, p.upper);
    const span = Math.max(Math.abs(lo), Math.abs(hi), R, 1);
    const step = niceStep(span * 1.2);
    // Axes: the axis of rotation runs past the region; the other axis covers the radius.
    const along = [Math.max(hi, 0) + span * 0.25, R * 1.3, R * 1.1];
    const back = [Math.max(-lo, 0) + span * 0.15, R * 1.3, R * 1.1];
    const L = v === 'x' ? along : [R * 1.3, Math.max(hi, 0) + span * 0.25, R * 1.1];
    const N = v === 'x' ? back : [R * 1.3, Math.max(-lo, 0) + span * 0.15, R * 1.1];
    // The axis of rotation runs through the solid, so its scale is drawn as a ruler just outside it.
    const ax = v === 'x' ? 0 : 1;
    k.axes({ L, neg: N, step, names: ['x', 'y', 'z'], show: [true, true, true], colour: axis, noTicks: ax === 0 ? [true, false, true] : [false, true, true] });
    const at = (s, rad, phi) => (v === 'x' ? [s, rad * Math.cos(phi), rad * Math.sin(phi)] : [rad * Math.cos(phi), s, rad * Math.sin(phi)]);
    {
      // ruler: along the axis of rotation, offset below (x-axis) or to the left (y-axis) of the solid
      const off = R * 1.18;
      const base = (s) => (v === 'x' ? [s, -off, 0] : [-off, s, 0]);
      const r0 = Math.min(0, lo);
      const r1 = Math.max(0, hi);
      k.line(base(r0), base(r1), { colour: axis, width: 1.5 });
      const tickDir = v === 'x' ? [0, -1, 0] : [-1, 0, 0];
      for (let t = Math.ceil(r0 / step) * step; t <= r1 + 1e-9; t += step) {
        const q = base(t);
        k.line(q, add(q, scale(tickDir, 6 * k.u)), { colour: axis, width: 1.5 });
        k.label(add(q, scale(tickDir, 9 * k.u)), esc(plain(t).replace('-', '−')), { cls: 'is-tick', at: v === 'x' ? 's' : 'w' });
      }
      k.label(base(r1), `${v} scale`, { cls: 'is-muted', at: v === 'x' ? 'e' : 'n' });
    }

    if (r.error) {
      card.push({ title: 'Solid of revolution' }, { error: r.error });
      return;
    }
    const sweep = (Math.max(0, Math.min(360, p.sweep)) * Math.PI) / 180;
    const samples = r.samples;

    // The plane region between the curve and the axis (z = 0), with its outline.
    const strip = [];
    for (let i = 0; i + 1 < samples.length; i++) {
      const [s0, f0] = samples[i];
      const [s1, f1] = samples[i + 1];
      strip.push([at(s0, 0, 0), at(s0, f0, 0), at(s1, f1, 0)], [at(s0, 0, 0), at(s1, f1, 0), at(s1, 0, 0)]);
    }
    const regionMat = k.basic(orange, 0.28);
    const rg = new T.BufferGeometry();
    rg.setAttribute('position', new T.Float32BufferAttribute(strip.flat().flatMap((q) => k.V(q).toArray()), 3));
    k.add3(new T.Mesh(rg, regionMat));
    k.polyline(samples.map(([s, f]) => at(s, f, 0)), { colour: orange, width: 3.5 });
    k.line(at(lo, 0, 0), at(lo, samples[0][1], 0), { colour: orange, width: 2.5 });
    k.line(at(hi, 0, 0), at(hi, samples[samples.length - 1][1], 0), { colour: orange, width: 2.5 });

    // The swept solid: a lathe of the curve, closed with the end discs.
    const ring = Math.max(2, Math.ceil((64 * sweep) / (2 * Math.PI)));
    if (p.showSolid && sweep > 1e-6) {
      const pos = [];
      const prof = samples.map(([s, f]) => [s, f]);
      for (let i = 0; i + 1 < prof.length; i++) {
        for (let j = 0; j < ring; j++) {
          const a0 = (sweep * j) / ring;
          const a1 = (sweep * (j + 1)) / ring;
          const q00 = at(prof[i][0], prof[i][1], a0);
          const q01 = at(prof[i][0], prof[i][1], a1);
          const q10 = at(prof[i + 1][0], prof[i + 1][1], a0);
          const q11 = at(prof[i + 1][0], prof[i + 1][1], a1);
          pos.push(q00, q10, q11, q00, q11, q01);
        }
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos.flatMap((q) => k.V(q).toArray()), 3));
      g.computeVertexNormals();
      const grey = p.showDiscs;
      k.add3(new T.Mesh(g, k.lambert(grey ? pal.grid : orange, grey ? 0.38 : 0.55)));
      // fine grid lines on the surface: a few profile copies and rings
      const meridians = Math.max(1, Math.round(ring / 8));
      for (let j = 0; j <= ring; j += meridians) {
        const a = (sweep * j) / ring;
        const pts = prof.filter((_, i) => i % 4 === 0 || i === prof.length - 1).map(([s, f]) => at(s, f, a));
        for (let i = 0; i + 1 < pts.length; i++) k.line(pts[i], pts[i + 1], { colour: axis, width: 1, opacity: 0.45 });
      }
    }

    // Discs: lathes of rectangles, opaque, with dark rims.
    if (p.showDiscs && sweep > 1e-6) {
      const pos = [];
      const rims = [];
      const steps = Math.max(2, Math.ceil((48 * sweep) / (2 * Math.PI)));
      for (const d of r.slices) {
        const rad = Math.abs(d.r);
        if (!(rad > 0)) continue;
        for (let j = 0; j < steps; j++) {
          const a0 = (sweep * j) / steps;
          const a1 = (sweep * (j + 1)) / steps;
          // outer wall
          pos.push(at(d.s0, rad, a0), at(d.s1, rad, a0), at(d.s1, rad, a1), at(d.s0, rad, a0), at(d.s1, rad, a1), at(d.s0, rad, a1));
          // the two flat faces
          for (const s of [d.s0, d.s1]) pos.push(at(s, 0, 0), at(s, rad, a0), at(s, rad, a1));
        }
        if (sweep < 2 * Math.PI - 1e-6) {
          for (const a of [0, sweep]) pos.push(at(d.s0, 0, a), at(d.s0, rad, a), at(d.s1, rad, a), at(d.s0, 0, a), at(d.s1, rad, a), at(d.s1, 0, a));
        }
        for (const s of [d.s0, d.s1]) {
          const rim = [];
          for (let j = 0; j <= steps; j++) rim.push(at(s, rad, (sweep * j) / steps));
          rims.push(rim);
        }
      }
      if (pos.length) {
        const g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(pos.flatMap((q) => k.V(q).toArray()), 3));
        g.computeVertexNormals();
        k.add3(new T.Mesh(g, k.lambert(orange, 1, true)));
        const rimPos = [];
        for (const rim of rims) for (let i = 0; i + 1 < rim.length; i++) rimPos.push(...k.V(rim[i]).toArray(), ...k.V(rim[i + 1]).toArray());
        const lg = new T.BufferGeometry();
        lg.setAttribute('position', new T.Float32BufferAttribute(rimPos, 3));
        k.add3(new T.LineSegments(lg, new T.LineBasicMaterial({ color: new T.Color(ink), transparent: true, opacity: 0.75 })));
      }
    }

    // Axis of rotation: thicker and dashed, labelled.
    const ext = span * 0.2;
    k.line(at(lo - ext, 0, 0), at(hi + ext, 0, 0), { colour: ink, width: 3, dashed: true });
    if (k.showLabels) {
      k.label(at(lo - ext, 0, 0), 'axis of rotation', { at: v === 'x' ? 'w' : 's', cls: 'is-muted' });
      const mid = samples[Math.floor(samples.length * 0.62)];
      const fx = v === 'x' ? 'y' : 'x';
      if (r.tex) k.label(at(mid[0], mid[1], 0), `${fx} = ${esc(p.f)}`, { at: v === 'x' ? 'ne' : 'e', cls: 'is-accent is-strong' });
      // one representative disc
      if (p.showDiscs && r.slices.length) {
        const d = r.slices[Math.floor(r.slices.length * 0.7)];
        if (Number.isFinite(d.r)) k.label(at(d.s, Math.abs(d.r), Math.min(sweep, Math.PI / 2)), `disc: π r² Δ${v}`, { at: 'ne', cls: 'is-muted' });
      }
    }

    // Integral card.
    const dv = `\\,d${v}`;
    const f2 = r.tex ? `\\left(${r.tex}\\right)^{2}` : `${other}^{2}`;
    card.push({ title: 'Volume by discs' });
    card.push({ tex: `V = \\pi\\int_{${tp(r.lo)}}^{${tp(r.hi)}} ${other}^{2}${dv} = \\pi\\int_{${tp(r.lo)}}^{${tp(r.hi)}} ${f2}${dv}` });
    card.push({ tex: `\\phantom{V} \\approx ${tn(r.volume, 5)} = ${tn(r.volumeOverPi, 5)}\\,\\pi` });
    card.push({ tex: `\\sum_{i=1}^{${r.n}} \\pi r_i^{2}\\,\\Delta ${v} \\approx ${tn(r.discSum, 5)} \\quad (\\Delta ${v} = ${tn(r.discWidth, 3)},\\ \\text{${p.discRule}})` });
    card.push({ note: `Disc sum − volume = ${ln(r.discError)}` });
  }

  // ── trig3d ─────────────────────────────────────────────────────────────────────────────────────
  function buildTrig(k, s, p, card) {
    const { orange, blue, ink, axis, muted } = k.colours;
    const L = k.showLabels;
    const m = (x) => `${ln(x, 4)} m`; // computed lengths
    const mi = (x) => `${plain(x)} m`; // lengths as entered
    const deg = (x) => `${ln(x, 4)}°`;
    const size = Math.max(...(s.scene === 'tower' ? [s.distA, s.distB, s.h] : s.scene === 'pyramid' ? [s.s, s.h] : [s.l, s.w, s.h]));
    const arcR = size * 0.12;
    const ground = (half, cx = 0, cy = 0) => {
      k.fill([[cx - half, cy - half, 0], [cx + half, cy - half, 0], [cx + half, cy + half, 0], [cx - half, cy + half, 0]], pal.grid, 0.35);
      const g = k.grid(half * 2, 10, 0.8);
      g.position.copy(k.V([cx, cy, -size * 0.001]));
      // north arrow
      const na = [cx + half * 0.82, cy + half * 0.55, 0];
      k.arrow(na, add(na, [0, half * 0.3, 0]), { colour: ink, width: 2.5, head: 16 });
      k.label(add(na, [0, half * 0.36, 0]), 'N', { cls: 'is-strong' });
    };
    if (s.scene === 'tower') {
      const { O, T: top, A, B } = s;
      const half = Math.max(s.distA, s.distB) * 1.15;
      ground(half);
      // tower
      k.line(O, top, { colour: ink, width: 5 });
      k.fill([[-arcR * 0.15, -arcR * 0.15, 0], [arcR * 0.15, -arcR * 0.15, 0], [arcR * 0.15, arcR * 0.15, 0], [-arcR * 0.15, arcR * 0.15, 0]], ink, 1);
      // ground lines and AB
      k.line(O, A, { colour: ink, width: 2 });
      k.line(O, B, { colour: ink, width: 2 });
      k.line(A, B, { colour: ink, width: 2.5 });
      // lines of sight (dashed)
      k.line(A, top, { colour: orange, width: 2.5, dashed: true });
      k.line(B, top, { colour: blue, width: 2.5, dashed: true });
      if (p.showTriangles) {
        k.fill([A, O, top], orange, 0.15);
        k.fill([B, O, top], blue, 0.15);
      }
      const ra = arcR * 0.35;
      k.rightAngle(O, sub(A, O), [0, 0, 1], ra, { colour: muted });
      k.rightAngle(O, sub(B, O), [0, 0, 1], ra, { colour: muted });
      const la = k.angleArc(A, sub(O, A), sub(top, A), arcR, { colour: orange });
      const lb = k.angleArc(B, sub(O, B), sub(top, B), arcR, { colour: blue });
      const lo = k.angleArc(O, sub(A, O), sub(B, O), arcR * 0.8, { colour: muted, width: 2 });
      k.sphere(A, 7, orange);
      k.cube(B, 6, blue);
      if (L) {
        k.label(A, '<span class="s3d-mark is-ring"></span>A', { at: 'sw', cls: 'is-accent is-strong' });
        k.label(B, '<span class="s3d-mark"></span>B', { at: 'se', cls: 'is-blue is-strong' });
        k.label(top, 'T', { at: 'n', cls: 'is-strong' });
        k.label(O, 'O', { at: 'sw', cls: 'is-strong' });
        k.label([0, 0, s.h * 0.55], `h = ${mi(s.h)}`, { at: 'e' });
        k.label(scale(A, 0.5), mi(s.distA), { at: 's', cls: 'is-mono' });
        k.label(scale(B, 0.5), mi(s.distB), { at: 's', cls: 'is-mono' });
        k.label(scale(add(A, B), 0.5), `AB = ${m(s.distAB)}`, { at: 's', cls: 'is-mono' });
        if (la) k.label(la, deg(s.elevA), { at: 'w', cls: 'is-accent is-mono' });
        if (lb) k.label(lb, deg(s.elevB), { at: 'e', cls: 'is-blue is-mono' });
        if (lo) k.label(lo, deg(s.baseAngle), { at: 'c', cls: 'is-muted is-mono' });
      }
      card.push({ title: 'Tower' });
      card.push({ tex: `\\tan\\theta_A = \\dfrac{h}{OA} = \\dfrac{${tp(s.h)}}{${tp(s.distA)}} \\;\\Rightarrow\\; \\theta_A = ${tn(s.elevA)}^{\\circ}` });
      card.push({ tex: `\\tan\\theta_B = \\dfrac{h}{OB} = \\dfrac{${tp(s.h)}}{${tp(s.distB)}} \\;\\Rightarrow\\; \\theta_B = ${tn(s.elevB)}^{\\circ}` });
      card.push({ tex: `AB^2 = OA^2 + OB^2 - 2\\,OA\\cdot OB\\cos ${tn(s.baseAngle)}^{\\circ} \\;\\Rightarrow\\; AB = ${tn(s.distAB)}\\ \\text{m}` });
      return;
    }
    if (s.scene === 'cuboid' || s.scene === 'ramp') {
      const v = s.v;
      const half = Math.max(s.l, s.w) * 0.95;
      ground(half, s.l / 2, s.w / 2);
      if (s.scene === 'cuboid') {
        const { A, B, C, D, E, F, G, H } = v;
        k.faces([[A, B, F], [A, F, E], [B, C, G], [B, G, F], [E, F, G], [E, G, H], [A, E, H], [A, H, D], [D, H, G], [D, G, C]], pal.panel, 0.25);
        for (const [a, b] of [[A, B], [B, C], [C, D], [D, A], [E, F], [F, G], [G, H], [H, E], [A, E], [B, F], [C, G], [D, H]]) k.line(a, b, { colour: ink, width: 2 });
        k.line(A, C, { colour: blue, width: 3 });
        k.line(A, G, { colour: orange, width: 4 });
        if (p.showTriangles) k.fill([A, C, G], orange, 0.15);
        k.rightAngle(C, sub(A, C), [0, 0, 1], size * 0.06, { colour: muted });
        const la = k.angleArc(A, sub(C, A), sub(G, A), size * 0.18, { colour: orange });
        if (L) {
          for (const [n, q, at] of [['A', A, 'sw'], ['B', B, 's'], ['C', C, 'se'], ['D', D, 'w'], ['E', E, 'nw'], ['F', F, 'n'], ['G', G, 'ne'], ['H', H, 'n']]) k.label(q, n, { at, cls: 'is-strong' });
          k.label(scale(add(A, B), 0.5), mi(s.l), { at: 's', cls: 'is-mono' });
          k.label(scale(add(B, C), 0.5), mi(s.w), { at: 'e', cls: 'is-mono' });
          k.label(scale(add(C, G), 0.5), mi(s.h), { at: 'e', cls: 'is-mono' });
          k.label(scale(add(A, C), 0.5), `AC = ${m(s.faceDiagonal)}`, { at: 's', cls: 'is-blue is-mono' });
          k.label(scale(add(A, G), 0.55), `AG = ${m(s.spaceDiagonal)}`, { at: 'nw', cls: 'is-accent is-mono' });
          if (la) k.label(la, `θ = ${deg(s.diagonalAngle)}`, { at: 'e', cls: 'is-accent is-mono' });
        }
        card.push({ title: 'Cuboid' });
        card.push({ tex: `AC = \\sqrt{${tp(s.l)}^2 + ${tp(s.w)}^2} = ${tn(s.faceDiagonal)},\\quad AG = \\sqrt{AC^2 + ${tp(s.h)}^2} = ${tn(s.spaceDiagonal)}` });
        card.push({ tex: `\\tan\\theta = \\dfrac{CG}{AC} = \\dfrac{${tp(s.h)}}{${tn(s.faceDiagonal)}} \\;\\Rightarrow\\; \\theta = ${tn(s.diagonalAngle)}^{\\circ}` });
        return;
      }
      const { A, B, C, D, E, F } = v;
      k.faces([[A, D, F], [A, F, E], [B, C, F], [B, F, E], [A, B, E], [D, C, F]], orange, 0.22);
      for (const [a, b] of [[A, B], [B, C], [C, D], [D, A], [E, F], [B, E], [C, F], [A, E], [D, F]]) k.line(a, b, { colour: ink, width: 2 });
      k.line(A, E, { colour: blue, width: 3.5 });
      k.line(A, C, { colour: muted, width: 2.5, dashed: true });
      k.line(A, F, { colour: orange, width: 4 });
      if (p.showTriangles) {
        k.fill([A, C, F], orange, 0.15);
        k.fill([A, B, E], blue, 0.12);
      }
      k.rightAngle(C, sub(A, C), [0, 0, 1], size * 0.06, { colour: muted });
      const ls = k.angleArc(A, sub(B, A), sub(E, A), size * 0.2, { colour: blue });
      const ld = k.angleArc(A, sub(C, A), sub(F, A), size * 0.14, { colour: orange });
      if (L) {
        for (const [n, q, at] of [['A', A, 'sw'], ['B', B, 's'], ['C', C, 'se'], ['D', D, 'w'], ['E', E, 'n'], ['F', F, 'ne']]) k.label(q, n, { at, cls: 'is-strong' });
        k.label(scale(add(A, B), 0.5), mi(s.l), { at: 's', cls: 'is-mono' });
        k.label(scale(add(B, C), 0.5), mi(s.w), { at: 'e', cls: 'is-mono' });
        k.label(scale(add(C, F), 0.5), mi(s.h), { at: 'e', cls: 'is-mono' });
        k.label(scale(add(A, F), 0.6), `AF = ${m(s.spaceDiagonal)}`, { at: 'nw', cls: 'is-accent is-mono' });
        if (ls) k.label(ls, `slope ${deg(s.slopeAngle)}`, { at: 's', cls: 'is-blue is-mono' });
        if (ld) k.label(ld, `${deg(s.diagonalAngle)}`, { at: 'e', cls: 'is-accent is-mono' });
      }
      card.push({ title: 'Ramp' });
      card.push({ tex: `\\text{slope: } \\tan\\alpha = \\dfrac{BE}{AB} = \\dfrac{${tp(s.h)}}{${tp(s.l)}} \\;\\Rightarrow\\; \\alpha = ${tn(s.slopeAngle)}^{\\circ}` });
      card.push({ tex: `\\text{diagonal AF: } \\tan\\beta = \\dfrac{CF}{AC} = \\dfrac{${tp(s.h)}}{${tn(s.faceDiagonal)}} \\;\\Rightarrow\\; \\beta = ${tn(s.diagonalAngle)}^{\\circ}` });
      return;
    }
    // pyramid
    const { V: apex, M: mid, N, K, corners } = s;
    ground(s.s * 0.95);
    const tris = [];
    for (let i = 0; i < 4; i++) tris.push([corners[i], corners[(i + 1) % 4], apex]);
    k.faces(tris, orange, 0.2);
    for (let i = 0; i < 4; i++) {
      k.line(corners[i], corners[(i + 1) % 4], { colour: ink, width: 2 });
      k.line(corners[i], apex, { colour: ink, width: 2 });
    }
    k.line(mid, apex, { colour: muted, width: 2.5, dashed: true });
    k.line(mid, N, { colour: muted, width: 2, dashed: true });
    k.line(mid, K, { colour: muted, width: 2, dashed: true });
    k.line(N, apex, { colour: orange, width: 4 });
    k.line(K, apex, { colour: blue, width: 4 });
    if (p.showTriangles) {
      k.fill([mid, N, apex], orange, 0.18);
      k.fill([mid, K, apex], blue, 0.15);
    }
    k.rightAngle(mid, sub(N, mid), [0, 0, 1], size * 0.05, { colour: muted });
    k.rightAngle(mid, sub(K, mid), [0, 0, 1], size * 0.05, { colour: muted });
    const lf = k.angleArc(N, sub(mid, N), sub(apex, N), size * 0.12, { colour: orange });
    const le = k.angleArc(K, sub(mid, K), sub(apex, K), size * 0.12, { colour: blue });
    if (L) {
      k.label(apex, 'V', { at: 'n', cls: 'is-strong' });
      k.label(mid, 'M', { at: 'nw', cls: 'is-strong' });
      k.label(N, 'E', { at: 's', cls: 'is-strong' }); // midpoint of an edge (N is the north arrow)
      k.label(K, 'K', { at: 'se', cls: 'is-strong' });
      k.label(scale(add(mid, apex), 0.5), `h = ${mi(s.h)}`, { at: 'w', cls: 'is-mono' });
      k.label(scale(add(corners[0], N), 0.5), `s = ${mi(s.s)}`, { at: 's', cls: 'is-mono' });
      k.label(scale(add(N, apex), 0.5), `${m(s.slantHeight)}`, { at: 'w', cls: 'is-accent is-mono' });
      k.label(scale(add(K, apex), 0.5), `${m(s.slantEdge)}`, { at: 'e', cls: 'is-blue is-mono' });
      if (lf) k.label(lf, deg(s.faceAngle), { at: 'w', cls: 'is-accent is-mono' });
      if (le) k.label(le, deg(s.edgeAngle), { at: 'e', cls: 'is-blue is-mono' });
    }
    card.push({ title: 'Square pyramid' });
    card.push({ tex: `\\text{face: } \\tan\\alpha = \\dfrac{h}{s/2} = \\dfrac{${tp(s.h)}}{${tp(s.s / 2)}} \\;\\Rightarrow\\; \\alpha = ${tn(s.faceAngle)}^{\\circ}` });
    card.push({ tex: `\\text{edge: } \\tan\\beta = \\dfrac{h}{s/\\sqrt{2}} \\;\\Rightarrow\\; \\beta = ${tn(s.edgeAngle)}^{\\circ}` });
  }

  // ── vectors ────────────────────────────────────────────────────────────────────────────────────
  function buildVectors(k, s, p, card) {
    const { orange, blue, ink, axis, muted, green } = k.colours;
    const L = vectorAxisLength(s);
    const step = L > 12 ? 2 : 1;
    // Seen from above in 2D, tick labels sit beside each axis in the plane (below x, left of y).
    k.axes({ L, step, show: [true, true, !s.flat], colour: axis, tickSide: s.flat ? [[0, -1, 0], [-1, 0, 0]] : [], tickAt: s.flat ? ['s', 'w'] : [] });
    k.grid(2 * L, 2 * L, 0.7);
    const show = k.showLabels;
    const name = (n) => `<b>${n}</b>`;
    const comp = (q) => `(${(s.flat ? q.slice(0, 2) : q).map((x) => plain(x).replace('-', '−')).join(', ')})`;
    const guides = (q, colour) => {
      if (!p.showComponents || !q.every(Number.isFinite)) return;
      const foot = [q[0], q[1], 0];
      const o = { colour, width: 1.5, dashed: true, opacity: 0.8 };
      if (!s.flat && Math.abs(q[2]) > 1e-9) k.line(q, foot, o);
      if (Math.abs(q[0]) > 1e-9 && Math.abs(q[1]) > 1e-9) {
        k.line(foot, [q[0], 0, 0], o);
        k.line(foot, [0, q[1], 0], o);
      }
    };
    const O = [0, 0, 0];
    guides(s.a, orange);
    guides(s.b, blue);
    k.arrow(O, s.a, { colour: orange, width: 3.5 });
    k.arrow(O, s.b, { colour: blue, width: 3.5 });
    if (show) {
      k.label(s.a, `${name('a')} = ${comp(s.a)}`, { at: 'ne', cls: 'is-accent is-strong' });
      k.label(s.b, `${name('b')} = ${comp(s.b)}`, { at: 'se', cls: 'is-blue is-strong' });
    }
    const op = s.operation;
    const r = s.result;
    const T3 = (q) => (s.flat ? q.slice(0, 2) : q);
    const tcomp = (q) => `(${T3(q).map(tp).join(',\\ ')})`;
    if (op === 'add' && r) {
      k.arrow(s.a, r, { colour: blue, width: 2.5, dashed: true });
      k.line(s.b, r, { colour: orange, width: 1.5, dashed: true, opacity: 0.7 });
      k.arrow(O, r, { colour: ink, width: 5 });
      if (show) k.label(r, `${name('a + b')} = ${comp(r)}`, { at: 'n', cls: 'is-strong' });
      card.push({ title: 'Adding: head to tail' });
      card.push({ tex: `\\mathbf{a}+\\mathbf{b} = ${tcomp(s.a)} + ${tcomp(s.b)} = ${tcomp(r)}` });
      card.push({ tex: `|\\mathbf{a}+\\mathbf{b}| = ${tn(length(r))} \\le |\\mathbf{a}| + |\\mathbf{b}| = ${tn(s.magA + s.magB)}` });
    } else if (op === 'subtract' && r) {
      k.arrow(s.b, s.a, { colour: ink, width: 3, dashed: true });
      k.arrow(O, r, { colour: ink, width: 5 });
      if (show) k.label(r, `${name('a − b')} = ${comp(r)}`, { at: 'n', cls: 'is-strong' });
      card.push({ title: 'Subtracting' });
      card.push({ tex: `\\mathbf{a}-\\mathbf{b} = ${tcomp(s.a)} - ${tcomp(s.b)} = ${tcomp(r)}` });
      card.push({ note: 'The dashed arrow from the tip of b to the tip of a is the same vector.' });
    } else if (op === 'scale' && r) {
      k.arrow(O, r, { colour: ink, width: 5 });
      if (show) k.label(r, `${esc(plain(s.scalar).replace('-', '−'))}${name('a')} = ${comp(r)}`, { at: 'n', cls: 'is-strong' });
      card.push({ title: 'Scaling' });
      card.push({ tex: `k\\mathbf{a} = ${tp(s.scalar)}${tcomp(s.a)} = ${tcomp(r)},\\quad |k\\mathbf{a}| = |k|\\,|\\mathbf{a}| = ${tn(length(r))}` });
    } else if (op === 'project' && r) {
      if (r.every(Number.isFinite)) {
        // the line of b, extended, the projection, and the perpendicular from a's tip
        const bh = normalize(s.b);
        const ext = Math.max(length(s.b), length(r)) * 1.15;
        k.line(scale(bh, -ext * 0.3), scale(bh, ext), { colour: blue, width: 1.5, opacity: 0.5 });
        k.line(s.a, r, { colour: muted, width: 2, dashed: true });
        if (length(sub(s.a, r)) > 1e-6 && length(r) > 1e-6) k.rightAngle(r, sub(s.a, r), scale(r, -1), Math.min(length(r), length(sub(s.a, r))) * 0.15, { colour: muted });
        k.arrow(O, r, { colour: ink, width: 5 });
        if (show) k.label(r, `proj = ${comp(r)}`, { at: 's', cls: 'is-strong' });
      }
      card.push({ title: 'Projection of a on b' });
      card.push({ tex: `\\text{proj}_{\\mathbf{b}}\\mathbf{a} = \\dfrac{\\mathbf{a}\\cdot\\mathbf{b}}{|\\mathbf{b}|^{2}}\\,\\mathbf{b} = \\dfrac{${tn(s.dot)}}{${tn(s.magB ** 2)}}${tcomp(s.b)} = ${r.every(Number.isFinite) ? tcomp(r.map((x) => Number(x.toPrecision(4)))) : '\\text{undefined}'}` });
    } else {
      const arcPt = Number.isFinite(s.angle) ? k.angleArc(O, s.a, s.b, Math.min(length(s.a), length(s.b)) * 0.35, { colour: green, width: 2.5 }) : null;
      if (show && arcPt) k.label(arcPt, `θ = ${fmt(s.angle, 4)}°`, { cls: 'is-green is-mono' });
      const terms = T3(s.a).map((x, i) => `(${tp(x)})(${tp(T3(s.b)[i])})`).join(' + ');
      card.push({ title: 'Scalar (dot) product' });
      card.push({ tex: `\\mathbf{a}\\cdot\\mathbf{b} = ${terms} = ${tn(s.dot)}` });
      card.push({ tex: `\\cos\\theta = \\dfrac{\\mathbf{a}\\cdot\\mathbf{b}}{|\\mathbf{a}|\\,|\\mathbf{b}|} = \\dfrac{${tn(s.dot)}}{${tn(s.magA)} \\times ${tn(s.magB)}} \\;\\Rightarrow\\; \\theta = ${Number.isFinite(s.angle) ? `${tn(s.angle)}^{\\circ}` : '\\text{undefined}'}` });
      if (Math.abs(s.dot) < 1e-12 && Number.isFinite(s.angle)) card.push({ note: 'a · b = 0, so a and b are perpendicular.' });
    }
    if (!(s.magA > 0) || !(s.magB > 0)) card.push({ error: 'A zero vector has no direction, so the angle and the projection are undefined.' });
  }

  // ── lines and spheres ──────────────────────────────────────────────────────────────────────────
  function buildLines(k, s, p, card) {
    const { orange, ink, axis, muted, blue } = k.colours;
    const bound = Math.max(8, Math.ceil(Math.max(...[s.a1, s.P, s.mode === 'sphere' ? s.c : s.a2].filter((q) => q && q.every(Number.isFinite)).map((q) => Math.max(...q.map(Math.abs))))));
    k.axes({ L: bound, step: bound > 12 ? 4 : 2, colour: axis });
    k.grid(2 * bound, bound, 0.6);
    const show = k.showLabels;
    const col = (q) => `\\begin{pmatrix}${q.map(tp).join('\\\\')}\\end{pmatrix}`;
    const coord = (q) => `(${q.map((x) => ln(x)).join(', ')})`;
    const drawLine = (a, u, opts) => {
      if (!(length(u) > 0)) return;
      const t = clipLine(a, u, -10, 10);
      if (!t) return;
      k.line(add(a, scale(u, t[0])), add(a, scale(u, t[1])), opts);
    };
    drawLine(s.a1, s.u, { colour: orange, width: 3.5 });
    k.sphere(s.a1, 6, orange);
    if (length(s.u) > 0) k.arrow(s.a1, add(s.a1, s.u), { colour: orange, width: 3, head: 16 });
    if (show) {
      k.label(s.a1, 'A₁', { at: 'nw', cls: 'is-accent is-strong' });
      if (length(s.u) > 0) k.label(add(s.a1, s.u), '<b>u</b>', { at: 'ne', cls: 'is-accent' });
    }
    // moving point P
    if (length(s.u) > 0) {
      const inside = s.mode === 'sphere' && s.pCentreDistance <= s.R + 1e-9;
      k.sphere(s.P, 6.5, orange, inside ? 1 : 0.25);
      k.line([0, 0, 0], s.P, { colour: muted, width: 1.5, dashed: true });
      if (show) k.label(s.P, `<span class="s3d-mark ${inside ? 'is-dot' : 'is-ring'}"></span>P ${coord(s.P)}`, { at: 'se', cls: 'is-accent is-mono' });
    }
    card.length = 0;
    if (s.zeroDir) {
      card.push({ title: 'No line' }, { error: "A direction vector can't be zero." });
      return;
    }
    if (s.mode === 'sphere') {
      const S = s.sphere;
      // translucent sphere with a ring facing the camera and an equator
      const m = new T.Mesh(new T.SphereGeometry(s.R, 48, 32), k.lambert(blue, 0.18));
      m.position.copy(k.V(s.c));
      k.add3(m);
      const eq = [];
      for (let i = 0; i <= 96; i++) eq.push(add(s.c, [s.R * Math.cos((i * Math.PI) / 48), s.R * Math.sin((i * Math.PI) / 48), 0]));
      k.polyline(eq, { colour: blue, width: 1.5, opacity: 0.6 });
      const ring = facingRing(s.c, s.R, k, blue);
      k.add3(ring);
      k.sphere(s.c, 5, blue);
      if (show) k.label(s.c, 'C', { at: 'se', cls: 'is-blue is-strong' });
      for (const [i, q] of S.points.entries()) {
        k.diamond(q, 9, ink);
        if (show) k.label(q, `${S.hits === 1 ? 'tangent, ' : ''}λ = ${ln(i === 0 ? S.lambda1 : S.lambda2)} ${coord(q)}`, { at: i === 0 ? 'nw' : 'ne', cls: 'is-mono is-strong' });
      }
      const verdict = S.hits === 2 ? 'Meets the sphere twice' : S.hits === 1 ? 'Touches the sphere (tangent)' : 'Misses the sphere';
      card.push({ title: verdict, verdict: true });
      card.push({ tex: `\\mathbf{r} = ${col(s.a1)} + \\lambda${col(s.u)},\\quad |\\mathbf{r} - ${col(s.c)}| = ${tp(s.R)}` });
      card.push({ tex: `${tn(S.A)}\\lambda^{2} ${S.B < 0 ? '-' : '+'} ${tn(Math.abs(S.B))}\\lambda ${S.C < 0 ? '-' : '+'} ${tn(Math.abs(S.C))} = 0,\\quad \\Delta = ${tn(S.discriminant)}` });
      card.push({ note: `Distance from C to the line: ${fmt(S.centreDistance, 3)}. |P − C| = ${fmt(s.pCentreDistance, 3)}.` });
      return;
    }
    // two lines
    drawLine(s.a2, s.v, { colour: ink, width: 3, dashed: true });
    k.sphere(s.a2, 6, ink);
    if (length(s.v) > 0) k.arrow(s.a2, add(s.a2, s.v), { colour: ink, width: 3, head: 16 });
    if (show) {
      k.label(s.a2, 'A₂', { at: 'nw', cls: 'is-strong' });
      if (length(s.v) > 0) k.label(add(s.a2, s.v), '<b>v</b>', { at: 'ne' });
    }
    const Lr = s.lines;
    if (Lr.relation === RELATION.intersecting) {
      k.diamond(Lr.point, 10, ink);
      if (show) k.label(Lr.point, `<span class="s3d-mark is-diamond"></span>${coord(Lr.point)}`, { at: 'e', cls: 'is-mono is-strong' });
    }
    if (p.showClosest && (Lr.relation === RELATION.skew || Lr.relation === RELATION.parallel)) {
      k.line(Lr.closest1, Lr.closest2, { colour: muted, width: 2.5, dashed: true, dash: 4, gap: 5 });
      k.sphere(Lr.closest1, 4, muted);
      k.sphere(Lr.closest2, 4, muted);
      if (show) k.label(scale(add(Lr.closest1, Lr.closest2), 0.5), `d = ${fmt(Lr.distance, 3)}`, { at: 'e', cls: 'is-mono' });
    }
    const verdicts = {
      intersecting: [`Intersecting at ${coord(Lr.point ?? [NaN, NaN, NaN])}`, `u is not a multiple of v, and λ = ${ln(Lr.lambda)}, μ = ${ln(Lr.mu)} satisfy all three equations.`],
      parallel: ['Parallel', `v is a multiple of u, and A₂ is not on line 1: the lines are ${fmt(Lr.distance, 3)} apart.`],
      coincident: ['Coincident', 'v is a multiple of u, and A₂ lies on line 1: the same line written twice.'],
      skew: ['Skew', `u is not a multiple of v, and the three equations for λ and μ are inconsistent. Closest distance ${fmt(Lr.distance, 3)}.`],
      invalid: ['No line', "A direction vector can't be zero."],
    }[Lr.kind];
    card.push({ title: verdicts[0], verdict: true });
    card.push({ note: verdicts[1] });
    card.push({ tex: `\\mathbf{r}_1 = ${col(s.a1)} + \\lambda${col(s.u)},\\quad \\mathbf{r}_2 = ${col(s.a2)} + \\mu${col(s.v)}` });
  }

  /** A circle of radius R around c in the plane facing the camera (redrawn as the camera turns). */
  function facingRing(c, R, k, colour) {
    const pts = [];
    for (let i = 0; i <= 96; i++) pts.push(new T.Vector3(Math.cos((i * Math.PI) / 48), Math.sin((i * Math.PI) / 48), 0));
    const g = new T.BufferGeometry().setFromPoints(pts);
    const ring = new T.Line(g, new T.LineBasicMaterial({ color: new T.Color(colour) }));
    ring.position.copy(k.V(c));
    ring.scale.setScalar(R);
    ring.onBeforeRender = (_r, _s, cam) => {
      ring.quaternion.copy(cam.quaternion);
      ring.updateMatrixWorld();
    };
    return ring;
  }

  // ── orthographic ───────────────────────────────────────────────────────────────────────────────
  function partMesh(k, part, colour, opacity = 1) {
    let geo;
    if (part.holes.length) {
      // Plan shape with circular holes, extruded upwards.
      const shape = new T.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(part.W, 0);
      shape.lineTo(part.W, part.D);
      shape.lineTo(0, part.D);
      shape.closePath();
      for (const h of part.holes) {
        const hole = new T.Path();
        hole.absarc(h.cx, h.cy, h.r, 0, Math.PI * 2, true);
        shape.holes.push(hole);
      }
      const H = Math.max(...part.profile.map((q) => q[1]));
      geo = new T.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false, curveSegments: 48 });
      geo.rotateX(-Math.PI / 2); // (x, y, z) → (x, z, −y): model y becomes −z, extrusion goes up
    } else {
      const shape = new T.Shape(part.profile.map(([x, z]) => new T.Vector2(x, z)));
      geo = new T.ExtrudeGeometry(shape, { depth: part.D, bevelEnabled: false });
      geo.translate(0, 0, -part.D); // model y from 0 (front) to D (back) is three.js z from 0 to −D
    }
    const mesh = new T.Mesh(geo, k.lambert(colour, opacity));
    k.add3(mesh);
    const edges = new T.LineSegments(new T.EdgesGeometry(geo, 25), new T.LineBasicMaterial({ color: new T.Color(pal.ink) }));
    k.add3(edges);
    return mesh;
  }

  function buildOrtho(k, s, p) {
    const { orange, axis, blue } = k.colours;
    const { W, D } = s.part;
    const H = s.height;
    partMesh(k, s.part, orange);
    const big = Math.max(W, D, H);
    // viewing directions
    const arrows = [
      ['FRONT', [W / 2, -big * 0.75, H / 2], [W / 2, -big * 0.12, H / 2]],
      ['TOP', [W / 2, D / 2, H + big * 0.7], [W / 2, D / 2, H + big * 0.12]],
      ['RIGHT', [W + big * 0.75, D / 2, H / 2], [W + big * 0.12, D / 2, H / 2]],
    ];
    for (const [name, from, to] of arrows) {
      k.arrow(from, to, { colour: blue, width: 3, head: 18 });
      if (k.showLabels) k.label(from, name, { at: name === 'TOP' ? 'n' : name === 'FRONT' ? 's' : 'e', cls: 'is-blue is-strong' });
    }
    // small axes at the origin corner
    const a = big * 0.15;
    k.axes({ L: [W + a, D + a, H + a], neg: 0, ticks: false, names: ['x', 'y', 'z'], colour: axis });
  }

  // ── descriptive ────────────────────────────────────────────────────────────────────────────────
  function buildDescriptive(k, s) {
    const { orange, ink, axis, blue, muted } = k.colours;
    if (s.feature === 'face') {
      partMesh(k, s.part, pal.panel, 1);
      k.fill(s.face, orange, 1, { onTop: true });
      for (let i = 0; i < 4; i++) k.line(s.face[i], s.face[(i + 1) % 4], { colour: orange, width: 3.5 });
      const c = scale(s.face.reduce((acc, q) => add(acc, q), [0, 0, 0]), 0.25);
      if (k.showLabels) k.label(c, 'sloping face', { at: 'ne', cls: 'is-accent is-strong' });
      const big = Math.max(s.part.W, s.part.D, s.part.H);
      k.axes({ L: [s.part.W + big * 0.3, s.part.D + big * 0.3, s.part.H + big * 0.3], neg: 0, ticks: false, colour: axis });
      return;
    }
    const { A, B } = s;
    // horizontal plane (z = 0) and frontal plane (y = 0), faint
    const X = Math.max(A[0], B[0]) * 1.15 + 5;
    const Yd = Math.max(A[1], B[1]) * 1.15 + 5;
    const Z = Math.max(A[2], B[2]) * 1.15 + 5;
    k.fill([[0, 0, 0], [X, 0, 0], [X, Yd, 0], [0, Yd, 0]], pal.grid, 0.45);
    k.fill([[0, 0, 0], [X, 0, 0], [X, 0, Z], [0, 0, Z]], blue, 0.08);
    k.axes({ L: [X * 1.05, Yd * 1.05, Z * 1.05], neg: 0, ticks: false, colour: axis });
    // projections of A and B onto the two planes
    for (const P of [A, B]) {
      k.line(P, [P[0], P[1], 0], { colour: muted, width: 1.5, dashed: true });
      k.line(P, [P[0], 0, P[2]], { colour: muted, width: 1.5, dashed: true });
    }
    k.line([A[0], A[1], 0], [B[0], B[1], 0], { colour: muted, width: 2 });
    k.line([A[0], 0, A[2]], [B[0], 0, B[2]], { colour: muted, width: 2 });
    k.line(A, B, { colour: orange, width: 4.5 });
    k.sphere(A, 6, ink);
    k.sphere(B, 6, ink);
    if (k.showLabels) {
      // a narrow split view only has room for the letters
      const roomy = sizes.w >= 400;
      k.label(A, roomy ? `A (${A.map(plain).join(', ')})` : 'A', { at: 'nw', cls: 'is-strong is-mono' });
      k.label(B, roomy ? `B (${B.map(plain).join(', ')})` : 'B', { at: 'ne', cls: 'is-strong is-mono' });
      if (roomy) k.label(scale(add(A, B), 0.5), `TL ${ln(s.trueLength, 4)} mm`, { at: 'nw', cls: 'is-accent is-mono' });
    }
  }

  // ── card (KaTeX) ───────────────────────────────────────────────────────────────────────────────
  function setCard(lines) {
    card.replaceChildren();
    for (const l of lines) {
      const div = document.createElement('div');
      if (l.title) {
        div.className = `s3d-card__title${l.verdict ? ' is-verdict' : ''}`;
        div.textContent = l.title;
      } else if (l.error) {
        div.className = 's3d-card__error';
        div.textContent = l.error;
      } else if (l.note) {
        div.className = 's3d-card__note';
        div.textContent = l.note;
      } else if (l.tex) {
        div.className = 's3d-card__line';
        if (katex) div.innerHTML = katex.renderToString(l.tex, { throwOnError: false, output: 'html', strict: 'ignore' });
        else div.textContent = l.tex;
      }
      card.append(div);
    }
  }

  // ── drawing sheets (Canvas 2D) ─────────────────────────────────────────────────────────────────
  function drawSheet() {
    if (!sheetCanvas || !current) return;
    const ctx = sheetCanvas.getContext('2d');
    const dpr = sheetCanvas.width / Math.max(1, sizes.sw);
    const W = sizes.sw;
    const H = sizes.h;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = pal.panel;
    ctx.fillRect(0, 0, W, H);
    sheetHits = [];
    if (W < 40 || H < 40) return;
    // Sheet text: the stage size (≥ 18 px on a projector), smaller only when the sheet itself is narrow.
    sheetPx = Math.max(10, Math.min(sizes.px, Math.round(W / 30)));
    if (setup === 'orthographic') drawOrthoSheet(ctx, W, H, current.snap, current.params);
    else drawDescriptiveSheet(ctx, W, H, current.snap, current.params);
  }

  function pen(ctx, { colour = pal.ink, width = 1, dash = [] } = {}) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.lineCap = 'butt';
  }

  function seg(ctx, a, b) {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }

  /** Sheet text. With `maxWidth`, the size steps down (to 9 px at least) until the text fits. */
  function text(ctx, str, x, y, { px = sheetPx, kind = 'label', colour = pal.ink, align = 'center', baseline = 'middle', maxWidth = Infinity } = {}) {
    let size = px;
    ctx.font = font(kind, size);
    while (size > 9 && ctx.measureText(str).width > maxWidth) {
      size -= 1;
      ctx.font = font(kind, size);
    }
    ctx.fillStyle = colour;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(str, x, y);
  }

  function arrowHead(ctx, tip, dir, size, colour) {
    const L = Math.hypot(dir[0], dir[1]) || 1;
    const ux = dir[0] / L;
    const uy = dir[1] / L;
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(tip[0], tip[1]);
    ctx.lineTo(tip[0] - ux * size - uy * size * 0.35, tip[1] - uy * size + ux * size * 0.35);
    ctx.lineTo(tip[0] - ux * size + uy * size * 0.35, tip[1] - uy * size - ux * size * 0.35);
    ctx.closePath();
    ctx.fill();
  }

  /** Dimension between two sheet points with extension lines offset by `off` (px, along normal). */
  function dimension(ctx, a, b, off, label, colour) {
    const d = [b[0] - a[0], b[1] - a[1]];
    const L = Math.hypot(d[0], d[1]);
    if (L < 4) return;
    const n = [-d[1] / L, d[0] / L];
    const A = [a[0] + n[0] * off, a[1] + n[1] * off];
    const B = [b[0] + n[0] * off, b[1] + n[1] * off];
    const sgn = Math.sign(off) || 1;
    pen(ctx, { colour, width: 1 });
    seg(ctx, [a[0] + n[0] * 3 * sgn, a[1] + n[1] * 3 * sgn], [A[0] + n[0] * 5 * sgn, A[1] + n[1] * 5 * sgn]);
    seg(ctx, [b[0] + n[0] * 3 * sgn, b[1] + n[1] * 3 * sgn], [B[0] + n[0] * 5 * sgn, B[1] + n[1] * 5 * sgn]);
    seg(ctx, A, B);
    arrowHead(ctx, A, [A[0] - B[0], A[1] - B[1]], 9, colour);
    arrowHead(ctx, B, [B[0] - A[0], B[1] - A[1]], 9, colour);
    const mx = (A[0] + B[0]) / 2;
    const my = (A[1] + B[1]) / 2;
    ctx.font = font('mono', sheetPx);
    const w = ctx.measureText(label).width;
    ctx.fillStyle = pal.panel;
    ctx.fillRect(mx - w / 2 - 3, my - sheetPx / 2 - 2, w + 6, sheetPx + 4);
    text(ctx, label, mx, my, { kind: 'mono', colour });
  }

  function projectionSymbol(ctx, x, y, size, method) {
    // Truncated cone: side view (trapezoid, large end left) and end view (two circles).
    const Dd = size;
    const d = size / 2;
    const len = size * 0.9;
    const gap = size * 0.45;
    const trap = (x0) => {
      pen(ctx, { colour: pal.ink, width: 1.75 });
      ctx.beginPath();
      ctx.moveTo(x0, y - Dd / 2);
      ctx.lineTo(x0 + len, y - d / 2);
      ctx.lineTo(x0 + len, y + d / 2);
      ctx.lineTo(x0, y + Dd / 2);
      ctx.closePath();
      ctx.stroke();
    };
    const circles = (cx) => {
      pen(ctx, { colour: pal.ink, width: 1.75 });
      for (const r of [Dd / 2, d / 2]) {
        ctx.beginPath();
        ctx.arc(cx, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    };
    if (method === 'first') {
      circles(x + Dd / 2);
      trap(x + Dd + gap);
    } else {
      trap(x);
      circles(x + len + gap + Dd / 2);
    }
    pen(ctx, { colour: pal.ink, width: 1, dash: [10, 3, 2, 3] });
    seg(ctx, [x - 4, y], [x + len + gap + Dd + 4, y]);
    ctx.setLineDash([]);
    return len + gap + Dd;
  }

  function drawOrthoSheet(ctx, W, H, s, p) {
    const px = sheetPx;
    const w = s.width;
    const d = s.depth;
    const h = s.height;
    const g = Math.max(14, 0.32 * Math.max(w, d, h));
    const top = s.placement.top;
    const side = s.placement.side;
    // view origins in sheet millimetres (v up)
    const O = {
      front: [0, 0],
      top: [0, top > 0 ? h + g : -g - d],
      right: [side > 0 ? w + g : -g - d, 0],
    };
    const dimGap = p.showDimensions ? 12 : 0;
    const u0 = Math.min(0, O.right[0]) - (p.showDimensions && side > 0 ? dimGap : 0);
    const u1 = Math.max(w, O.right[0] + d) + (p.showDimensions && side < 0 ? dimGap : 0);
    const v0 = Math.min(0, O.top[1]) - (p.showDimensions ? dimGap : 0);
    const v1 = Math.max(h, O.top[1] + d);
    const block = px * 3.4;
    const pad = Math.max(12, px * 0.9);
    const titleRoom = px * 2.2;
    const k = Math.min((W - 2 * pad) / (u1 - u0), (H - 2 * pad - block - titleRoom * 1.4) / (v1 - v0));
    const ox = pad + ((W - 2 * pad) - (u1 - u0) * k) / 2 - u0 * k;
    const oy = pad + titleRoom * 0.2 + (v1 * k);
    const S = (o, q) => [ox + (o[0] + q[0]) * k, oy - (o[1] + q[1]) * k];

    // frame
    pen(ctx, { colour: pal.axis, width: 1 });
    ctx.strokeRect(6.5, 6.5, W - 13, H - 13);

    const views = [
      ['front', 'FRONT VIEW', [w, h]],
      ['top', 'TOP VIEW', [w, d]],
      ['right', 'RIGHT VIEW', [d, h]],
    ];
    const key = `${s.key}|${s.method}|${p.challenge}`;
    if (key !== revealKey) {
      revealed = new Set();
      revealKey = key;
    }
    const lineW = Math.max(2, Math.min(3.2, k * 0.08 + 1.4));

    // projectors (thin, light) between views
    if (p.showProjectors && !p.challenge) {
      pen(ctx, { colour: pal.grid, width: 1 });
      const fx = new Set();
      const fz = new Set();
      const ty = new Set();
      // From the ends of feature edges only (not every side of a hole's 64-gon), plus each hole's sides.
      const minLen = 0.03 * Math.max(w, d, h);
      const isFeature = (l) => Math.hypot(l.b[0] - l.a[0], l.b[1] - l.a[1]) > minLen;
      const r6 = (x) => Math.round(x * 1e6) / 1e6;
      for (const l of s.views.front.lines.filter(isFeature)) for (const q of [l.a, l.b]) {
        fx.add(r6(q[0]));
        fz.add(r6(q[1]));
      }
      for (const l of s.views.top.lines.filter(isFeature)) for (const q of [l.a, l.b]) ty.add(r6(q[1]));
      for (const hole of s.part.holes) {
        fx.add(r6(hole.cx - hole.r)).add(r6(hole.cx + hole.r));
        ty.add(r6(hole.cy - hole.r)).add(r6(hole.cy + hole.r));
      }
      for (const x of fx) seg(ctx, S(O.front, [x, top > 0 ? h : 0]), S(O.top, [x, top > 0 ? 0 : d]));
      for (const z of fz) seg(ctx, S(O.front, [side > 0 ? w : 0, z]), S(O.right, [side > 0 ? 0 : d, z]));
      // top ↔ right through a 45° mitre line
      const mit = (y) => [O.right[0] + y, O.top[1] + y];
      for (const y of ty) {
        const m = mit(y);
        seg(ctx, S(O.top, [top > 0 ? w : 0, y]), S([0, 0], m));
        seg(ctx, S([0, 0], m), S(O.right, [y, side > 0 ? h : 0]));
      }
      pen(ctx, { colour: pal.axis, width: 1 });
      seg(ctx, S([0, 0], mit(-d * 0.1)), S([0, 0], mit(d * 1.1)));
    }

    for (const [name, title, [vw, vh]] of views) {
      const o = O[name];
      const V = s.views[name];
      const hidden = p.challenge && !revealed.has(name);
      const a = S(o, [0, vh]);
      const b = S(o, [vw, 0]);
      sheetHits.push({ name, x0: a[0] - 10, y0: a[1] - 10, x1: b[0] + 10, y1: b[1] + 10 });
      if (hidden) {
        pen(ctx, { colour: pal.axis, width: 1.5, dash: [6, 5] });
        ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
        ctx.setLineDash([]);
        text(ctx, '?', (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - px * 0.6, { px: px * 2, kind: 'strong', colour: pal.accentText });
        text(ctx, 'Click to check', (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + px * 0.9, { colour: pal.muted });
      } else {
        if (p.showHidden) {
          pen(ctx, { colour: pal.ink, width: Math.max(1.25, lineW * 0.5), dash: [8, 4] });
          for (const l of V.lines) if (l.hidden) seg(ctx, S(o, l.a), S(o, l.b));
        }
        pen(ctx, { colour: pal.ink, width: 1.1, dash: [14, 3, 3, 3] });
        for (const c of V.centres) seg(ctx, S(o, c.a), S(o, c.b));
        pen(ctx, { colour: pal.ink, width: lineW });
        ctx.lineCap = 'square';
        for (const l of V.lines) if (!l.hidden) seg(ctx, S(o, l.a), S(o, l.b));
        ctx.setLineDash([]);
      }
      // title under the view
      const below = S(o, [vw / 2, 0]);
      const dimBelow = p.showDimensions && ((name === 'front' && top > 0) || (name === 'top' && top < 0) || name === 'right');
      text(ctx, title, below[0], below[1] + (dimBelow ? dimGap * k + px * 0.9 : px * 0.9), { kind: 'strong', colour: pal.muted, px, maxWidth: (vw + g * 0.9) * k });
    }

    if (p.showDimensions) {
      const dc = pal.muted;
      const off = dimGap * k * 0.62;
      const wView = top > 0 ? 'front' : 'top';
      dimension(ctx, S(O[wView], [0, 0]), S(O[wView], [w, 0]), off, formatPlain(w), dc);
      // height: on the side of the front view away from the right view
      if (side > 0) dimension(ctx, S(O.front, [0, h]), S(O.front, [0, 0]), off, formatPlain(h), dc);
      else dimension(ctx, S(O.front, [w, 0]), S(O.front, [w, h]), off, formatPlain(h), dc);
      dimension(ctx, S(O.right, [0, 0]), S(O.right, [d, 0]), off, formatPlain(d), dc);
    }

    // title block
    const by = H - pad - block * 0.55;
    const sym = projectionSymbol(ctx, pad + 6, by, px * 1.6, s.method);
    const room = W - (pad + 6 + sym + px) - pad;
    text(ctx, s.method === 'first' ? 'FIRST-ANGLE PROJECTION' : 'THIRD-ANGLE PROJECTION', pad + 6 + sym + px, by - px * 0.6, { align: 'left', kind: 'strong', px, maxWidth: room });
    text(ctx, `${s.part.label.toUpperCase()} · DIMENSIONS IN mm · NOT TO SCALE`, pad + 6 + sym + px, by + px * 0.65, { align: 'left', colour: pal.muted, px, maxWidth: room });
  }

  function drawDescriptiveSheet(ctx, W, H, s, p) {
    const px = sheetPx;
    const { orange, blue } = { orange: pal.series[0], blue: pal.series[1] };
    // gather every sheet point to fit
    let pts;
    if (s.feature === 'line') pts = [s.front.A, s.front.B, s.top.A, s.top.B, s.aux.A, s.aux.B, ...s.aux.fold, [s.front.A[0], 0], [s.front.B[0], 0]];
    else pts = [...s.front.profile, ...s.top.outline, ...s.aux.face, ...s.aux.fold];
    const xs = pts.map((q) => q[0]);
    const ys = pts.map((q) => q[1]);
    // room around the views for the true-length labels written beside the auxiliary view
    const pad = Math.max(14, px) + (s.feature === 'line' ? px * 2.6 : px);
    let u0 = Math.min(...xs) - 12;
    let u1 = Math.max(...xs) + 12;
    let v0 = Math.min(...ys) - 12;
    let v1 = Math.max(...ys) + 12;
    const k = Math.min((W - 2 * pad) / (u1 - u0), (H - 2 * pad - px * 1.6) / (v1 - v0));
    const ox = pad + (W - 2 * pad - (u1 - u0) * k) / 2 - u0 * k;
    const oy = pad + px * 1.6 + (H - 2 * pad - px * 1.6 - (v1 - v0) * k) / 2 + v1 * k;
    const S = (q) => [ox + q[0] * k, oy - q[1] * k];
    pen(ctx, { colour: pal.axis, width: 1 });
    ctx.strokeRect(6.5, 6.5, W - 13, H - 13);
    const thick = Math.max(2, Math.min(3, k * 0.06 + 1.5));
    /** Fold line from a to b (sheet mm) labelled near | far at its end; nFar points towards the far view. */
    const foldLine = (a, b, near, far, nFar) => {
      pen(ctx, { colour: pal.ink, width: 1.25, dash: [16, 4, 3, 4] });
      seg(ctx, S(a), S(b));
      ctx.setLineDash([]);
      const e = S(b);
      const o = [nFar[0] * px * 0.85, -nFar[1] * px * 0.85];
      text(ctx, near, e[0] - o[0], e[1] - o[1], { kind: 'strong', colour: pal.muted });
      text(ctx, far, e[0] + o[0], e[1] + o[1], { kind: 'strong', colour: pal.muted });
    };
    const dot2 = (q, colour = pal.ink) => {
      const P = S(q);
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.arc(P[0], P[1], 4, 0, Math.PI * 2);
      ctx.fill();
    };
    const tag = (q, str, dx, dy, colour = pal.ink) => {
      const P = S(q);
      text(ctx, str, P[0] + dx, P[1] + dy, { kind: 'strong', colour });
    };
    if (s.feature === 'line') {
      const { front, top, aux } = s;
      // H/F fold line (v = 0)
      const fx0 = Math.min(front.A[0], front.B[0]) - 15;
      const fx1 = Math.max(front.A[0], front.B[0]) + 15;
      foldLine([fx0, 0], [fx1, 0], 'H', 'F', [0, -1]);
      if (p.showProjectors) {
        pen(ctx, { colour: pal.grid, width: 1.25 });
        seg(ctx, S(top.A), S(front.A));
        seg(ctx, S(top.B), S(front.B));
        seg(ctx, S(top.A), S(aux.A));
        seg(ctx, S(top.B), S(aux.B));
      }
      // H/1 fold line
      foldLine(aux.fold[0], aux.fold[1], 'H', '1', aux.normal);
      // views
      pen(ctx, { colour: pal.ink, width: thick });
      seg(ctx, S(front.A), S(front.B));
      seg(ctx, S(top.A), S(top.B));
      pen(ctx, { colour: orange, width: thick + 1.5 });
      seg(ctx, S(aux.A), S(aux.B));
      for (const q of [front.A, front.B, top.A, top.B]) dot2(q);
      dot2(aux.A, orange);
      dot2(aux.B, orange);
      if (p.showLabels !== false) {
        tag(front.A, 'A', -14, 12);
        tag(front.B, 'B', 14, 12);
        tag(top.A, 'A', -14, -12);
        tag(top.B, 'B', 14, -12);
        tag(aux.A, 'A₁', -16, -10, pal.accentText);
        tag(aux.B, 'B₁', 16, -10, pal.accentText);
        // transfer distances: the same in the front view and the auxiliary view
        const tc = blue;
        // front view: from the fold line H/F (v = 0) down to the point
        const markFront = (q, lab) => {
          const a = S([q[0], 0]);
          const b = S(q);
          pen(ctx, { colour: tc, width: 1.5 });
          seg(ctx, [a[0] + 10, a[1]], [b[0] + 10, b[1]]);
          text(ctx, lab, a[0] + 12 + px * 0.6, (a[1] + b[1]) / 2, { colour: tc, kind: 'mono', align: 'left' });
        };
        markFront(front.A, 'd₁');
        markFront(front.B, 'd₂');
        const n = aux.normal;
        const markAux = (q, d, lab) => {
          const foot = [q[0] - n[0] * d, q[1] - n[1] * d];
          const a = S(foot);
          const b = S(q);
          const t = [aux.dir[0] * 10, -aux.dir[1] * 10];
          pen(ctx, { colour: tc, width: 1.5 });
          seg(ctx, [a[0] + t[0], a[1] + t[1]], [b[0] + t[0], b[1] + t[1]]);
          text(ctx, lab, (a[0] + b[0]) / 2 + t[0] * 2.4, (a[1] + b[1]) / 2 + t[1] * 2.4, { colour: tc, kind: 'mono' });
        };
        markAux(aux.A, s.transfer[0], 'd₁');
        markAux(aux.B, s.transfer[1], 'd₂');
        const mid = S([(aux.A[0] + aux.B[0]) / 2, (aux.A[1] + aux.B[1]) / 2]);
        const nn = [aux.normal[0], -aux.normal[1]];
        text(ctx, `TRUE LENGTH ${ln(s.trueLength, 4)} mm`, mid[0] + nn[0] * px * 1.6, mid[1] + nn[1] * px * 1.6, { kind: 'strong', colour: pal.accentText, maxWidth: W - 2 * pad });
        text(ctx, `θ = ${ln(s.angleHP, 3)}° to the horizontal plane`, mid[0] + nn[0] * px * 2.9, mid[1] + nn[1] * px * 2.9, { colour: pal.accentText, maxWidth: W - 2 * pad });
      }
      text(ctx, 'TOP VIEW', S([Math.min(top.A[0], top.B[0]), 0])[0], S([0, Math.max(top.A[1], top.B[1])])[1] - px * 1.4, { kind: 'strong', colour: pal.muted, align: 'left', px });
      text(ctx, 'FRONT VIEW', S([Math.min(front.A[0], front.B[0]), 0])[0], S([0, Math.min(front.A[1], front.B[1])])[1] + px * 1.5, { kind: 'strong', colour: pal.muted, align: 'left', px });
      return;
    }
    // sloping face
    const { front, top, aux } = s;
    const xsF = front.profile.map((q) => q[0]);
    foldLine([Math.min(...xsF) - 12, 0], [Math.max(...xsF) + 12, 0], 'H', 'F', [0, -1]);
    if (p.showProjectors) {
      pen(ctx, { colour: pal.grid, width: 1.25 });
      for (let i = 0; i < 2; i++) seg(ctx, S(front.face[i]), S(top.face[i]));
      for (let i = 0; i < 4; i++) seg(ctx, S(front.face[i]), S(aux.face[i]));
    }
    foldLine(aux.fold[0], aux.fold[1], 'F', '1', aux.normal);
    // top view: outline, ridge, face shaded
    ctx.fillStyle = orange;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    top.face.forEach((q, i) => (i ? ctx.lineTo(...S(q)) : ctx.moveTo(...S(q))));
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    aux.face.forEach((q, i) => (i ? ctx.lineTo(...S(q)) : ctx.moveTo(...S(q))));
    ctx.closePath();
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
    pen(ctx, { colour: pal.ink, width: thick });
    ctx.beginPath();
    top.outline.forEach((q, i) => (i ? ctx.lineTo(...S(q)) : ctx.moveTo(...S(q))));
    ctx.closePath();
    ctx.stroke();
    seg(ctx, S(top.ridge[0]), S(top.ridge[1]));
    ctx.beginPath();
    front.profile.forEach((q, i) => (i ? ctx.lineTo(...S(q)) : ctx.moveTo(...S(q))));
    ctx.closePath();
    ctx.stroke();
    pen(ctx, { colour: orange, width: thick + 1.5 });
    seg(ctx, S(front.face[0]), S(front.face[1]));
    ctx.beginPath();
    aux.face.forEach((q, i) => (i ? ctx.lineTo(...S(q)) : ctx.moveTo(...S(q))));
    ctx.closePath();
    ctx.stroke();
    if (p.showLabels !== false) {
      const c = aux.face.reduce((acc, q) => [acc[0] + q[0] / 4, acc[1] + q[1] / 4], [0, 0]);
      const C = S(c);
      text(ctx, 'TRUE SHAPE', C[0], C[1] - px * 0.7, { kind: 'strong', colour: pal.accentText });
      text(ctx, `${ln(s.trueLength, 4)} × ${formatPlain(s.part.D)} mm`, C[0], C[1] + px * 0.7, { kind: 'mono', colour: pal.accentText });
      const tc = S([(top.face[0][0] + top.face[2][0]) / 2, (top.face[0][1] + top.face[2][1]) / 2]);
      text(ctx, `${ln(s.planLength, 3)} × ${formatPlain(s.part.D)}`, tc[0], tc[1], { kind: 'mono', colour: pal.ink, px });
      const fe = S([(front.face[0][0] + front.face[1][0]) / 2, (front.face[0][1] + front.face[1][1]) / 2]);
      text(ctx, 'edge view', fe[0] - px * 0.4, fe[1] + px * 1.1, { colour: pal.accentText, align: 'right', px });
    }
    text(ctx, 'TOP VIEW', S([0, 0])[0], S([0, s.part.D + 15])[1] - px * 0.9, { kind: 'strong', colour: pal.muted, align: 'left', px });
    text(ctx, 'FRONT VIEW', S([0, 0])[0], S([0, -s.part.H - 15])[1] + px * 1.1, { kind: 'strong', colour: pal.muted, align: 'left', px });
  }

  function onSheetClick(e) {
    if (!current || setup !== 'orthographic' || !current.params.challenge) return;
    const r = sheetCanvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const hit = sheetHits.find((h) => x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1);
    if (hit) {
      revealed.add(hit.name);
      drawSheet();
    }
  }
  sheetCanvas?.addEventListener('click', onSheetClick);

  // ── API ────────────────────────────────────────────────────────────────────────────────────────
  measure();
  init();

  return {
    update(snap, params, opts = {}) {
      if (!ready) {
        pending = { snap, params, opts };
        return;
      }
      build(snap, params, opts);
    },
    resetView,
    resize() {
      measure();
      if (!ready) return;
      applySize();
      if (current) build(current.snap, current.params, {});
    },
    setTheme() {
      pal = readPalette(stage);
      if (ready && current) build(current.snap, current.params, {});
    },
    destroy() {
      destroyed = true;
      stage.removeEventListener('keydown', onKey);
      sheetCanvas?.removeEventListener('click', onSheetClick);
      if (ready) {
        disposeContent();
        controls.dispose();
        renderer.dispose();
        renderer.forceContextLoss?.();
      }
      root.remove();
    },
  };
}
