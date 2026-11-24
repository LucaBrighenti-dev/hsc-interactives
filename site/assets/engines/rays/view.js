// rays engine view: drawing only. Reads the model's solution; never changes the optics.
// Media are flat tints (darker = larger n) labelled with their n values; the normal is dashed; angles are
// measured from the normal with arcs and labels; every ray uses the accent colour plus a text label.
//
// Labels are placed last: each has a few candidate spots, and the one with the most clearance from rays,
// lines and earlier labels wins, so text stays readable at any angle and on any stage size.
import { createSurface, readPalette, stageFontPx, viewport, label, arrow, font } from '../../engine-kit.js';
import { sourcePosition, sourceDirection, criticalAngle } from './model.js';

const DEG = Math.PI / 180;
const deg = (x) => `${x.toFixed(1)}°`;
const nText = (n) => n.toFixed(2);

export function createView(stage) {
  const surface = createSurface(stage);
  let pal = readPalette(stage);
  let vp = null;
  let box = null; // the ray box on screen, for dragging: { x0, y0, x1, y1, half }

  function draw(sol, params) {
    const { ctx, width: W, height: H } = surface;
    const px = stageFontPx(W);
    const compact = W < 700; // phones: fewer, shorter labels
    const pad = Math.round(px * 0.8);
    surface.begin(pal.bg);

    const lineH = Math.round(px * 1.45);
    const sceneTop = pad + lineH * 2 + Math.round(px * 0.3);
    const rect = { x: pad, y: sceneTop, w: Math.max(40, W - 2 * pad), h: Math.max(40, H - sceneTop - pad) };
    const { scene, key, wall } = sol;
    vp = viewport({ x: scene.view.x, y: scene.view.y, rect, equal: true });
    const k = vp.scaleX; // px per scene unit (equal on both axes)
    const S = (p) => [vp.toX(p[0]), vp.toY(p[1])];
    const accent = pal.series[0];
    const lay = createLayout(ctx, rect, px, compact);

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    drawMedia(ctx, scene, rect, S);
    if (params.showProtractor) drawProtractor(ctx, scene, S, k, px, lay);
    drawBoundaries(ctx, scene, S, k, lay);

    // Normals: long and dashed at the surface of interest, short at the fibre's first bounce and at every
    // other interaction of the main ray.
    const longNormal = (scene.protractorRadius + 0.8) * k;
    let normalEnds = null;
    if (key) normalEnds = dashedNormal(ctx, S(key.point), key.normal, longNormal, false, lay);
    if (wall) dashedNormal(ctx, S(wall.point), wall.normal, (scene.cladding + 0.3) * k, true, lay);
    for (const e of sol.main.events) {
      if (e === key || e === wall || e.type === 'absorbed' || e.incidence < 1) continue;
      dashedNormal(ctx, S(e.point), e.normal, Math.min(1.4 * k, 70), true, null);
    }

    // Critical angle (and the fibre's acceptance cone): dashed construction lines.
    const critical = params.showCritical ? drawCritical(ctx, sol, S, k, lay) : null;
    const cone = params.showCritical && scene.kind === 'fibre' ? drawAcceptance(ctx, sol, S, k, lay) : null;

    // Faint partial reflections, under the main ray. Opacity grows from 0 with the reflected fraction
    // (about 0.25 for glass's 4%, fully opaque from 64%); the model drops branches below 0.5%.
    for (const b of sol.partials) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, 1.25 * Math.sqrt(b.intensity));
      polyline(ctx, b.points.map(S), accent, 2);
      ctx.restore();
      lay.addPolyline(b.points.map(S));
    }

    // Main ray, with arrowheads showing the direction of travel.
    const pts = sol.main.points.map(S);
    polyline(ctx, pts, accent, 3);
    lay.addPolyline(pts);
    for (let i = 0; i < pts.length - 1; i++) {
      const seg = clipSegment(pts[i], pts[i + 1], rect);
      if (!seg) continue;
      const [a, b] = seg;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 56) continue;
      const ux = (b[0] - a[0]) / len;
      const uy = (b[1] - a[1]) / len;
      const mx = a[0] + ux * (len / 2 + 8);
      const my = a[1] + uy * (len / 2 + 8);
      arrow(ctx, mx - ux * 22, my - uy * 22, mx, my, { colour: accent, width: 3, head: Math.max(11, px * 0.75) });
    }
    const last = sol.main.events.at(-1);
    if (sol.main.status === 'absorbed' && last) {
      const [x, y] = S(last.point);
      cross(ctx, x, y, Math.max(7, px * 0.45), pal.ink);
    }

    drawRayBox(ctx, sol, S, k, px, lay);

    // ---- labels, most important first ----
    const rA = Math.max(40, px * 2.6);
    if (key) {
      angleArc(ctx, lay, S(key.point), key.normal, neg(key.dIn), rA, `i = ${deg(key.incidence)}`, { required: true });
      if (key.type === 'refract') angleArc(ctx, lay, S(key.point), neg(key.normal), key.dOut, rA, `r = ${deg(key.refraction)}`, { required: true });
      else if (key.type === 'tir') angleArc(ctx, lay, S(key.point), key.normal, key.dOut, rA * 1.25, 'TIR', { strong: true, required: true });
    }
    if (wall) {
      angleArc(ctx, lay, S(wall.point), wall.normal, neg(wall.dIn), rA * 0.9, `φ = ${deg(wall.incidence)}`);
      if (wall.type === 'tir') rayLabel(lay, S(wall.point), wall.dOut, rA * 2.2, 'TIR', { strong: true });
      else if (wall.type === 'refract') rayLabel(lay, S(wall.point), wall.dOut, rA * 1.4, 'escapes', { strong: true });
    }
    if (scene.kind === 'rect') {
      const out = sol.main.events.find((e) => e.tag === 'bottom' && e.type === 'refract');
      if (out) angleArc(ctx, lay, S(out.point), neg(out.normal), out.dOut, rA, `e = ${deg(out.refraction)}`);
    }
    if (critical) placeEndLabel(lay, critical, `θc = ${deg(scene.critical)}`, { colour: pal.ink });
    if (cone && !compact) placeEndLabel(lay, cone, `acceptance θₐ = ${deg(sol.outputs.acceptance)}`, { colour: pal.muted });

    if (sol.main.status === 'absorbed' && last) {
      const [x, y] = S(last.point);
      const g = px * 0.7;
      lay.place(compact ? 'absorbed' : 'absorbed by the coating', [
        { x: x + g, y: y + g, align: 'left', baseline: 'top' },
        { x: x - g, y: y + g, align: 'right', baseline: 'top' },
        { x: x + g, y: y - g, align: 'left', baseline: 'bottom' },
        { x: x - g, y: y - g, align: 'right', baseline: 'bottom' },
      ], { colour: pal.ink, box: pal.bg });
    } else if (sol.main.status === 'limit' && last) {
      const [x, y] = S(last.point);
      lay.place(`trace stops after ${sol.main.events.length} interactions`, [
        { x: x + px * 0.6, y: y - px * 0.6, align: 'left', baseline: 'bottom' },
        { x: x - px * 0.6, y: y + px * 0.6, align: 'right', baseline: 'top' },
      ], { colour: pal.ink, box: pal.bg });
    }

    drawMediumLabels(sol, params, rect, S, px, lay, compact);

    if (key && !compact) {
      const partial = sol.partials.find((b) => b.from === sol.main.events.indexOf(key));
      if (partial) {
        const beyond = params.showProtractor ? scene.protractorRadius * k + px * 1.2 : rA * 2.2;
        rayLabel(lay, S(key.point), key.dRef, Math.max(rA * 2.2, beyond), `reflected ${(100 * partial.intensity).toFixed(1)}%`, { muted: true });
      }
    }
    if (normalEnds && !compact && scene.kind !== 'fibre') {
      const [[x0, y0], [x1, y1], u] = normalEnds;
      const g = px * 0.4;
      const at = (x, y, s) => ({ x: x + s * u[0] * g, y: y + s * u[1] * g, align: Math.abs(u[0]) > 0.5 ? (s * u[0] > 0 ? 'left' : 'right') : 'center', baseline: Math.abs(u[1]) > 0.5 ? (s * u[1] > 0 ? 'top' : 'bottom') : 'middle' });
      lay.place('normal', [at(x1, y1, 1), at(x0, y0, -1)], { colour: pal.muted });
    }
    if (!compact && box) {
      const { x0, y0, x1, y1, half } = box;
      const ux = (x1 - x0) / Math.hypot(x1 - x0, y1 - y0);
      const uy = (y1 - y0) / Math.hypot(x1 - x0, y1 - y0);
      const mx = (x0 + x1) / 2;
      const my = (y0 + y1) / 2;
      const g = half + px * 0.5;
      const spot = (dx, dy) => ({ x: mx + dx * g, y: my + dy * g, align: dx > 0.3 ? 'left' : dx < -0.3 ? 'right' : 'center', baseline: dy > 0.3 ? 'top' : dy < -0.3 ? 'bottom' : 'middle' });
      lay.place('ray box · drag', [spot(-uy, ux), spot(uy, -ux), { x: x0 - ux * px * 0.5, y: y0 - uy * px * 0.5, align: ux > 0.3 ? 'right' : ux < -0.3 ? 'left' : 'center', baseline: uy > 0.3 ? 'bottom' : uy < -0.3 ? 'top' : 'middle' }], { colour: pal.muted });
    }
    ctx.restore();

    drawHeader(ctx, sol, W, pad, lineH, px);
  }

  // ---- pieces ----

  function tintAlpha(n) {
    return Math.min(0.42, Math.max(0, (n - 1) * 0.3));
  }

  function drawMedia(ctx, scene, rect, S) {
    for (const r of scene.regions) {
      ctx.save();
      ctx.beginPath();
      if (r.poly) r.poly.forEach((p, i) => (i ? ctx.lineTo(...S(p)) : ctx.moveTo(...S(p))));
      else ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.closePath();
      ctx.fillStyle = pal.bg;
      ctx.fill();
      ctx.globalAlpha = tintAlpha(r.n);
      ctx.fillStyle = pal.ink;
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBoundaries(ctx, scene, S, k, lay) {
    for (const b of scene.boundaries) {
      ctx.save();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = b.kind === 'absorber' ? 4 : 2;
      ctx.beginPath();
      if (b.type === 'seg') {
        ctx.moveTo(...S(b.a));
        ctx.lineTo(...S(b.b));
        lay.addSeg(S(b.a), S(b.b));
      } else {
        const [cx, cy] = S(b.c);
        ctx.arc(cx, cy, b.r * k, -b.a0, -b.a1, true);
        const n = 24;
        const pts = Array.from({ length: n + 1 }, (_, i) => {
          const a = b.a0 + ((b.a1 - b.a0) * i) / n;
          return S([b.c[0] + b.r * Math.cos(a), b.c[1] + b.r * Math.sin(a)]);
        });
        lay.addPolyline(pts);
      }
      ctx.stroke();
      if (b.kind === 'absorber') {
        // Hatching on the outside of the coating: a second cue that this edge absorbs.
        const [ax, ay] = S(b.a);
        const [bx, by] = S(b.b);
        const len = Math.hypot(bx - ax, by - ay);
        const ux = (bx - ax) / len;
        const uy = (by - ay) / len;
        const out = (b.a[1] + b.b[1]) / 2 > 0 ? -1 : 1; // screen y: up for the top coating
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let s = 6; s < len; s += 12) {
          const x = ax + ux * s;
          const y = ay + uy * s;
          ctx.moveTo(x, y);
          ctx.lineTo(x - 7, y + out * 7);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawProtractor(ctx, scene, S, k, px, lay) {
    const [cx, cy] = S(scene.pivot);
    const R = scene.protractorRadius * k;
    if (R < 40) return;
    const a0 = Math.atan2(-scene.normal[1], scene.normal[0]); // screen angle of the normal
    ctx.save();
    ctx.strokeStyle = pal.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;
    const fine = R * DEG >= 3.5;
    ctx.beginPath();
    for (let d = 0; d < 360; d += fine ? 1 : 5) {
      const len = d % 10 === 0 ? 12 : d % 5 === 0 ? 8 : 4;
      const a = a0 + d * DEG;
      ctx.moveTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
      ctx.lineTo(cx + (R - len) * Math.cos(a), cy + (R - len) * Math.sin(a));
    }
    ctx.stroke();
    const rl = R - 12 - px * 0.8;
    const step = [10, 15, 30].find((s) => rl * s * DEG >= 2.3 * px);
    // Ticks only when the numbers would be crowded, and in the fibre (where the entry face is busy and
    // the launch angle is labelled anyway).
    if (!step || scene.kind === 'fibre') {
      ctx.restore();
      return;
    }
    ctx.font = font('mono', px);
    ctx.fillStyle = pal.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let d = 0; d < 360; d += step) {
      const v = d % 180 <= 90 ? d % 180 : 180 - (d % 180); // measured from the nearer normal
      const a = a0 + d * DEG;
      const x = cx + rl * Math.cos(a);
      const y = cy + rl * Math.sin(a);
      ctx.fillText(String(v), x, y);
      const w = ctx.measureText(String(v)).width;
      lay.addBox({ x: x - w / 2, y: y - px / 2, w, h: px }); // labels keep clear of the numerals
    }
    ctx.restore();
  }

  /** Dashed normal through a point. Returns its two ends and the screen unit vector towards the first end. */
  function dashedNormal(ctx, [x, y], n, len, short, lay) {
    const ux = n[0];
    const uy = -n[1];
    const a = [x - ux * len, y - uy * len];
    const b = [x + ux * len, y + uy * len];
    ctx.save();
    ctx.strokeStyle = short ? pal.muted : pal.ink;
    ctx.lineWidth = short ? 1.5 : 2;
    ctx.setLineDash(short ? [5, 5] : [9, 7]);
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.stroke();
    ctx.restore();
    lay?.addSeg(a, b);
    return [a, b, [ux, uy]];
  }

  /** The dashed critical-angle direction where light meets a less dense medium. Returns the line for its label. */
  function drawCritical(ctx, sol, S, k, lay) {
    const { scene } = sol;
    const c = scene.critical;
    if (c === null) return null;
    let ev = null;
    let len = 0;
    if (scene.kind === 'boundary') {
      ev = sol.key;
      len = scene.protractorRadius * 0.85;
    } else if (scene.kind === 'semi') {
      ev = sol.key;
      len = scene.radius * 0.66;
    } else if (scene.kind === 'fibre') {
      ev = sol.wall;
      len = Math.min(scene.coreHalf * 1.2 / Math.cos(c * DEG), 3);
    }
    // Only where light arrives from the denser side (rect: θc applies inside the block; see the readout).
    if (!ev || !(ev.n1 > ev.n2)) return null;
    const t = tangentialSide(ev);
    const dir = [Math.cos(c * DEG) * ev.normal[0] + Math.sin(c * DEG) * t[0], Math.cos(c * DEG) * ev.normal[1] + Math.sin(c * DEG) * t[1]];
    const [x, y] = S(ev.point);
    const end = [x + dir[0] * len * k, y - dir[1] * len * k];
    ctx.save();
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(...end);
    ctx.stroke();
    ctx.restore();
    lay.addSeg([x, y], end);
    return { from: [x, y], to: end };
  }

  function drawAcceptance(ctx, sol, S, k, lay) {
    const a = sol.outputs.acceptance;
    if (a === null || a >= 90) return null;
    const { scene } = sol;
    const [x, y] = S(scene.pivot);
    const len = scene.sourceDistance * 0.72 * k;
    const up = [x - Math.cos(a * DEG) * len, y - Math.sin(a * DEG) * len];
    const down = [x - Math.cos(a * DEG) * len, y + Math.sin(a * DEG) * len];
    ctx.save();
    ctx.strokeStyle = pal.muted;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(...up);
    ctx.moveTo(x, y);
    ctx.lineTo(...down);
    ctx.stroke();
    ctx.restore();
    lay.addSeg([x, y], up);
    lay.addSeg([x, y], down);
    return { from: [x, y], to: down, alt: { from: [x, y], to: up } };
  }

  /** Label at the far end of a construction line (or of its alternative). */
  function placeEndLabel(lay, line, text, style) {
    const spots = [];
    for (const l of [line, line.alt].filter(Boolean)) {
      const dx = l.to[0] - l.from[0];
      const dy = l.to[1] - l.from[1];
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const g = 8;
      spots.push({ x: l.to[0] + ux * g, y: l.to[1] + uy * g, align: ux > 0.3 ? 'left' : ux < -0.3 ? 'right' : 'center', baseline: uy > 0.3 ? 'top' : uy < -0.3 ? 'bottom' : 'middle' });
      for (const s of [1, -1]) {
        const ox = -uy * s;
        const oy = ux * s;
        spots.push({ x: l.to[0] - ux * len * 0.25 + ox * g, y: l.to[1] - uy * len * 0.25 + oy * g, align: ox > 0.3 ? 'left' : ox < -0.3 ? 'right' : 'center', baseline: oy > 0.3 ? 'top' : oy < -0.3 ? 'bottom' : 'middle' });
      }
    }
    lay.place(text, spots, { ...style, box: pal.bg });
  }

  // Unit vector along the surface, on the side the incoming ray comes from.
  function tangentialSide(ev) {
    const b = neg(ev.dIn);
    const along = b[0] * ev.normal[0] + b[1] * ev.normal[1];
    const t = [b[0] - along * ev.normal[0], b[1] - along * ev.normal[1]];
    const len = Math.hypot(t[0], t[1]);
    return len > 1e-9 ? [t[0] / len, t[1] / len] : [-ev.normal[1], ev.normal[0]];
  }

  /** Arc from the normal (`from`) to a ray (`to`), both scene-space unit vectors, with its label. */
  function angleArc(ctx, lay, [x, y], from, to, r, text, { strong = false, required = false } = {}) {
    const px = lay.px;
    const a = Math.atan2(-from[1], from[0]);
    const b = Math.atan2(-to[1], to[0]);
    let delta = b - a;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    if (Math.abs(delta) > 0.002) {
      ctx.save();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, a, a + delta, delta < 0);
      ctx.stroke();
      ctx.restore();
      const n = 8;
      lay.addPolyline(Array.from({ length: n + 1 }, (_, i) => [x + r * Math.cos(a + (delta * i) / n), y + r * Math.sin(a + (delta * i) / n)]));
    }
    const style = { colour: strong ? pal.accentText : pal.ink, kind: strong ? 'strong' : 'label', box: pal.bg, required };
    const half = lay.width(text, style.kind) / 2;
    const s = delta >= 0 ? 1 : -1;
    const g = px * 0.45;
    const spot = (cx, cy, ox, oy) => ({ x: cx + ox * g, y: cy + oy * g, align: ox > 0.35 ? 'left' : ox < -0.35 ? 'right' : 'center', baseline: oy > 0.35 ? 'top' : oy < -0.35 ? 'bottom' : 'middle' });
    // Outside the angle, beside the ray, near the arc (and further out along the ray).
    const outer = (rr) => spot(x + rr * Math.cos(b), y + rr * Math.sin(b), -Math.sin(b) * s, Math.cos(b) * s);
    // On the bisector, far enough out for the text to clear both lines.
    const m = a + delta / 2;
    const rb = Math.min(r * 3, Math.max(r + px * 0.6, (half + 6) / Math.max(0.2, Math.sin(Math.abs(delta) / 2))));
    const bis = spot(x + rb * Math.cos(m), y + rb * Math.sin(m), Math.cos(m), Math.sin(m));
    const spots = Math.abs(delta) >= 60 * DEG ? [bis, outer(r), outer(r * 1.7)] : [outer(r), outer(r * 1.7), bis, outer(r * 2.4)];
    lay.place(text, spots, style);
  }

  /** Label beside a ray, `dist` px from its start, on whichever side is clearer. */
  function rayLabel(lay, [x, y], d, dist, text, { strong = false, muted = false } = {}) {
    const ux = d[0];
    const uy = -d[1];
    const g = lay.px * 0.6;
    const spots = [];
    for (const f of [1, 1.4, 0.75]) {
      for (const s of [1, -1]) {
        const ox = -uy * s;
        const oy = ux * s;
        spots.push({ x: x + ux * dist * f + ox * g, y: y + uy * dist * f + oy * g, align: ox > 0.35 ? 'left' : ox < -0.35 ? 'right' : 'center', baseline: oy > 0.35 ? 'top' : oy < -0.35 ? 'bottom' : 'middle' });
      }
    }
    lay.place(text, spots, { colour: muted ? pal.muted : strong ? pal.accentText : pal.ink, kind: strong ? 'strong' : 'label', box: pal.bg });
  }

  function drawMediumLabels(sol, params, rect, S, px, lay, compact) {
    const { scene } = sol;
    const g = px * 0.6;
    const style = { colour: pal.ink, kind: 'strong' };
    const corner = (x, y, align, baseline) => ({ x, y, align, baseline });
    const R = rect.x + rect.w - g;
    const L = rect.x + g;
    const T = rect.y + g;
    const B = rect.y + rect.h - g;
    if (scene.kind === 'boundary') {
      lay.place(compact ? `n₁ = ${nText(params.n1)}` : `Upper medium  n₁ = ${nText(params.n1)}`, [corner(R, T, 'right', 'top'), corner(L, T, 'left', 'top')], style);
      lay.place(compact ? `n₂ = ${nText(params.n2)}` : `Lower medium  n₂ = ${nText(params.n2)}`, [corner(R, B, 'right', 'bottom'), corner(L, B, 'left', 'bottom')], style);
      return;
    }
    lay.place(compact ? `n₀ = ${nText(params.nOuter)}` : `Surroundings  n₀ = ${nText(params.nOuter)}`, [corner(R, T, 'right', 'top'), corner(R, B, 'right', 'bottom'), corner(L, B, 'left', 'bottom')], style);
    const block = compact ? `n = ${nText(params.nBlock)}` : `Block  n = ${nText(params.nBlock)}`;
    if (scene.kind === 'rect') {
      const [x0, y0] = S([-scene.halfWidth, -scene.thickness]);
      const [x1, y1] = S([scene.halfWidth, 0]);
      lay.place(block, [corner(x1 - g, y0 - g, 'right', 'bottom'), corner(x0 + g, y0 - g, 'left', 'bottom'), corner(x1 - g, y1 + g, 'right', 'top'), corner(x0 + g, y1 + g, 'left', 'top')], { ...style, optional: compact });
    } else if (scene.kind === 'semi') {
      // Inside the block, either side of the normal; the shorter wording if the longer one has no room.
      const Rr = scene.radius;
      const spots = [];
      for (const text of compact ? [block] : [block, `n = ${nText(params.nBlock)}`]) {
        for (const f of [0.72, 0.86, 0.5, 0.3]) {
          spots.push({ ...corner(...S([0.25, -Rr * f]), 'left', 'middle'), text }, { ...corner(...S([-0.25, -Rr * f]), 'right', 'middle'), text });
        }
      }
      lay.place(block, spots, style);
    } else if (scene.kind === 'fibre') {
      const L0 = scene.length;
      const c = scene.coreHalf;
      const e = c + scene.cladding;
      const xs = [0.97, 0.75, 0.5, 0.3].map((f) => L0 * f);
      const core = compact ? `core ${nText(params.nCore)}` : `Core  n = ${nText(params.nCore)}`;
      const clad = compact ? `cladding ${nText(params.nClad)}` : `Cladding  n = ${nText(params.nClad)}`;
      lay.place(core, xs.map((wx) => corner(...S([wx, 0]), 'right', 'middle')), { ...style, optional: compact });
      lay.place(clad, xs.flatMap((wx) => [corner(...S([wx, (c + e) / 2]), 'right', 'middle'), corner(...S([wx, -(c + e) / 2]), 'right', 'middle')]), { ...style, optional: compact });
      if (!compact) {
        const [x, yTop] = S([L0, e]);
        const [, yBot] = S([L0, -e]);
        lay.place('Coating (absorbs)', [corner(x, yTop - g, 'right', 'bottom'), corner(x, yBot + g, 'right', 'top')], { colour: pal.muted });
      }
    }
  }

  function drawRayBox(ctx, sol, S, k, px, lay) {
    const { scene, angle } = sol;
    const [sx, sy] = S(sourcePosition(scene, angle));
    const d = sourceDirection(scene, angle);
    const ux = d[0];
    const uy = -d[1];
    // Sized to the scene so it stays on stage on phones (the hit area adds 14 px of slack for touch).
    const len = Math.max(16, Math.min(px * 3.2, 1.8 * k));
    const half = Math.max(7, Math.min(px * 0.75, 0.6 * k));
    const bx = sx - ux * len;
    const by = sy - uy * len;
    const nx = -uy;
    const ny = ux;
    const corners = [
      [sx + nx * half, sy + ny * half],
      [sx - nx * half, sy - ny * half],
      [bx - nx * half, by - ny * half],
      [bx + nx * half, by + ny * half],
    ];
    ctx.save();
    ctx.fillStyle = pal.ink;
    ctx.beginPath();
    corners.forEach((c, i) => (i ? ctx.lineTo(...c) : ctx.moveTo(...c)));
    ctx.closePath();
    ctx.fill();
    // Grip lines (a cue that the box can be dragged) and the slit at the front.
    ctx.strokeStyle = pal.bg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const f of [0.3, 0.45, 0.6]) {
      const gx = sx - ux * len * f;
      const gy = sy - uy * len * f;
      ctx.moveTo(gx + nx * half * 0.55, gy + ny * half * 0.55);
      ctx.lineTo(gx - nx * half * 0.55, gy - ny * half * 0.55);
    }
    ctx.stroke();
    ctx.strokeStyle = pal.series[0];
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(sx + nx * half * 0.5, sy + ny * half * 0.5);
    ctx.lineTo(sx - nx * half * 0.5, sy - ny * half * 0.5);
    ctx.stroke();
    ctx.restore();
    lay.addPolyline([...corners, corners[0]]);
    box = { x0: bx, y0: by, x1: sx, y1: sy, half };
  }

  function drawHeader(ctx, sol, W, pad, lineH, px) {
    const { line1, line2, alert } = headerText(sol);
    const maxW = W - 2 * pad;
    ctx.save();
    const fit = (variants, kind) => {
      ctx.font = font(kind, px);
      return variants.find((t) => ctx.measureText(t).width <= maxW) ?? variants.at(-1);
    };
    label(ctx, fit(line1, 'mono'), pad, pad + px, { colour: pal.ink, px, kind: 'mono' });
    label(ctx, fit(line2, 'strong'), pad, pad + px + lineH, { colour: alert ? pal.accentText : pal.ink, px, kind: 'strong' });
    ctx.restore();
  }

  function polyline(ctx, pts, colour, width) {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.restore();
  }

  function cross(ctx, x, y, r, colour) {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - r, y - r);
    ctx.lineTo(x + r, y + r);
    ctx.moveTo(x - r, y + r);
    ctx.lineTo(x + r, y - r);
    ctx.stroke();
    ctx.restore();
  }

  return {
    draw,
    canvas: surface.canvas,
    /** True if (x, y) in canvas CSS px is on the ray box (generous, for touch). */
    hitSource(x, y) {
      if (!box) return false;
      const dx = box.x1 - box.x0;
      const dy = box.y1 - box.y0;
      const l2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x - box.x0) * dx + (y - box.y0) * dy) / l2));
      return Math.hypot(x - (box.x0 + t * dx), y - (box.y0 + t * dy)) <= box.half + 14;
    },
    /** Canvas CSS px → scene units. */
    toWorld: (x, y) => (vp ? [vp.fromX(x), vp.fromY(y)] : null),
    resize: () => surface.resize(),
    setTheme() {
      pal = readPalette(stage);
    },
    destroy: () => surface.destroy(),
  };
}

