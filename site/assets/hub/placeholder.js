// Generated placeholder thumbnails for cards without a screenshot: flat graphite and orange line drawings,
// one motif per engine family (arcs for particles, a truss for statics, a histogram for sampling, ...).
// Deterministic for each id, so a card always gets the same picture. No gradients, no glow.
const NS = 'http://www.w3.org/2000/svg';
const W = 320;
const H = 180;
// Design tokens, applied as inline styles so the drawing follows tokens.css.
const BG = 'var(--c-bg)';
const GREY = 'var(--c-line-strong)';
const ACCENT = 'var(--c-accent)';

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n1 = (v) => v.toFixed(1);
const line = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${n1(x)} ${n1(y)}`).join('');
const dot = (x, y, s = 4) => `M${n1(x - s / 2)} ${n1(y - s / 2)}h${s}v${s}h${-s}z`;
const circle = (cx, cy, r) => `M${n1(cx + r)} ${n1(cy)}A${r} ${r} 0 1 0 ${n1(cx - r)} ${n1(cy)}A${r} ${r} 0 1 0 ${n1(cx + r)} ${n1(cy)}`;
const range = (n) => Array.from({ length: n }, (_, i) => i);

/** Each motif returns { base, accent, fill }: path data for grey strokes, orange strokes and orange fills. */
const MOTIFS = {
  // A family of projectile arcs from one launch point, with strobe dots at equal times on one of them.
  particle2d(rand) {
    const x0 = 26;
    const y0 = 158;
    const n = 5 + Math.floor(rand() * 3);
    const hit = Math.floor(rand() * n);
    let base = `M10 ${y0}H310`;
    let accent = '';
    let fill = '';
    for (const k of range(n)) {
      const th = ((18 + ((k + 0.5) * 66) / n) * Math.PI) / 180;
      const R = 268 * Math.sin(2 * th);
      const Hm = 134 * Math.sin(th) ** 2;
      const pts = range(41).map((i) => [x0 + (R * i) / 40, y0 - 4 * Hm * (i / 40) * (1 - i / 40)]);
      if (k === hit) {
        accent += line(pts);
        for (let i = 5; i < 40; i += 5) fill += dot(pts[i][0], pts[i][1]);
      } else base += line(pts);
    }
    return { base, accent, fill };
  },

  // A Warren truss on a pin and a roller, a few members picked out, and a point load.
  statics(rand) {
    const panels = 4 + Math.floor(rand() * 3);
    const x0 = 34;
    const x1 = 286;
    const yb = 128;
    const yt = 60 + rand() * 18;
    const dx = (x1 - x0) / panels;
    const bottom = range(panels + 1).map((i) => [x0 + i * dx, yb]);
    const top = range(panels).map((i) => [x0 + (i + 0.5) * dx, yt]);
    let base = line([bottom[0], bottom[panels]]) + line([top[0], top[panels - 1]]);
    let accent = '';
    for (const i of range(panels)) {
      const up = line([bottom[i], top[i]]);
      const down = line([top[i], bottom[i + 1]]);
      if (rand() < 0.28) accent += up;
      else base += up;
      if (rand() < 0.28) accent += down;
      else base += down;
    }
    // Supports: a pin on the left, a roller on the right.
    base += `M${x0} ${yb}l-10 16h20z` + `M${x1} ${yb}l-10 14h20z` + `M${x1 - 12} ${yb + 19}h24` + `M${x0 - 16} ${yb + 16}h32`;
    const j = top[Math.floor(rand() * panels)];
    accent += `M${n1(j[0])} ${n1(j[1] - 40)}V${n1(j[1] - 6)}M${n1(j[0] - 5)} ${n1(j[1] - 13)}L${n1(j[0])} ${n1(j[1] - 5)}L${n1(j[0] + 5)} ${n1(j[1] - 13)}`;
    return { base, accent, fill: '' };
  },

  // A histogram of samples with the normal curve over it.
  statsim(rand) {
    const bins = 15;
    const x0 = 34;
    const x1 = 286;
    const yb = 156;
    const w = (x1 - x0) / bins;
    const mu = 5.5 + rand() * 3;
    const s = 2 + rand() * 1.2;
    const g = (x) => Math.exp(-((x - mu) ** 2) / (2 * s * s));
    let base = `M${x0 - 14} ${yb}H${x1 + 14}`;
    for (const i of range(bins)) {
      const h = 112 * g(i + 0.5) * (0.82 + rand() * 0.3);
      if (h < 3) continue;
      base += `M${n1(x0 + i * w + 2)} ${yb}V${n1(yb - h)}H${n1(x0 + (i + 1) * w - 2)}V${yb}`;
    }
    const accent = line(range(81).map((i) => [x0 + (i / 80) * (x1 - x0), yb - 112 * g((i / 80) * bins)]));
    return { base, accent, fill: '' };
  },

  // Axes, the unit circle, and a regular polygon of nth roots.
  argand(rand) {
    const cx = 160;
    const cy = 90;
    const r = 64;
    const n = 5 + Math.floor(rand() * 5);
    const phase = rand() * Math.PI * 2;
    let base = `M36 ${cy}H284M${cx} 12V168` + circle(cx, cy, r);
    let fill = '';
    const pts = range(n + 1).map((k) => {
      const a = phase + (2 * Math.PI * k) / n;
      return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    });
    for (const p of pts.slice(0, n)) {
      base += line([[cx, cy], p]);
      fill += dot(p[0], p[1], 6);
    }
    return { base, accent: line(pts), fill };
  },

  // Streamlines bending around an aerofoil at a small angle of attack.
  aero(rand) {
    const cx = 160;
    const cy = 94;
    const chord = 150;
    const t = 0.13;
    const alpha = ((3 + rand() * 7) * Math.PI) / 180;
    const thick = (x) => 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1015 * x ** 4);
    const camber = (x) => 0.04 * (x < 0.4 ? (2 * 0.4 * x - x * x) / 0.16 : (1 - 0.8 + 2 * 0.4 * x - x * x) / 0.36);
    const rot = ([x, y]) => {
      const X = (x - 0.4) * chord;
      const Y = -y * chord;
      return [cx + X * Math.cos(alpha) + Y * Math.sin(alpha), cy - X * Math.sin(alpha) + Y * Math.cos(alpha)];
    };
    const xs = range(31).map((i) => (1 - Math.cos((Math.PI * i) / 30)) / 2);
    const upper = xs.map((x) => rot([x, camber(x) + thick(x)]));
    const lower = xs.map((x) => rot([x, camber(x) - thick(x)])).reverse();
    const accent = `${line([...upper, ...lower])}Z`;
    let base = '';
    for (const k of [-4, -3, -2, -1, 1, 2, 3, 4]) {
      const y0 = cy + k * 17;
      const bump = k < 0 ? -16 / (1 + 0.55 * (Math.abs(k) - 1)) : 7 / (1 + 0.55 * (k - 1));
      base += line(range(61).map((i) => [8 + (i / 60) * 304, y0 + bump * Math.exp(-(((8 + (i / 60) * 304 - cx) / 78) ** 2))]));
    }
    return { base, accent, fill: '' };
  },

  // Two waves and their superposition.
  wave(rand) {
    const l1 = 60 + rand() * 30;
    const l2 = l1 * (1.15 + rand() * 0.25);
    const p1 = rand() * Math.PI * 2;
    const p2 = rand() * Math.PI * 2;
    const xs = range(121).map((i) => 12 + (i / 120) * 296);
    const y1 = (x) => 14 * Math.sin((2 * Math.PI * x) / l1 + p1);
    const y2 = (x) => 14 * Math.sin((2 * Math.PI * x) / l2 + p2);
    const base = `M12 40H308M12 82H308M12 140H308` + line(xs.map((x) => [x, 40 - y1(x)])) + line(xs.map((x) => [x, 82 - y2(x)]));
    const accent = line(xs.map((x) => [x, 140 - (y1(x) + y2(x))]));
    return { base, accent, fill: '' };
  },

  // A slope field: short segments along a smooth direction field.
  field2d(rand) {
    const a = 1 + rand() * 2;
    const b = 1 + rand() * 2;
    const p = rand() * Math.PI * 2;
    const field = (x, y) => Math.sin((x / W) * Math.PI * a + p) + Math.cos((y / H) * Math.PI * b - p) * 0.8;
    const step = 20;
    let base = '';
    let accent = '';
    for (let y = step / 2; y < H; y += step) {
      for (let x = step / 2; x < W; x += step) {
        const ang = field(x, y);
        const len = 6 + rand() * 3;
        const seg = line([
          [x - Math.cos(ang) * len, y - Math.sin(ang) * len],
          [x + Math.cos(ang) * len, y + Math.sin(ang) * len],
        ]);
        if (rand() < 0.14) accent += seg;
        else base += seg;
      }
    }
    return { base, accent, fill: '' };
  },

  // Axes with tick marks, a cubic through three marked roots, and its derivative.
  fnplot(rand) {
    const ox = 160;
    const oy = 92;
    const r = [-1, -0.35 + rand() * 0.7, 1];
    const sign = rand() < 0.5 ? 1 : -1;
    const f = (u) => (u - r[0]) * (u - r[1]) * (u - r[2]);
    const df = (u) => (u - r[1]) * (u - r[2]) + (u - r[0]) * (u - r[2]) + (u - r[0]) * (u - r[1]);
    // A domain just past the outer roots keeps the turning points large in the frame.
    const us = range(121).map((i) => -1.22 + (i / 120) * 2.44);
    const X = (u) => ox + u * 118;
    const peak = (g) => Math.max(...us.map((u) => Math.abs(g(u))));
    const sf = 64 / peak(f);
    const sd = 50 / peak(df);
    let base = `M10 ${oy}H310M${ox} 8V172`;
    for (const k of [-2, -1, 1, 2]) base += `M${n1(X(k / 2))} ${oy - 4}v8`;
    base += line(us.map((u) => [X(u), oy - sign * sd * df(u)]));
    const accent = line(us.map((u) => [X(u), oy - sign * sf * f(u)]));
    return { base, accent, fill: r.map((u) => dot(X(u), oy, 6)).join('') };
  },

  // An isometric wireframe box, its axes and one vector.
  space3d(rand) {
    const s = 46;
    const P = ([x, y, z]) => [160 + (x - y) * Math.cos(Math.PI / 6) * s, 128 + (x + y) * 0.5 * s - z * s];
    const a = 1.2 + rand() * 0.8;
    const b = 1 + rand() * 0.8;
    const c = 0.9 + rand() * 0.9;
    const v = [
      [0, 0, 0], [a, 0, 0], [a, b, 0], [0, b, 0],
      [0, 0, c], [a, 0, c], [a, b, c], [0, b, c],
    ].map(P);
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    let base = edges.map(([i, j]) => line([v[i], v[j]])).join('');
    base += line([P([0, 0, 0]), P([a + 0.6, 0, 0])]) + line([P([0, 0, 0]), P([0, b + 0.6, 0])]) + line([P([0, 0, 0]), P([0, 0, c + 0.6])]);
    const tip = v[6];
    return { base, accent: line([v[0], tip]), fill: dot(tip[0], tip[1], 7) };
  },

  // A glass block with parallel rays refracting through it.
  rays(rand) {
    const bx0 = 118;
    const bx1 = 206;
    const by0 = 36;
    const by1 = 148;
    let base = `M${bx0} ${by0}H${bx1}V${by1}H${bx0}Z`;
    let accent = '';
    const th1 = ((28 + rand() * 22) * Math.PI) / 180;
    const th2 = Math.asin(Math.sin(th1) / 1.5);
    const hit = Math.floor(rand() * 3);
    for (const k of range(3)) {
      const yIn = 64 + k * 22;
      const yOut = yIn + (bx1 - bx0) * Math.tan(th2);
      const start = [bx0 - 100, yIn - 100 * Math.tan(th1)];
      const end = [bx1 + 100, yOut + 100 * Math.tan(th1)];
      const path = line([start, [bx0, yIn], [bx1, yOut], end]);
      if (k === hit) accent += path;
      else base += path;
      if (k === hit) base += `M${bx0 - 26} ${yIn}H${bx0 + 26}`;
    }
    return { base, accent, fill: '' };
  },

  // A loop with a cell, two resistors and nodes.
  circuit(rand) {
    // Zigzag resistor from (x0, y0) to (x1, y1), horizontal or vertical.
    const zig = (x0, y0, x1, y1) => {
      const pts = [[x0, y0]];
      for (const i of range(6)) {
        const u = (i + 0.5) / 6;
        const off = i % 2 ? 7 : -7;
        pts.push(y0 === y1 ? [x0 + u * (x1 - x0), y0 + off] : [x0 + off, y0 + u * (y1 - y0)]);
      }
      pts.push([x1, y1]);
      return line(pts);
    };
    const top = 42;
    const bottom = 140;
    const left = 52;
    const right = 268;
    const mid = 172 + rand() * 30;
    const r1 = 80 + rand() * 20;
    // Wires, with a gap for the cell on the left side and for each resistor.
    let base = `M${left} ${top}H${r1}M${r1 + 56} ${top}H${right}V${bottom}H${left}V104M${left} 80V${top}`;
    base += `M${left - 14} 80H${left + 14}M${left - 7} 104H${left + 7}`;
    base += `M${n1(mid)} ${top}V68M${n1(mid)} 116V${bottom}`;
    const accent = zig(r1, top, r1 + 56, top) + zig(mid, 68, mid, 116);
    const fill = dot(mid, top, 6) + dot(mid, bottom, 6);
    return { base, accent, fill };
  },

  // A stress–strain curve: elastic line, hardening, necking and fracture, with the 0.2% offset line.
  materials(rand) {
    const ox = 34;
    const oy = 152;
    const ey = 62 + rand() * 16;
    const ex = ox + 30 + rand() * 12;
    const peak = 30 + rand() * 12;
    const px = 180 + rand() * 30;
    const fx = px + 50 + rand() * 30;
    let base = `M${ox} ${oy}H304M${ox} ${oy}V18`;
    // The 0.2% offset line runs parallel to the elastic line, shifted right.
    base += `M${ox + 10} ${oy}L${n1(ox + 10 + ((oy - ey + 26) / (oy - ey)) * (ex - ox))} ${n1(ey - 26)}`;
    const accent = `M${ox} ${oy}L${n1(ex)} ${n1(ey)}Q${n1(ex + 40)} ${n1(peak + 4)} ${n1(px)} ${n1(peak)}Q${n1((px + fx) / 2)} ${n1(peak)} ${n1(fx)} ${n1(peak + 34)}`;
    return { base, accent, fill: dot(fx, peak + 34, 7) };
  },

  // Concentric orbits with one marked transition (custom pages).
  custom(rand) {
    const cx = 160;
    const cy = 90;
    const radii = [16, 34, 54, 76];
    let base = radii.map((r) => circle(cx, cy, r)).join('');
    const from = 1 + Math.floor(rand() * 3);
    const a = rand() * Math.PI * 2;
    const p1 = [cx + radii[from] * Math.cos(a), cy + radii[from] * Math.sin(a)];
    const p0 = [cx + radii[from - 1] * Math.cos(a), cy + radii[from - 1] * Math.sin(a)];
    base += `M${cx - 120} ${cy}H${cx - 90}M${cx + 90} ${cy}H${cx + 120}`;
    return { base, accent: circle(cx, cy, radii[from]) + line([p1, p0]), fill: dot(p0[0], p0[1], 7) + dot(cx, cy, 6) };
  },
};

/**
 * @param {string} id      catalog id (seeds the drawing)
 * @param {string} [kind]  engine name; unknown names use the slope field
 * @returns {SVGSVGElement}
 */
export function placeholderSvg(id, kind) {
  const rand = mulberry32(hash(id));
  const motif = MOTIFS[kind] ?? MOTIFS.field2d;
  const { base, accent, fill } = motif(rand);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('width', String(W));
  bg.setAttribute('height', String(H));
  bg.style.fill = BG;
  svg.append(bg);
  for (const [d, stroke, width, paint] of [
    [base, GREY, 1.5, 'none'],
    [accent, ACCENT, 2, 'none'],
    [fill, 'none', 0, ACCENT],
  ]) {
    if (!d) continue;
    const node = document.createElementNS(NS, 'path');
    node.setAttribute('d', d);
    node.style.fill = paint;
    if (stroke !== 'none') {
      node.style.stroke = stroke;
      node.setAttribute('stroke-width', String(width));
      node.setAttribute('stroke-linecap', 'square');
      node.setAttribute('stroke-linejoin', 'miter');
      node.setAttribute('vector-effect', 'non-scaling-stroke');
    }
    svg.append(node);
  }
  return svg;
}
