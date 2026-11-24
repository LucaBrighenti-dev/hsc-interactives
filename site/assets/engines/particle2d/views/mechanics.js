// Mechanics views: circular motion (banked curve, string, torque), collisions, relative velocity and the
// work–energy roller track.
import { q, si, rich, header, niceCeil, niceRange, polyline, clipTo, line, disc, vector, viewport, axisMargins, drawAxes, label, arrow, rect, barRows, fitText } from './common.js';
import { bankedForces, trackEnergy, PUCK_RADIUS } from '../model.js';
import { tickText } from '../../../engine-kit.js';
import { formatPlain, formatNumber } from '../../../format.js';

const DEG = Math.PI / 180;

// ------------------------------------------------------------------------------------------- circular

export function drawCircular(ctx, S, st, p, ahead, pal) {
  const c = st.cfg;
  if (c.mode === 'torque') return drawTorque(ctx, S, st, p, pal);
  const { W, H, px, pad } = S;
  const track = c.mode === 'track';
  const m = track ? c.carMass : c.mass;
  const Fc = (m * c.v * c.v) / c.r;
  const top = header(ctx, S, pal, track ? `Car on a curve: r = ${formatPlain(c.r)} m, v = ${formatPlain(c.v)} m/s, bank ${formatPlain(p.bankAngle)}°` : `Mass on a string: r = ${formatPlain(c.r)} m, v = ${formatPlain(c.v)} m/s, m = ${formatPlain(c.mass)} kg`, `t = ${q(st.t, 's')}`);

  // Top view (square panel on the left).
  const side = Math.min((W - 2 * pad) * (track ? 0.46 : 1), H - top - pad - px * 0.4);
  const panel = rect(track ? pad : (W - side) / 2, top + px * 0.4, side, H - top - pad - px * 0.4);
  const topView = !(track && S.narrow); // phone-sized stages show only the cross-section for the car
  if (topView) {
  const reach = !track && c.release > 0 ? 2.4 : 1.3;
  const vp = viewport({ x: [-reach * c.r, reach * c.r], y: [-reach * c.r, reach * c.r], rect: panel, equal: true });
  const O = [vp.toX(0), vp.toY(0)];
  ctx.save();
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = track ? Math.max(6, px * 1.4) : 1.5;
  if (!track) ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.arc(O[0], O[1], c.r * vp.scaleX, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  line(ctx, O[0] - 8, O[1], O[0] + 8, O[1], pal.ink, 1.5);
  line(ctx, O[0], O[1] - 8, O[0], O[1] + 8, pal.ink, 1.5);
  label(ctx, 'centre', O[0] + px * 0.5, O[1] + px * 0.4, { colour: pal.muted, px, baseline: 'top' });
  clipTo(ctx, panel, () => {
    if (p.trail) polyline(ctx, vp, st.hist, (r) => r[1], (r) => r[2], { colour: pal.series[0], width: 3, extra: [st.y[0], st.y[1]] });
  });
  const [x, y, vx, vy] = st.y;
  const X = vp.toX(x);
  const Y = vp.toY(y);
  if (!track && !st.free) line(ctx, O[0], O[1], X, Y, pal.ink, 2);
  const L = px * 4;
  if (p.showVectors) {
    const sp = Math.hypot(vx, vy) || 1;
    vector(ctx, pal, X, Y, (vx / sp) * L, (-vy / sp) * L, `v = ${q(Math.hypot(vx, vy), 'm/s')}`, { colour: pal.ink, px });
    if (!st.free) {
      const r = Math.hypot(x, y);
      vector(ctx, pal, X, Y, (-x / r) * L * 0.85, (y / r) * L * 0.85, `${track ? 'F' : 'T'} = ${si(Fc, 'N')}`, { colour: pal.series[1], px, width: 2.5, dashed: true });
    }
  }
  if (track) {
    const ang = Math.atan2(vy, vx);
    ctx.save();
    ctx.translate(X, Y);
    ctx.rotate(-ang);
    ctx.fillStyle = pal.series[0];
    ctx.fillRect(-px * 0.9, -px * 0.5, px * 1.8, px * 1);
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-px * 0.9, -px * 0.5, px * 1.8, px * 1);
    ctx.restore();
  } else disc(ctx, X, Y, px * 0.5, pal.series[0], pal.ink);
  if (st.free) label(ctx, fitText(ctx, `String cut at t = ${q(st.ev.release.t, 's')}: the mass moves along the tangent`, W - 2 * pad, px, 'strong'), pad, panel.y + panel.h, { colour: pal.ink, px, kind: 'strong', baseline: 'bottom', box: pal.bg });
  }
  if (!track) {
    label(ctx, `T = mv²/r = ${si(Fc, 'N')} · period ${q((2 * Math.PI * c.r) / Math.max(c.v, 1e-9), 's')}`, panel.x + panel.w, panel.y + px * 0.2, { colour: pal.ink, px, align: 'right', baseline: 'top', box: pal.bg });
    return;
  }

  // Cross-section of the banked road with the forces on the car (to scale with mg).
  const F = bankedForces({ mass: c.carMass, speed: c.v, radius: c.r, bank: c.bank, g: c.g, mu: c.mu });
  const sx = topView ? panel.x + panel.w + px * 2 : pad;
  const sec = rect(sx, top + px * 0.4, W - sx - pad, H - top - pad - px * 0.4);
  label(ctx, fitText(ctx, 'Cross-section (centre of the curve to the left)', sec.w, px, 'strong'), sec.x, sec.y + px * 0.9, { colour: pal.ink, px, kind: 'strong' });
  const cx = sec.x + sec.w * 0.45;
  const cy = sec.y + sec.h * 0.48;
  const th = c.bank;
  const len = sec.w * 0.42;
  const ux = Math.cos(th);
  const uy = -Math.sin(th);
  line(ctx, cx - ux * len, cy - uy * len, cx + ux * len, cy + uy * len, pal.ink, 3);
  line(ctx, cx - ux * len, cy - uy * len, cx + len, cy - uy * len, pal.axis, 1.5, [5, 5]);
  if (c.bank > 0) label(ctx, `θ = ${formatPlain(p.bankAngle)}°`, cx - ux * len + px * 3.2, cy - uy * len - 4, { colour: pal.ink, px, baseline: 'bottom' });
  // Car block on the slope.
  const nx = -uy;
  const ny = -ux; // outward normal (up from the road) in screen coords
  const bw = px * 3.2;
  const bh = px * 1.6;
  ctx.save();
  ctx.translate(cx + nx * bh * 0.5, cy + ny * bh * 0.5);
  ctx.rotate(-th);
  ctx.fillStyle = pal.series[0];
  ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
  ctx.restore();
  const G = [cx + nx * bh * 0.5, cy + ny * bh * 0.5];
  const mg = c.carMass * c.g;
  const k = (Math.min(sec.h, sec.w) * 0.22) / mg;
  vector(ctx, pal, G[0], G[1], 0, mg * k, `mg = ${si(mg, 'N')}`, { colour: pal.series[2], px, width: 2.5 });
  vector(ctx, pal, G[0], G[1], nx * F.N * k, ny * F.N * k, `N = ${si(F.N, 'N')}`, { colour: pal.series[1], px, width: 2.5 });
  // Friction acts along the slope: f > 0 down the slope (towards the centre, to the left and down).
  if (Math.abs(F.f) > mg * 1e-6) vector(ctx, pal, G[0], G[1], -ux * F.f * k, -uy * F.f * k, `f = ${si(Math.abs(F.f), 'N')} ${F.f > 0 ? 'down' : 'up'} the slope`, { colour: pal.series[3], px, width: 2.5, dashed: true });
  vector(ctx, pal, G[0], G[1] - bh * 1.8, -Fc * k, 0, `net ${si(Fc, 'N')}`, { colour: pal.ink, px, width: 2, dashed: true });
  let ty = sec.y + sec.h - px * (S.narrow ? 0.6 : 3.6);
  const grips = F.muRequired <= c.mu + 1e-12;
  if (!S.narrow) {
    label(ctx, `Design speed √(rg tan θ) = ${q(F.designSpeed, 'm/s')}`, sec.x, ty, { colour: pal.ink, px });
    ty += px * 1.5;
    label(ctx, `Friction needed μ = ${Number.isFinite(F.muRequired) ? formatNumber(F.muRequired) : '—'} (available ${formatPlain(c.mu)})`, sec.x, ty, { colour: pal.ink, px });
    ty += px * 1.5;
  }
  label(ctx, S.narrow ? (grips ? 'Grips' : `Slides ${F.f > 0 ? 'up' : 'down'} the bank`) : grips ? 'Grips: the tyres can supply this friction' : `Slides ${F.f > 0 ? 'up' : 'down'} the bank: needs more friction than μ allows`, sec.x, ty, { colour: grips ? pal.ink : pal.accentText, px, kind: 'strong' });
}

