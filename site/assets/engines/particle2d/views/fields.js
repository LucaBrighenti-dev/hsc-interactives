// Field views: charged particles in E and B fields, an orbit around Earth, and orbits with a GPS fix.
import { q, si, rich, header, subheader, niceCeil, polyline, clipTo, line, disc, vector, viewport, axisMargins, drawAxes, label, arrow, rect, barRows, textWidth } from './common.js';
import { tickText } from '../../../engine-kit.js';
import { PARTICLES, gpsSatellites, gpsReceiver, gpsFix, circularOrbit } from '../model.js';
import { formatPlain, formatNumber } from '../../../format.js';

const time = (t) => (t < 1e-6 ? q(t * 1e9, 'ns') : t < 1e-3 ? q(t * 1e6, 'µs') : t < 120 ? q(t, 's') : t < 7200 ? q(t / 60, 'min') : q(t / 3600, 'h'));

/** Equal-scale viewport centred in a rect, covering [x0, x1] × [y0, y1]. */
function fit(rectIn, x, y) {
  return viewport({ x, y, rect: rectIn, equal: true });
}

// ------------------------------------------------------------------------------------ charged particle

export function drawCharged(ctx, S, st, p, ahead, pal) {
  const { W, H, px, pad } = S;
  const c = st.cfg;
  const part = PARTICLES[p.particle] ?? PARTICLES.electron;
  const magnetic = c.mode === 'magnetic';
  const hasB = c.mode !== 'electric' && c.Bz !== 0;
  const fieldText = [
    c.mode !== 'magnetic' ? `E = V/d = ${si(Math.abs(c.Ey), 'V/m')}` : null,
    c.mode !== 'electric' ? `B = ${formatPlain(p.bField)} mT ${p.bDirection === 'into' ? 'into' : 'out of'} the page` : null,
  ].filter(Boolean).join(' · ');
  let top = header(ctx, S, pal, `${part.label} · v = ${formatNumber(c.v)} m/s · ${fieldText}`, `t = ${time(st.t)}`);
  top = subheader(ctx, S, pal, `m = ${formatNumber(part.mass)} kg · q = ${formatNumber(part.charge)} C · gravity ignored`, top);

  const L = c.L;
  const m = axisMargins(px);
  const plot = rect(pad + m.left, top + px * 0.4, W - 2 * pad - m.left - m.right, H - top - px * 0.4 - m.bottom - pad);
  const yHalf = magnetic ? c.yMax : c.d / 2 + Math.max(c.d * 0.35, L * 0.06);
  const vp = fit(plot, [-0.15 * L, L * 1.08], [-yHalf, yHalf]);
  const cm = { formatX: (v) => tickText(v * 100), formatY: (v) => tickText(v * 100) };
  drawAxes(ctx, vp, pal, { px, layer: 'under', grid: true, ...cm, xCount: 8, yCount: 6 });

  clipTo(ctx, plot, () => {
    // Field region and symbols.
    const fx0 = vp.toX(0);
    const fx1 = vp.toX(L);
    const fy0 = magnetic ? plot.y : vp.toY(c.d / 2);
    const fy1 = magnetic ? plot.y + plot.h : vp.toY(-c.d / 2);
    line(ctx, fx0, plot.y, fx0, plot.y + plot.h, pal.axis, 1.5, [6, 6]);
    line(ctx, fx1, plot.y, fx1, plot.y + plot.h, pal.axis, 1.5, [6, 6]);
    if (hasB) {
      const step = Math.max(px * 2.6, (fx1 - fx0) / 9);
      ctx.save();
      ctx.strokeStyle = pal.muted;
      ctx.fillStyle = pal.muted;
      ctx.lineWidth = 1.5;
      for (let X = fx0 + step / 2; X < fx1; X += step) {
        for (let Y = fy0 + step / 2; Y < fy1; Y += step) {
          ctx.beginPath();
          ctx.arc(X, Y, px * 0.38, 0, Math.PI * 2);
          ctx.stroke();
          if (p.bDirection === 'into') {
            const d = px * 0.27;
            ctx.beginPath();
            ctx.moveTo(X - d, Y - d);
            ctx.lineTo(X + d, Y + d);
            ctx.moveTo(X + d, Y - d);
            ctx.lineTo(X - d, Y + d);
            ctx.stroke();
          } else disc(ctx, X, Y, px * 0.1, pal.muted);
        }
      }
      ctx.restore();
    }
    if (!magnetic) {
      // E field arrows from the + plate to the − plate.
      if (c.Ey !== 0) {
        const n = Math.max(3, Math.floor((fx1 - fx0) / (px * 3.4)));
        const dir = Math.sign(c.Ey); // −1: pointing down the page in world y
        for (let i = 0; i < n; i++) {
          const X = fx0 + ((i + 0.5) * (fx1 - fx0)) / n;
          const Ya = vp.toY(-dir * c.d * 0.32);
          const Yb = vp.toY(dir * c.d * 0.32);
          arrow(ctx, X, Ya, X, Yb, { colour: pal.axis, width: 1.5, head: 9 });
        }
      }
      // Plates with + / − glyphs (second cue to colour).
      const th = Math.max(6, px * 0.45);
      const topSign = c.V > 0 ? '+' : c.V < 0 ? '−' : '0';
      const botSign = c.V > 0 ? '−' : c.V < 0 ? '+' : '0';
      for (const [Y, sign, side] of [[vp.toY(c.d / 2), topSign, -1], [vp.toY(-c.d / 2), botSign, 1]]) {
        ctx.fillStyle = sign === '+' ? pal.series[0] : sign === '−' ? pal.series[1] : pal.axis;
        ctx.fillRect(fx0, side < 0 ? Y - th : Y, fx1 - fx0, th);
        const n = Math.max(2, Math.floor((fx1 - fx0) / (px * 3)));
        for (let i = 0; i < n; i++) label(ctx, sign, fx0 + ((i + 0.5) * (fx1 - fx0)) / n, side < 0 ? Y - th - 2 : Y + th + 2, { colour: pal.ink, px: px + 2, kind: 'strong', align: 'center', baseline: side < 0 ? 'bottom' : 'top' });
      }
    }
    // Approach line, then the path.
    line(ctx, vp.toX(-0.15 * L), vp.toY(0), fx0, vp.toY(0), pal.muted, 1.5, [4, 6]);
    if (p.trail) polyline(ctx, vp, st.hist, (r) => r[1], (r) => r[2], { colour: pal.series[0], width: 3, extra: [st.y[0], st.y[1]] });
  });

  const X = vp.toX(st.y[0]);
  const Y = vp.toY(st.y[1]);
  const [vx, vy] = [st.y[2], st.y[3]];
  const sp = Math.hypot(vx, vy);
  const Fx = c.q * vy * c.Bz;
  const Fy = c.q * (c.Ey - vx * c.Bz);
  const F = Math.hypot(Fx, Fy);
  const Lv = px * 4;
  if (sp > 0) vector(ctx, pal, X, Y, (vx / sp) * Lv, (-vy / sp) * Lv, `v = ${q(sp, 'm/s')}`, { colour: pal.ink, px });
  if (F > 0) vector(ctx, pal, X, Y, (Fx / F) * Lv * 0.8, (-Fy / F) * Lv * 0.8, `F = ${q(F, 'N')}`, { colour: pal.series[1], px, width: 2.5, dashed: true });
  disc(ctx, X, Y, px * 0.55, pal.series[0], pal.ink);
  label(ctx, part.charge < 0 ? '−' : '+', X, Y + 1, { colour: pal.bg, px, kind: 'strong', align: 'center', baseline: 'middle' });

  drawAxes(ctx, vp, pal, { px, layer: 'over', xTitle: 'x (cm)', yTitle: 'y (cm)', ...cm, xCount: 8, yCount: 6 });

  if (st.done) {
    const end = st.ev.end;
    const msg =
      end === 'plate' ? `Hit the plate after ${time(st.t)}` :
      end === 'right' ? `Left the field after ${time(st.t)}, deflected ${si(st.y[1], 'm')}` :
      end === 'left' ? `Back out of the field after ${time(st.t)}, ${si(Math.abs(st.y[1]), 'm')} from the entry point` :
      end === 'view' ? 'Left the view: the radius is larger than the window' : `Stopped after ${time(st.t)}`;
    label(ctx, msg, plot.x + 8, plot.y + 8, { colour: pal.ink, px, kind: 'strong', baseline: 'top', box: pal.bg, padding: 6 });
  } else if (magnetic && hasB) {
    label(ctx, `r = mv/qB = ${si(c.radius, 'm')}`, plot.x + 8, plot.y + 8, { colour: pal.ink, px, baseline: 'top', box: pal.bg, padding: 6 });
  }
}

