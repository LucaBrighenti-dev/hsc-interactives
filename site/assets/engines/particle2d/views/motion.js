// One-dimensional motion views: braking, resisted motion, SHM and the motion-graphs cart.
import { q, si, rich, header, subheader, niceCeil, niceRange, polyline, clipTo, line, disc, vector, viewport, axisMargins, label, arrow, rect, graph, marker, barRows, textWidth } from './common.js';
import { niceTicks, tickText } from '../../../engine-kit.js';
import { cartTarget } from '../model.js';
import { formatPlain } from '../../../format.js';

const minMax = (rows, i, extra = []) => {
  let lo = Infinity;
  let hi = -Infinity;
  for (const r of rows) {
    if (r[i] < lo) lo = r[i];
    if (r[i] > hi) hi = r[i];
  }
  for (const v of extra) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return [lo, hi];
};

/** A horizontal distance scale (ticks and labels) along y = Y between world x0 and x1. */
function distanceScale(ctx, vp, Y, pal, px, title) {
  const { ticks } = niceTicks(vp.x[0], vp.x[1], Math.max(3, Math.floor(vp.rect.w / (px * 5))));
  ctx.save();
  ctx.strokeStyle = pal.axis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const t of ticks) {
    const X = Math.round(vp.toX(t)) + 0.5;
    ctx.moveTo(X, Y);
    ctx.lineTo(X, Y + 8);
  }
  ctx.stroke();
  ctx.restore();
  for (const t of ticks) label(ctx, tickText(t), vp.toX(t), Y + 10, { colour: pal.muted, px, kind: 'mono', align: 'center', baseline: 'top' });
  if (title) label(ctx, title, vp.rect.x + vp.rect.w, Y - 8, { colour: pal.ink, px, align: 'right', baseline: 'bottom', box: pal.bg });
}

/** Side view of a car whose front bumper is at X (px), sitting on the road at Y. */
function car(ctx, X, Y, len, pal) {
  const h = len * 0.28;
  const wheel = Math.max(4, len * 0.1);
  ctx.fillStyle = pal.series[0];
  ctx.fillRect(X - len, Y - wheel - h, len, h);
  ctx.fillRect(X - len * 0.72, Y - wheel - h - h * 0.75, len * 0.46, h * 0.75);
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(X - len, Y - wheel - h, len, h);
  ctx.strokeRect(X - len * 0.72, Y - wheel - h - h * 0.75, len * 0.46, h * 0.75);
  disc(ctx, X - len * 0.78, Y - wheel, wheel, pal.ink);
  disc(ctx, X - len * 0.22, Y - wheel, wheel, pal.ink);
}

// ------------------------------------------------------------------------------------------- braking