function drawTorque(ctx, S, st, p, pal) {
  const { W, H, px, pad } = S;
  const c = st.cfg;
  const sinP = c.sinPhi;
  const cosP = Math.cos(c.phi);
  const tau = c.arm * c.F * sinP;
  const top = header(ctx, S, pal, `Torque τ = rF sin θ = ${formatPlain(c.arm)} × ${formatPlain(c.F)} × sin ${formatPlain(p.forceAngle)}° = ${q(tau, 'N·m')}`, null);
  const area = rect(pad, top + px, W - 2 * pad, H - top - pad - px * 2.6);
  const vp = viewport({ x: [-0.45 * c.arm, 1.65 * c.arm], y: [-0.75 * c.arm, 1.0 * c.arm], rect: area, equal: true });
  const P = [vp.toX(0), vp.toY(0)];
  const E = [vp.toX(c.arm), vp.toY(0)];
  const leverPx = E[0] - P[0];

  // Line of action of F (dashed), clipped to the stage.
  clipTo(ctx, area, () => {
    const ext = Math.max(area.w, area.h) * 2;
    line(ctx, E[0] - cosP * ext, E[1] + sinP * ext, E[0] + cosP * ext, E[1] - sinP * ext, pal.muted, 1.5, [4, 6]);
  });

  // Spanner: a bar from the pivot to the point where the force acts.
  const w = Math.max(px * 0.9, 0.07 * leverPx);
  ctx.fillStyle = pal.grid;
  ctx.fillRect(P[0], P[1] - w / 2, leverPx + w * 0.6, w);
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(P[0], P[1] - w / 2, leverPx + w * 0.6, w);
  disc(ctx, P[0], P[1], w * 0.9, pal.bg, pal.ink, 2.5);
  disc(ctx, P[0], P[1], 4, pal.ink);
  label(ctx, 'pivot', P[0] - w - px * 0.4, P[1], { colour: pal.muted, px, align: 'right', baseline: 'middle' });
  label(ctx, `r = ${formatPlain(c.arm)} m`, P[0] + leverPx * 0.35, P[1] - w / 2 - px * 0.4, { colour: pal.ink, px, align: 'center', baseline: 'bottom', box: pal.bg });

  // Moment arm: the perpendicular distance from the pivot to the line of action.
  if (sinP > 1e-6) {
    const foot = c.arm * cosP * vp.scaleX; // from E back along F to the foot of the perpendicular
    const Fp = [E[0] - cosP * foot, E[1] + sinP * foot];
    line(ctx, P[0], P[1], Fp[0], Fp[1], pal.series[2], 2.5, [8, 4]);
    let nx = -(Fp[1] - P[1]);
    let ny = Fp[0] - P[0];
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    if (ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    const off = w / 2 + px * 0.9;
    label(ctx, `moment arm r sin θ = ${q(c.arm * sinP, 'm')}`, (P[0] + Fp[0]) / 2 + nx * off, (P[1] + Fp[1]) / 2 + ny * off, { colour: pal.ink, px, align: 'center', baseline: 'top', box: pal.bg });
  }

  // The force and its perpendicular component.
  const Lf = leverPx * (0.3 + (0.7 * c.F) / 500);
  if (Math.abs(cosP) > 0.02 && sinP > 1e-6) {
    vector(ctx, pal, E[0], E[1], 0, -sinP * Lf, null, { colour: pal.series[1], px, width: 2.5, dashed: true });
    rich(ctx, ['F', { sub: '⊥' }, ` = F sin θ = ${q(c.F * sinP, 'N')}`], E[0] + (cosP > 0 ? -px * 0.6 : px * 0.6), E[1] - (sinP * Lf) / 2, {
      px,
      colour: pal.ink,
      align: cosP > 0 ? 'right' : 'left',
      baseline: 'middle',
      box: pal.bg,
    });
  }
  vector(ctx, pal, E[0], E[1], cosP * Lf, -sinP * Lf, `F = ${q(c.F, 'N')}`, { colour: pal.ink, px });
  const ar = px * 2;
  ctx.save();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(E[0], E[1], ar, -c.phi, 0);
  ctx.stroke();
  ctx.restore();
  label(ctx, `θ = ${formatPlain(p.forceAngle)}°`, E[0] + ar + px * 0.4, E[1] + w / 2 + px * 0.3, { colour: pal.ink, px, baseline: 'top', box: pal.bg });
  label(ctx, tau > 1e-9 ? `Turns anticlockwise with τ = ${q(tau, 'N·m')}` : 'No turning effect: F acts along the spanner', pad, H - pad, { colour: pal.ink, px, kind: 'strong', baseline: 'bottom' });
}

// ------------------------------------------------------------------------------------------ collisions

export function drawCollisions(ctx, S, st, p, ahead, pal) {
  const { W, H, px, pad } = S;
  const c = st.cfg;
  const col = st.ev.collision;
  const top = header(ctx, S, pal, `${c.twoD ? '2D' : '1D'} collision · e = ${formatPlain(c.e)}${col ? ` · contact at t = ${q(col.t, 's')}, impulse ${q(col.J, 'N·s')}` : ''}`, `t = ${q(st.t, 's')}`);
  const barsOn = p.showBars && !S.narrow; // no room for the bars on phone-sized stages
  const trackH = barsOn ? (H - top) * (c.twoD ? 0.52 : 0.4) : H - top - pad;
  const area = rect(pad, top + px * 0.4, W - 2 * pad, trackH - px * 0.4);
  const R = PUCK_RADIUS;
  // Fit the whole run (both pucks, start to finish) so neither puck leaves the view.
  let [xl, xh, yl, yh] = [-4.5, 4.5, c.twoD ? -2.2 : -0.9, c.twoD ? 2.2 : 0.9];
  for (const r of (ahead ?? st).hist) {
    xl = Math.min(xl, r[1] - R - 0.4, r[5] - R - 0.4);
    xh = Math.max(xh, r[1] + R + 0.4, r[5] + R + 0.4);
    if (c.twoD) {
      yl = Math.min(yl, r[2] - R - 0.3, r[6] - R - 0.3);
      yh = Math.max(yh, r[2] + R + 0.3, r[6] + R + 0.3);
    }
  }
  const padX = (xh - xl) * 0.1;
  const vp = viewport({ x: [xl - padX, xh + padX], y: [yl, yh], rect: area, equal: true });
  if (!c.twoD) line(ctx, area.x, vp.toY(-R) + 1, area.x + area.w, vp.toY(-R) + 1, pal.ink, 2);
  else {
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(area.x + 0.5, area.y + 0.5, area.w - 1, area.h - 1);
  }
  const y = st.y;
  const pucks = [
    { name: 'A', m: c.mA, x: y[0], y: y[1], vx: y[2], vy: y[3], i: 1, colour: pal.series[0] },
    { name: 'B', m: c.mB, x: y[4], y: y[5], vx: y[6], vy: y[7], i: 5, colour: pal.series[1] },
  ];
  clipTo(ctx, area, () => {
    if (p.trail) {
      polyline(ctx, vp, st.hist, (r) => r[1], (r) => r[2], { colour: pal.series[0], width: 2.5, extra: [y[0], y[1]] });
      polyline(ctx, vp, st.hist, (r) => r[5], (r) => r[6], { colour: pal.series[1], width: 2.5, dash: [8, 5], extra: [y[4], y[5]] });
    }
    if (col && c.twoD) {
      const nx = col.xA - col.xB;
      const ny = col.yA - col.yB;
      const l = Math.hypot(nx, ny);
      line(ctx, vp.toX(col.xB - (nx / l) * 1.2), vp.toY(col.yB - (ny / l) * 1.2), vp.toX(col.xA + (nx / l) * 1.2), vp.toY(col.yA + (ny / l) * 1.2), pal.muted, 1.5, [4, 5]);
    }
    for (const k of pucks) {
      const X = vp.toX(k.x);
      const Y = vp.toY(k.y);
      disc(ctx, X, Y, R * vp.scaleX, k.colour, pal.ink, 2);
      label(ctx, k.name, X, Y + 1, { colour: pal.bg, px, kind: 'strong', align: 'center', baseline: 'middle' });
    }
  });
  for (const k of pucks) {
    const sp = Math.hypot(k.vx, k.vy);
    if (sp > 1e-9) {
      const L = px * 1.2 + px * 2.2 * Math.min(1, sp / 5);
      vector(ctx, pal, vp.toX(k.x), vp.toY(k.y) - (c.twoD ? 0 : R * vp.scaleX + px * 0.9), (k.vx / sp) * L, (-k.vy / sp) * L, `${q(sp, 'm/s')}`, { colour: pal.ink, px, width: 2.5 });
    }
  }
  label(ctx, `A: ${formatPlain(c.mA)} kg   B: ${formatPlain(c.mB)} kg`, area.x + 4, area.y + area.h - 4, { colour: pal.ink, px, baseline: 'bottom', box: pal.bg });
  if (!barsOn) return;

  // Momentum and kinetic energy bars (dashed outline: the total before the collision).
  const bTop = area.y + area.h + px * 1.4;
  const pA = c.mA * y[2];
  const pB = c.mB * y[6];
  const keA = 0.5 * c.mA * (y[2] ** 2 + y[3] ** 2);
  const keB = 0.5 * c.mB * (y[6] ** 2 + y[7] ** 2);
  const p0 = c.mA * c.uA + c.mB * c.uB;
  const ke0 = st.ke0;
  const colW = (W - 2 * pad - px * 2) / 2;
  const pRows = [
    { label: 'A', value: pA, colour: pal.series[0], text: q(pA, 'kg·m/s') },
    { label: 'B', value: pB, colour: pal.series[1], text: q(pB, 'kg·m/s') },
    { label: 'Total', value: pA + pB, colour: pal.ink, text: q(pA + pB, 'kg·m/s') },
    { label: 'Before', value: p0, colour: pal.muted, dashed: true, text: q(p0, 'kg·m/s') },
  ];
  if (c.twoD) {
    const py = c.mA * y[3] + c.mB * y[7];
    pRows.splice(3, 0, { label: 'Total y', value: py, colour: pal.axis, text: q(py, 'kg·m/s') });
  }
  const pScale = Math.max(...pRows.map((r) => Math.abs(r.value)), 1e-9);
  const hRows = Math.min(H - bTop - pad, pRows.length * px * 2);
  label(ctx, c.twoD ? 'Momentum (x unless marked)' : 'Momentum', pad, bTop, { colour: pal.ink, px, kind: 'strong', baseline: 'bottom' });
  barRows(ctx, rect(pad, bTop + px * 0.3, colW, hRows), pal, px, pRows.map((r) => ({ ...r, signed: true })), pScale);
  const kx = pad + colW + px * 2;
  const keRows = [
    { label: 'A', value: keA, colour: pal.series[0], text: q(keA, 'J') },
    { label: 'B', value: keB, colour: pal.series[1], text: q(keB, 'J') },
    { label: 'Total', value: keA + keB, colour: pal.ink, text: q(keA + keB, 'J') },
    { label: 'Before', value: ke0, colour: pal.muted, dashed: true, text: q(ke0, 'J') },
  ];
  const lost = ke0 - keA - keB;
  label(ctx, `Kinetic energy${col ? ` · lost ${q(Math.abs(lost) <= 1e-12 * ke0 ? 0 : lost, 'J')}` : ''}`, kx, bTop, { colour: pal.ink, px, kind: 'strong', baseline: 'bottom' });
  barRows(ctx, rect(kx, bTop + px * 0.3, colW, Math.min(H - bTop - pad, keRows.length * px * 2)), pal, px, keRows, Math.max(ke0, keA + keB, 1e-9));
}

// ----------------------------------------------------------------------------------- relative velocity

export function drawRelative(ctx, S, st, p, ahead, pal) {
  const { W, H, px, pad } = S;
  const c = st.cfg;
  const run = ahead ?? st;
  const [x, y] = st.y;
  const end = run.hist[run.hist.length - 1] ?? [0, 0, 0];
  const top = header(
    ctx,
    S,
    pal,
    c.boat ? `Boat ${formatPlain(c.vb)} m/s, heading ${formatPlain(p.heading)}° ${p.heading >= 0 ? 'upstream' : 'downstream'} · current ${formatPlain(c.u)} m/s` : `Plane ${formatPlain(p.airspeed)} km/h heading ${formatPlain(p.bearing)}° · wind ${formatPlain(p.windSpeed)} km/h toward ${formatPlain(p.windBearing)}°`,
    c.boat ? `t = ${q(st.t, 's')}` : `t = ${q(st.t / 60, 'min')}`,
  );
  const m = axisMargins(px);
  const plot = rect(pad + m.left, top + px * 0.4, W - 2 * pad - m.left - m.right, H - top - px * 0.4 - m.bottom - pad);
  const unit = c.boat ? 1 : 1000;
  let xs = [0, end[1], x];
  let ys = [0, end[2], y];
  if (c.boat) ys = [...ys, -0.12 * c.W, 1.12 * c.W];
  const tri = p.showTriangle;
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), c.boat ? c.W : 1000);
  // Room for the vector triangle near the start.
  const vRef = Math.max(Math.hypot(...c.rel), Math.hypot(...c.medium), Math.hypot(...c.ground), 1e-9);
  const triScale = (span * 0.32) / vRef;
  if (tri) {
    xs = [...xs, c.rel[0] * triScale, c.ground[0] * triScale];
    ys = [...ys, c.rel[1] * triScale, c.ground[1] * triScale];
  }
  const xr = niceRange(Math.min(...xs), Math.max(...xs), 1, 0.08);
  const yrr = niceRange(Math.min(...ys), Math.max(...ys), 1, 0.06);
  const vp = viewport({ x: xr, y: yrr, rect: plot, equal: true });
  const fmt = c.boat ? undefined : (v) => tickText(v / 1000);
  drawAxes(ctx, vp, pal, { px, layer: 'under', formatX: fmt, formatY: fmt });
  const O = [vp.toX(0), vp.toY(0)];
  clipTo(ctx, plot, () => {
    if (c.boat) {
      const y0 = vp.toY(0);
      const y1 = vp.toY(c.W);
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = pal.series[1];
      ctx.fillRect(plot.x, y1, plot.w, y0 - y1);
      ctx.restore();
      line(ctx, plot.x, y0, plot.x + plot.w, y0, pal.ink, 2.5);
      line(ctx, plot.x, y1, plot.x + plot.w, y1, pal.ink, 2.5);
      const n = Math.max(3, Math.floor(plot.w / (px * 7)));
      for (let i = 0; i < n; i++) {
        const X = plot.x + ((i + 0.5) * plot.w) / n;
        if (c.u > 0) arrow(ctx, X - px, (y0 + y1) / 2 + ((i % 2) - 0.5) * (y0 - y1) * 0.4, X + px, (y0 + y1) / 2 + ((i % 2) - 0.5) * (y0 - y1) * 0.4, { colour: pal.muted, width: 1.5, head: 8 });
      }
      line(ctx, O[0], y0, O[0], y1, pal.muted, 1.5, [6, 6]);
      label(ctx, 'directly opposite', O[0] - 6, y1 + 6, { colour: pal.ink, px, align: 'right', baseline: 'top', box: pal.bg });
    } else {
      const ex = O[0] + Math.sin(c.bearing) * plot.w * 2;
      const ey = O[1] - Math.cos(c.bearing) * plot.w * 2;
      line(ctx, O[0], O[1], ex, ey, pal.muted, 1.5, [6, 6]);
    }
    if (p.trail) polyline(ctx, vp, st.hist, (r) => r[1], (r) => r[2], { colour: pal.series[0], width: 3, extra: [x, y] });
    if (st.ev.end === 'bank') {
      const lx = vp.toX(x);
      const ly = vp.toY(c.W);
      if (Math.abs(x) > 1e-9) {
        arrow(ctx, (O[0] + lx) / 2, ly - px * 1.2, O[0], ly - px * 1.2, { colour: pal.ink, width: 1.5, head: 9 });
        arrow(ctx, (O[0] + lx) / 2, ly - px * 1.2, lx, ly - px * 1.2, { colour: pal.ink, width: 1.5, head: 9 });
        label(ctx, `drift ${q(Math.abs(x), 'm')} ${x > 0 ? 'downstream' : 'upstream'}`, (O[0] + lx) / 2, ly - px * 1.6, { colour: pal.ink, px, kind: 'strong', align: 'center', baseline: 'bottom', box: pal.bg });
      } else label(ctx, 'lands directly opposite', lx + px, ly - px * 1.2, { colour: pal.ink, px, kind: 'strong', baseline: 'bottom', box: pal.bg });
    }
  });
  // Vector triangle at the start: relative velocity + velocity of the water/air = ground velocity.
  if (tri) {
    const k = triScale * vp.scaleX;
    const Ax = O[0] + c.rel[0] * k;
    const Ay = O[1] - c.rel[1] * k;
    const kmh = (v) => (c.boat ? q(v, 'm/s') : q(v * 3.6, 'km/h'));
    vector(ctx, pal, O[0], O[1], c.rel[0] * k, -c.rel[1] * k, `${c.boat ? 'boat' : 'air'} ${kmh(Math.hypot(...c.rel))}`, { colour: pal.series[1], px, width: 2.5 });
    vector(ctx, pal, Ax, Ay, c.medium[0] * k, -c.medium[1] * k, `${c.boat ? 'current' : 'wind'} ${kmh(Math.hypot(...c.medium))}`, { colour: pal.series[2], px, width: 2.5, dashed: true });
    vector(ctx, pal, O[0], O[1], c.ground[0] * k, -c.ground[1] * k, null, { colour: pal.ink, px, width: 3.5 });
    const gx = O[0] + c.ground[0] * k * 0.5;
    const gy = O[1] - c.ground[1] * k * 0.5;
    label(ctx, `ground ${kmh(Math.hypot(...c.ground))}`, gx + px * 0.6, gy + px * 0.6, { colour: pal.ink, px, kind: 'strong', baseline: 'top', box: pal.bg });
  }
  // The boat or plane: a triangle pointing along its heading.
  const hx = c.rel[0];
  const hy = c.rel[1];
  const hl = Math.hypot(hx, hy) || 1;
  const X = vp.toX(x);
  const Y = vp.toY(y);
  const s = px * 0.9;
  ctx.beginPath();
  ctx.moveTo(X + (hx / hl) * s * 1.4, Y - (hy / hl) * s * 1.4);
  ctx.lineTo(X - (hx / hl) * s + (hy / hl) * s * 0.7, Y + (hy / hl) * s + (hx / hl) * s * 0.7);
  ctx.lineTo(X - (hx / hl) * s - (hy / hl) * s * 0.7, Y + (hy / hl) * s - (hx / hl) * s * 0.7);
  ctx.closePath();
  ctx.fillStyle = pal.series[0];
  ctx.fill();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  drawAxes(ctx, vp, pal, { px, layer: 'over', xTitle: c.boat ? 'downstream (m)' : 'east (km)', yTitle: c.boat ? 'across (m)' : 'north (km)', formatX: fmt, formatY: fmt });
  if (!c.boat) label(ctx, 'N ↑', plot.x + plot.w - 4, plot.y + px * 2.2, { colour: pal.ink, px, kind: 'strong', align: 'right', baseline: 'top', box: pal.bg });
  void unit;
}