// ------------------------------------------------------------------------------------------------ orbit

function earth(ctx, vp, R, pal, px, spin = null) {
  const X = vp.toX(0);
  const Y = vp.toY(0);
  const r = R * vp.scaleX;
  disc(ctx, X, Y, r, pal.grid, pal.axis, 2);
  if (spin !== null) line(ctx, X, Y, X + r * Math.cos(spin), Y - r * Math.sin(spin), pal.axis, 1.5, [4, 4]);
  if (r > px * 2.2) label(ctx, 'Earth', X, Y, { colour: pal.muted, px, align: 'center', baseline: 'middle' });
}

export function drawOrbit(ctx, S, st, p, ahead, pal) {
  const { W, H, px, pad } = S;
  const c = st.cfg;
  const top = header(ctx, S, pal, `Launch ${formatPlain(p.orbitSpeed)} km/s at ${formatPlain(p.altitude)} km · circular ${q(Math.sqrt(c.GM / c.r0) / 1000, 'km/s')} · escape ${q(Math.sqrt((2 * c.GM) / c.r0) / 1000, 'km/s')}`, `t = ${time(st.t)}`);
  const wide = !S.narrow && W > H * 1.25;
  const side = wide ? Math.min(W * 0.3, px * 19) : 0;
  const area = rect(pad, top + px * 0.4, W - 2 * pad - side, H - top - pad - px * 0.4);
  const R = c.viewR * 1.06;
  const vp = fit(area, [-R, R], [-R, R]);
  const [x, y, vx, vy] = st.y;

  // Equal areas: sectors over equal time intervals.
  const T = c.el.bound ? c.el.period : c.Tc;
  const dtA = T / 12;
  if (p.showAreas) {
    const rows = st.hist;
    let k = 0;
    let i0 = 0;
    const sectors = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] >= (k + 1) * dtA - 1e-9 || i === rows.length - 1) {
        sectors.push([i0, i, rows[i][0] >= (k + 1) * dtA - 1e-9]);
        i0 = i;
        k += 1;
      }
    }
    sectors.forEach(([a, b], n) => {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = n % 2 ? pal.series[1] : pal.series[2];
      ctx.beginPath();
      ctx.moveTo(vp.toX(0), vp.toY(0));
      for (let j = a; j <= b; j++) ctx.lineTo(vp.toX(rows[j][1]), vp.toY(rows[j][2]));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    label(ctx, `Shaded sectors: equal times of ${time(dtA)}, equal areas of ${q(0.5 * Math.abs(c.r0 * c.v0 * Math.cos(c.gamma)) * dtA, 'm²')}`, area.x, area.y + area.h, { colour: pal.ink, px, baseline: 'bottom', box: pal.bg });
  }
  earth(ctx, vp, c.R, pal, px);
  if (p.trail) polyline(ctx, vp, st.hist, (r) => r[1], (r) => r[2], { colour: pal.series[0], width: 3, extra: [x, y] });
  const X = vp.toX(x);
  const Y = vp.toY(y);
  if (p.showVectors) {
    const r = Math.hypot(x, y);
    const v = Math.hypot(vx, vy);
    const vRef = Math.max(c.v0, Math.sqrt(c.GM / c.R) * 0.5);
    const L = px * 4.5;
    vector(ctx, pal, X, Y, (vx / vRef) * L, (-vy / vRef) * L, `v = ${q(v / 1000, 'km/s')}`, { colour: pal.ink, px });
    const g = c.GM / (r * r);
    vector(ctx, pal, X, Y, (-x / r) * px * 3, (y / r) * px * 3, `g = ${q(g, 'm/s²')}`, { colour: pal.series[1], px, width: 2.5, dashed: true });
  }
  ctx.fillStyle = pal.series[0];
  ctx.fillRect(X - px * 0.4, Y - px * 0.4, px * 0.8, px * 0.8);
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(X - px * 0.4, Y - px * 0.4, px * 0.8, px * 0.8);

  // Scale bar.
  const sb = niceCeil((area.w * 0.18) / vp.scaleX / 1000) * 1000;
  const sx = area.x + px * 0.5;
  const sy = area.y + px * 0.8;
  line(ctx, sx, sy, sx + sb * vp.scaleX, sy, pal.ink, 2.5);
  label(ctx, `${formatNumber(sb / 1000)} km`, sx, sy + 6, { colour: pal.ink, px, kind: 'mono', baseline: 'top' });

  if (st.done) {
    const msg = st.ev.end === 'crash' ? `Hit Earth after ${time(st.t)}` : st.ev.end === 'escape' ? `Escaped: left the view after ${time(st.t)}` : st.ev.end === 'orbit' ? `One full orbit in ${time(st.t)}` : `Stopped after ${time(st.t)}`;
    label(ctx, msg, area.x + area.w / 2, area.y + px * 0.2, { colour: pal.ink, px, kind: 'strong', align: 'center', baseline: 'top', box: pal.bg, padding: 6 });
  }

  // Energy bars (wide stages): KE, GPE and total, per kilogram scale from the start.
  if (side) {
    const bx = W - pad - side + px;
    const r = Math.hypot(x, y);
    const ke = 0.5 * c.m * (vx * vx + vy * vy);
    const pe = (-c.GM * c.m) / r;
    const scale = Math.max(Math.abs((-c.GM * c.m) / c.R), 1);
    label(ctx, 'Energy', bx, area.y + px, { colour: pal.ink, px, kind: 'strong', baseline: 'bottom' });
    barRows(ctx, rect(bx, area.y + px * 1.4, side - px, px * 6.4), pal, px, [
      { label: 'KE', value: ke, colour: pal.series[0], text: si(ke, 'J'), signed: true },
      { label: 'GPE', value: pe, colour: pal.series[1], text: si(pe, 'J') },
      { label: 'Total', value: ke + pe, colour: pal.ink, dashed: true, text: si(ke + pe, 'J') },
    ], scale);
    let ty = area.y + px * 9.6;
    const el = c.el;
    const lines = [
      el.bound ? `Period ${time(el.period)}` : 'Not bound: total energy ≥ 0',
      `Eccentricity ${formatNumber(el.e)}`,
      `Lowest ${q((el.rp - c.R) / 1000, 'km')}`,
      el.bound ? `Highest ${q((el.ra - c.R) / 1000, 'km')}` : null,
    ].filter(Boolean);
    for (const l of lines) {
      label(ctx, l, bx, ty, { colour: pal.ink, px });
      ty += px * 1.5;
    }
  }
}