export function drawBraking(ctx, S, st, p, ahead, pal) {
  const { W, H, px, pad } = S;
  const c = st.cfg;
  const top = header(ctx, S, pal, `${q(c.v0, 'm/s')} (${q(c.v0 * 3.6, 'km/h')}) · μ = ${formatPlain(c.mu)} · g = ${formatPlain(c.g)} m/s² · reaction ${formatPlain(c.tr)} s`, `t = ${q(st.t, 's')}`);
  const run = ahead ?? st;
  const stopX = run.ev.stop?.x ?? st.y[0];
  const xHi = niceCeil(Math.max(5, stopX, st.y[0]) * 1.08);

  // Road strip.
  const roadH = Math.max(px * 7, (H - top) * 0.36);
  const road = rect(pad + px * 4, top, W - 2 * pad - px * 5, roadH);
  const vp = viewport({ x: [-0.02 * xHi, xHi], y: [0, 1], rect: road });
  const Yroad = road.y + road.h * 0.5;
  line(ctx, road.x, Yroad, road.x + road.w, Yroad, pal.ink, 2.5);
  distanceScale(ctx, vp, Yroad, pal, px, null);
  label(ctx, 'distance (m)', road.x + road.w, Yroad + px * 2.4, { colour: pal.ink, px, align: 'right', baseline: 'top' });

  // Reaction (dashed, blue) and braking (solid, orange) segments under the road.
  const x = st.y[0];
  const bs = st.ev.brakeStart;
  const Yseg = Yroad + px * 3.9;
  const reactEnd = bs ? bs.x : x;
  if (reactEnd > 0) {
    line(ctx, vp.toX(0), Yseg, vp.toX(reactEnd), Yseg, pal.series[1], 8, [10, 6]);
    if (!S.narrow) label(ctx, `reaction ${q(reactEnd, 'm')}`, vp.toX(0), Yseg + px * 0.6, { colour: pal.ink, px, baseline: 'top' });
  }
  if (bs && x > bs.x) {
    line(ctx, vp.toX(bs.x), Yseg, vp.toX(x), Yseg, pal.series[0], 8);
    if (!S.narrow) label(ctx, `braking ${q(x - bs.x, 'm')}`, vp.toX(x), Yseg + px * 0.6, { colour: pal.ink, px, align: 'right', baseline: 'top' });
  }
  if (bs) line(ctx, vp.toX(bs.x), Yroad - px * 3.2, vp.toX(bs.x), Yroad, pal.muted, 1.5, [4, 4]);
  if (bs && bs.x > 0 && !S.narrow) label(ctx, 'brakes on', vp.toX(bs.x), Yroad - px * 3.3, { colour: pal.muted, px, align: 'center', baseline: 'bottom' });

  const carLen = Math.max(px * 3.4, vp.scaleX * 4.5);
  car(ctx, vp.toX(x), Yroad, carLen, pal);
  if (st.y[1] > 0) vector(ctx, pal, vp.toX(x) + 6, Yroad - carLen * 0.62, Math.max(px * 1.5, px * 4 * (st.y[1] / Math.max(c.v0, 1))), 0, `v = ${q(st.y[1], 'm/s')}`, { colour: pal.ink, px });
  if (st.ev.stop) label(ctx, `Stopped after ${q(st.ev.stop.x, 'm')} in ${q(st.ev.stop.t, 's')}`, road.x, road.y + px * 0.2, { colour: pal.ink, px, kind: 'strong', baseline: 'top', box: pal.bg });

  // v–t graph (area = distance) and energy bars.
  const m = axisMargins(px);
  const lowTop = road.y + road.h + px * 1.2;
  const lowH = H - lowTop - pad;
  const gW = S.narrow ? W - 2 * pad : (W - 2 * pad) * 0.58;
  const gRect = rect(pad + m.left, lowTop, gW - m.left - px, lowH - m.bottom);
  const T = Math.max(0.5, run.ev.stop?.t ?? st.t);
  graph(ctx, gRect, pal, px, { x: [0, niceCeil(T * 1.08)], y: [0, niceCeil(Math.max(1, c.v0) * 1.15)], xTitle: 't (s)', yTitle: 'v (m/s)' }, (gv) => {
    const rows = st.hist;
    const fill = (from, to, colour) => {
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.moveTo(gv.toX(from), gv.toY(0));
      for (const r of rows) if (r[0] >= from && r[0] <= to) ctx.lineTo(gv.toX(r[0]), gv.toY(r[2]));
      if (st.t >= from && st.t <= to) ctx.lineTo(gv.toX(st.t), gv.toY(st.y[1]));
      ctx.lineTo(gv.toX(Math.min(to, st.t)), gv.toY(0));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    const tb = bs ? bs.t : st.t;
    fill(0, tb, pal.series[1]);
    if (bs) fill(tb, st.t, pal.series[0]);
    polyline(ctx, gv, rows, (r) => r[0], (r) => r[2], { colour: pal.series[0], width: 3, extra: [st.t, st.y[1]] });
    marker(ctx, gv.toX(st.t), gv.toY(st.y[1]), pal.ink);
    if (!S.narrow) label(ctx, 'area under the graph = distance', gRect.x + gRect.w - 4, gRect.y + px * 2.2, { colour: pal.muted, px, align: 'right', baseline: 'top', box: pal.bg });
  });

  if (S.narrow) return;
  const o = { ke: 0.5 * c.m * st.y[1] ** 2, w: c.m * c.decel * (bs ? Math.max(0, x - bs.x) : 0), ke0: 0.5 * c.m * c.v0 * c.v0 };
  const bx = pad + gW + px;
  const bRect = rect(bx, lowTop + px * 0.4, W - bx - pad, Math.min(lowH * 0.5, px * 6.4));
  label(ctx, 'Energy', bx, lowTop, { colour: pal.ink, px, kind: 'strong', baseline: 'bottom' });
  barRows(ctx, bRect, pal, px, [
    { label: 'Kinetic', value: o.ke, colour: pal.series[0], text: si(o.ke, 'J') },
    { label: 'Heat', value: o.w, colour: pal.series[1], text: si(o.w, 'J') },
    { label: 'Total', value: o.ke + o.w, colour: pal.ink, dashed: true, text: si(o.ke + o.w, 'J') },
  ], Math.max(o.ke0, 1));
  let y = bRect.y + bRect.h + px * 1.4;
  label(ctx, `Friction force μmg = ${si(c.m * c.decel, 'N')}`, bx, y, { colour: pal.ink, px });
  y += px * 1.5;
  label(ctx, `Rotor temperature rise ${q(o.w / (c.rotorMass * c.rotorHeat), 'K')}`, bx, y, { colour: pal.ink, px, kind: 'strong' });
}

// ------------------------------------------------------------------------------------- resisted motion

/** Graph choices shared by resisted motion and SHM; rows are [t, x, v, a]. */
const GRAPHS = {
  xt: { gx: (r) => r[0], gy: (r) => r[1], xTitle: 't (s)', yTitle: 'x (m)', time: true },
  vt: { gx: (r) => r[0], gy: (r) => r[2], xTitle: 't (s)', yTitle: 'v (m/s)', time: true },
  at: { gx: (r) => r[0], gy: (r) => r[3], xTitle: 't (s)', yTitle: 'ẍ (m/s²)', time: true },
  vx: { gx: (r) => r[1], gy: (r) => r[2], xTitle: 'x (m)', yTitle: 'v (m/s)', time: false },
  v2x: { gx: (r) => r[1], gy: (r) => r[2] * r[2], xTitle: 'x (m)', yTitle: 'v² (m²/s²)', time: false },
};

/**
 * One graph of a run: the whole run faint (preview), the part so far in orange, the current point, and an
 * optional dashed comparison curve. Returns the viewport.
 */
function runGraph(ctx, box, pal, px, choice, st, ahead, opts = {}) {
  const G = GRAPHS[choice] ?? GRAPHS.xt;
  const rows = ahead?.hist ?? st.hist;
  const now = st.hist.length ? [st.t, st.y[0], st.y[1], opts.accNow ?? 0] : null;
  const xs = [];
  const ys = [];
  for (const r of rows) {
    xs.push(G.gx(r));
    ys.push(G.gy(r));
  }
  if (now) {
    xs.push(G.gx(now));
    ys.push(G.gy(now));
  }
  for (const v of opts.extraY ?? []) ys.push(v);
  const xr = G.time ? [0, opts.duration] : niceRange(Math.min(...xs), Math.max(...xs), 1, 0.08);
  const yr = niceRange(Math.min(0, ...ys), Math.max(0, ...ys), choice === 'v2x' ? 1 : 1, 0.1);
  return graph(ctx, box, pal, px, { x: xr, y: yr, xTitle: G.xTitle, yTitle: G.yTitle }, (gv) => {
    if (ahead) polyline(ctx, gv, ahead.hist, G.gx, G.gy, { colour: pal.grid, width: 2.5 });
    if (opts.compare) polyline(ctx, gv, opts.compare, G.gx, G.gy, { colour: pal.muted, width: 2, dash: [8, 6] });
    opts.under?.(gv);
    const recent = G.time || !opts.period ? st.hist : st.hist.filter((r) => r[0] >= st.t - opts.period);
    polyline(ctx, gv, recent, G.gx, G.gy, { colour: pal.series[0], width: 3, extra: now ? [G.gx(now), G.gy(now)] : null });
    if (now) marker(ctx, gv.toX(G.gx(now)), gv.toY(G.gy(now)), pal.ink);
    opts.over?.(gv);
  });
}

export function drawResisted(ctx, S, st, p, ahead, pal) {
  const { W, H, px, pad } = S;
  const c = st.cfg;
  const vertical = c.vertical;
  const resisted = c.kOverM > 0;
  const law = c.law === 'linear' ? 'kv' : 'kv²';
  const term = resisted ? (c.law === 'linear' ? 'kv' : 'kv|v|') : null;
  const eq = vertical ? `m dv/dt = −mg${term ? ` − ${term}` : ''}` : term ? `m dv/dt = −${term}` : 'm dv/dt = 0 (no resistance)';
  let top = header(ctx, S, pal, eq, `t = ${q(st.t, 's')}`);
  top = subheader(
    ctx,
    S,
    pal,
    `m = ${formatPlain(c.m)} kg${resisted ? ` · k = ${formatPlain(c.k)} ${c.law === 'linear' ? 'kg/s' : 'kg/m'}` : ' · no resistance'}${vertical ? ` · g = ${formatPlain(c.g)} m/s² · up is positive` : ' · forward is positive'}`,
    top,
  );
  const run = ahead ?? st;
  const vt = vertical && resisted ? (c.law === 'linear' ? c.g / c.kOverM : Math.sqrt(c.g / c.kOverM)) : null;
  const [x0, x1] = minMax(run.hist, 1, [0, st.y[0]]);
  const [v0, v1] = minMax(run.hist, 2, [0, st.y[1], ...(vt ? [-vt] : [])]);
  const m = axisMargins(px);
  const accNow = DRAG_ACC(c, st.y[1]);

  // Motion panel: a column on the left (vertical) or a strip on top (horizontal); none on phones.
  let gx = pad;
  let gTop = top;
  const obj = (X, Y, scaleV, keyX, keyY) => {
    const v = st.y[1];
    const fr = c.kOverM * (c.law === 'linear' ? Math.abs(v) : v * v) * c.m;
    const Fref = Math.max(c.m * c.gEff, fr, 1e-9);
    const L = px * 3.4;
    const dirV = Math.sign(v);
    const key = [[`v = ${q(v, 'm/s')}`, pal.ink, false]];
    const forces = p.showForces !== false;
    if (vertical) {
      if (Math.abs(v) > 1e-9) vector(ctx, pal, X - px * 1.4, Y, 0, -dirV * Math.min(L * 1.4, px + (L * Math.abs(v)) / scaleV), 'v', { colour: pal.ink, px });
      if (forces) {
        vector(ctx, pal, X + px * 1.2, Y, 0, (L * c.m * c.g) / Fref, 'mg', { colour: pal.series[2], px, width: 2.5 });
        key.push([`mg = ${q(c.m * c.g, 'N')}`, pal.series[2], false]);
        if (fr > 1e-9) vector(ctx, pal, X + px * 2.6, Y, 0, (dirV * L * fr) / Fref, law, { colour: pal.series[1], px, width: 2.5, dashed: true });
      }
    } else {
      if (Math.abs(v) > 1e-9) vector(ctx, pal, X, Y - px * 1.2, dirV * Math.min(L * 1.4, px + (L * Math.abs(v)) / scaleV), 0, 'v', { colour: pal.ink, px });
      if (forces && fr > 1e-9) vector(ctx, pal, X, Y + px * 1.2, (-dirV * L * fr) / Fref, 0, law, { colour: pal.series[1], px, width: 2.5, dashed: true });
    }
    if (forces && resisted) key.push([`${law} = ${q(fr, 'N')}`, pal.series[1], true]);
    let ky = keyY;
    for (const [text, colour, dashed] of key) {
      line(ctx, keyX, ky, keyX + px * 1.4, ky, colour, 3, dashed ? [5, 3] : null);
      label(ctx, text, keyX + px * 1.9, ky, { colour: pal.ink, px, baseline: 'middle', box: pal.bg });
      ky += px * 1.45;
    }
    ctx.fillStyle = pal.series[0];
    ctx.fillRect(X - px * 0.6, Y - px * 0.6, px * 1.2, px * 1.2);
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(X - px * 0.6, Y - px * 0.6, px * 1.2, px * 1.2);
  };
  const vScale = Math.max(Math.abs(v0), Math.abs(v1), 1);
  if (S.narrow) {
    // Phone-sized stage: the graphs alone.
  } else if (vertical) {
    const colW = Math.min(W * 0.36, px * 21);
    const col = rect(pad + m.left, top + px, colW - m.left, H - top - px - pad - px);
    const [lo, hi] = niceRange(x0, x1, 1, 0.06);
    const vp = viewport({ x: [0, 1], y: [lo, hi], rect: col });
    const { ticks } = niceTicks(lo, hi, 6);
    line(ctx, col.x, col.y, col.x, col.y + col.h, pal.axis, 1.5);
    for (const t of ticks) {
      line(ctx, col.x - 6, vp.toY(t), col.x, vp.toY(t), pal.axis, 1.5);
      label(ctx, tickText(t), col.x - 10, vp.toY(t), { colour: pal.muted, px, kind: 'mono', align: 'right', baseline: 'middle' });
    }
    line(ctx, col.x, vp.toY(0), col.x + col.w, vp.toY(0), pal.grid, 1, [6, 6]);
    label(ctx, 'x (m)', col.x + 8, col.y, { colour: pal.ink, px, baseline: 'top', box: pal.bg });
    if (st.ev.apex && st.ev.apex.t > 0) line(ctx, col.x, vp.toY(st.ev.apex.x), col.x + col.w, vp.toY(st.ev.apex.x), pal.muted, 1.5, [6, 6]);
    const oy = vp.toY(st.y[0]);
    obj(col.x + px * 3.6, oy, vScale, col.x + px * 7.6, Math.max(col.y + px * 2, Math.min(col.y + col.h - px * 3.6, oy - px * 1.4)));
    gx = pad + colW + px * 2;
  } else {
    const strip = rect(pad + px, top + px * 0.5, W - 2 * pad - 2 * px, px * 8.5);
    const [lo, hi] = niceRange(x0, x1, 1, 0.04);
    const vp = viewport({ x: [lo, hi], y: [0, 1], rect: strip });
    const Y = strip.y + strip.h * 0.62;
    line(ctx, strip.x, Y + px * 0.6, strip.x + strip.w, Y + px * 0.6, pal.ink, 2);
    distanceScale(ctx, vp, Y + px * 0.6, pal, px, null);
    obj(vp.toX(st.y[0]), Y, vScale, strip.x + strip.w - px * 13, strip.y + px * 0.4);
    label(ctx, 'x (m)', strip.x + strip.w, Y + px * 2.4, { colour: pal.ink, px, align: 'right', baseline: 'top' });
    gTop = strip.y + strip.h + px * 1.5;
  }

  // The same motion with no resistance, for comparison (dashed).
  let compare = null;
  if (resisted && p.showNoDrag) {
    compare = [];
    for (let i = 0; i <= 120; i++) {
      const t = (c.duration * i) / 120;
      compare.push([t, c.v0 * t - 0.5 * c.gEff * t * t, c.v0 - c.gEff * t, -c.gEff]);
    }
  }
  const asymptote = (gv) => {
    if (!vt) return;
    line(ctx, gv.rect.x, gv.toY(-vt), gv.rect.x + gv.rect.w, gv.toY(-vt), pal.series[1], 2, [8, 6]);
    rich(ctx, ['−v', { sub: 'T' }, ` = ${q(-vt, 'm/s')}${S.narrow ? '' : ' (terminal velocity)'}`], gv.rect.x + gv.rect.w - 4, gv.toY(-vt) + px * 0.9, { colour: pal.ink, px, align: 'right', baseline: 'middle', box: pal.bg });
  };
  const top2 = (gv) => {
    const ap = st.ev.apex;
    if (vertical && ap && ap.t > 0) {
      line(ctx, gv.toX(ap.t), gv.toY(ap.x), gv.toX(ap.t), gv.toY(0), pal.muted, 1.5, [5, 5]);
      if (!S.narrow) label(ctx, `top: ${q(ap.x, 'm')} at t = ${q(ap.t, 's')}`, gv.toX(ap.t) + px * 0.5, gv.toY(ap.x) - px * 0.3, { colour: pal.ink, px, baseline: 'bottom', box: pal.bg });
    }
  };

  // Graphs: v–t (with the terminal velocity) and the chosen graph; on phones, the chosen graph only.
  const choice = p.graph ?? 'xt';
  const area = rect(gx + m.left, gTop, W - gx - m.left - pad - m.right, H - gTop - pad);
  const one = S.narrow || choice === 'vt';
  const gh = one ? area.h - m.bottom : (area.h - m.bottom * 2 - px) / 2;
  const opts = (key) => ({ duration: c.duration, accNow, compare, extraY: key === 'vt' && vt ? [-vt] : [], under: key === 'vt' ? asymptote : key === 'xt' ? top2 : null });
  if (!one || choice === 'vt') runGraph(ctx, rect(area.x, area.y, area.w, gh), pal, px, 'vt', st, ahead, opts('vt'));
  if (choice !== 'vt') runGraph(ctx, rect(area.x, one ? area.y : area.y + gh + m.bottom + px, area.w, gh), pal, px, choice, st, ahead, opts(choice));
}

const DRAG_ACC = (c, v) => (c.kOverM === 0 ? -c.gEff : -c.gEff - c.kOverM * (c.law === 'linear' ? v : Math.abs(v) * v));

// ------------------------------------------------------------------------------------------------ SHM

export function drawShm(ctx, S, st, p, ahead, pal) {
  const { W, H, px, pad } = S;
  const c = st.cfg;
  const [x, v] = st.y;
  const n = c.n;
  const a = c.a;
  const cc = c.c;
  const maths = c.maths;
  let top = header(ctx, S, pal, maths ? 'x = c + a cos(nt + α)' : 'x = a cos(nt + α)', `t = ${q(st.t, 's')}`);
  top = subheader(
    ctx,
    S,
    pal,
    maths
      ? `n = ${formatPlain(n)} rad/s · c = ${formatPlain(cc)} m · x₀ = ${formatPlain(c.x0)} m, v₀ = ${formatPlain(c.v0)} m/s → a = ${q(a, 'm')}, α = ${q(c.alpha, 'rad')}`
      : `a = ${formatPlain(a)} m · n = √(k/m) = ${q(n, 'rad/s')} · α = ${formatPlain(p.phase)}° · T = 2π/n = ${q((2 * Math.PI) / n, 's')}`,
    top,
  );
  const theta = Math.atan2(-v / n, x - cc);
  const m = axisMargins(px);
  const scaleA = a > 0 ? a : 1;

  // Left: reference circle (centre c), the particle on the diameter, and the spring (or a line) below.
  const panelW = Math.min(W * (S.narrow ? 0.46 : 0.4), (H - top) * 0.95);
  const R = panelW * 0.32;
  const cx = pad + panelW / 2;
  const cy = top + px + (p.showCircle ? R + px * 1.5 : (H - top) * 0.3);
  const k = R / scaleA;
  const Qx = cx + (x - cc) * k;
  line(ctx, cx - R - px * 1.5, cy, cx + R + px * 1.5, cy, pal.axis, 1.5);
  const ticks = maths ? [[-1, 'c − a'], [0, 'c'], [1, 'c + a']] : [[-1, '−a'], [0, '0'], [1, 'a']];
  for (const [t, s] of ticks) {
    line(ctx, cx + t * R, cy - 5, cx + t * R, cy + 5, pal.axis, 1.5);
    label(ctx, s, cx + t * R, cy + px * 0.5, { colour: pal.muted, px, align: 'center', baseline: 'top' });
  }
  label(ctx, 'x', cx + R + px * 1.6, cy, { colour: pal.ink, px, baseline: 'middle' });
  if (p.showCircle && a > 0) {
    const Px = cx + R * Math.cos(theta);
    const Py = cy - R * Math.sin(theta);
    ctx.save();
    ctx.strokeStyle = pal.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    // Angle nt + α measured anticlockwise from the positive x direction (0 to 2π).
    const tn = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const ar = Math.max(px * 1.6, R * 0.22);
    ctx.strokeStyle = pal.ink;
    ctx.beginPath();
    ctx.arc(cx, cy, ar, -tn, 0);
    ctx.stroke();
    ctx.restore();
    line(ctx, cx, cy, Px, Py, pal.ink, 2);
    line(ctx, Px, Py, Px, cy, pal.muted, 1.5, [5, 5]);
    disc(ctx, Px, Py, px * 0.35, pal.ink);
    const mid = tn / 2;
    label(ctx, 'nt + α', cx + (ar + px * 0.4) * Math.cos(mid), cy - (ar + px * 0.4) * Math.sin(mid), {
      colour: pal.ink,
      px,
      align: Math.cos(mid) >= 0 ? 'left' : 'right',
      baseline: Math.sin(mid) >= 0 ? 'bottom' : 'top',
      box: pal.bg,
    });
    label(ctx, 'P', Px + (Px >= cx ? px * 0.5 : -px * 0.5), Py + (Py <= cy ? -px * 0.3 : px * 0.3), { colour: pal.ink, px, kind: 'strong', align: Px >= cx ? 'left' : 'right', baseline: Py <= cy ? 'bottom' : 'top' });
  }
  disc(ctx, Qx, cy, px * 0.5, pal.series[0], pal.ink);

  // Spring and block (spring form) or the particle on a line (maths form), with v and ẍ arrows and a key.
  if (!S.narrow) {
    const sy = Math.min(H - pad - px * 5.2, cy + (p.showCircle ? R : 0) + px * 4.2);
    const wall = cx - R - px * 4;
    const bx = Qx - px * 0.8;
    if (!maths) {
      line(ctx, wall, sy - px * 1.2, wall, sy + px * 1.2, pal.ink, 3);
      ctx.save();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wall, sy);
      for (let i = 1; i < 12; i++) ctx.lineTo(wall + ((bx - wall) * i) / 12, sy + (i % 2 ? -px * 0.55 : px * 0.55));
      ctx.lineTo(bx, sy);
      ctx.stroke();
      ctx.restore();
    } else line(ctx, cx - R - px * 1.5, sy + px * 0.8, cx + R + px * 1.5, sy + px * 0.8, pal.ink, 2);
    ctx.fillStyle = pal.series[0];
    ctx.fillRect(bx, sy - px * 0.8, px * 1.6, px * 1.6);
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, sy - px * 0.8, px * 1.6, px * 1.6);
    line(ctx, cx, sy + px * 1.2, cx, sy + px * 1.8, pal.axis, 1.5);
    const acc = -n * n * (x - cc);
    const sc = (R * 0.8) / scaleA;
    let ky = sy + px * 3.1;
    if (p.showArrows !== false) {
      vector(ctx, pal, Qx, sy - px * 1.5, (v / n) * sc, 0, 'v', { colour: pal.ink, px });
      vector(ctx, pal, Qx, sy + px * 1.5, (acc / (n * n)) * sc, 0, 'ẍ', { colour: pal.series[1], px, width: 2.5, dashed: true });
      for (const [text, colour, dashed] of [[`v = ${q(v, 'm/s')}`, pal.ink, false], [`ẍ = −n²(x − c) = ${q(acc, 'm/s²')}`, pal.series[1], true]]) {
        line(ctx, wall, ky, wall + px * 1.4, ky, colour, 3, dashed ? [5, 3] : null);
        label(ctx, text, wall + px * 1.9, ky, { colour: pal.ink, px, baseline: 'middle' });
        ky += px * 1.45;
      }
    }
    label(ctx, maths ? `centre c = ${formatPlain(cc)} m` : `k = ${formatPlain(c.k)} N/m, m = ${formatPlain(c.m)} kg`, wall, ky, { colour: pal.muted, px, baseline: 'middle' });
  }

  // Right: x–t, then the chosen graph (x–t alone when that is the choice, and on phones).
  const gx = pad + panelW + px * 2 + m.left;
  const area = rect(gx, top + px * 0.5, W - gx - pad - m.right, H - top - px * 0.5 - pad);
  const choice = p.graph ?? 'xt';
  const one = S.narrow || choice === 'xt';
  const gh = one ? area.h - m.bottom : (area.h - 2 * m.bottom - px) / 2;
  const accNow = -n * n * (x - cc);
  const period = (2 * Math.PI) / n;
  const tag = (text) => (gv) => label(ctx, text, gv.rect.x + gv.rect.w - 4, gv.rect.y + px * 1.8, { colour: pal.muted, px, align: 'right', baseline: 'top', box: pal.bg });
  if (!one || choice === 'xt' || S.narrow) {
    const first = S.narrow ? choice : 'xt';
    runGraph(ctx, rect(area.x, area.y, area.w, gh), pal, px, first, st, ahead, { duration: c.duration, accNow, period });
  }
  if (!one) {
    const tags = { v2x: 'v² = n²(a² − (x − c)²)', vx: 'v against x', vt: 'v–t', at: 'ẍ = −n²(x − c)' };
    runGraph(ctx, rect(area.x, area.y + gh + m.bottom + px, area.w, gh), pal, px, choice, st, ahead, { duration: c.duration, accNow, period, over: tag(tags[choice] ?? '') });
  }
}