// ---- label layout ----

/**
 * Obstacles (screen segments) plus a placer that draws each label at its clearest candidate spot, then
 * treats the label's box as an obstacle for the labels after it.
 */
function createLayout(ctx, rect, px, compact = false) {
  const obstacles = [];
  const addSeg = (a, b) => {
    const c = clipSegment(a, b, rect);
    if (c) obstacles.push(c);
  };
  const width = (text, kind = 'label') => {
    ctx.save();
    ctx.font = font(kind, px);
    const w = ctx.measureText(text).width;
    ctx.restore();
    return w;
  };
  const boxOf = (text, c, kind) => {
    const w = width(text, kind) + 8;
    const h = px * 1.2 + 6;
    const x = c.align === 'left' ? c.x - 4 : c.align === 'right' ? c.x - w + 4 : c.x - w / 2;
    const y = c.baseline === 'top' ? c.y - 3 : c.baseline === 'bottom' ? c.y - h + 3 : c.y - h / 2;
    return { x, y, w, h };
  };
  const score = (b) => {
    const over = Math.max(0, rect.x - b.x) + Math.max(0, b.x + b.w - rect.x - rect.w) + Math.max(0, rect.y - b.y) + Math.max(0, b.y + b.h - rect.y - rect.h);
    // Clearance (capped), less a penalty per obstacle the label would cover, so when every spot is
    // crowded the least crowded one wins.
    let clear = 40;
    let hits = 0;
    for (const [a, z] of obstacles) {
      const d = segRectDistance(a, z, b);
      if (d === 0) hits += 1;
      clear = Math.min(clear, d);
    }
    return clear - 8 * hits - over * 3;
  };
  const addBox = ({ x, y, w, h }) => {
    for (const [a, z] of [[[x, y], [x + w, y]], [[x + w, y], [x + w, y + h]], [[x + w, y + h], [x, y + h]], [[x, y + h], [x, y]]]) obstacles.push([a, z]);
  };
  return {
    px,
    width,
    addSeg,
    addBox,
    addPolyline(pts) {
      for (let i = 0; i < pts.length - 1; i++) addSeg(pts[i], pts[i + 1]);
    },
    /**
     * Draw `text` at the best of `spots` ({ x, y, align, baseline, text? }), earlier spots winning ties.
     * A spot's own `text` (a shorter wording) overrides `text`. With `optional` (the default on compact
     * stages unless `required`), skip the label when no spot is clear.
     */
    place(text, spots, { colour, kind = 'label', box = null, optional = compact, required = false } = {}) {
      let best = null;
      for (const c of spots) {
        const b = boxOf(c.text ?? text, c, kind);
        const s = score(b);
        if (!best || s > best.s + 0.5) best = { c, b, s };
      }
      if (!best || (optional && !required && best.s < 1)) return;
      label(ctx, best.c.text ?? text, best.c.x, best.c.y, { colour, px, kind, align: best.c.align, baseline: best.c.baseline, box, padding: 3 });
      addBox(best.b);
    },
  };
}