// ------------------------------------------------------------------------------------------- orbit-gps

export function drawOrbitGps(ctx, S, st, p, ahead, pal) {
  const { W, H, px, pad } = S;
  const c = st.cfg;
  const gpsView = p.gpsView === 'gps';
  const top = header(
    ctx,
    S,
    pal,
    gpsView ? `GPS fix · receiver clock error ${formatPlain(p.clockError)} ns → ranges ${q(299792458 * c.clock, 'm')} too long` : 'Low, GPS and geostationary orbits (to scale)',
    `t = ${q(st.t / 3600, 'h')}`,
  );
  const spin = c.psi0 + c.omegaE * st.t;
  const area = rect(pad, top + px * 0.4, W - 2 * pad, H - top - pad - px * 0.4);

  if (!gpsView) {
    const R = c.rGeo * 1.1;
    const vp = fit(area, [-R, R], [-R, R]);
    earth(ctx, vp, c.R, pal, px, spin);
    const sats = [
      { r: c.rLeo, x: st.y[0], y: st.y[1], colour: pal.series[0], name: 'Low orbit', shape: 'circle' },
      { r: c.rGps, x: st.y[4], y: st.y[5], colour: pal.series[1], name: 'GPS', shape: 'square' },
      { r: c.rGeo, x: st.y[8], y: st.y[9], colour: pal.series[2], name: 'Geostationary', shape: 'triangle' },
    ];
    for (const s of sats) {
      ctx.save();
      ctx.strokeStyle = s.colour;
      ctx.lineWidth = 2;
      ctx.setLineDash(s.shape === 'square' ? [10, 6] : s.shape === 'triangle' ? [3, 5] : []);
      ctx.beginPath();
      ctx.arc(vp.toX(0), vp.toY(0), s.r * vp.scaleX, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    const allGps = gpsSatellites(st);
    for (const g of allGps.slice(1)) shape(ctx, vp.toX(g[0]), vp.toY(g[1]), px * 0.4, 'square', pal.series[1], pal);
    for (const s of sats) shape(ctx, vp.toX(s.x), vp.toY(s.y), px * 0.55, s.shape, s.colour, pal);
    // Key with altitude and period of each orbit.
    const keyLines = sats.map((s) => {
      const o = circularOrbit(c.GM, s.r);
      return { s, text: `${s.name}: ${q((s.r - c.R) / 1000, 'km')} up, ${time(o.period)}, ${q(o.speed / 1000, 'km/s')}` };
    });
    let ky = area.y + px * 0.4;
    for (const { s, text } of keyLines) {
      shape(ctx, area.x + px * 0.6, ky + px * 0.6, px * 0.45, s.shape, s.colour, pal);
      label(ctx, text, area.x + px * 1.6, ky + px * 0.6, { colour: pal.ink, px, baseline: 'middle', box: pal.bg });
      ky += px * 1.6;
    }
    const rx = gpsReceiver(st);
    disc(ctx, vp.toX(rx[0]), vp.toY(rx[1]), Math.max(3, px * 0.25), pal.ink);
    label(ctx, 'Earth turns once per sidereal day (23.93 h)', area.x, area.y + area.h, { colour: pal.muted, px, baseline: 'bottom', box: pal.bg });
    return;
  }

  // GPS fix: three highest satellites, pseudorange circles, and a zoomed inset at the receiver.
  const R = c.rGps * 1.08;
  const insetW = S.narrow ? 0 : Math.min(area.w * 0.36, area.h * 0.9);
  const main = rect(area.x, area.y, area.w - insetW - (S.narrow ? 0 : px), area.h);
  const vp = fit(main, [-R, R], [-R, R]);
  const fix = gpsFix(st);
  const rx = fix.receiver;
  const RX = vp.toX(rx[0]);
  const RY = vp.toY(rx[1]);
  earth(ctx, vp, c.R, pal, px, spin);
  ctx.save();
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(vp.toX(0), vp.toY(0), c.rGps * vp.scaleX, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // Horizon at the receiver.
  const ux = rx[0] / c.R;
  const uy = rx[1] / c.R;
  const hz = R * 1.2 * vp.scaleX;
  clipTo(ctx, main, () => {
    line(ctx, RX - uy * hz, RY - ux * hz, RX + uy * hz, RY + ux * hz, pal.muted, 1.5, [6, 6]);
    for (const [n, s] of fix.used.entries()) {
      ctx.save();
      ctx.strokeStyle = pal.series[1];
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.arc(vp.toX(s.pos[0]), vp.toY(s.pos[1]), s.pseudo * vp.scaleX, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      line(ctx, vp.toX(s.pos[0]), vp.toY(s.pos[1]), RX, RY, pal.series[1], 1.5);
      void n;
    }
  });
  for (const s of fix.sats) {
    const used = fix.used.indexOf(s);
    shape(ctx, vp.toX(s.pos[0]), vp.toY(s.pos[1]), px * (used >= 0 ? 0.55 : 0.38), 'square', used >= 0 ? pal.series[1] : pal.grid, pal);
    if (used >= 0) label(ctx, String(used + 1), vp.toX(s.pos[0]) + px * 0.7, vp.toY(s.pos[1]) - px * 0.5, { colour: pal.ink, px, kind: 'strong', baseline: 'bottom', box: pal.bg });
  }
  disc(ctx, RX, RY, px * 0.35, pal.series[0], pal.ink);
  label(ctx, 'receiver', RX + px * 0.6, RY + px * 0.4, { colour: pal.ink, px, baseline: 'top', box: pal.bg });
  let ky = main.y + px * 0.4;
  for (const [n, s] of fix.used.entries()) {
    label(ctx, `${n + 1}: ${q(s.range / 1000, 'km')}, signal ${q(s.travel * 1000, 'ms')}`, main.x, ky + px * 0.9, { colour: pal.ink, px, box: pal.bg });
    ky += px * 1.5;
  }
  if (S.narrow) {
    label(ctx, `Position error ${fix.error === null ? '—' : q(fix.error, 'm')}`, main.x, main.y + main.h, { colour: pal.ink, px, kind: 'strong', baseline: 'bottom', box: pal.bg });
    return;
  }

  // Inset: the three range lines near the receiver, true position and the fix.
  const ins = rect(area.x + area.w - insetW, area.y + px * 1.6, insetW, Math.min(insetW, area.h - px * 1.6));
  ctx.fillStyle = pal.bg;
  ctx.fillRect(ins.x, ins.y, ins.w, ins.h);
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ins.x + 0.5, ins.y + 0.5, ins.w - 1, ins.h - 1);
  const err = fix.error ?? 0;
  const half = niceCeil(Math.max(50, err * 1.6, Math.abs(299792458 * c.clock) * 1.6));
  label(ctx, `Zoom at the receiver: ${formatNumber(2 * half)} m across`, ins.x, ins.y - 6, { colour: pal.ink, px, kind: 'strong', baseline: 'bottom' });
  const ivp = viewport({ x: [-half, half], y: [-half, half], rect: ins, equal: true });
  clipTo(ctx, ins, () => {
    for (const s of fix.used) {
      // Points on the pseudorange circle near the receiver, computed relative to the receiver.
      const dx = rx[0] - s.pos[0];
      const dy = rx[1] - s.pos[1];
      const base = Math.atan2(dy, dx);
      const span = (half * 1.6) / s.pseudo;
      ctx.save();
      ctx.strokeStyle = pal.series[1];
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const a = base - span + (2 * span * i) / 20;
        const lx = s.pos[0] - rx[0] + s.pseudo * Math.cos(a);
        const ly = s.pos[1] - rx[1] + s.pseudo * Math.sin(a);
        if (i === 0) ctx.moveTo(ivp.toX(lx), ivp.toY(ly));
        else ctx.lineTo(ivp.toX(lx), ivp.toY(ly));
      }
      ctx.stroke();
      ctx.restore();
    }
    const cx = ivp.toX(0);
    const cy = ivp.toY(0);
    line(ctx, cx - px * 0.6, cy, cx + px * 0.6, cy, pal.ink, 2.5);
    line(ctx, cx, cy - px * 0.6, cx, cy + px * 0.6, pal.ink, 2.5);
    if (fix.solution) {
      const fx = ivp.toX(fix.solution[0] - rx[0]);
      const fy = ivp.toY(fix.solution[1] - rx[1]);
      disc(ctx, fx, fy, px * 0.4, pal.series[0], pal.ink);
    }
  });
  let ly = ins.y + ins.h + px * 1.2;
  label(ctx, '+ true position   ● best fit to the 3 ranges', ins.x, ly, { colour: pal.ink, px });
  ly += px * 1.5;
  label(ctx, `Position error ${fix.error === null ? '—' : q(fix.error, 'm')}`, ins.x, ly, { colour: pal.ink, px, kind: 'strong' });
  if (c.clock !== 0) {
    ly += px * 1.5;
    label(ctx, 'Real receivers use one more satellite', ins.x, ly, { colour: pal.muted, px });
    ly += px * 1.3;
    label(ctx, 'to solve for their clock error as well.', ins.x, ly, { colour: pal.muted, px });
  }
}

/** Satellite marker: circle, square or triangle (shape is the second cue to colour). */
function shape(ctx, X, Y, r, kind, fill, pal) {
  ctx.beginPath();
  if (kind === 'circle') ctx.arc(X, Y, r, 0, Math.PI * 2);
  else if (kind === 'triangle') {
    ctx.moveTo(X, Y - r * 1.2);
    ctx.lineTo(X + r * 1.1, Y + r * 0.8);
    ctx.lineTo(X - r * 1.1, Y + r * 0.8);
    ctx.closePath();
  } else ctx.rect(X - r, Y - r, 2 * r, 2 * r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = pal.ink;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

