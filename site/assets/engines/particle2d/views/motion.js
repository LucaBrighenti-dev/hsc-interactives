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

export function drawResisted(ctx, S, st, p, ahead, pal) {
  const { W, H, px, pad } = S;
  const c = st.cfg;
  const vertical = c.vertical;
  const law = c.law === 'linear' ? 'kv' : 'kv²';
  const eq = vertical ? `m dv/dt = −mg − ${c.law === 'linear' ? 'kv' : 'kv|v|'}` : `m dv/dt = −${c.law === 'linear' ? 'kv' : 'kv|v|'}`;
  let top = header(ctx, S, pal, eq, `t = ${q(st.t, 's')}`);
  top = subheader(ctx, S, pal, `m = ${formatPlain(c.m)} kg · k = ${formatPlain(c.k)} ${c.law === 'linear' ? 'kg/s' : 'kg/m'}${vertical ? ` · g = ${formatPlain(c.g)} m/s² · up is positive` : ' · forward is positive'}`, top);
  const run = ahead ?? st;
  const vt = vertical ? (c.law === 'linear' ? c.g / c.kOverM : Math.sqrt(c.g / c.kOverM)) : null;
  const [x0, x1] = minMax(run.hist, 1, [0, st.y[0]]);
  const [v0, v1] = minMax(run.hist, 2, [0, st.y[1], ...(vt ? [-vt] : [])]);
  const m = axisMargins(px);

  // Motion panel: a column on the left (vertical) or a strip on top (horizontal).
  let gx = pad;
  let gTop = top;
  // The object with its arrows (symbol at each tip); magnitudes are listed in a key beside it.
  const obj = (X, Y, scaleV, keyX, keyY) => {
    const v = st.y[1];
    const fr = c.kOverM * (c.law === 'linear' ? Math.abs(v) : v * v) * c.m;
    const Fref = Math.max(c.m * c.g, fr, 1e-9);
    const L = px * 3.4;
    const dirV = Math.sign(v);
    const key = [[`v = ${q(v, 'm/s')}`, pal.ink, false]];
    if (vertical) {
      if (Math.abs(v) > 1e-9) vector(ctx, pal, X - px * 1.4, Y, 0, -dirV * Math.min(L * 1.4, px + (L * Math.abs(v)) / scaleV), 'v', { colour: pal.ink, px });
      vector(ctx, pal, X + px * 1.2, Y, 0, (L * c.m * c.g) / Fref, 'mg', { colour: pal.series[2], px, width: 2.5 });
      key.push([`mg = ${q(c.m * c.g, 'N')}`, pal.series[2], false]);
      if (fr > 1e-9) vector(ctx, pal, X + px * 2.6, Y, 0, (dirV * L * fr) / Fref, law, { colour: pal.series[1], px, width: 2.5, dashed: true });
    } else {
      if (Math.abs(v) > 1e-9) vector(ctx, pal, X, Y - px * 1.2, dirV * Math.min(L * 1.4, px + (L * Math.abs(v)) / scaleV), 0, 'v', { colour: pal.ink, px });
      if (fr > 1e-9) vector(ctx, pal, X, Y + px * 1.2, (-dirV * L * fr) / Fref, 0, law, { colour: pal.series[1], px, width: 2.5, dashed: true });
    }
    key.push([`${law} = ${q(fr, 'N')}`, pal.series[1], true]);
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
    if (st.ev.apex && st.ev.apex.t > 0) {
      line(ctx, col.x, vp.toY(st.ev.apex.x), col.x + col.w, vp.toY(st.ev.apex.x), pal.muted, 1.5, [6, 6]);
    }
    const oy = vp.toY(st.y[0]);
    obj(col.x + px * 3.6, oy, vScale, col.x + px * 7.6, Math.max(col.y + px * 2, Math.min(col.y + col.h - px * 3.6, oy - px * 1.4)));
    gx = pad + colW + px * 2;
  } else {
    const stripH = px * 8.5;
    const strip = rect(pad + px, top + px * 0.5, W - 2 * pad - 2 * px, stripH);
    const [lo, hi] = niceRange(x0, x1, 1, 0.04);
    const vp = viewport({ x: [lo, hi], y: [0, 1], rect: strip });
    const Y = strip.y + strip.h * 0.62;
    line(ctx, strip.x, Y + px * 0.6, strip.x + strip.w, Y + px * 0.6, pal.ink, 2);
    distanceScale(ctx, vp, Y + px * 0.6, pal, px, null);
    obj(vp.toX(st.y[0]), Y, vScale, strip.x + strip.w - px * 13, strip.y + px * 0.4);
    label(ctx, 'x (m)', strip.x + strip.w, Y + px * 2.4, { colour: pal.ink, px, align: 'right', baseline: 'top' });
    gTop = strip.y + strip.h + px * 1.5;
  }

  // Graphs: v–t above x–t (faint: the whole run; orange: so far).
  const tMax = c.duration;
  const area = rect(gx + m.left, gTop, W - gx - m.left - pad - m.right, H - gTop - pad);
  const gh = (area.h - m.bottom * 2 - px) / 2;
  const vr = niceRange(v0, v1, 1, 0.08);
  graph(ctx, rect(area.x, area.y, area.w, gh), pal, px, { x: [0, tMax], y: vr, xTitle: 't (s)', yTitle: 'v (m/s)' }, (gv) => {
    if (ahead) polyline(ctx, gv, ahead.hist, (r) => r[0], (r) => r[2], { colour: pal.grid, width: 2.5 });
    if (vt) {
      line(ctx, gv.rect.x, gv.toY(-vt), gv.rect.x + gv.rect.w, gv.toY(-vt), pal.series[1], 2, [8, 6]);
      rich(ctx, ['−v', { sub: 'T' }, ` = ${q(-vt, 'm/s')}${S.narrow ? '' : ' (terminal velocity)'}`], gv.rect.x + gv.rect.w - 4, gv.toY(-vt) + px * 0.9, { colour: pal.ink, px, align: 'right', baseline: 'middle', box: pal.bg });
    }
    polyline(ctx, gv, st.hist, (r) => r[0], (r) => r[2], { colour: pal.series[0], width: 3, extra: [st.t, st.y[1]] });
    marker(ctx, gv.toX(st.t), gv.toY(st.y[1]), pal.ink);
  });
  const xr = niceRange(x0, x1, 1, 0.08);
  graph(ctx, rect(area.x, area.y + gh + m.bottom + px, area.w, gh), pal, px, { x: [0, tMax], y: xr, xTitle: 't (s)', yTitle: 'x (m)' }, (gv) => {
    if (ahead) polyline(ctx, gv, ahead.hist, (r) => r[0], (r) => r[1], { colour: pal.grid, width: 2.5 });
    polyline(ctx, gv, st.hist, (r) => r[0], (r) => r[1], { colour: pal.series[0], width: 3, extra: [st.t, st.y[0]] });
    const ap = st.ev.apex;
    if (vertical && ap && ap.t > 0) {
      line(ctx, gv.toX(ap.t), gv.toY(ap.x), gv.toX(ap.t), gv.toY(0), pal.muted, 1.5, [5, 5]);
      label(ctx, `top: ${q(ap.x, 'm')} at t = ${q(ap.t, 's')}`, gv.toX(ap.t) + px * 0.5, gv.toY(ap.x) - px * 0.3, { colour: pal.ink, px, baseline: 'bottom', box: pal.bg });
    }
    marker(ctx, gv.toX(st.t), gv.toY(st.y[0]), pal.ink);
  });
}