function segRectDistance(a, b, r) {
  if (clipSegment(a, b, r)) return 0;
  const corners = [[r.x, r.y], [r.x + r.w, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h]];
  let d = Math.min(pointRectDistance(a, r), pointRectDistance(b, r));
  for (const c of corners) d = Math.min(d, pointSegDistance(c, a, b));
  return d;
}

function pointRectDistance([x, y], r) {
  const dx = Math.max(r.x - x, 0, x - r.x - r.w);
  const dy = Math.max(r.y - y, 0, y - r.y - r.h);
  return Math.hypot(dx, dy);
}

function pointSegDistance([x, y], a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2));
  return Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy));
}

// ---- text (pure) ----

/** Angles closer than this (degrees) count as equal: "i = θc" rather than "<" or ">". */
export const SAME_ANGLE = 5e-5;

/**
 * Two numbers printed so that their order is visible: `min` decimals, or more (up to `max`) when they
 * would otherwise print the same. numberPair(41.8, 41.8103) → ['41.80', '41.81'].
 */
export function numberPair(a, b, min = 1, max = 4) {
  for (let d = min; d <= max; d++) {
    const sa = a.toFixed(d);
    const sb = b.toFixed(d);
    if (sa !== sb) return [sa, sb];
  }
  return [a.toFixed(max), b.toFixed(max)];
}
const anglePair = (a, b) => numberPair(a, b).map((s) => `${s}°`);