// --------------------------------------------------------------------------------------- roller track

export function drawTrack(ctx, S, st, p, ahead, pal) {
  const { W, H, px, pad } = S;
  const c = st.cfg;
  const P = c.P;
  const top = header(ctx, S, pal, `μ = ${formatPlain(c.mu)} · m = ${formatPlain(c.m)} kg · g = ${formatPlain(c.g)} m/s²`, `t = ${q(st.t, 's')}`);
  const side = Math.min(W * (S.narrow ? 0.4 : 0.32), px * 20);
  const m = axisMargins(px);
  const plot = rect(pad + m.left, top + px * 0.6, W - 2 * pad - side - m.left - m.right - px, H - top - px * 0.6 - m.bottom - pad);
  const yTop = niceCeil(c.H * 1.25);
  const s = Math.min(plot.w / (P.xMax - P.xMin + 2), plot.h / (yTop + 0.5));
  const vp = viewport({ x: [P.xMin - 1, P.xMin - 1 + plot.w / s], y: [-0.5, -0.5 + plot.h / s], rect: plot });
  drawAxes(ctx, vp, pal, { px, layer: 'under', xCount: 6, yCount: 4 });
  // Track.
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= 240; i++) {
    const X = P.xMin + ((P.xMax - P.xMin) * i) / 240;
    if (i === 0) ctx.moveTo(vp.toX(X), vp.toY(P.y(X)));
    else ctx.lineTo(vp.toX(X), vp.toY(P.y(X)));
  }
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
  // Cart, tangent to the track.
  const x = st.y[0];
  const d1 = P.dy(x);
  const ang = Math.atan(d1 * (vp.scaleY / vp.scaleX));
  const X = vp.toX(x);
  const Y = vp.toY(P.y(x));
  const w = px * 2;
  const h = px * 1.1;
  ctx.save();
  ctx.translate(X, Y);
  ctx.rotate(-ang);
  ctx.fillStyle = pal.series[0];
  ctx.fillRect(-w / 2, -h - 4, w, h);
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-w / 2, -h - 4, w, h);
  disc(ctx, -w * 0.28, -3, 3.5, pal.ink);
  disc(ctx, w * 0.28, -3, 3.5, pal.ink);
  ctx.restore();
  const e = trackEnergy(st);
  if (Math.abs(e.v) > 1e-6) {
    const ux = Math.cos(ang) * Math.sign(e.v);
    const uy = -Math.sin(ang) * Math.sign(e.v);
    const L = px * 1.5 + px * 2.5 * Math.min(1, Math.abs(e.v) / Math.sqrt(2 * c.g * c.H + c.v0 * c.v0 + 1e-9));
    vector(ctx, pal, X - Math.sin(ang) * px * 2.4, Y - Math.cos(ang) * px * 2.4, ux * L, uy * L, `v = ${q(Math.abs(e.v), 'm/s')}`, { colour: pal.ink, px, width: 2.5 });
  }
  drawAxes(ctx, vp, pal, { px, layer: 'over', xTitle: 'x (m)', yTitle: 'height (m)', xCount: 6, yCount: 4 });
  if (st.done && st.ev.end === 'stopped') label(ctx, `Stopped at t = ${q(st.t, 's')}: friction holds the cart`, plot.x + 6, plot.y + 6, { colour: pal.ink, px, kind: 'strong', baseline: 'top', box: pal.bg });
  if (st.done && st.ev.end === 'end') label(ctx, 'Reached the end of the track', plot.x + 6, plot.y + 6, { colour: pal.ink, px, kind: 'strong', baseline: 'top', box: pal.bg });

  // Stacked energy bar: KE + GPE + work against friction = starting energy.
  const bx = W - pad - side;
  const by = top + px * 2;
  const bh = H - by - pad - px * 2;
  const E0 = st.e0;
  const k = E0 > 0 ? bh / (E0 * 1.08) : 0;
  const barW = Math.min(side * 0.3, px * 4);
  const parts = [
    { name: 'Heat', v: e.w, colour: pal.series[3] },
    { name: 'GPE', v: e.gpe, colour: pal.series[1] },
    { name: 'KE', v: e.ke, colour: pal.series[0] },
  ];
  label(ctx, 'Energy', bx, by - px * 0.6, { colour: pal.ink, px, kind: 'strong', baseline: 'bottom' });
  let yb = by + bh;
  for (const part of parts) {
    const hgt = Math.max(0, part.v * k);
    ctx.fillStyle = part.colour;
    ctx.fillRect(bx, yb - hgt, barW, hgt);
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 1;
    if (hgt > 1) ctx.strokeRect(bx + 0.5, yb - hgt + 0.5, barW - 1, hgt - 1);
    yb -= hgt;
  }
  const e0y = by + bh - E0 * k;
  line(ctx, bx - 6, e0y, bx + barW + 6, e0y, pal.ink, 2, [6, 4]);
  // Labels to the right of the bar (top to bottom).
  let ly = by + px * 0.8;
  for (const part of [...parts].reverse()) {
    ctx.fillStyle = part.colour;
    ctx.fillRect(bx + barW + px * 0.8, ly - px * 0.7, px * 0.8, px * 0.8);
    label(ctx, `${part.name} ${q(part.v, 'J')}`, bx + barW + px * 2, ly, { colour: pal.ink, px });
    ly += px * 1.5;
  }
  label(ctx, `Start ${q(E0, 'J')}`, bx + barW + px * 2, ly, { colour: pal.ink, px, kind: 'strong' });
  ly += px * 1.5;
  label(ctx, `Sum ${q(e.total, 'J')}`, bx + barW + px * 2, ly, { colour: pal.muted, px });
}