// ------------------------------------------------------------------------------------------------ SHM

export function drawShm(ctx, S, st, p, ahead, pal) {
  const { W, H, px, pad } = S;
  const c = st.cfg;
  let top = header(ctx, S, pal, 'x = a cos(nt + α)', `t = ${q(st.t, 's')}`);
  top = subheader(ctx, S, pal, `a = ${formatPlain(c.a)} m · n = √(k/m) = ${q(c.n, 'rad/s')} · α = ${formatPlain(p.phase)}° · T = 2π/n = ${q((2 * Math.PI) / c.n, 's')}`, top);
  const [x, v] = st.y;
  const theta = Math.atan2(-v / c.n, x);
  const m = axisMargins(px);

  // Left: reference circle, the particle on the diameter, and a spring below.
  const panelW = Math.min(W * (S.narrow ? 0.46 : 0.4), (H - top) * 0.95);
  const R = panelW * 0.32;
  const cx = pad + panelW / 2;
  const cy = top + px + (p.showCircle ? R + px * 1.5 : (H - top) * 0.3);
  const k = R / c.a;
  const Qx = cx + x * k;
  line(ctx, cx - R - px * 1.5, cy, cx + R + px * 1.5, cy, pal.axis, 1.5);
  for (const [t, s] of [[-1, '−a'], [0, '0'], [1, 'a']]) {
    line(ctx, cx + t * R, cy - 5, cx + t * R, cy + 5, pal.axis, 1.5);
    label(ctx, s, cx + t * R, cy + px * 0.5, { colour: pal.muted, px, align: 'center', baseline: 'top' });
  }
  label(ctx, 'x', cx + R + px * 1.6, cy, { colour: pal.ink, px, baseline: 'middle' });
  if (p.showCircle) {
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

  if (!S.narrow) drawSpring();
  function drawSpring() {
  // Spring and block (the same x as the particle), with the velocity and acceleration arrows.
  const sy = Math.min(H - pad - px * 5.2, cy + (p.showCircle ? R : 0) + px * 4.2);
  const wall = cx - R - px * 4;
  line(ctx, wall, sy - px * 1.2, wall, sy + px * 1.2, pal.ink, 3);
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const bx = Qx - px * 0.8;
  ctx.moveTo(wall, sy);
  const coils = 12;
  for (let i = 1; i < coils; i++) ctx.lineTo(wall + ((bx - wall) * i) / coils, sy + (i % 2 ? -px * 0.55 : px * 0.55));
  ctx.lineTo(bx, sy);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = pal.series[0];
  ctx.fillRect(bx, sy - px * 0.8, px * 1.6, px * 1.6);
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx, sy - px * 0.8, px * 1.6, px * 1.6);
  line(ctx, cx, sy + px * 1.2, cx, sy + px * 1.8, pal.axis, 1.5);
  const acc = -c.n * c.n * x;
  const sc = (R * 0.8) / c.a;
  vector(ctx, pal, Qx, sy - px * 1.5, (v / c.n) * sc, 0, 'v', { colour: pal.ink, px });
  vector(ctx, pal, Qx, sy + px * 1.5, (acc / (c.n * c.n)) * sc, 0, 'a', { colour: pal.series[1], px, width: 2.5, dashed: true });
  let ky = sy + px * 3.1;
  for (const [text, colour, dashed] of [[`v = ${q(v, 'm/s')}`, pal.ink, false], [`a = −n²x = ${q(acc, 'm/s²')}`, pal.series[1], true]]) {
    line(ctx, wall, ky, wall + px * 1.4, ky, colour, 3, dashed ? [5, 3] : null);
    label(ctx, text, wall + px * 1.9, ky, { colour: pal.ink, px, baseline: 'middle' });
    ky += px * 1.45;
  }
  label(ctx, `k = ${formatPlain(c.k)} N/m, m = ${formatPlain(c.m)} kg`, wall, ky, { colour: pal.muted, px, baseline: 'middle' });
  }

  // Right: x–t, then v² (or v) against x.
  const gx = pad + panelW + px * 2 + m.left;
  const area = rect(gx, top + px * 0.5, W - gx - pad - m.right, H - top - px * 0.5 - pad);
  const gh = S.narrow ? area.h - m.bottom : (area.h - 2 * m.bottom - px) / 2;
  const A = c.a * 1.25;
  const rows = ahead?.hist ?? [];
  graph(ctx, rect(area.x, area.y, area.w, gh), pal, px, { x: [0, c.duration], y: [-niceCeil(A), niceCeil(A)], xTitle: 't (s)', yTitle: 'x (m)' }, (gv) => {
    polyline(ctx, gv, rows, (r) => r[0], (r) => r[1], { colour: pal.grid, width: 2.5 });
    polyline(ctx, gv, st.hist, (r) => r[0], (r) => r[1], { colour: pal.series[0], width: 3, extra: [st.t, x] });
    marker(ctx, gv.toX(st.t), gv.toY(x), pal.ink);
  });
  if (S.narrow) return;
  const vmax = c.a * c.n;
  const v2 = p.plot === 'v2';
  const yr = v2 ? [0, niceCeil(vmax * vmax * 1.15)] : [-niceCeil(vmax * 1.2), niceCeil(vmax * 1.2)];
  const gy = (r) => (v2 ? r[2] * r[2] : r[2]);
  graph(ctx, rect(area.x, area.y + gh + m.bottom + px, area.w, gh), pal, px, { x: [-niceCeil(A), niceCeil(A)], y: yr, xTitle: 'x (m)', yTitle: v2 ? 'v² (m²/s²)' : 'v (m/s)' }, (gv) => {
    polyline(ctx, gv, rows, (r) => r[1], gy, { colour: pal.grid, width: 2.5 });
    const recent = st.hist.filter((r) => r[0] >= st.t - (2 * Math.PI) / c.n);
    polyline(ctx, gv, recent, (r) => r[1], gy, { colour: pal.series[0], width: 3, extra: [x, v2 ? v * v : v] });
    marker(ctx, gv.toX(x), gv.toY(v2 ? v * v : v), pal.ink);
    label(ctx, v2 ? 'v² = n²(a² − x²)' : 'v against x', gv.rect.x + gv.rect.w - 4, gv.rect.y + px * 1.8, { colour: pal.muted, px, align: 'right', baseline: 'top', box: pal.bg });
  });
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

