// fnplot scenes: turn a setup's solved model into panels, drawing items and labels for view.js.
// Layout and presentation only; every number comes from model.js.
//
// A scene is { version, panels: [{ id, rect, window: { x, y, equal? }, zoomable?, zoomKey?, linkX?,
// axes?: { xTitle, yTitle, piX, piY, hideY } | false, items: [...] }], tex: [...], message? }.
import { axisMargins } from '../../engine-kit.js';
import { formatNumber } from '../../format.js';
import * as M from './model.js';

/** A number for LaTeX: 3 significant figures, ASCII minus, ×10ⁿ for very large or small values. */
export function tn(v, sf = 3) {
  if (!Number.isFinite(v)) return v > 0 ? '\\infty' : v < 0 ? '-\\infty' : '\\text{undefined}';
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1e5 || a < 1e-3) {
    let e = Math.floor(Math.log10(a));
    let m = Number((v / 10 ** e).toPrecision(sf));
    if (Math.abs(m) >= 10) {
      m /= 10;
      e += 1;
    }
    return `${m}\\times10^{${e}}`;
  }
  return String(Number(v.toPrecision(sf)));
}

/** A number for canvas text: 3 s.f., true minus sign. */
const fx3 = (v, sf = 3) => formatNumber(v, { sigfigs: sf });
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const GREEK = ['α', 'β', 'γ', 'δ', 'ε', 'ζ'];
const COL_TOP = 60; // text columns start below the zoom buttons (44 px + 8 px inset)

/** Area centroid of a polygon (shoelace); falls back to the vertex mean for a degenerate one. */
function centroid(poly) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    const cross = x0 * y1 - x1 * y0;
    a += cross;
    cx += (x0 + x1) * cross;
    cy += (y0 + y1) * cross;
  }
  if (Math.abs(a) < 1e-12) return [poly.reduce((t, q) => t + q[0], 0) / poly.length, poly.reduce((t, q) => t + q[1], 0) / poly.length];
  return [cx / (3 * a), cy / (3 * a)];
}
const COEFFS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

function plotRect(x, y, w, h, px) {
  const m = axisMargins(px);
  return { x: x + m.left, y: y + m.top, w: Math.max(40, w - m.left - m.right), h: Math.max(40, h - m.top - m.bottom) };
}

/** World window around [lo, hi] values with a margin, never flat. */
function span(lo, hi, margin = 0.15, minHalf = 1) {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [-minHalf, minHalf];
  let a = lo;
  let b = hi;
  if (b - a < 2 * minHalf * 0.2) {
    const mid = (a + b) / 2;
    a = mid - minHalf;
    b = mid + minHalf;
  }
  const m = (b - a) * margin;
  return [a - m, b + m];
}

function rangeOf(f, a, b, n = 240) {
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= n; i++) {
    const y = f(a + ((b - a) * i) / n);
    if (Number.isFinite(y)) {
      lo = Math.min(lo, y);
      hi = Math.max(hi, y);
    }
  }
  return [lo, hi];
}

function errorScene(s, c) {
  return {
    version: c.version,
    panels: [],
    tex: [],
    message: { title: `Can't read ${s.name} yet`, name: s.name, source: s.source, pos: s.error.pos, end: s.error.end, text: s.error.message },
  };
}

/** A block of LaTeX lines in stage pixels. */
const block = (id, lines, x, y, extra = {}) => ({ id, lines, x, y, frame: true, ...extra });

// ─────────────────────────────────────────────────────────────────────────────────────────────