/** An angle as the teacher entered it: 1 decimal place, more if they typed more (up to 3). */
function degIn(x) {
  for (let d = 1; d < 3; d++) if (Math.abs(Number(x.toFixed(d)) - x) < 1e-9) return `${x.toFixed(d)}°`;
  return `${x.toFixed(3)}°`;
}

/**
 * Header lines, longest first so the view can pick one that fits. Comparisons with θc are made on the
 * unrounded angles and printed with enough decimals to show the order (never "41.8° < 41.8°").
 */
export function headerText(sol) {
  const { scene, key, wall, outputs: o } = sol;
  const lines = { line1: [''], line2: [''], alert: false };
  if (!key) return lines;
  const n1 = nText(key.n1);
  const i = degIn(key.incidence);
  const product = key.n1 * Math.sin(key.incidence * DEG);
  if (key.type === 'refract') {
    const r = deg(key.refraction);
    const n2 = nText(key.n2);
    const lhs = product.toFixed(3);
    lines.line1 = [`Snell: n₁ sin i = n₂ sin r   ${n1} × sin ${i} = ${n2} × sin ${r} = ${lhs}`, `${n1} sin ${i} = ${n2} sin ${r}`];
  } else {
    const [lhs, n2] = numberPair(product, key.n2, 2, 6);
    lines.line1 = [`n₁ sin i = ${n1} × sin ${i} = ${lhs} > n₂ = ${n2}: no refracted ray`, `${n1} sin ${i} = ${lhs} > ${n2}`];
  }

  if (scene.kind === 'fibre') {
    const c = o.critical;
    if (key.type !== 'refract') {
      lines.line2 = ['Total internal reflection at the end face: no light enters the fibre', 'No light enters the fibre'];
      lines.alert = true;
    } else if (!wall || c === null) {
      lines.line2 = o.guided ? ['Guided along the axis', 'Guided'] : ['Escapes: the cladding is not less dense than the core, so there is no TIR', 'Escapes the core'];
      lines.alert = Boolean(o.guided);
    } else if (Math.abs(wall.incidence - c) < SAME_ANGLE) {
      lines.line2 = [`At the limit: φ = θc = ${deg(c)}, the ray grazes along the core–cladding boundary`, `φ = θc = ${deg(c)}: grazes the boundary`, 'φ = θc'];
    } else {
      const [phi, crit] = anglePair(wall.incidence, c);
      if (o.guided) {
        const bounces = o.tirCount === 1 ? '1 total internal reflection' : `${o.tirCount} total internal reflections`;
        lines.line2 = [`Guided: φ = ${phi} > θc = ${crit} at every bounce (${bounces})`, `Guided: φ > θc (${bounces})`, 'Guided: φ > θc'];
        lines.alert = true;
      } else {
        lines.line2 = [`Escapes: φ = ${phi} < θc = ${crit}, so light refracts into the cladding`, `Escapes: φ = ${phi} < θc = ${crit}`, 'Escapes: φ < θc'];
      }
    }
    return lines;
  }

  const c = criticalAngle(key.n1, key.n2); // at the surface of interest, in the direction the light travels
  if (c !== null && Math.abs(key.incidence - c) < SAME_ANGLE) {
    // The classic demonstration: exactly at the critical angle.
    lines.line2 =
      key.type === 'refract'
        ? [`Critical angle: i = θc = ${deg(c)}, so the refracted ray grazes the surface (r = ${deg(key.refraction)})`, `i = θc = ${deg(c)}: the refracted ray grazes the surface`, 'i = θc']
        : [`Critical angle: i = θc = ${deg(c)}, so total internal reflection just begins`, `i = θc = ${deg(c)}: TIR begins`, 'i = θc'];
    lines.alert = true;
  } else if (key.type === 'tir') {
    const [a, b] = anglePair(key.incidence, c);
    lines.line2 = [`Total internal reflection: i = ${a} > θc = ${b}`, `TIR: i > θc = ${b}`];
    lines.alert = true;
  } else if (c !== null) {
    const [a, b] = anglePair(key.incidence, c);
    lines.line2 = [`Refraction: i = ${a} < θc = ${b}, part of the light reflects`, `Refraction: i < θc = ${b}`];
  } else if (key.incidence < 0.05 && key.n1 !== key.n2) {
    lines.line2 = ['Along the normal: the ray crosses without bending', 'Along the normal: no bending'];
  } else if (key.n2 > key.n1) {
    lines.line2 = ['Into a denser medium: the ray bends towards the normal', 'Bends towards the normal'];
  } else if (key.n2 < key.n1) {
    lines.line2 = ['Into a less dense medium: the ray bends away from the normal', 'Bends away from the normal'];
  } else {
    lines.line2 = ['Equal refractive indices: the ray does not bend', 'No bending'];
  }
  if (scene.kind === 'rect' && key.type === 'refract') {
    // (TIR at the top face itself, from denser surroundings, keeps the message above.)
    const last = sol.main.events.at(-1);
    if (o.tirCount > 0) {
      lines.line2 = [`Total internal reflection inside the block (${o.tirCount})`, 'TIR inside the block'];
      lines.alert = true;
    } else if (last?.tag === 'bottom' && last.type === 'refract') {
      lines.line2 = ['Parallel faces: the ray leaves parallel to the incident ray, shifted sideways', 'Leaves parallel, shifted sideways'];
    }
  }
  return lines;
}

function neg(v) {
  return [-v[0], -v[1]];
}

/** Clip a screen segment to a rectangle (Liang–Barsky). Returns null when it is outside. */
function clipSegment(a, b, r) {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const checks = [
    [-dx, a[0] - r.x],
    [dx, r.x + r.w - a[0]],
    [-dy, a[1] - r.y],
    [dy, r.y + r.h - a[1]],
  ];
  for (const [p, q] of checks) {
    if (p === 0) {
      if (q < 0) return null;
      continue;
    }
    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return null;
  }
  return [
    [a[0] + t0 * dx, a[1] + t0 * dy],
    [a[0] + t1 * dx, a[1] + t1 * dy],
  ];
}