// ----------------------------------------------------------------------------------------------- cart

export function drawCart(ctx, S, st, p, ahead, pal) {
  const { W, H, px, pad, ui } = S;
  const c = st.cfg;
  const live = c.mode !== 'uniform';
  const intro =
    c.mode === 'uniform'
      ? `x₀ = ${formatPlain(c.x0)} m · u = ${formatPlain(c.u)} m/s · a = ${formatPlain(c.a)} m/s²`
      : c.mode === 'drive'
        ? 'Drive the cart: drag the throttle, or press ← and →'
        : 'Match the dashed target graph: drag the throttle, or press ← and →';
  const top = header(ctx, S, pal, intro, `t = ${q(st.t, 's')}`);
  const a = c.mode === 'uniform' ? c.a : st.throttle;
  const match = c.mode === 'match';
  const targetRows = [];
  if (match) for (let i = 0; i <= 200; i++) {
    const t = (c.duration * i) / 200;
    const tg = cartTarget(c.challenge, t);
    targetRows.push([t, tg.x, tg.v, tg.a]);
  }
  const rows = ahead?.hist ?? st.hist;
  const [x0, x1] = minMax(rows, 1, [st.y[0], ...(match ? targetRows.map((r) => r[1]) : []), live ? -5 : st.y[0], live ? 5 : st.y[0]]);

  // Track strip with the cart.
  const strip = rect(pad + px, top + px * 0.2, W - 2 * pad - 2 * px, px * (S.narrow ? 4.4 : 5.4));
  const [lo, hi] = niceRange(x0, x1, 2, 0.06);
  const vp = viewport({ x: [lo, hi], y: [0, 1], rect: strip });
  const Y = strip.y + strip.h * 0.62;
  line(ctx, strip.x, Y, strip.x + strip.w, Y, pal.ink, 2.5);
  distanceScale(ctx, vp, Y, pal, px, null);
  label(ctx, 'x (m)', strip.x + strip.w, Y - 6, { colour: pal.ink, px, align: 'right', baseline: 'bottom', box: pal.bg });
  const X = vp.toX(st.y[0]);
  const w = px * 3;
  ctx.fillStyle = pal.series[0];
  ctx.fillRect(X - w / 2, Y - px * 1.6, w, px * 1.1);
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(X - w / 2, Y - px * 1.6, w, px * 1.1);
  disc(ctx, X - w * 0.3, Y - px * 0.28, px * 0.28, pal.ink);
  disc(ctx, X + w * 0.3, Y - px * 0.28, px * 0.28, pal.ink);
  if (match) {
    const tx = vp.toX(cartTarget(c.challenge, st.t).x);
    line(ctx, tx, Y - px * 2.2, tx, Y + 2, pal.series[1], 2.5, [6, 4]);
    label(ctx, 'target', tx, Y - px * 2.3, { colour: pal.ink, px, align: 'center', baseline: 'bottom', box: pal.bg });
  }
  if (Math.abs(st.y[1]) > 1e-9) vector(ctx, pal, X, Y - px * 2.6, Math.sign(st.y[1]) * (px * 1.2 + px * 1.6 * Math.min(1, Math.abs(st.y[1]) / 3)), 0, `v = ${q(st.y[1], 'm/s')}`, { colour: pal.ink, px, width: 2.5 });

  // Throttle (drive and match).
  let gTop = strip.y + strip.h + px * 1.8;
  ui.enabled = live;
  if (live) {
    const tw = S.narrow ? W - 2 * pad - 2 * px : Math.min(W * 0.5, px * 26);
    const tr = rect(W / 2 - tw / 2, gTop + px * (S.narrow ? 1.6 : 0.4), tw, px * 0.9);
    ui.throttle = tr;
    if (S.narrow) label(ctx, `Throttle a = ${q(a, 'm/s²')}`, tr.x, tr.y - 6, { colour: pal.ink, px, kind: 'strong', baseline: 'bottom' });
    else label(ctx, 'Throttle', tr.x - px, tr.y + tr.h / 2, { colour: pal.ink, px, kind: 'strong', align: 'right', baseline: 'middle' });
    ctx.fillStyle = pal.grid;
    ctx.fillRect(tr.x, tr.y, tr.w, tr.h);
    for (let v = -2; v <= 2; v += 1) {
      const tx = tr.x + ((v + 2) / 4) * tr.w;
      line(ctx, tx, tr.y + tr.h, tx, tr.y + tr.h + 6, pal.axis, 1.5);
      label(ctx, tickText(v), tx, tr.y + tr.h + 8, { colour: pal.muted, px, kind: 'mono', align: 'center', baseline: 'top' });
    }
    const hx = tr.x + ((a + 2) / 4) * tr.w;
    const zx = tr.x + tr.w / 2;
    ctx.fillStyle = pal.series[1];
    ctx.fillRect(Math.min(zx, hx), tr.y, Math.abs(hx - zx), tr.h);
    ctx.fillStyle = pal.ink;
    ctx.fillRect(hx - 5, tr.y - 6, 10, tr.h + 12);
    if (!S.narrow) label(ctx, `a = ${q(a, 'm/s²')}`, tr.x + tr.w + px, tr.y + tr.h / 2, { colour: pal.ink, px, kind: 'mono', baseline: 'middle' });
    gTop = tr.y + tr.h + px * (S.narrow ? 2 : 2.4);
  } else ui.throttle = null;

  // Three stacked graphs: x–t, v–t, a–t.
  const m = axisMargins(px);
  const area = rect(pad + m.left, gTop, W - 2 * pad - m.left - m.right, H - gTop - pad);
  const shown = S.narrow ? 1 : 3; // phone-sized stages show the x–t graph only
  const gh = (area.h - shown * m.bottom - px) / shown;
  const all = [...rows, ...targetRows];
  const series = [
    { i: 1, title: 'x (m)', min: 2, now: st.y[0] },
    { i: 2, title: 'v (m/s)', min: 1, now: st.y[1] },
    { i: 3, title: 'a (m/s²)', min: 1, now: a },
  ];
  series.slice(0, shown).forEach((sr, k) => {
    const [l, h] = minMax(all, sr.i, live ? [sr.now, sr.i === 3 ? -2 : 0, sr.i === 3 ? 2 : 0] : [sr.now]);
    const yr = niceRange(l, h, sr.min, 0.1);
    graph(ctx, rect(area.x, area.y + k * (gh + m.bottom + px * 0.5), area.w, gh), pal, px, { x: [0, c.duration], y: yr, xTitle: 't (s)', yTitle: sr.title, yCount: 3 }, (gv) => {
      if (match) polyline(ctx, gv, targetRows, (r) => r[0], (r) => r[sr.i], { colour: pal.series[1], width: 2.5, dash: [8, 6] });
      else if (ahead) polyline(ctx, gv, ahead.hist, (r) => r[0], (r) => r[sr.i], { colour: pal.grid, width: 2.5 });
      polyline(ctx, gv, st.hist, (r) => r[0], (r) => r[sr.i], { colour: pal.series[0], width: 3, extra: [st.t, sr.now] });
      marker(ctx, gv.toX(st.t), gv.toY(sr.now), pal.ink);
    });
  });
  if (match) {
    const err = st.errN ? Math.sqrt(st.errSum / st.errN) : 0;
    label(ctx, `match error ${q(err, 'm')} (RMS)`, W - pad, gTop - px * 0.6, { colour: pal.ink, px, kind: 'strong', align: 'right', baseline: 'bottom' });
  }
}

