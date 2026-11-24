// Projectile view: true-scale trajectory (1 m is the same length on both axes), launch platform, angle,
// trail, velocity vector and components, apex and range markers, and the no-drag path for comparison.
import { q, rich, header, niceCeil, polyline, clipTo, line, disc, vector, viewport, axisMargins, drawAxes, label, arrow, rect, textWidth } from './common.js';
import { projectileNoDrag, projectilePoint } from '../model.js';
import { formatPlain } from '../../../format.js';

export function drawProjectile(ctx, S, st, p, ahead, pal) {
  const { W, H, px, pad } = S;
  const c = st.cfg;
  const dragOn = p.drag !== 'none';
  const conditions = `g = ${formatPlain(p.g)} m/s² · ${
    dragOn ? `air resistance ${p.drag === 'linear' ? 'kv' : 'kv²'}, k = ${formatPlain(p.k)} ${p.drag === 'linear' ? 'kg/s' : 'kg/m'}, m = ${formatPlain(p.mass)} kg` : 'no air resistance'
  }`;
  const top = header(ctx, S, pal, conditions, `t = ${q(st.t, 's')}`);

  // World extents from the whole flight (preview), the no-drag comparison and the current point.
  const run = ahead ?? st;
  let xMax = Math.max(st.y[0], 0);
  let yMax = Math.max(c.height, st.y[1]);
  for (const r of run.hist) {
    if (r[1] > xMax) xMax = r[1];
    if (r[2] > yMax) yMax = r[2];
  }
  const ghost = dragOn && p.showNoDrag ? projectileNoDrag(p) : null;
  if (ghost) {
    xMax = Math.max(xMax, ghost.range);
    yMax = Math.max(yMax, ghost.maxHeight);
  }
  const xHi = niceCeil(Math.max(1, xMax) * 1.04);
  const yHi = niceCeil(Math.max(1, yMax) * 1.12);
  const xLo = -0.06 * xHi;
  const m = axisMargins(px);
  const plot = rect(pad + m.left, top + px * 0.4, W - 2 * pad - m.left - m.right, H - top - px * 0.4 - m.bottom - pad);
  // Equal scale, ground on the bottom edge, launch point near the left edge.
  const s = Math.min(plot.w / (xHi - xLo), plot.h / yHi);
  const vp = viewport({ x: [xLo, xLo + plot.w / s], y: [0, plot.h / s], rect: plot });
  drawAxes(ctx, vp, pal, { px, layer: 'under', xCount: 8, yCount: 5 });

  const X0 = vp.toX(0);
  const Y0 = vp.toY(c.height);
  const ground = vp.toY(0);

  clipTo(ctx, { x: plot.x - 2, y: plot.y - px * 3, w: plot.w + 4, h: plot.h + px * 3 + 2 }, () => {
    // Launch platform.
    if (c.height > 0) {
      ctx.fillStyle = pal.grid;
      ctx.fillRect(plot.x, Y0, X0 - plot.x, ground - Y0);
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(plot.x, Y0, X0 - plot.x, ground - Y0);
    }

    // No-drag comparison path (dashed, muted).
    if (ghost && ghost.flightTime > 0) {
      const pts = [];
      for (let i = 0; i <= 96; i++) pts.push(projectilePoint(p, (ghost.flightTime * i) / 96));
      polyline(ctx, vp, pts, (r) => r[0], (r) => r[1], { colour: pal.muted, width: 2, dash: [8, 6] });
      const [gx, gy] = projectilePoint(p, ghost.timeToApex);
      label(ctx, 'no air resistance', vp.toX(gx), vp.toY(gy) - px * 0.6, { colour: pal.muted, px, align: 'center', baseline: 'bottom', box: pal.bg });
    }

    // Launch angle.
    const th = (p.angle * Math.PI) / 180;
    if (c.speed > 0 && Math.abs(p.angle) >= 1) {
      const ar = px * 2.6;
      line(ctx, X0, Y0, X0 + ar * 1.5, Y0, pal.axis, 1.5, [5, 5]);
      ctx.save();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(X0, Y0, ar, Math.min(0, -th), Math.max(0, -th));
      ctx.stroke();
      ctx.restore();
      // Beside the arc, just above (or below, for a downward launch) the horizontal reference line.
      label(ctx, `θ = ${formatPlain(p.angle)}°`, X0 + ar + px * 0.4, Y0 + (th > 0 ? -px * 0.2 : px * 0.2), {
        colour: pal.ink,
        px,
        baseline: th > 0 ? 'bottom' : 'top',
        box: pal.bg,
      });
    }

    // Trail: the path so far.
    if (p.trail) polyline(ctx, vp, st.hist, (r) => r[1], (r) => r[2], { colour: pal.series[0], width: 3, extra: [st.y[0], st.y[1]] });

    // Apex: dashed drop line and H label.
    const apex = st.ev.apex;
    if (apex && apex.t > 0) {
      const ax = vp.toX(apex.x);
      const ay = vp.toY(apex.y);
      line(ctx, ax, ay, ax, ground, pal.muted, 1.5, [6, 6]);
      ctx.fillStyle = pal.ink;
      ctx.fillRect(ax - 5, ay - 5, 10, 10);
      label(ctx, `H = ${q(apex.y, 'm')}`, ax + px * 0.6, ay - px * 0.5, { colour: pal.ink, px, kind: 'strong', baseline: 'bottom', box: pal.bg });
    }

    // Landing: a dimension line for the range.
    const land = st.ev.land;
    if (land && land.x > 0) {
      const lx = vp.toX(land.x);
      const dy = ground - px * 2.3;
      arrow(ctx, (X0 + lx) / 2, dy, X0, dy, { colour: pal.ink, width: 1.5, head: 10 });
      arrow(ctx, (X0 + lx) / 2, dy, lx, dy, { colour: pal.ink, width: 1.5, head: 10 });
      line(ctx, lx, ground, lx, dy - px * 0.5, pal.ink, 1.5);
      if (c.height === 0) line(ctx, X0, ground, X0, dy - px * 0.5, pal.ink, 1.5);
      label(ctx, `R = ${q(land.x, 'm')}`, (X0 + lx) / 2, dy - px * 0.35, { colour: pal.ink, px, kind: 'strong', align: 'center', baseline: 'bottom', box: pal.bg });
    }
  });

  // The ball and its velocity (drawn last, over everything, and allowed past the plot edge).
  const X = vp.toX(st.y[0]);
  const Y = vp.toY(st.y[1]);
  const [vx, vy] = [st.y[2], st.y[3]];
  let vRef = Math.max(c.speed, 1);
  if (ahead?.ev.land) vRef = Math.max(vRef, Math.hypot(ahead.ev.land.vx, ahead.ev.land.vy));
  const vs = (0.2 * Math.min(plot.w, plot.h)) / vRef;
  if (p.showComponents) {
    const dx = vx * vs;
    const dy = -vy * vs;
    line(ctx, X + dx, Y, X + dx, Y + dy, pal.muted, 1, [3, 4]);
    line(ctx, X, Y + dy, X + dx, Y + dy, pal.muted, 1, [3, 4]);
    if (vector(ctx, pal, X, Y, dx, 0, null, { colour: pal.series[1], width: 2.5, dashed: true, px })) {
      rich(ctx, ['v', { sub: 'x' }, ` = ${q(vx, 'm/s')}`], X + dx / 2, Y + (dy > 0 ? -px * 0.6 : px * 0.7), {
        px,
        colour: pal.ink,
        align: 'center',
        baseline: dy > 0 ? 'bottom' : 'top',
        box: pal.bg,
      });
    }
    if (vector(ctx, pal, X, Y, 0, dy, null, { colour: pal.series[2], width: 2.5, dashed: true, px })) {
      rich(ctx, ['v', { sub: 'y' }, ` = ${q(vy, 'm/s')}`], X - px * 0.6, Y + dy / 2, { px, colour: pal.ink, align: 'right', baseline: 'middle', box: pal.bg });
    }
  }
  if (p.showVelocity) vector(ctx, pal, X, Y, vx * vs, -vy * vs, `v = ${q(Math.hypot(vx, vy), 'm/s')}`, { colour: pal.ink, width: 3, px });
  disc(ctx, X, Y, Math.max(6, px * 0.5), pal.series[0], pal.ink, 1.5);

  drawAxes(ctx, vp, pal, { px, layer: 'over', xTitle: 'x (m)', yTitle: 'y (m)', xCount: 8, yCount: 5 });

  // Key: events reached so far (top right of the plot).
  const lines = [];
  if (st.ev.apex && st.ev.apex.t > 0) lines.push(`Top: ${q(st.ev.apex.y, 'm')} high at t = ${q(st.ev.apex.t, 's')}`);
  if (st.ev.land) lines.push(`Landed: ${q(st.ev.land.x, 'm')} away at t = ${q(st.ev.land.t, 's')}`);
  if (lines.length && !S.narrow) {
    const w = Math.max(...lines.map((l) => textWidth(ctx, l, px))) + px;
    const x0 = plot.x + plot.w - w;
    let y = plot.y + px * 0.2;
    ctx.fillStyle = pal.bg;
    ctx.fillRect(x0, y, w, lines.length * px * 1.45 + px * 0.4);
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, y + 0.5, w - 1, lines.length * px * 1.45 + px * 0.4 - 1);
    for (const l of lines) {
      y += px * 1.45;
      label(ctx, l, x0 + px * 0.5, y, { colour: pal.ink, px });
    }
  }
}