const BUILDERS = {
  transform(c) {
    const { s, p, W, H, px, pal } = c;
    if (s.error) return errorScene(s, c);
    const side = p.layout === 'side' && W >= 700;
    const head = px * 3;
    const win = { x: [-5, 5], y: [-5, 5] };
    const axes = { xTitle: 'x', yTitle: 'y', piX: p.piTicks };
    const x0 = p.probeX;
    const gName = { reciprocal: '1/f(x₀)', abs: '|f(x₀)|', absx: 'f(|x₀|)' }[p.transform];
    const fCurve = (extra = {}) => ({ kind: 'fn', key: 'f', f: s.f, colour: pal.series[1], width: 3, ...extra });
    const gCurve = { kind: 'fn', key: 'g', f: s.g, colour: pal.series[0], width: 3.5 };
    const probe = (y, colour, name) =>
      Number.isFinite(y)
        ? [
            { kind: 'vline', x: x0, y0: 0, y1: y, dash: [4, 5], colour: pal.muted },
            { kind: 'point', x: x0, y, colour, drag: 'probe' },
            { kind: 'text', x: x0, y, dx: 14, dy: -12, text: `${name} = ${fx3(y)}`, colour: pal.ink },
          ]
        : [{ kind: 'point', x: x0, y: 0, colour, drag: 'probe', hollow: true }];
    const invariant = s.invariant.map(([x, y]) => ({ kind: 'point', x, y, r: 6, hollow: true, colour: pal.ink }));
    const tex = [];
    const panels = [];
    if (side) {
      const w = (W - px) / 2;
      const r1 = plotRect(0, head, w, H - head, px);
      const r2 = plotRect(w + px, head, w, H - head, px);
      panels.push({ id: 'f', rect: r1, window: win, zoomable: true, zoomKey: 'both', axes, items: [fCurve(), ...probe(s.fValue, pal.series[1], 'f(x₀)')] });
      panels.push({
        id: 'g',
        rect: r2,
        window: win,
        zoomable: true,
        zoomKey: 'both',
        axes,
        items: [...(p.showOriginal ? [fCurve({ key: 'f2', width: 2, dash: [8, 6], asymptotes: false })] : []), gCurve, ...invariant, ...probe(s.gValue, pal.series[0], gName)],
      });
      tex.push({ id: 'ft', tex: s.fTex, x: r1.x, y: px * 0.5, colour: pal.series[1], box: false });
      tex.push({ id: 'gt', tex: s.gTex, x: r2.x, y: px * 0.5, colour: pal.accentText, box: false });
    } else {
      const r = plotRect(0, head, W, H - head, px);
      panels.push({
        id: 'g',
        rect: r,
        window: win,
        zoomable: true,
        axes,
        items: [fCurve({ width: 2, dash: [8, 6], asymptotes: false }), gCurve, ...invariant, ...probe(s.gValue, pal.series[0], gName)],
      });
      tex.push({ id: 'ft', lines: [s.gTex, s.fTex], lineColours: [pal.accentText, pal.series[1]], x: r.x, y: px * 0.3, box: false, size: W < 600 ? 0.85 : 1 });
    }
    if (s.invariant.length && W >= 600) {
      const last = panels[panels.length - 1].rect;
      tex.push({ id: 'inv', tex: '\\circ\\ \\text{invariant points: }f(x)=\\pm1', x: last.x + last.w - 6, y: last.y + last.h - 6, align: 'right', valign: 'bottom', size: 0.8, colour: pal.muted });
    }
    return { version: c.version, panels, tex };
  },

  inverse(c) {
    const { s, p, W, H, px, pal } = c;
    if (s.error) return errorScene(s, c);
    const wide = W >= 900;
    const colW = wide ? clamp(W * 0.34, 300, 480) : 0;
    const head = wide ? 0 : px * 5.2;
    const r = plotRect(0, head, W - colW, H - head, px);
    const [x0, c0] = s.probe;
    const items = [];
    if (p.showMirror) {
      items.push({ kind: 'line', p0: [0, 0], p1: [1, 1], dash: [8, 6], colour: pal.muted, width: 1.5 });
      items.push({ kind: 'tex', tex: 'y=x', x: 4.2, y: 4.2, dx: 8, dy: -4, valign: 'bottom', colour: pal.muted, box: true });
    }
    items.push({ kind: 'fn', key: 'full', f: s.f, colour: pal.muted, width: 2, dash: [3, 6], asymptotes: false });
    items.push({ kind: 'vline', x: s.a, dash: [2, 5], colour: pal.grid, width: 1.5 });
    items.push({ kind: 'vline', x: s.b, dash: [2, 5], colour: pal.grid, width: 1.5 });
    items.push({ kind: 'fn', key: `restricted-${s.a}-${s.b}`, f: s.f, domain: [s.a, s.b], colour: pal.series[0], width: 3.5 });
    items.push({ kind: 'param', key: `mirror-${s.a}-${s.b}`, fx: s.f, fy: (t) => t, t0: s.a, t1: s.b, colour: pal.series[1], width: s.oneToOne ? 3.5 : 2.5, dash: s.oneToOne ? null : [10, 7] });
    // Horizontal line test through the probe.
    if (Number.isFinite(c0)) {
      items.push({ kind: 'hline', y: c0, dash: [10, 6], colour: pal.accentText, width: 2 });
      for (const h of s.hits) items.push({ kind: 'point', x: h, y: c0, r: 6, colour: pal.accentText });
      items.push({ kind: 'segment', p0: [x0, c0], p1: [c0, x0], dash: [2, 5], colour: pal.muted, width: 1.5 });
      items.push({ kind: 'point', x: c0, y: x0, r: 7, hollow: true, colour: pal.series[1] });
    }
    items.push({ kind: 'point', x: x0, y: c0, colour: pal.series[0], drag: 'probe' });
    items.push({ kind: 'point', x: s.a, y: 0, square: true, r: 8, colour: pal.ink, drag: 'domainMin' });
    items.push({ kind: 'point', x: s.b, y: 0, square: true, r: 8, colour: pal.ink, drag: 'domainMax' });
    items.push({ kind: 'text', x: s.a, y: 0, dy: -16, text: 'a', align: 'center', font: 'strong' });
    items.push({ kind: 'text', x: s.b, y: 0, dy: -16, text: 'b', align: 'center', font: 'strong' });
    const status = s.oneToOne ? '\\text{One-to-one: the inverse is a function}' : '\\text{Not one-to-one: the reflection is not a function}';
    const hitsLine = `\\text{The line }y=${tn(c0)}\\text{ meets the graph }${s.hits.length}\\text{ time${s.hits.length === 1 ? '' : 's'}}`;
    const lines = [s.fTex, `\\text{Domain: }${tn(s.a)}\\le x\\le ${tn(s.b)}`, `\\text{Range: }${tn(s.rangeMin)}\\le y\\le ${tn(s.rangeMax)}`, '', status, hitsLine];
    const colours = [pal.accentText, pal.ink, pal.ink, null, s.oneToOne ? pal.ink : pal.accentText, pal.muted];
    const tex = wide
      ? [block('info', lines, W - colW + px * 0.4, COL_TOP, { lineColours: colours, size: 0.95 })]
      : [block('info', [s.fTex, status], r.x, px * 0.3, { lineColours: [pal.accentText, colours[4]], size: W < 600 ? 0.8 : 0.95 })];
    if (s.oneToOne && wide) tex.push({ id: 'finv', tex: 'y=f^{-1}(x)', x: W - colW + px * 0.4, y: H - px * 2.4, colour: pal.series[1], box: false });
    return {
      version: c.version,
      panels: [{ id: 'main', rect: r, window: { x: [-6, 6], y: [-6, 6], equal: true }, zoomable: true, axes: { xTitle: 'x', yTitle: 'y', piX: p.piTicks }, items }],
      tex,
    };
  },

  parametric(c) {
    const { s, p, W, H, px, pal } = c;
    if (s.error) return errorScene(s, c);
    const wide = W >= 900;
    const colW = wide ? clamp(W * 0.34, 300, 500) : 0;
    const head = wide ? 0 : px * 4;
    const r = plotRect(0, head, W - colW, H - head, px);
    // Window: the whole curve and the origin.
    let lo = [0, 0];
    let hi = [0, 0];
    for (const seg of M.sampleParametric(s.x, s.y, s.t0, s.t1, 400))
      for (const [x, y] of seg) {
        lo = [Math.min(lo[0], x), Math.min(lo[1], y)];
        hi = [Math.max(hi[0], x), Math.max(hi[1], y)];
      }
    const win = { x: span(lo[0], hi[0], 0.12, 1), y: span(lo[1], hi[1], 0.12, 1), equal: true };
    const [cx, cy] = s.point;
    const items = [
      { kind: 'param', key: 'full', fx: s.x, fy: s.y, t0: s.t0, t1: s.t1, colour: pal.muted, width: 2, dash: [6, 6] },
      { kind: 'param', fx: s.x, fy: s.y, t0: s.t0, t1: s.t, colour: pal.series[0], width: 3.5, n: 600 },
      { kind: 'point', x: s.x(s.t0), y: s.y(s.t0), r: 6, hollow: true, colour: pal.muted },
      { kind: 'text', x: s.x(s.t0), y: s.y(s.t0), dx: 10, dy: 22, text: `t = ${fx3(s.t0)}`, colour: pal.muted },
    ];
    // Direction of travel: a short arrow along the tangent.
    const h = (s.t1 - s.t0) * 1e-4;
    const dx = s.x(Math.min(s.t1, s.t + h)) - s.x(Math.max(s.t0, s.t - h));
    const dy = s.y(Math.min(s.t1, s.t + h)) - s.y(Math.max(s.t0, s.t - h));
    const len = Math.hypot(dx, dy);
    if (len > 0 && Number.isFinite(cx)) {
      const L = 0.09 * (win.x[1] - win.x[0]);
      items.push({ kind: 'arrow', p0: [cx, cy], p1: [cx + (dx / len) * L, cy + (dy / len) * L], colour: pal.ink, width: 2.5 });
    }
    items.push({ kind: 'point', x: cx, y: cy, colour: pal.series[0], drag: 'tracer' });
    items.push({ kind: 'text', x: cx, y: cy, dx: 14, dy: -14, text: `t = ${fx3(s.t)}`, font: 'strong' });
    const pointLine = `t=${tn(s.t)}:\\ (x,y)=\\left(${tn(cx)},\\ ${tn(cy)}\\right)`;
    const elim = Math.round(p.eliminate);
    const steps = s.steps.slice(0, elim);
    const lines = [s.xTex, s.yTex, '', pointLine];
    const colours = [pal.ink, pal.ink, null, pal.accentText];
    if (elim > 0) {
      lines.push('', '\\text{Eliminate }t\\text{:}', ...steps);
      colours.push(null, pal.muted, ...steps.map((_, i) => (i === steps.length - 1 && s.cartesian && elim >= s.steps.length ? pal.accentText : pal.ink)));
    }
    const tex = wide
      ? [block('eq', lines, W - colW + px * 0.4, COL_TOP, { lineColours: colours })]
      : [block('eq', [`${s.xTex},\\ ${s.yTex}`, pointLine, ...(elim > 0 ? [steps[steps.length - 1]] : [])], r.x, px * 0.3, { size: W < 600 ? 0.8 : 0.95, lineColours: [pal.ink, pal.accentText, pal.ink] })];
    return { version: c.version, panels: [{ id: 'main', rect: r, window: win, zoomable: true, axes: { xTitle: 'x', yTitle: 'y', piX: p.piTicks }, items }], tex };
  },

  polynomial(c) {
    const { s, p, W, H, px, pal } = c;
    const wide = W >= 900;
    const colW = wide ? clamp(W * 0.32, 300, 460) : 0;
    const head = wide ? 0 : px * 3.2;
    const r = plotRect(0, head, W - colW, H - head, px);
    if (p.leading === 0) return { version: c.version, panels: [], tex: [], message: { title: 'The leading coefficient can’t be 0', name: 'a', source: '0', text: 'With a = 0 there is no polynomial of this degree. Choose any other value for a.' } };
    const lo = Math.min(...s.roots);
    const hi = Math.max(...s.roots);
    const [ymin, ymax] = rangeOf(s.f, lo - 0.6, hi + 0.6);
    const M_ = clamp(Math.max(Math.abs(ymin), Math.abs(ymax)), 2, 1e6) * 1.3;
    const items = [{ kind: 'fn', key: 'P', f: s.f, colour: pal.series[0], width: 3.5 }];
    const order = s.roots.map((root, i) => ({ root, i })).sort((u, v) => u.root - v.root);
    order.forEach(({ root, i }) => {
      items.push({ kind: 'point', x: root, y: 0, colour: pal.series[1], drag: `root-${i}` });
      const shared = order.filter((o) => Math.abs(o.root - root) < 1e-9);
      if (shared[0].i === i) {
        const names = shared.map((o) => GREEK[order.indexOf(o)] ?? '•').join(' = ');
        items.push({ kind: 'text', x: root, y: 0, dy: px * 1.9, text: `${names} = ${fx3(root)}`, align: 'center', colour: pal.series[1], font: 'strong' });
      }
    });
    for (const g of s.groups) {
      if (g.multiplicity < 2) continue;
      const word = g.multiplicity === 2 ? 'double root: touches' : g.multiplicity === 3 ? 'triple root: flattens and crosses' : `${g.multiplicity}-fold root`;
      items.push({ kind: 'text', x: g.root, y: 0, dy: -px * 1.4, text: word, align: 'center', colour: pal.ink });
    }
    const n = s.degree;
    const names = COEFFS.slice(0, n + 1);
    const vieta = [`\\textstyle\\sum\\alpha=-\\frac{${names[1]}}{${names[0]}}=${tn(s.sum, 4)}`];
    if (n >= 2) vieta.push(`\\textstyle\\sum\\alpha\\beta=\\frac{${names[2]}}{${names[0]}}=${tn(s.pairSum, 4)}`);
    if (n >= 3) vieta.push(`\\textstyle\\sum\\alpha\\beta\\gamma=-\\frac{${names[3]}}{${names[0]}}=${tn(s.tripleSum, 4)}`);
    if (n >= 4 || n === 1) vieta.push(`\\text{product of roots}=${n % 2 ? '-' : ''}\\frac{${names[n]}}{${names[0]}}=${tn(s.product, 4)}`);
    const coeffLine = `${names.map((nm, i) => `${nm}=${tn(s.coeffs[i], 4)}`).join(',\\ ')}`;
    const lines = [s.factoredTex, `\\phantom{P(x)}=${s.tex.slice(5)}`, coeffLine, '', ...vieta];
    const tex = wide
      ? [block('vieta', lines, W - colW + px * 0.4, COL_TOP, { lineColours: [pal.accentText, pal.ink, pal.muted, null, ...vieta.map(() => pal.ink)], size: 0.95 })]
      : [block('vieta', [s.tex, vieta.slice(0, 2).join(',\\quad ')], r.x, px * 0.3, { size: W < 600 ? 0.75 : 0.9 })];
    return { version: c.version, panels: [{ id: 'main', rect: r, window: { x: [-6, 6], y: [-M_, M_] }, zoomable: true, axes: { xTitle: 'x', yTitle: 'y', piX: p.piTicks }, items }], tex };
  },

  auxiliary(c) {
    const { s, p, W, H, px, pal } = c;
    const wide = W >= 760;
    const triW = wide ? clamp(W * 0.3, 240, 460) : 0;
    const head = px * 3.6;
    const g = plotRect(triW, head, W - triW, H - head, px);
    const yMax = Math.max(2, s.R * 1.3);
    const items = [];
    if (p.showComponents) {
      items.push({ kind: 'fn', key: 'A', f: s.partA, colour: pal.series[1], width: 2.5, dash: [10, 6] });
      items.push({ kind: 'fn', key: 'B', f: s.partB, colour: pal.series[2], width: 2.5, dash: [3, 5] });
    }
    items.push({ kind: 'fn', key: 'sum', f: s.sum, colour: pal.series[0], width: 3.5 });
    for (const xm of [s.xMax - 4 * Math.PI, s.xMax - 2 * Math.PI, s.xMax, s.xMax + 2 * Math.PI]) {
      items.push({ kind: 'point', x: xm, y: s.R, r: 6, colour: pal.series[0] });
    }
    items.push({ kind: 'hline', y: s.R, dash: [4, 6], colour: pal.muted });
    items.push({ kind: 'hline', y: -s.R, dash: [4, 6], colour: pal.muted });
    // Label the maximum furthest from the y-axis, so it never sits on the axis title.
    const xLabel = [s.xMax - 2 * Math.PI, s.xMax].reduce((best, x) => (Math.abs(x) > Math.abs(best) ? x : best));
    items.push({ kind: 'text', x: xLabel, y: s.R, dy: -12, text: `max R = ${fx3(s.R)}`, align: 'center', colour: pal.ink });
    const al = p.angleUnit === 'deg' ? `${tn(s.alphaDeg, 4)}^{\\circ}` : `${tn(s.alpha, 4)}`;
    const sign = (v) => (v < 0 ? '-' : '+');
    const lhs = `${tn(s.a)}\\sin x${sign(s.b)}${tn(Math.abs(s.b))}\\cos x`;
    const formFilled = s.formTex.replace('R', tn(s.R, 4)).replace('\\alpha', al);
    const sq = s.a * s.a + s.b * s.b;
    const rLine = `R=\\sqrt{a^{2}+b^{2}}=${Number.isInteger(sq) && !Number.isInteger(s.R) ? `\\sqrt{${sq}}\\approx ` : ''}${tn(s.R, 4)},\\quad\\alpha=${al}`;
    const tex = [
      { id: 'id', lines: [`${lhs}=${formFilled}`], x: g.x, y: px * 0.3, colour: pal.accentText, box: false, size: W < 600 ? 0.8 : 1.05 },
      { id: 'r', tex: rLine, x: g.x, y: px * 2.0, colour: pal.ink, box: false, size: W < 600 ? 0.75 : 0.9 },
    ];
    if (p.showComponents && W >= 600) {
      tex.push(block('legend', [`\\color{${pal.series[1]}}{\\text{- - -}}\\ ${tn(s.a)}\\sin x`, `\\color{${pal.series[2]}}{\\cdots}\\ ${tn(s.b)}\\cos x`], g.x + g.w - 6, g.y + g.h - 6, { align: 'right', valign: 'bottom', size: 0.85 }));
    }
    const panels = [{ id: 'graph', rect: g, window: { x: [-2 * Math.PI, 2 * Math.PI], y: [-yMax, yMax] }, zoomable: true, axes: { xTitle: 'x', yTitle: 'y', piX: true }, items }];
    if (wide) {
      // The triangle: legs R cos α and R sin α, hypotenuse R, angle α at the origin.
      const X = s.R * Math.cos(s.alpha);
      const Y = s.R * Math.sin(s.alpha);
      const legs = {
        'sin-plus': ['a', 'b'],
        'sin-minus': ['a', '-b'],
        'cos-plus': ['b', '-a'],
        'cos-minus': ['b', 'a'],
      }[p.form];
      const m = 0.35 * s.R + 0.6;
      const tr = { x: px, y: head + px, w: triW - 2 * px, h: H - head - 2 * px };
      const triItems = [
        { kind: 'hline', y: 0, colour: pal.grid, width: 1 },
        { kind: 'vline', x: 0, colour: pal.grid, width: 1 },
        { kind: 'segment', p0: [0, 0], p1: [X, 0], colour: pal.series[1], width: 3 },
        { kind: 'segment', p0: [X, 0], p1: [X, Y], colour: pal.series[2], width: 3 },
        { kind: 'segment', p0: [0, 0], p1: [X, Y], colour: pal.series[0], width: 3.5 },
        { kind: 'arc', cx: 0, cy: 0, r: px * 2, a0: 0, a1: s.alpha, colour: pal.ink, width: 2 },
        { kind: 'point', x: X, y: Y, colour: pal.series[0], drag: 'tip' },
        { kind: 'tex', tex: `R\\cos\\alpha=${legs[0]}=${tn(X)}`, x: X / 2, y: 0, dy: Y >= 0 ? 8 : -8, align: 'center', valign: Y >= 0 ? 'top' : 'bottom', colour: pal.series[1], size: 0.85 },
        { kind: 'tex', tex: `R\\sin\\alpha=${legs[1]}=${tn(Y)}`, x: X, y: Y / 2, dx: X >= 0 ? 8 : -8, align: X >= 0 ? 'left' : 'right', valign: 'middle', colour: pal.series[2], size: 0.85 },
        { kind: 'tex', tex: `R=${tn(s.R)}`, x: X / 2, y: Y / 2, dx: X >= 0 ? -10 : 10, dy: Y >= 0 ? -10 : 10, align: X >= 0 ? 'right' : 'left', valign: Y >= 0 ? 'bottom' : 'top', colour: pal.accentText, size: 0.85 },
        { kind: 'tex', tex: '\\alpha', x: 0, y: 0, dx: px * 2.4 * Math.cos(s.alpha / 2), dy: -px * 2.4 * Math.sin(s.alpha / 2), align: 'center', valign: 'middle', size: 0.9, box: false },
      ];
      const sx = Math.abs(X) > 1e-9 ? Math.sign(X) : 1;
      const sy = Math.abs(Y) > 1e-9 ? Math.sign(Y) : 1;
      const q = 0.08 * s.R;
      if (Math.abs(X) > 1e-9 && Math.abs(Y) > 1e-9) triItems.splice(5, 0, { kind: 'path', points: [[X - sx * q, 0], [X - sx * q, sy * q], [X, sy * q]], colour: pal.ink, width: 1.5 });
      panels.unshift({ id: 'tri', rect: tr, window: { x: [Math.min(0, X) - m, Math.max(0, X) + m], y: [Math.min(0, Y) - m, Math.max(0, Y) + m], equal: true }, axes: false, items: triItems });
    }
    return { version: c.version, panels, tex };
  },

  blackbody(c) {
    const { s, p, W, H, px, pal } = c;
    const head = px * 0.5;
    const r = plotRect(0, head, W, H - head, px);
    const peaks = s.curves.map((cv) => cv.peak * 1e9);
    const xMax = clamp(Math.ceil((3.4 * Math.max(...peaks)) / 500) * 500, 1500, 12000);
    const yTop = Math.max(...s.curves.map((cv) => cv.peakRadiance)) / 1e12;
    const items = [];
    if (p.showVisible) {
      items.push({ kind: 'band', x0: 380, x1: 750, colour: pal.series[5], alpha: 0.14 });
      // Below the y-axis title, which sits at the top left of the plot.
      items.push({ kind: 'text', x: 565, y: yTop * 1.2, dy: px * 3.4, text: 'visible', align: 'center', colour: pal.muted, box: false });
      items.push({ kind: 'text', x: 380, y: yTop * 1.2, dx: -6, dy: px * 3.4, text: 'UV', align: 'right', colour: pal.muted, box: false });
      items.push({ kind: 'text', x: 750, y: yTop * 1.2, dx: 6, dy: px * 3.4, text: 'IR', align: 'left', colour: pal.muted, box: false });
    }
    if (p.showLocus) {
      items.push({ kind: 'fn', key: 'locus', f: (l) => M.planck(l * 1e-9, M.WIEN_B / (l * 1e-9)) / 1e12, domain: [50, xMax], colour: pal.muted, width: 2, dash: [4, 4], asymptotes: false });
    }
    const dashes = [null, [10, 6], [3, 5]];
    s.curves.forEach((cv, i) => {
      const colour = pal.series[i];
      const lp = cv.peak * 1e9;
      const yp = cv.peakRadiance / 1e12;
      items.push({ kind: 'fn', key: `T${i}-${cv.T}`, f: (l) => M.planck(l * 1e-9, cv.T) / 1e12, domain: [1, xMax * 1.2], colour, width: i === 0 ? 3.5 : 2.5, dash: dashes[i], asymptotes: false });
      items.push({ kind: 'vline', x: lp, y0: 0, y1: yp, colour, dash: [4, 4], width: 1.5 });
      items.push({ kind: 'point', x: lp, y: yp, r: 6, colour });
      items.push({ kind: 'text', x: lp, y: yp, dx: 10, dy: -10, text: `${fx3(cv.T, 4)} K`, colour: i === 0 ? pal.accentText : colour, font: 'strong' });
    });
    const main = s.curves[0];
    const tex = [
      block(
        'wien',
        ['\\lambda_{\\max}=\\dfrac{b}{T},\\quad b=2.898\\times10^{-3}\\ \\text{m K}', `\\lambda_{\\max}=${tn(main.peak * 1e9, 3)}\\ \\text{nm at }${tn(p.temperature, 4)}\\ \\text{K}`],
        r.x + r.w - 6,
        r.y + (W >= 480 ? 56 : 6),
        { align: 'right', lineColours: [pal.ink, pal.accentText], size: W < 600 ? 0.75 : 0.95 },
      ),
    ];
    return {
      version: c.version,
      panels: [{ id: 'main', rect: r, window: { x: [0, xMax], y: [0, yTop * 1.2] }, zoomable: true, axes: { xTitle: 'λ (nm)', yTitle: 'Bλ (kW sr⁻¹ m⁻² nm⁻¹)' }, items }],
      tex,
    };
  },

  inequality(c) {
    const { s, p, W, H, px, pal } = c;
    if (s.error) return errorScene(s, c);
    const lineH = Math.max(px * 6, H * 0.24);
    const head = px * 3.4;
    const r = plotRect(0, head, W, H - head - lineH, px);
    const nl = plotRect(0, H - lineH, W, lineH, px);
    nl.x = r.x;
    nl.w = r.w;
    const big = 1e6;
    const items = [];
    for (const pc of s.pieces) {
      if (pc.a === pc.b) continue;
      items.push({ kind: 'band', x0: Math.max(pc.a, -big), x1: Math.min(pc.b, big), colour: pal.series[2], alpha: 0.12 });
    }
    for (const cp of s.critical) items.push({ kind: 'vline', x: cp.x, dash: [3, 5], colour: pal.muted, width: 1.5 });
    const rightConst = /^\s*0\s*$/.test(p.ineqRight);
    if (!rightConst) items.push({ kind: 'fn', key: 'R', f: s.right, colour: pal.series[1], width: 2.5, dash: [10, 6] });
    items.push({ kind: 'fn', key: 'L', f: s.left, colour: pal.series[0], width: 3.5 });
    // Number line.
    const lineItems = [];
    for (const pc of s.pieces) {
      const a = Math.max(pc.a, -big);
      const b = Math.min(pc.b, big);
      if (pc.a === pc.b) continue;
      lineItems.push({ kind: 'segment', p0: [a, 0], p1: [b, 0], colour: pal.series[0], width: 7 });
    }
    for (const cp of s.critical) {
      const inSet = s.pieces.some((pc) => (pc.a === cp.x && pc.closedA) || (pc.b === cp.x && pc.closedB));
      lineItems.push({ kind: 'point', x: cp.x, y: 0, r: 8, colour: pal.series[0], hollow: !inSet });
      lineItems.push({ kind: 'text', x: cp.x, y: 0, dy: px * 1.8, text: fx3(cp.x) + (cp.kind === 'pole' ? ' (undefined)' : ''), align: 'center', colour: pal.ink, px: px * 0.9 });
    }
    for (const rg of s.regions) {
      if (!Number.isFinite(rg.value)) continue;
      lineItems.push({ kind: 'text', x: rg.test, y: 0, dy: -px * 0.9, text: rg.value > 0 ? '+' : '−', align: 'center', colour: rg.ok ? pal.accentText : pal.muted, font: 'strong', px: px * 1.4, box: false });
    }
    const tex = [
      { id: 'stmt', lines: [s.statementTex, `\\text{Solution: }${s.solutionTex}`], lineColours: [pal.ink, pal.accentText], x: r.x, y: px * 0.2, box: false, size: W < 600 ? 0.8 : 1 },
    ];
    if (W >= 760) tex.push({ id: 'key', tex: '\\text{On the number line, + and − give the sign of (left − right) in each region}', x: nl.x + nl.w, y: nl.y + nl.h - 2, align: 'right', valign: 'bottom', size: 0.7, colour: pal.muted, box: false });
    return {
      version: c.version,
      panels: [
        { id: 'main', rect: r, window: { x: [-6, 6], y: [-6, 6] }, zoomable: true, zoomKey: 'ineq', axes: { xTitle: 'x', yTitle: 'y', piX: p.piTicks }, items },
        { id: 'line', rect: nl, window: { x: [-6, 6], y: [-1, 1] }, linkX: 'main', axes: { hideY: true, grid: false, piX: p.piTicks }, items: lineItems },
      ],
      tex,
    };
  },

  'inverse-trig'(c) {
    const { s, p, W, H, px, pal } = c;
    const wide = W >= 860 && p.showDerivative;
    const head = px * 3.4;
    const leftW = wide ? W * 0.58 : W;
    const r = plotRect(0, head, leftW, H - head, px);
    const items = [{ kind: 'line', p0: [0, 0], p1: [1, 1], dash: [8, 6], colour: pal.muted }];
    if (p.showFull) items.push({ kind: 'fn', key: `full-${p.trigFn}`, f: s.f, colour: pal.series[1], width: 2, dash: [3, 6], asymptotes: false });
    const [r0, r1] = s.restrict;
    const eps = p.trigFn === 'tan' ? 1e-9 : 0;
    items.push({ kind: 'fn', key: `restricted-${p.trigFn}`, f: s.f, domain: [r0 + eps, r1 - eps], colour: pal.series[1], width: 3.5, asymptotes: p.trigFn === 'tan' });
    items.push({ kind: 'fn', key: `inv-${p.trigFn}`, f: s.inv, colour: pal.series[0], width: 3.5, asymptotes: false });
    if (p.trigFn === 'tan') {
      items.push({ kind: 'hline', y: Math.PI / 2, dash: [8, 6], colour: pal.accentText, width: 1.5 });
      items.push({ kind: 'hline', y: -Math.PI / 2, dash: [8, 6], colour: pal.accentText, width: 1.5 });
    }
    const { x0, y0, slope, fSlope } = s;
    const tangent = (px0, py0, m, L = 0.9) => {
      const d = L / Math.hypot(1, m);
      return { kind: 'segment', p0: [px0 - d, py0 - m * d], p1: [px0 + d, py0 + m * d], colour: pal.ink, width: 2 };
    };
    items.push(tangent(x0, y0, slope), tangent(y0, x0, fSlope));
    items.push({ kind: 'segment', p0: [x0, y0], p1: [y0, x0], dash: [2, 5], colour: pal.muted, width: 1.5 });
    items.push({ kind: 'point', x: y0, y: x0, r: 7, hollow: true, colour: pal.series[1] });
    items.push({ kind: 'point', x: x0, y: y0, colour: pal.series[0], drag: 'trigProbe' });
    items.push({ kind: 'text', x: x0, y: y0, dx: 14, dy: -12, text: `slope ${fx3(slope)}`, colour: pal.accentText });
    items.push({ kind: 'text', x: y0, y: x0, dx: 14, dy: 22, text: `slope ${fx3(fSlope)}`, colour: pal.series[1] });
    const tex = [{ id: 'fns', lines: [s.tex, s.invTex], lineColours: [pal.series[1], pal.accentText], x: r.x, y: px * 0.2, box: false, size: W < 600 ? 0.8 : 1 }];
    const panels = [{ id: 'main', rect: r, window: { x: [-3.6, 3.6], y: [-2.2, 3.6], equal: true }, zoomable: true, axes: { xTitle: 'x', yTitle: 'y', piX: true, piY: true }, items }];
    if (wide) {
      const r2 = plotRect(leftW + px, head, W - leftW - px, H - head, px);
      const isTan = p.trigFn === 'tan';
      const dItems = [
        { kind: 'fn', key: `d-${p.trigFn}`, f: s.dInv, colour: pal.series[2], width: 3 },
        { kind: 'vline', x: x0, y0: 0, y1: slope, dash: [4, 5], colour: pal.muted },
        { kind: 'point', x: x0, y: slope, colour: pal.series[2], drag: 'trigProbe' },
        { kind: 'text', x: x0, y: slope, dx: 12, dy: -12, text: fx3(slope), colour: pal.ink, font: 'strong' },
      ];
      panels.push({ id: 'deriv', rect: r2, window: isTan ? { x: [-5, 5], y: [-0.4, 1.4] } : { x: [-1.6, 1.6], y: [-4.5, 4.5] }, zoomable: true, axes: { xTitle: 'x', yTitle: 'dy/dx' }, items: dItems });
      tex.push({ id: 'd', lines: [s.dTex], x: r2.x, y: px * 0.2, colour: pal.series[2], box: false, size: 0.95 });
    } else if (p.showDerivative) {
      tex.push(block('d', [s.dTex, `\\text{at }x=${tn(x0)}:\\ ${tn(slope)}`], r.x + r.w - 6, r.y + r.h - 6, { align: 'right', valign: 'bottom', size: W < 600 ? 0.75 : 0.9 }));
    }
    return { version: c.version, panels, tex };
  },

  substitution(c) {
    const { s, p, W, H, px, pal } = c;
    if (s.error) return errorScene(s, c);
    const side = W >= 640;
    const head = px * (side ? 6.4 : 3.2);
    const lo = Math.min(s.a, s.b);
    const hi = Math.max(s.a, s.b);
    const uLo = Math.min(s.uA, s.uB);
    const uHi = Math.max(s.uA, s.uB);
    const xWin = span(lo, hi, 0.25, 1);
    const uWin = span(uLo, uHi, 0.25, 1);
    const [i0, i1] = rangeOf(s.integrand, xWin[0], xWin[1]);
    const [f0, f1] = rangeOf(s.f, uWin[0], uWin[1]);
    const yWin = (a, b) => span(Math.min(0, a), Math.max(0, b), 0.15, 1);
    let r1;
    let r2;
    if (side) {
      const w = (W - px) / 2;
      r1 = plotRect(0, head, w, H - head, px);
      r2 = plotRect(w + px, head, w, H - head, px);
    } else {
      const h = (H - head) / 2;
      r1 = plotRect(0, head, W, h, px);
      r2 = plotRect(0, head + h, W, h, px);
    }
    const xItems = [
      { kind: 'fillUnder', key: 'ix', f: s.integrand, a: s.a, b: s.b, colour: pal.series[0], alpha: 0.25 },
      { kind: 'fn', key: 'integrand', f: s.integrand, colour: pal.series[0], width: 3.5 },
      { kind: 'vline', x: s.a, dash: [4, 5], colour: pal.muted },
      { kind: 'vline', x: s.b, dash: [4, 5], colour: pal.muted },
      { kind: 'point', x: s.a, y: 0, square: true, r: 8, colour: pal.ink, drag: 'subA' },
      { kind: 'point', x: s.b, y: 0, square: true, r: 8, colour: pal.ink, drag: 'subB' },
    ];
    const uItems = [
      { kind: 'fillUnder', key: 'iu', f: s.f, a: s.uA, b: s.uB, colour: pal.series[1], alpha: 0.25 },
      { kind: 'fn', key: 'f', f: s.f, colour: pal.series[1], width: 3.5 },
      { kind: 'vline', x: s.uA, dash: [4, 5], colour: pal.muted },
      { kind: 'vline', x: s.uB, dash: [4, 5], colour: pal.muted },
      { kind: 'point', x: s.uA, y: 0, r: 7, hollow: true, colour: pal.ink },
      { kind: 'point', x: s.uB, y: 0, r: 7, hollow: true, colour: pal.ink },
    ];
    const size = W < 600 ? 0.72 : 0.9;
    const tex = side
      ? [
          { id: 'lx', lines: [s.integrandTex, `\\int_{${tn(s.a)}}^{${tn(s.b)}}f(g(x))\\,g'(x)\\,dx=${tn(s.areaX, 4)}`], lineColours: [pal.ink, pal.accentText], x: r1.x, y: px * 0.2, box: false, size },
          { id: 'lu', lines: [`${s.fTex},\\ \\ ${s.gTex}`, `${s.dgTex}`, `\\int_{${tn(s.uA)}}^{${tn(s.uB)}}f(u)\\,du=${tn(s.areaU, 4)}`], lineColours: [pal.ink, pal.ink, pal.series[1]], x: r2.x, y: px * 0.2, box: false, size },
        ]
      : [{ id: 'l', lines: [`\\int_{${tn(s.a)}}^{${tn(s.b)}}f(g(x))g'(x)\\,dx=${tn(s.areaX, 4)}=\\int_{${tn(s.uA)}}^{${tn(s.uB)}}f(u)\\,du`], x: r1.x, y: px * 0.2, box: false, size, colour: pal.accentText }];
    return {
      version: c.version,
      panels: [
        { id: 'x', rect: r1, window: { x: xWin, y: yWin(i0, i1) }, zoomable: true, axes: { xTitle: 'x', yTitle: 'y', piX: p.piTicks }, items: xItems },
        { id: 'u', rect: r2, window: { x: uWin, y: yWin(f0, f1) }, zoomable: true, axes: { xTitle: 'u', yTitle: 'y', piX: p.piTicks }, items: uItems },
      ],
      tex,
    };
  },

  'by-parts'(c) {
    const { s, p, W, H, px, pal } = c;
    if (s.error) return errorScene(s, c);
    const wide = W >= 900;
    const colW = wide ? clamp(W * 0.36, 300, 520) : 0;
    const head = wide ? 0 : px * 3.4;
    const r = plotRect(0, head, W - colW, H - head, px);
    const size = W < 600 ? 0.75 : 0.95;
    if (s.mode === 'reduction') {
      const [a, b] = s.range;
      const [, top] = rangeOf(s.f, a, b);
      const items = [
        { kind: 'fillUnder', key: `ri-${s.n}-${p.reduction}`, f: s.f, a, b, colour: pal.series[0], alpha: 0.25 },
        { kind: 'fn', key: `rf-${s.n}-${p.reduction}`, f: s.f, colour: pal.series[0], width: 3.5, domain: [a, b] },
      ];
      const R = M.REDUCTIONS[p.reduction];
      const chainLines = s.chain.map(({ n, value }, i) => {
        if (i === 0) return `I_{${n}}=${p.reduction === 'sin' ? (n === 0 ? '\\frac{\\pi}{2}' : '1') : 'e-1'}=${tn(value, 4)}`;
        const step = p.reduction === 'sin' ? `\\frac{${n - 1}}{${n}}\\,I_{${n - 2}}` : `e-${n}\\,I_{${n - 1}}`;
        return `I_{${n}}=${step}=${tn(value, 4)}`;
      });
      const shown = chainLines.slice(-7);
      const lines = [R.tex, R.ruleTex, '', ...(chainLines.length > shown.length ? ['\\vdots'] : []), ...shown, '', `\\text{direct numerical value: }${tn(s.reductionNumeric, 4)}`];
      const colours = lines.map((l, i) => (i === lines.length - 3 ? pal.accentText : l.startsWith('\\text{direct') ? pal.muted : pal.ink));
      const tex = wide ? [block('red', lines, W - colW + px * 0.4, COL_TOP, { lineColours: colours, size })] : [block('red', [R.ruleTex, shown[shown.length - 1]], r.x, px * 0.2, { size })];
      return {
        version: c.version,
        panels: [{ id: 'main', rect: r, window: { x: span(a, b, 0.08, 0.5), y: [-0.1 * top, top * 1.2] }, zoomable: true, axes: { xTitle: 'x', yTitle: 'y', piX: p.reduction === 'sin' }, items }],
        tex,
      };
    }
    // Area picture in the (u, v) plane.
    const pts = M.sampleParametric(s.u, s.v, s.a, s.b, 400).flat();
    const us = pts.map((q) => q[0]);
    const vs = pts.map((q) => q[1]);
    const win = { x: span(Math.min(0, ...us), Math.max(0, ...us), 0.12, 0.5), y: span(Math.min(0, ...vs), Math.max(0, ...vs), 0.12, 0.5), equal: true };
    const [ua, va] = s.start;
    const [ub, vb] = s.end;
    const curve = pts.map(([u, v]) => [u, v]);
    const vdu = [[ua, 0], ...curve, [ub, 0]];
    const udv = [[0, va], ...curve, [0, vb]];
    const items = [
      { kind: 'path', points: vdu, close: true, fill: pal.series[1], alpha: 0.22, colour: null },
      { kind: 'path', points: udv, close: true, fill: pal.series[0], alpha: 0.22, colour: null },
      { kind: 'path', points: [[0, 0], [ub, 0], [ub, vb], [0, vb]], close: true, colour: pal.ink, width: 1.5, dash: [6, 5] },
    ];
    if (Math.abs(ua * va) > 1e-12) items.push({ kind: 'path', points: [[0, 0], [ua, 0], [ua, va], [0, va]], close: true, colour: pal.muted, width: 1.5, dash: [2, 5] });
    items.push({ kind: 'path', points: curve, colour: pal.ink, width: 3.5 });
    items.push({ kind: 'point', x: ua, y: va, r: 6, colour: pal.ink }, { kind: 'point', x: ub, y: vb, r: 6, colour: pal.ink });
    items.push({ kind: 'text', x: ua, y: va, dx: 10, dy: 20, text: `x = ${fx3(s.a)}`, colour: pal.muted });
    items.push({ kind: 'text', x: ub, y: vb, dx: 10, dy: -10, text: `x = ${fx3(s.b)}`, colour: pal.muted });
    const [cu, cv] = centroid(vdu);
    const [du_, dv_] = centroid(udv);
    items.push({ kind: 'tex', tex: '\\int v\\,du', x: cu, y: cv, align: 'center', valign: 'middle', colour: pal.series[1], box: false });
    items.push({ kind: 'tex', tex: '\\int u\\,dv', x: du_, y: dv_, align: 'center', valign: 'middle', colour: pal.accentText, box: false });
    const lines = [
      `${s.uTex},\\quad ${s.vTex}`,
      `${s.duTex},\\quad ${s.dvTex}`,
      '',
      `\\int_{${tn(s.a)}}^{${tn(s.b)}}u\\,dv=${tn(s.intUdv, 4)}`,
      `\\int_{${tn(s.a)}}^{${tn(s.b)}}v\\,du=${tn(s.intVdu, 4)}`,
      `\\Big[uv\\Big]_{${tn(s.a)}}^{${tn(s.b)}}=${tn(s.boundary, 4)}`,
      '',
      '\\int u\\,dv=\\Big[uv\\Big]-\\int v\\,du',
    ];
    const colours = [pal.ink, pal.muted, null, pal.accentText, pal.series[1], pal.ink, null, pal.ink];
    const tex = wide ? [block('parts', lines, W - colW + px * 0.4, COL_TOP, { lineColours: colours, size })] : [block('parts', [lines[0], lines[7]], r.x, px * 0.2, { size })];
    return { version: c.version, panels: [{ id: 'main', rect: r, window: win, zoomable: true, axes: { xTitle: 'u', yTitle: 'v', piX: p.piTicks }, items }], tex };
  },

  'partial-fractions'(c) {
    const { s, p, W, H, px, pal } = c;
    if (s.error) return errorScene(s, c);
    const head = px * 4.2;
    const r = plotRect(0, head, W, H - head, px);
    const dashes = [[10, 6], [3, 5], [14, 4, 3, 4], [6, 3]];
    const items = [];
    const legend = [];
    if (p.showTerms) {
      s.termFns.forEach((f, i) => {
        const colour = pal.series[1 + (i % 4)];
        items.push({ kind: 'fn', key: `t${i}`, f, colour, width: 2.5, dash: dashes[i % 4], asymptotes: false });
        legend.push({ tex: `\\frac{A_{${i + 1}}}{${s.termDenTex[i]}},\\ A_{${i + 1}}=${M.fracTex(s.terms[i].coef)}`, colour });
      });
      if (s.hasQuotient) {
        items.push({ kind: 'fn', key: 'q', f: s.quotientFn, colour: pal.series[5], width: 2.5, dash: [2, 4], asymptotes: false });
        legend.push({ tex: s.quotientTex, colour: pal.series[5] });
      }
    }
    items.push({ kind: 'fn', key: 'f', f: s.f, colour: pal.series[0], width: 3.5 });
    p.pfRoots.forEach((root, i) => items.push({ kind: 'point', x: root, y: 0, square: true, r: 8, colour: pal.ink, drag: `pole-${i}` }));
    const size = W < 600 ? 0.75 : 1;
    const tex = [{ id: 'eq', tex: `${s.lhsTex}=${s.rhsTex}`, x: r.x, y: px * 0.2, colour: pal.accentText, box: false, size }];
    if (legend.length && W >= 600) {
      tex.push(block('legend', legend.map((l) => `\\color{${l.colour}}{\\rule[0.35em]{1.4em}{3pt}}\\ \\ ${l.tex}`), r.x + r.w - 6, r.y + (W >= 480 ? 56 : 6), { align: 'right', size: 0.85 }));
    }
    return { version: c.version, panels: [{ id: 'main', rect: r, window: { x: [-6, 6], y: [-6, 6] }, zoomable: true, axes: { xTitle: 'x', yTitle: 'y', piX: p.piTicks }, items }], tex };
  },

  heating(c) {
    const { s, p, W, H, px, pal, state } = c;
    const head = px * 3.6;
    const r = plotRect(0, head, W, H - head, px);
    const t = M.heatingTime(s, state.n);
    const T = s.T(t);
    const items = [];
    const size = W < 600 ? 0.78 : 1;
    let lines;
    let yWin;
    if (s.mode === 'cooling') {
      const lo = Math.min(p.ambient, p.coolStart);
      const hi = Math.max(p.ambient, p.coolStart);
      yWin = [lo - 0.15 * (hi - lo) - 2, hi + 0.15 * (hi - lo) + 2];
      items.push({ kind: 'hline', y: p.ambient, dash: [10, 6], colour: pal.series[1], width: 2 });
      items.push({ kind: 'text', x: s.total, y: p.ambient, dx: -8, dy: -10, text: `surroundings ${fx3(p.ambient)} °C`, align: 'right', colour: pal.series[1] });
      for (let k = 1; k <= 3; k++) {
        const th = k * s.halfTime;
        if (th > s.total) break;
        items.push({ kind: 'vline', x: th, y0: p.ambient, y1: s.T(th), dash: [2, 5], colour: pal.muted });
        items.push({ kind: 'text', x: th, y: s.T(th), dx: 8, dy: -10, text: `${k} × t½`, colour: pal.muted });
      }
      items.push({ kind: 'fn', key: 'cool-full', f: s.T, domain: [0, s.total], colour: pal.muted, width: 2, dash: [6, 6], asymptotes: false });
      items.push({ kind: 'fn', f: s.T, domain: [0, Math.max(t, 1e-9)], colour: pal.series[0], width: 3.5, asymptotes: false });
      lines = ['T=T_{\\text{env}}+\\left(T_{0}-T_{\\text{env}}\\right)e^{-kt}', `t_{1/2}=\\dfrac{\\ln 2}{k}=${tn(s.halfTime, 3)}\\ \\text{s}`, `t=${tn(t, 3)}\\ \\text{s},\\quad T=${tn(T, 3)}\\ ^{\\circ}\\text{C}`];
    } else {
      const lo = Math.min(p.startTemp, 0);
      const hi = Math.max(p.endTemp, 100);
      yWin = [lo - 0.1 * (hi - lo), hi + 0.12 * (hi - lo)];
      // Reference lines, labelled where the curve is not: 0 °C at the right end, 100 °C at the left.
      items.push({ kind: 'hline', y: 0, dash: [4, 6], colour: pal.grid, width: 1.5 });
      items.push({ kind: 'text', x: s.total, y: 0, dy: px * 1.4, text: 'melting point 0 °C', align: 'right', colour: pal.muted, box: false });
      items.push({ kind: 'hline', y: 100, dash: [4, 6], colour: pal.grid, width: 1.5 });
      items.push({ kind: 'text', x: 0, y: 100, dx: 8, dy: -8, text: 'boiling point 100 °C', colour: pal.muted, box: false });
      const path = s.stages.length ? [[s.stages[0].t0, s.stages[0].T0], ...s.stages.map((st) => [st.t1, st.T1])] : [];
      items.push({ kind: 'path', points: path, colour: pal.muted, width: 2, dash: [6, 6] });
      const traced = [];
      for (const st of s.stages) {
        if (!traced.length) traced.push([st.t0, st.T0]);
        if (t >= st.t1) traced.push([st.t1, st.T1]);
        else {
          traced.push([t, T]);
          break;
        }
      }
      items.push({ kind: 'path', points: traced, colour: pal.series[0], width: 3.5 });
      const names = { solid: 'ice', melting: 'melting', liquid: 'water', boiling: 'boiling', gas: 'steam' };
      for (const st of s.stages) {
        const mid = [(st.t0 + st.t1) / 2, (st.T0 + st.T1) / 2];
        const wide = (st.t1 - st.t0) / s.total > 0.04;
        if (wide) items.push({ kind: 'text', x: mid[0], y: mid[1], dy: st.T0 === st.T1 ? -12 : 0, dx: st.T0 === st.T1 ? 0 : -10, text: names[st.kind], align: st.T0 === st.T1 ? 'center' : 'right', colour: pal.ink });
      }
      const st = M.heatingStageAt(s.stages, t);
      const formula = {
        solid: `Q=mc_{\\text{ice}}\\Delta T`,
        melting: `Q=mL_{f}=${tn(p.mass)}\\times${tn(p.latentFusion)}=${tn(p.mass * p.latentFusion)}\\ \\text{J}`,
        liquid: `Q=mc_{\\text{water}}\\Delta T`,
        boiling: `Q=mL_{v}=${tn(p.mass)}\\times${tn(p.latentVaporisation)}=${tn(p.mass * p.latentVaporisation)}\\ \\text{J}`,
        gas: `Q=mc_{\\text{steam}}\\Delta T`,
      }[st?.kind ?? 'solid'];
      lines = [`${formula}`, `t=${tn(t, 3)}\\ \\text{s},\\quad T=${tn(T, 3)}\\ ^{\\circ}\\text{C},\\quad Q=Pt=${tn(p.power * t, 3)}\\ \\text{J}`];
    }
    items.push({ kind: 'point', x: t, y: T, r: 8, colour: pal.series[0] });
    const tex = [{ id: 'heat', lines, lineColours: [pal.ink, pal.accentText, pal.accentText], x: r.x, y: px * 0.2, box: false, size }];
    return {
      version: c.version,
      panels: [{ id: 'main', rect: r, window: { x: [0, s.total * 1.04], y: yWin }, zoomable: true, axes: { xTitle: 't (s)', yTitle: 'T (°C)' }, items }],
      tex,
    };
  },
};

/** Build the scene for a setup. ctx: { s (solved), p (params), state, version, W, H, px, pal }. */
export function buildScene(setup, ctx) {
  return BUILDERS[setup](ctx);
}
