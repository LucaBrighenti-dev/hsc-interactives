// aero view: drawing only. Reads the model's solution; never changes physics.
//
// flight-forces: left, an aerofoil at angle of attack α on its flight path with the four forces
//   drawn to one scale through their lines of action (lift, weight, thrust, drag), the weight's
//   components, and the α and γ angles; right, a graph (C_L–α lift curve, drag polar, or thrust
//   needed against airspeed). The stall is shown in words (a banner) and in the picture
//   (separated flow over the wing, the shaded stalled region on the graphs).
// pitot-static: left, the probe with its total and static ports piped to an airspeed indicator
//   and an altimeter; right, the ISA pressure–altitude curve read backwards from p_s.
//
// Second cues beyond colour: every force arrow carries its symbol and value; drag has an open
// head; weight components are dashed; the static line is dashed, the total line solid.
import { createSurface, readPalette, stageFontPx, drawAxes, axisMargins, viewport, label, arrow, font } from '../../engine-kit.js';
import { formatNumber, formatPlain, siPrefix, MINUS } from '../../format.js';
import { liftCoefficient, dragCoefficient, speedSweep, isa, pressureAltitude, ALPHA_MIN, ALPHA_MAX, SPEED_MAX, STALL_WARNING_DEG, FT, KNOT, ISA, ISA_EXPONENT } from './model.js';

const DEG = Math.PI / 180;
const fmt = (v, sigfigs = 3) => formatNumber(v, { sigfigs });
const N = (v) => siPrefix(v, 'N');
const deg = (v) => `${fmt(v)}°`;
/** A whole number with grouping and a true minus sign: 1500, 11 000, −84 (altitudes, feet). */
const whole = (v) => {
  const r = Math.round(v);
  return r === 0 ? '0' : formatNumber(r, { sigfigs: String(Math.abs(r)).length });
};

// ---------------------------------------------------------------- Text with sub- and superscripts

/** "C_L", "C_{D0}", "x^{2}": `_` or `^` applies to the next character, or to a {braced} group. */
function parseRich(text) {
  const parts = [];
  let buf = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if ((ch === '_' || ch === '^') && i + 1 < text.length) {
      if (buf) parts.push({ t: buf, mode: 0 });
      buf = '';
      let s;
      if (text[i + 1] === '{') {
        const end = text.indexOf('}', i + 2);
        const stop = end < 0 ? text.length : end;
        s = text.slice(i + 2, stop);
        i = stop;
      } else {
        s = text[i + 1];
        i += 1;
      }
      parts.push({ t: s, mode: ch === '_' ? 1 : 2 });
    } else buf += ch;
  }
  if (buf) parts.push({ t: buf, mode: 0 });
  return parts;
}

function richWidth(ctx, text, px, kind = 'label') {
  const small = Math.round(px * 0.8);
  let w = 0;
  ctx.save();
  for (const p of parseRich(text)) {
    ctx.font = font(kind, p.mode ? small : px);
    w += ctx.measureText(p.t).width;
  }
  ctx.restore();
  return w;
}

/** Draw rich text on an alphabetic baseline at y. Returns the width. */
function rich(ctx, text, x, y, { colour = '#121316', px = 18, kind = 'label', align = 'left', box = null, padding = 4 } = {}) {
  const parts = parseRich(text);
  const small = Math.round(px * 0.8);
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const widths = parts.map((p) => {
    ctx.font = font(kind, p.mode ? small : px);
    return ctx.measureText(p.t).width;
  });
  const total = widths.reduce((a, b) => a + b, 0);
  let left = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  if (box) {
    ctx.fillStyle = box;
    ctx.fillRect(left - padding, y - px * 0.92 - padding, total + 2 * padding, px * 1.3 + 2 * padding);
  }
  ctx.fillStyle = colour;
  parts.forEach((p, i) => {
    ctx.font = font(kind, p.mode ? small : px);
    const dy = p.mode === 1 ? px * 0.3 : p.mode === 2 ? -px * 0.42 : 0;
    ctx.fillText(p.t, left, y + dy);
    left += widths[i];
  });
  ctx.restore();
  return total;
}

/** Draw the first of `options` that fits in maxWidth (the last one regardless). */
function richFit(ctx, options, x, y, maxWidth, opts) {
  const list = Array.isArray(options) ? options : [options];
  const pick = list.find((t) => richWidth(ctx, t, opts.px, opts.kind) <= maxWidth) ?? list[list.length - 1];
  return rich(ctx, pick, x, y, opts);
}

// ---------------------------------------------------------------- Shapes

/** Arrow with an open (chevron) head: the second cue that marks drag. */
function openArrow(ctx, x0, y0, x1, y1, { colour, width = 3, head = 14 }) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1) return false;
  const ux = dx / len;
  const uy = dy / len;
  const h = Math.min(head, len * 0.6);
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1 - ux * width * 0.5, y1 - uy * width * 0.5);
  ctx.moveTo(x1 - ux * h - uy * h * 0.55, y1 - uy * h + ux * h * 0.55);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 - ux * h + uy * h * 0.55, y1 - uy * h - ux * h * 0.55);
  ctx.stroke();
  ctx.restore();
  return true;
}

function dashedLine(ctx, x0, y0, x1, y1, colour, width = 1.5, dash = [6, 6]) {
  ctx.save();
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}

/**
 * Aerofoil outline in chord units (x from 0 at the leading edge to 1 at the trailing edge).
 * Thickness: the NACA four-digit distribution at 12% (Abbott & von Doenhoff, Theory of Wing
 * Sections, 1959; closed trailing edge). Camber: a parabolic arc of height m, which by thin-aerofoil
 * theory has zero-lift angle −2m, so m = C_L0/(4π) draws the aerofoil the lift model describes.
 */
function aerofoil(cl0, n = 48) {
  const m = Math.min(0.06, Math.max(0, cl0 / (4 * Math.PI)));
  const t = 0.12;
  const upper = [];
  const lower = [];
  for (let i = 0; i <= n; i++) {
    const x = (1 - Math.cos((Math.PI * i) / n)) / 2;
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
    const yc = 4 * m * x * (1 - x);
    const th = Math.atan(4 * m * (1 - 2 * x));
    upper.push([x - yt * Math.sin(th), yc + yt * Math.cos(th)]);
    lower.push([x + yt * Math.sin(th), yc - yt * Math.cos(th)]);
  }
  return { upper, lower };
}

// ---------------------------------------------------------------- View

export function createView(stage) {
  const surface = createSurface(stage);
  let pal = palette();

  function palette() {
    const p = readPalette(stage);
    const onAccent = getComputedStyle(stage).getPropertyValue('--c-on-accent').trim();
    return { ...p, onAccent: onAccent || '#0F1012', lift: p.series[1], thrust: p.series[0], drag: p.series[2], weight: p.ink };
  }

  function draw(setup, sol, params) {
    const { ctx, width: W, height: H } = surface;
    surface.begin(pal.bg);
    const px = stageFontPx(W);
    if (setup === 'pitot-static') drawPitot(ctx, W, H, px, sol, params);
    else drawFlight(ctx, W, H, px, sol, params);
  }

  function divider(ctx, x, y0, y1) {
    ctx.save();
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, y0);
    ctx.lineTo(Math.round(x) + 0.5, y1);
    ctx.stroke();
    ctx.restore();
  }

  /** A filled tag (e.g. STALL) followed by a sentence; shortens the sentence to fit. */
  function banner(ctx, x, y, px, tag, sentences, maxWidth, { filled = true } = {}) {
    ctx.save();
    ctx.font = font('strong', px);
    const tw = ctx.measureText(tag).width;
    const padX = Math.round(px * 0.5);
    const h = Math.round(px * 1.45);
    const top = y - px * 1.05;
    if (filled) {
      ctx.fillStyle = pal.accent;
      ctx.fillRect(x, top, tw + 2 * padX, h);
    } else {
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, top + 1, tw + 2 * padX - 2, h - 2);
    }
    ctx.restore();
    label(ctx, tag, x + padX, y, { colour: filled ? pal.onAccent : pal.accentText, px, kind: 'strong' });
    const sx = x + tw + 2 * padX + Math.round(px * 0.6);
    if (sentences.length) richFit(ctx, sentences, sx, y, maxWidth - (sx - x), { colour: pal.ink, px });
  }

  /** Title of a graph and the plot rectangle under it (leaving axisMargins for tick labels). */
  function graphFrame(ctx, r, px, pad, title) {
    const m = axisMargins(px);
    richFit(ctx, title, r.x + pad, r.y + pad + px + 4, r.w - 2 * pad, { colour: pal.ink, px: px + 2, kind: 'strong' });
    const top = r.y + pad + px * 2.9 + m.top;
    return { x: r.x + pad + m.left, y: top, w: Math.max(60, r.w - 2 * pad - m.left - m.right), h: Math.max(60, r.y + r.h - top - m.bottom - pad * 0.5) };
  }

  /** Axis titles drawn with rich text, placed as drawAxes places its own. */
  function axisTitles(ctx, vp, px, xTitle, yTitle) {
    const { rect } = vp;
    const axisY = vp.y[0] <= 0 && vp.y[1] >= 0 ? vp.toY(0) : rect.y + rect.h;
    const axisX = vp.x[0] <= 0 && vp.x[1] >= 0 ? vp.toX(0) : rect.x;
    if (xTitle) rich(ctx, xTitle, rect.x + rect.w - 4, axisY - 10 - px * 0.3, { colour: pal.ink, px, align: 'right', box: pal.bg });
    if (yTitle) rich(ctx, yTitle, axisX + 12, rect.y + 4 + px * 0.95, { colour: pal.ink, px, box: pal.bg });
  }

  function marker(ctx, x, y, size, { fill = pal.ink, ring = pal.bg, square = false } = {}) {
    ctx.save();
    ctx.fillStyle = ring;
    ctx.strokeStyle = fill;
    ctx.lineWidth = 2;
    if (square) {
      ctx.fillRect(x - size, y - size, 2 * size, 2 * size);
      ctx.strokeRect(x - size, y - size, 2 * size, 2 * size);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, size + 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Label next to a point, flipped to stay inside the rectangle. */
  function pointLabel(ctx, text, x, y, rect, px, { colour = pal.ink, above = true } = {}) {
    const w = richWidth(ctx, text, px);
    const gap = px * 0.7;
    let lx = x + gap;
    let align = 'left';
    if (lx + w > rect.x + rect.w - 4) {
      lx = x - gap;
      align = 'right';
    }
    let ly = above ? y - gap : y + gap + px * 0.8;
    if (ly - px < rect.y) ly = y + gap + px * 0.8;
    if (ly > rect.y + rect.h - 4) ly = y - gap;
    rich(ctx, text, lx, ly, { colour, px, align, box: pal.bg, padding: 3 });
  }

  // ============================================================== flight-forces

  function drawFlight(ctx, W, H, px, s, p) {
    const pad = Math.round(px * 1.1);
    const lh = Math.round(px * 1.5);
    const wide = W >= 720;
    const footerH = lh + Math.round(px * 0.4);
    const bodyH = H - footerH;
    const split = wide ? Math.round(W * 0.56) : W;

    drawDiagram(ctx, { x: 0, y: 0, w: split, h: bodyH }, px, pad, lh, s, p);
    if (wide) {
      divider(ctx, split, pad, bodyH - pad * 0.5);
      const g = { x: split, y: 0, w: W - split, h: bodyH };
      if (p.graph === 'polar') drawPolar(ctx, g, px, pad, s, p);
      else if (p.graph === 'thrust-speed') drawThrustSpeed(ctx, g, px, pad, s, p);
      else drawLiftCurve(ctx, g, px, pad, s, p);
    }

    // Footer: the model is simplified, and the values it rests on.
    const fy = H - Math.round(px * 0.55);
    ctx.save();
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, H - footerH + 0.5);
    ctx.lineTo(W - pad, H - footerH + 0.5);
    ctx.stroke();
    ctx.restore();
    const gText = `g = ${formatPlain(p.g)} m/s²`;
    const rho = `ρ = ${fmt(s.density, 4)} kg/m³`;
    richFit(
      ctx,
      [
        `Simplified teaching model: C_L = C_{L0} + 2πα up to the stall, then an illustrative smooth fall · ${gText} · ISA air, ${rho} at ${formatPlain(p.altitude)} m`,
        `Simplified model: C_L = C_{L0} + 2πα to the stall · ${gText} · ISA ${rho}`,
        `Simplified lift model · ${gText} · ${rho}`,
        `Simplified model · ${gText}`,
      ],
      pad,
      fy,
      W - 2 * pad,
      { colour: pal.muted, px },
    );
  }

  function drawDiagram(ctx, r, px, pad, lh, s, p) {
    const x0 = r.x + pad;
    const maxW = r.w - 2 * pad;
    const g = s.gamma;
    const level = Math.abs(g) < 1e-9;
    const Wc = level ? 'W' : 'W cos γ';

    // --- Top block: what kind of flight, and the two balance equations.
    let y = r.y + pad + px + 4;
    const title = level ? 'Level flight' : g > 0 ? `Climb, γ = ${formatPlain(g)}°` : `Descent, γ = ${formatPlain(g)}°`;
    const tw = rich(ctx, title, x0, y, { colour: pal.ink, px: px + 4, kind: 'strong' });
    const mode = s.alphaMode === 'manual' ? ['α set by hand', 'α by hand'] : ['α trimmed for steady flight', 'α trimmed'];
    const modeW = richWidth(ctx, mode[0], px);
    const modeText = tw + modeW + px * 2 < maxW ? mode[0] : tw + richWidth(ctx, mode[1], px) + px * 2 < maxW ? mode[1] : '';
    if (modeText) rich(ctx, modeText, r.x + r.w - pad, y, { colour: pal.muted, px, align: 'right' });
    y += lh + 2;

    const balanced = s.alphaMode === 'trim' && !s.stalled;
    const liftLines = balanced
      ? [`L = ${Wc} = ${N(s.lift)}`]
      : [`L = ${N(s.lift)}, but ${Wc} = ${N(s.liftNeeded)}`, `L = ${N(s.lift)}, ${Wc} = ${N(s.liftNeeded)}`];
    richFit(ctx, liftLines, x0, y, maxW, { colour: pal.ink, px });
    y += lh;
    const wSin = s.weight * Math.sin(g * DEG);
    const thrustLines = level
      ? [`T = D = ${N(s.thrust)}`]
      : [
          `T = D + W sin γ = ${N(s.drag)} ${wSin < 0 ? MINUS : '+'} ${N(Math.abs(wSin))} = ${N(s.thrust)}`,
          `T = D + W sin γ = ${N(s.thrust)}`,
          `T = ${N(s.thrust)}`,
        ];
    richFit(ctx, thrustLines, x0, y, maxW, { colour: pal.ink, px });
    const topEnd = y + px * 0.6;

    // --- Bottom block: stall state in words, then any imbalance.
    const status = [];
    if (s.stalled && s.alphaMode === 'manual') {
      status.push({
        tag: 'STALL',
        filled: true,
        text: [`α = ${deg(s.alpha)} is past the critical angle (${formatPlain(p.alphaStall)}°): lift falls, drag rises`, `Past the critical angle: lift falls, drag rises`, `Lift falls, drag rises`],
      });
    } else if (s.stalled) {
      status.push({
        tag: 'STALL',
        filled: true,
        text: [`Below the stall speed (${fmt(s.stallSpeedOnPath)} m/s): no α gives enough lift`, `Below the stall speed, ${fmt(s.stallSpeedOnPath)} m/s`, 'Too slow to hold'],
      });
    } else if (s.nearStall) {
      status.push({ tag: 'STALL WARNING', filled: false, text: [`α is within ${STALL_WARNING_DEG}° of the critical angle (${formatPlain(p.alphaStall)}°)`, 'Close to the critical angle', ''] });
    }
    if (s.alphaMode === 'manual' && !s.stalled) {
      const d = s.liftSurplus;
      const tol = 0.005 * s.weight;
      const sign = d > 0 ? '+' : MINUS;
      status.push({
        text:
          Math.abs(d) <= tol
            ? [`L balances ${Wc}: steady flight`, 'Balanced: steady flight']
            : [`L − ${Wc} = ${sign}${N(Math.abs(d))}: the flight path curves ${d > 0 ? 'upward' : 'downward'}`, `L − ${Wc} = ${sign}${N(Math.abs(d))}: path curves ${d > 0 ? 'up' : 'down'}`, `Path curves ${d > 0 ? 'up' : 'down'}`],
      });
    }
    if (s.thrust < -1e-9) {
      status.push({ text: ['T < 0: steeper than a glide at this speed, so it needs extra drag', 'T < 0: needs extra drag (airbrakes)', 'T < 0: needs extra drag'] });
    }
    let sy = r.y + r.h - pad * 0.6 - (status.length - 1) * lh;
    const statusTop = sy - px * 1.2;
    for (const st of status) {
      if (st.tag) banner(ctx, x0, sy, px, st.tag, st.text.filter(Boolean), maxW, { filled: st.filled });
      else richFit(ctx, st.text, x0, sy, maxW, { colour: pal.ink, px });
      sy += lh;
    }

    // --- Free-body diagram between the two blocks.
    const fx0 = r.x + pad;
    const fx1 = r.x + r.w - pad;
    const fy0 = topEnd + px * 0.3;
    const fy1 = (status.length ? statusTop : r.y + r.h - pad) - px * 0.3;
    const cx = (fx0 + fx1) / 2;
    const cy = (fy0 + fy1) / 2;
    const regionW = fx1 - fx0;
    const regionH = fy1 - fy0;
    if (regionH < 40 || regionW < 120) return;
    const c = Math.max(40, Math.min(regionW * 0.33, regionH * 0.62));
    const off = 0.17 * c;
    const lab = px * 1.3;

    // Directions on screen (y down). t: along the flight path; n: perpendicular to it ("up");
    // ch: along the chord towards the nose; cn: perpendicular to the chord (upper surface side).
    const gm = g * DEG;
    const th = (g + s.alpha) * DEG;
    const t = [Math.cos(gm), -Math.sin(gm)];
    const n = [-Math.sin(gm), -Math.cos(gm)];
    const ch = [Math.cos(th), -Math.sin(th)];
    const cn = [-Math.sin(th), -Math.cos(th)];
    const at = (d1, v1, d2 = 0, v2 = [0, 0]) => [cx + d1 * v1[0] + d2 * v2[0], cy + d1 * v1[1] + d2 * v2[1]];

    // One scale for all four forces (T and D optionally ×5, and labelled so).
    const zoom = p.zoomThrustDrag ? 5 : 1;
    const roomUp = cy - fy0 - off - lab;
    const roomDown = fy1 - cy - off - lab;
    let scale = Math.max(1, Math.min(roomUp, roomDown)) / Math.max(s.lift, s.weight, 1e-9);
    const hmax = Math.max(Math.max(s.thrust, 0), s.drag) * zoom;
    const roomFwd = fx1 - cx - 0.5 * c - px;
    const roomBack = cx - fx0 - 0.75 * c - px;
    if (hmax > 0) scale = Math.min(scale, Math.max(1, Math.min(roomFwd, roomBack)) / hmax);

    // Horizon and flight path.
    const reach = Math.min(cx - fx0, fx1 - cx);
    if (!level) {
      ctx.save();
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - reach, cy);
      ctx.lineTo(cx + reach * 0.15, cy);
      ctx.stroke();
      ctx.restore();
    }
    const [pbx, pby] = at(-reach, t);
    const [pfx, pfy] = at(reach, t);
    arrow(ctx, pbx, pby, pfx, pfy, { colour: pal.axis, width: 1.5, head: Math.max(10, px * 0.6), dashed: true });
    // Below the path, clear of the α label (above it) and the thrust label (nearer the wing).
    // (Skipped when the thrust label would reach it, on narrow stages.)
    const fpLeft = pfx - richWidth(ctx, 'flight path', px);
    const tLabelRight = cx + t[0] * 0.5 * c + richWidth(ctx, `T = ${N(s.thrust)}${p.zoomThrustDrag ? ' (×5)' : ''}`, px, 'strong');
    if (s.thrust <= 0 || fpLeft > tLabelRight + px) {
      rich(ctx, 'flight path', pfx - n[0] * px * 1.45, pfy - n[1] * px * 1.45, { colour: pal.muted, px, align: 'right', box: pal.bg, padding: 2 });
    }

    // Relative airflow (ahead of the wing, opposite to the motion).
    if (regionW > 420) {
      const [a0x, a0y] = at(1.45 * c, t, 0.62 * c, n);
      const [a1x, a1y] = at(0.95 * c, t, 0.62 * c, n);
      arrow(ctx, a0x, a0y, a1x, a1y, { colour: pal.muted, width: 2, head: Math.max(9, px * 0.5) });
      const lift = (richWidth(ctx, 'relative airflow', px) / 2) * Math.abs(Math.tan(gm));
      const [lax, lay] = at(1.2 * c, t, 0.62 * c + px * 0.7 + lift, n);
      rich(ctx, 'relative airflow', lax, lay, { colour: pal.muted, px, align: 'center' });
    }

    // γ arc behind the aircraft, between the horizontal and the path, labelled inside the wedge.
    if (!level) {
      const rg = 1.05 * c;
      ctx.save();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, rg, Math.PI, Math.PI - gm, g > 0);
      ctx.stroke();
      ctx.restore();
      const lr = rg + px * 1.1;
      const mid = Math.PI - gm / 2;
      rich(ctx, 'γ', cx + lr * Math.cos(mid), cy + lr * Math.sin(mid) + px * 0.3, { colour: pal.ink, px, kind: 'strong', align: 'center', box: pal.bg, padding: 1 });
    }
    // Aerofoil.
    const foil = aerofoil(p.cl0);
    const le = at(0.35 * c, ch);
    const toScreen = ([fx, fy]) => [le[0] - fx * c * ch[0] + fy * c * cn[0], le[1] - fx * c * ch[1] + fy * c * cn[1]];
    ctx.save();
    ctx.beginPath();
    foil.upper.forEach((pt, i) => {
      const [X, Y] = toScreen(pt);
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    for (let i = foil.lower.length - 1; i >= 0; i--) {
      const [X, Y] = toScreen(foil.lower[i]);
      ctx.lineTo(X, Y);
    }
    ctx.closePath();
    ctx.fillStyle = pal.panel;
    ctx.fill();
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // Chord line extended ahead, and the α arc between the path and the chord.
    const [ce0x, ce0y] = toScreen([1, 0]);
    const [ce1x, ce1y] = at(1.08 * c, ch);
    dashedLine(ctx, ce0x, ce0y, ce1x, ce1y, pal.muted, 1.5, [5, 5]);
    const ra = 0.9 * c;
    if (Math.abs(s.alpha) > 0.05) {
      ctx.save();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, ra, -gm, -th, s.alpha > 0);
      ctx.stroke();
      ctx.restore();
    }
    rich(ctx, `α = ${deg(s.alpha)}`, ce1x + px * 0.4, ce1y + (s.alpha >= 0 ? -px * 0.35 : px * 1.1), { colour: pal.ink, px, kind: 'strong' });

    // Separated flow over the upper surface when stalled.
    if (s.stalled) {
      ctx.save();
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const f = 0.45 + i * 0.16;
        const hgt = 0.12 + 0.04 * (i % 2) + 0.025 * i;
        const [X, Y] = toScreen([f, hgt]);
        const rr = (0.045 + 0.01 * i) * c;
        const start = -th + i * 1.3;
        ctx.beginPath();
        ctx.arc(X, Y, rr, start, start + Math.PI * 1.6);
        ctx.stroke();
      }
      ctx.restore();
      const [sx, sy2] = toScreen([0.8, 0.4]);
      rich(ctx, 'separated flow', sx, sy2, { colour: pal.accentText, px, align: 'center', box: pal.bg, padding: 2 });
    }

    // Forces. Lines of action through the centre of gravity; arrows start just clear of the wing.
    // Labels sit beside the arrows, offset perpendicular to the flight path so tilted paths stay clear.
    const head = Math.max(12, px * 0.8);
    const lStart = at(off, n);
    const lEnd = at(off + s.lift * scale, n);
    arrow(ctx, lStart[0], lStart[1], lEnd[0], lEnd[1], { colour: pal.lift, width: 4, head });
    rich(ctx, `L = ${N(s.lift)}`, lEnd[0] + px * 0.5, lEnd[1] + px * 0.35, { colour: pal.ink, px, kind: 'strong', box: pal.bg, padding: 2 });

    const wStart = [cx, cy + off];
    const wEnd = [cx, cy + off + s.weight * scale];
    if (p.showComponents && !level) {
      const wc = s.weight * Math.cos(gm) * scale;
      const ws = s.weight * Math.sin(gm) * scale;
      const cEnd = [wStart[0] - n[0] * wc, wStart[1] - n[1] * wc];
      const sEnd = [wStart[0] - t[0] * ws, wStart[1] - t[1] * ws];
      const compColour = pal.muted;
      arrow(ctx, wStart[0], wStart[1], cEnd[0], cEnd[1], { colour: compColour, width: 2, head: head * 0.75, dashed: true });
      arrow(ctx, wStart[0], wStart[1], sEnd[0], sEnd[1], { colour: compColour, width: 2, head: head * 0.75, dashed: true });
      dashedLine(ctx, cEnd[0], cEnd[1], wEnd[0], wEnd[1], pal.grid, 1.5, [4, 4]);
      dashedLine(ctx, sEnd[0], sEnd[1], wEnd[0], wEnd[1], pal.grid, 1.5, [4, 4]);
      // W cos γ: beside the middle of its arrow, on the side away from W.
      const side = g > 0 ? 1 : -1;
      const mx = (wStart[0] + cEnd[0]) / 2 + side * t[0] * px * 0.7;
      const my = (wStart[1] + cEnd[1]) / 2 + side * t[1] * px * 0.7;
      rich(ctx, 'W cos γ', mx, my + px * 0.35, { colour: pal.muted, px, align: g > 0 ? 'left' : 'right', box: pal.bg, padding: 2 });
      // W sin γ: beyond the tip of its (short) arrow.
      rich(ctx, 'W sin γ', sEnd[0] + (g > 0 ? -1 : 1) * px * 0.5, sEnd[1] + px * 0.35, { colour: pal.muted, px, align: g > 0 ? 'right' : 'left', box: pal.bg, padding: 2 });
    }
    arrow(ctx, wStart[0], wStart[1], wEnd[0], wEnd[1], { colour: pal.weight, width: 4, head });
    rich(ctx, `W = ${N(s.weight)}`, wEnd[0] + px * 0.5, wEnd[1] + px * 0.1, { colour: pal.ink, px, kind: 'strong', box: pal.bg, padding: 2 });

    const tStart = at(0.5 * c, t);
    if (s.thrust > 0) {
      const tEnd = at(0.5 * c + s.thrust * scale * zoom, t);
      arrow(ctx, tStart[0], tStart[1], tEnd[0], tEnd[1], { colour: pal.thrust, width: 3.5, head });
      // Below the path, starting just ahead of the nose; pushed further down by the path's slope
      // across the label's width when descending, so the tilted path never crosses the text.
      const text = `T = ${N(s.thrust)}${zoom > 1 ? ' (×5)' : ''}`;
      const slope = g < 0 ? richWidth(ctx, text, px, 'strong') * Math.tan(-gm) : 0;
      const [tlx, tly] = at(0.5 * c, t, -(px * 1.25 + slope), n);
      rich(ctx, text, tlx, tly, { colour: pal.ink, px, kind: 'strong', box: pal.bg, padding: 2 });
    }
    const dStart = at(-0.75 * c, t);
    const dEnd = at(-0.75 * c - s.drag * scale * zoom, t);
    openArrow(ctx, dStart[0], dStart[1], dEnd[0], dEnd[1], { colour: pal.drag, width: 3.5, head });
    // Ending at the arrow's start (just behind the wing): below the path in level flight and climbs,
    // above it in descents (the γ arc takes the other side), offset by the slope across the text.
    const dText = `D = ${N(s.drag)}${zoom > 1 ? ' (×5)' : ''}`;
    const dSlope = richWidth(ctx, dText, px, 'strong') * Math.abs(Math.tan(gm));
    const [dlx, dly] = g >= 0 ? at(-0.75 * c, t, -(px * 1.25 + dSlope), n) : at(-0.75 * c, t, px * 0.55 + dSlope, n);
    rich(ctx, dText, dlx, dly, { colour: pal.ink, px, kind: 'strong', align: 'right', box: pal.bg, padding: 2 });
    // Centre of gravity symbol (quartered circle).
    const rc = Math.max(6, px * 0.4);
    ctx.save();
    ctx.fillStyle = pal.panel;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rc, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = pal.ink;
    for (const a0 of [0, Math.PI]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, rc, a0 - th, a0 - th + Math.PI / 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // --- Graphs -------------------------------------------------------------------------------

  function clRange(s, p, xmin) {
    const lo = Math.min(0, liftCoefficient(xmin, p));
    return [Math.floor((lo - 0.05) / 0.5) * 0.5, Math.ceil((s.clMax + 0.25) / 0.5) * 0.5];
  }

  function drawLiftCurve(ctx, r, px, pad, s, p) {
    const lin = `C_L = ${formatPlain(p.cl0)} + 2πα`;
    const rect = graphFrame(ctx, r, px, pad, [`Lift curve: ${lin} (α in rad) up to the stall`, `Lift curve: ${lin}`, 'Lift curve']);
    const xmin = Math.min(ALPHA_MIN, Math.floor(s.alpha));
    const vp = viewport({ x: [xmin, ALPHA_MAX], y: clRange(s, p, xmin), rect });
    drawAxes(ctx, vp, pal, { px, layer: 'under', xCount: 6 });

    // Stalled region: flat shade plus a word.
    const xs = vp.toX(p.alphaStall);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = pal.grid;
    ctx.fillRect(xs, rect.y, rect.x + rect.w - xs, rect.h);
    ctx.restore();
    rich(ctx, 'stalled', (xs + rect.x + rect.w) / 2, rect.y + px * 1.2, { colour: pal.accentText, px, kind: 'strong', align: 'center' });

    // Curve.
    ctx.save();
    ctx.beginPath();
    for (let a = xmin, i = 0; a <= ALPHA_MAX + 1e-9; a += 0.05, i++) {
      const X = vp.toX(a);
      const Y = vp.toY(liftCoefficient(a, p));
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
    ctx.strokeStyle = pal.series[0];
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // Stall point.
    const sx = vp.toX(p.alphaStall);
    const sy = vp.toY(s.clMax);
    marker(ctx, sx, sy, 6, { fill: pal.ink, square: true });
    rich(ctx, `stall: C_{L max} = ${fmt(s.clMax)}`, sx - px * 0.6, sy - px * 0.7, { colour: pal.ink, px, align: 'right', box: pal.bg, padding: 3 });

    // Current operating point.
    const X = vp.toX(s.alpha);
    const Y = vp.toY(s.cl);
    const axisY = vp.toY(0);
    dashedLine(ctx, X, axisY, X, Y, pal.muted);
    marker(ctx, X, Y, 7, { fill: s.stalled ? pal.accent : pal.ink });
    pointLabel(ctx, `α = ${deg(s.alpha)}, C_L = ${fmt(s.cl)}`, X, Y, rect, px, { above: false });

    drawAxes(ctx, vp, pal, { px, layer: 'over', xCount: 6 });
    axisTitles(ctx, vp, px, 'α (°)', 'C_L');
  }

  function drawPolar(ctx, r, px, pad, s, p) {
    const rect = graphFrame(ctx, r, px, pad, ['Drag polar: C_L against C_D', 'Drag polar']);
    const xmin = Math.min(ALPHA_MIN, Math.floor(s.alpha));
    const cdStall = dragCoefficient(p.alphaStall, p);
    const xmax = Math.ceil((Math.max(cdStall, s.cd) * 1.5) / 0.05) * 0.05;
    const vp = viewport({ x: [0, xmax], y: clRange(s, p, xmin), rect });
    drawAxes(ctx, vp, pal, { px, layer: 'under', xCount: 5 });

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const branch = (a0, a1, dashed) => {
      ctx.beginPath();
      for (let a = a0, i = 0; a <= a1 + 1e-9; a += 0.05, i++) {
        const X = vp.toX(dragCoefficient(a, p));
        const Y = vp.toY(liftCoefficient(a, p));
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      }
      ctx.setLineDash(dashed ? [10, 7] : []);
      ctx.strokeStyle = pal.series[0];
      ctx.lineWidth = 3;
      ctx.stroke();
    };
    branch(xmin, p.alphaStall, false);
    branch(p.alphaStall, ALPHA_MAX, true);
    // Tangent from the origin: its slope is (L/D)max.
    const yTop = vp.y[1];
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = pal.series[1];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(vp.toX(0), vp.toY(0));
    ctx.lineTo(vp.toX(yTop / s.maxLiftToDrag), vp.toY(yTop));
    ctx.stroke();
    ctx.restore();

    const tx = vp.toX(2 * p.cd0);
    const ty = vp.toY(s.clAtMaxLD);
    marker(ctx, tx, ty, 6, { fill: pal.series[1], square: true });
    rich(ctx, `(L/D)_{max} = ${fmt(s.maxLiftToDrag)}${s.maxLDBeyondStall ? ' (past the stall)' : ''}`, tx + px * 0.8, ty + px * 0.35, { colour: pal.ink, px, box: pal.bg, padding: 3 });

    const X = vp.toX(s.cd);
    const Y = vp.toY(s.cl);
    marker(ctx, X, Y, 7, { fill: s.stalled ? pal.accent : pal.ink });
    pointLabel(ctx, `now: L/D = ${fmt(s.liftToDrag)}`, X, Y, rect, px, { above: false });
    rich(ctx, 'dashed: past the stall', rect.x + rect.w - px * 0.4, rect.y + rect.h - px * 0.6, { colour: pal.muted, px, align: 'right', box: pal.bg, padding: 3 });

    drawAxes(ctx, vp, pal, { px, layer: 'over', xCount: 5 });
    axisTitles(ctx, vp, px, 'C_D', 'C_L');
  }

  function drawThrustSpeed(ctx, r, px, pad, s, p) {
    const level = Math.abs(p.gamma) < 1e-9;
    const rect = graphFrame(ctx, r, px, pad, [level ? 'Thrust needed for level flight' : 'Thrust needed on this flight path', 'Thrust needed']);
    const rows = speedSweep(p, 0.5);
    if (!rows.length) {
      rich(ctx, 'The stall speed is above 100 m/s for these settings.', rect.x, rect.y + px * 2, { colour: pal.ink, px });
      return;
    }
    let hi = 0;
    let lo = 0;
    for (const [, T, D] of rows) {
      hi = Math.max(hi, T, D);
      lo = Math.min(lo, T);
    }
    const kilo = Math.max(hi, -lo) >= 2000;
    const f = kilo ? 1e-3 : 1;
    const span = hi - lo;
    const vp = viewport({ x: [0, SPEED_MAX], y: [(lo < 0 ? lo - 0.15 * span : 0) * f, (hi + 0.12 * span) * f], rect });
    drawAxes(ctx, vp, pal, { px, layer: 'under', xCount: 5 });

    const vs = s.stallSpeedOnPath;
    const xs = vp.toX(Math.min(vs, SPEED_MAX));
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = pal.grid;
    ctx.fillRect(rect.x, rect.y, xs - rect.x, rect.h);
    ctx.restore();
    if (xs - rect.x > px * 4) rich(ctx, 'stall', (rect.x + xs) / 2, rect.y + rect.h - px * 0.6, { colour: pal.accentText, px, kind: 'strong', align: 'center' });

    const curve = (col, colour, width, dash) => {
      ctx.save();
      ctx.beginPath();
      rows.forEach((row, i) => {
        const X = vp.toX(row[0]);
        const Y = vp.toY(row[col] * f);
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      });
      ctx.setLineDash(dash);
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    };
    const series = [
      { col: 3, colour: pal.series[1], width: 2.5, dash: [10, 6], name: 'zero-lift drag' },
      { col: 4, colour: pal.series[2], width: 2.5, dash: [3, 5], name: 'induced drag' },
    ];
    if (!level) series.push({ col: 2, colour: pal.muted, width: 2, dash: [], name: 'total drag D' });
    series.push({ col: 1, colour: pal.series[0], width: 3, dash: [], name: level ? 'thrust needed, T = D' : 'thrust needed, T' });
    for (const sr of series) curve(sr.col, sr.colour, sr.width, sr.dash);

    // Legend (top right, inside the plot).
    const legW = Math.max(...series.map((sr) => richWidth(ctx, sr.name, px))) + px * 3.2;
    let ly = rect.y + px * 1.2;
    const lx = rect.x + rect.w - legW - px * 0.4;
    ctx.save();
    ctx.fillStyle = pal.bg;
    ctx.fillRect(lx - 6, ly - px * 1.1, legW + 6, series.length * px * 1.4 + px * 0.2);
    ctx.restore();
    for (const sr of [...series].reverse()) {
      ctx.save();
      ctx.setLineDash(sr.dash);
      ctx.strokeStyle = sr.colour;
      ctx.lineWidth = sr.width;
      ctx.beginPath();
      ctx.moveTo(lx, ly - px * 0.35);
      ctx.lineTo(lx + px * 2.4, ly - px * 0.35);
      ctx.stroke();
      ctx.restore();
      rich(ctx, sr.name, lx + px * 2.8, ly, { colour: pal.ink, px });
      ly += px * 1.4;
    }

    // Least thrust (in level flight, the speed for (L/D)max).
    let min = rows[0];
    for (const row of rows) if (row[1] < min[1]) min = row;
    const mx = vp.toX(min[0]);
    const my = vp.toY(min[1] * f);

    // Current airspeed on the trimmed curve (guide line first, labels last so nothing covers them).
    const V = p.airspeed;
    const X = vp.toX(V);
    let current = null;
    if (s.trimThrust !== null && V <= SPEED_MAX) {
      const T = s.trimThrust;
      const Y = vp.toY(T * f);
      dashedLine(ctx, X, vp.toY(Math.max(vp.y[0], 0)), X, Y, pal.muted);
      current = { Y, text: `V = ${fmt(V)} m/s, T = ${N(T)}` };
    } else {
      dashedLine(ctx, X, rect.y, X, rect.y + rect.h, pal.accent, 2);
    }
    marker(ctx, mx, my, 6, { fill: pal.series[1], square: true });
    const minBelow = my + px * 2.4 < rect.y + rect.h;
    rich(ctx, `least T at ${fmt(min[0])} m/s`, mx, minBelow ? my + px * 1.6 : my - px * 0.8, { colour: pal.ink, px, align: 'center', box: pal.bg, padding: 3 });
    if (current) {
      marker(ctx, X, current.Y, 7, { fill: pal.ink });
      pointLabel(ctx, current.text, X, current.Y, rect, px, { above: true });
    } else {
      pointLabel(ctx, `V = ${fmt(V)} m/s: stalled`, X, rect.y + rect.h * 0.55, rect, px, { colour: pal.accentText });
    }

    drawAxes(ctx, vp, pal, { px, layer: 'over', xCount: 5 });
    axisTitles(ctx, vp, px, 'V (m/s)', `T, D (${kilo ? 'kN' : 'N'})`);
  }

  // ============================================================== pitot-static

  function drawPitot(ctx, W, H, px, s, p) {
    const pad = Math.round(px * 1.1);
    const lh = Math.round(px * 1.5);
    const wide = W >= 720;
    const footerH = lh + Math.round(px * 0.4);
    const bodyH = H - footerH;
    const split = wide ? Math.round(W * 0.56) : W;

    drawProbe(ctx, { x: 0, y: 0, w: split, h: bodyH }, px, pad, lh, s, p);
    if (wide) {
      divider(ctx, split, pad, bodyH - pad * 0.5);
      drawIsaGraph(ctx, { x: split, y: 0, w: W - split, h: bodyH }, px, pad, s, p);
    }

    ctx.save();
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, H - footerH + 0.5);
    ctx.lineTo(W - pad, H - footerH + 0.5);
    ctx.stroke();
    ctx.restore();
    richFit(
      ctx,
      [
        'Incompressible flow: p_t = p_s + ½ρV² · ISA temperatures · no instrument or position errors · ρ_0 = 1.225 kg/m³',
        'Incompressible flow: p_t = p_s + ½ρV² · ISA · no instrument errors',
        'Incompressible flow · ISA',
      ],
      pad,
      H - Math.round(px * 0.55),
      W - 2 * pad,
      { colour: pal.muted, px },
    );
  }

  function drawProbe(ctx, r, px, pad, lh, s, p) {
    const x0 = r.x + pad;
    const maxW = r.w - 2 * pad;
    const titleY = r.y + pad + px + 4;
    richFit(ctx, ['Pitot-static system', 'Pitot-static'], x0, titleY, maxW, { colour: pal.ink, px: px + 4, kind: 'strong' });
    const narrow = r.w < 560;
    const kPa = (v) => siPrefix(v, 'Pa', { sigfigs: 4 });
    const totalCol = pal.series[0];
    const staticCol = pal.series[1];
    const lineH = Math.round(px * 1.45);

    // Instruments along the bottom.
    const bigPx = Math.round(px * (narrow ? 1.6 : 2.4));
    const nLines = narrow ? 2 : 3;
    const boxH = Math.round(px * 1.45 + bigPx * 1.3 + nLines * lineH + px * 0.8);
    const boxTop = r.y + r.h - pad * 0.6 - boxH;
    const gap = pad;
    const boxW = (maxW - gap) / 2;
    const asi = { x: x0, y: boxTop, w: boxW, h: boxH };
    const alt = { x: x0 + boxW + gap, y: boxTop, w: boxW, h: boxH };

    // Probe near the top, with room above it for the total-port label.
    const pr = Math.max(7, Math.round(px * (narrow ? 0.6 : 1)));
    const py = Math.round(titleY + px * 2.8 + pr);
    const tipX = x0 + maxW * (narrow ? 0.24 : 0.2);
    const endX = x0 + maxW * (narrow ? 0.74 : 0.76);
    const holeX = tipX + (endX - tipX) * 0.55;

    // Airflow, arriving from the left.
    for (const dy of [-2.2, 0, 2.2]) {
      const yy = py + dy * pr;
      arrow(ctx, x0, yy, tipX - px * (dy === 0 ? 1.0 : 0.2), yy, { colour: pal.muted, width: 2, head: Math.max(9, px * 0.5) });
    }

    // Pipes, routed down the right-hand side to the instruments (drawn before the probe body).
    const xsTotal = endX + px * 1.2;
    const xsStatic = endX + px * 2.4;
    const asiTotalX = asi.x + asi.w * 0.3;
    const asiStaticX = asi.x + asi.w * 0.7;
    const altStaticX = alt.x + alt.w * 0.5;
    const y1 = boxTop - px * 1.7;
    const y2 = boxTop - px * 0.8;
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = totalCol;
    ctx.beginPath();
    ctx.moveTo(endX - 2, py);
    ctx.lineTo(xsTotal, py);
    ctx.lineTo(xsTotal, y1);
    ctx.lineTo(asiTotalX, y1);
    ctx.lineTo(asiTotalX, asi.y);
    ctx.stroke();
    ctx.strokeStyle = staticCol;
    ctx.setLineDash([9, 6]);
    ctx.beginPath();
    ctx.moveTo(endX - 2, py - pr * 0.55);
    ctx.lineTo(xsStatic, py - pr * 0.55);
    ctx.lineTo(xsStatic, y2);
    ctx.lineTo(asiStaticX, y2);
    ctx.lineTo(asiStaticX, asi.y);
    ctx.moveTo(altStaticX, y2);
    ctx.lineTo(altStaticX, alt.y);
    ctx.stroke();
    ctx.restore();

    // Probe body: a tube with a rounded nose.
    ctx.save();
    ctx.fillStyle = pal.panel;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(endX, py - pr);
    ctx.lineTo(tipX + pr, py - pr);
    ctx.arc(tipX + pr, py, pr, -Math.PI / 2, Math.PI / 2, true);
    ctx.lineTo(endX, py + pr);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Internal channels: total (solid) from the nose, static (dashed) from the side holes.
    ctx.lineWidth = 2;
    ctx.strokeStyle = totalCol;
    ctx.beginPath();
    ctx.moveTo(tipX + 2, py);
    ctx.lineTo(endX, py);
    ctx.stroke();
    ctx.strokeStyle = staticCol;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(holeX, py - pr * 0.55);
    ctx.lineTo(endX, py - pr * 0.55);
    ctx.stroke();
    ctx.setLineDash([]);
    // Total port (facing the flow) and static ports (flush with the side).
    ctx.fillStyle = pal.ink;
    ctx.beginPath();
    ctx.arc(tipX + 1, py, Math.max(3, pr * 0.38), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pal.bg;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = pal.ink;
    for (const dx of [0, pr * 1.3]) {
      for (const sy of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(holeX + dx, py + sy * pr, Math.max(2.5, pr * 0.28), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();

    // Port labels.
    richFit(ctx, [`total port: p_t = ${kPa(s.totalPressure)}`, `p_t = ${kPa(s.totalPressure)}`], tipX - px * 0.2, py - pr - px * 0.75, endX - tipX + px * 2, { colour: pal.ink, px, kind: 'strong', box: pal.bg, padding: 2 });
    const sLabel = [`static ports: p_s = ${kPa(s.staticPressure)}`, `p_s = ${kPa(s.staticPressure)}`];
    const sw = Math.min(...sLabel.map((t) => richWidth(ctx, t, px, 'strong')));
    const sx = Math.min(holeX - px * 2, xsTotal - px * 0.6 - sw);
    richFit(ctx, sLabel, sx, py + pr + px * 1.45, xsTotal - px * 0.6 - sx, { colour: pal.ink, px, kind: 'strong', box: pal.bg, padding: 2 });

    // Middle: the airflow and Bernoulli's equation with today's numbers, if there is room.
    const textW = xsTotal - x0 - px * 1.2;
    let yy = py + pr + px * 3.4;
    const room = (n) => yy + (n - 1) * lineH <= y1 - px * 0.9;
    if (room(1)) {
      richFit(ctx, [`airflow V = ${fmt(s.airspeed)} m/s (${fmt(s.airspeed / KNOT)} knots)`, `V = ${fmt(s.airspeed)} m/s`], x0, yy, textW, { colour: pal.ink, px });
      yy += lineH;
    }
    if (s.mach > 0.3 && room(1)) {
      richFit(ctx, [`Mach ${fmt(s.mach, 2)}: compressibility, ignored here, starts to matter`, `Mach ${fmt(s.mach, 2)}: compressibility ignored`], x0, yy, textW, { colour: pal.accentText, px, kind: 'strong' });
      yy += lineH;
    }
    // Centre the Bernoulli block and the line legend in the space left above the pipes.
    const blockH = lineH * 4.7;
    const spare = y1 - px * 0.9 - (yy + blockH);
    if (spare > 0) yy += spare / 2;
    if (room(3)) {
      yy += lineH * 0.4;
      richFit(ctx, ['Bernoulli (incompressible): p_t = p_s + ½ρV²', 'p_t = p_s + ½ρV²'], x0, yy, textW, { colour: pal.ink, px, kind: 'strong' });
      yy += lineH;
      richFit(
        ctx,
        [
          `${kPa(s.totalPressure)} = ${kPa(s.staticPressure)} + ½ × ${fmt(s.density, 4)} × ${fmt(s.airspeed)}² Pa`,
          `${kPa(s.totalPressure)} = ${kPa(s.staticPressure)} + ${siPrefix(s.pressureDifference, 'Pa')}`,
        ],
        x0,
        yy,
        textW,
        { colour: pal.ink, px },
      );
      yy += lineH;
      richFit(ctx, [`so Δp = p_t − p_s = ½ρV² = ${siPrefix(s.pressureDifference, 'Pa')}`, `Δp = ${siPrefix(s.pressureDifference, 'Pa')}`], x0, yy, textW, { colour: pal.ink, px });
      yy += lineH;
    }
    if (room(1)) {
      // Line legend: solid total line, dashed static line.
      yy += lineH * 0.3;
      const seg = px * 2.2;
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = totalCol;
      ctx.beginPath();
      ctx.moveTo(x0, yy - px * 0.35);
      ctx.lineTo(x0 + seg, yy - px * 0.35);
      ctx.stroke();
      ctx.restore();
      const w1 = rich(ctx, 'total pressure line', x0 + seg + px * 0.4, yy, { colour: pal.ink, px });
      const x2 = x0 + seg + px * 0.4 + w1 + px * 1.2;
      if (x2 + seg + richWidth(ctx, 'static pressure line', px) < xsTotal - px) {
        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = staticCol;
        ctx.setLineDash([9, 6]);
        ctx.beginPath();
        ctx.moveTo(x2, yy - px * 0.35);
        ctx.lineTo(x2 + seg, yy - px * 0.35);
        ctx.stroke();
        ctx.restore();
        rich(ctx, 'static pressure line', x2 + seg + px * 0.4, yy, { colour: pal.ink, px });
      }
    }

    // Instruments: each works only from the pressures it is piped.
    const box = (b, title, big, lines) => {
      ctx.save();
      ctx.fillStyle = pal.panel;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x + 0.75, b.y + 0.75, b.w - 1.5, b.h - 1.5);
      ctx.restore();
      const ix = b.x + px * 0.7;
      const iw = b.w - px * 1.4;
      let ly = b.y + px * 1.45;
      label(ctx, title, ix, ly, { colour: pal.accentText, px, kind: 'mono' });
      ly += bigPx * 1.3;
      label(ctx, big, ix, ly, { colour: pal.ink, px: bigPx, kind: 'mono' });
      ly += lineH;
      for (const l of lines.slice(0, nLines)) {
        richFit(ctx, l, ix, ly, iw, { colour: pal.ink, px });
        ly += lineH;
      }
    };
    const dial = fmt(s.indicatedAirspeed);
    box(
      asi,
      'AIRSPEED',
      `${fmt(s.trueAirspeed)} m/s`,
      narrow
        ? [[`Δp = ${siPrefix(s.pressureDifference, 'Pa')}`], [`dial (ρ_0): ${dial} m/s`]]
        : [
            [`V = √(2Δp/ρ) = √(2 × ${fmt(s.pressureDifference, 4)} ÷ ${fmt(s.density, 4)})`, `V = √(2Δp/ρ)`],
            [`ρ = ${fmt(s.density, 4)} kg/m³ from the ISA`, `ρ = ${fmt(s.density, 4)} kg/m³`],
            [`A dial set for ρ_0 = 1.225 shows ${dial} m/s`, `dial (ρ_0): ${dial} m/s`],
          ],
    );
    const ft = whole(s.indicatedAltitude / FT);
    const err = s.altimeterError;
    box(
      alt,
      'ALTIMETER',
      `${whole(s.indicatedAltitude)} m`,
      narrow
        ? [[`p_s = ${kPa(s.staticPressure)}`], [`QNH ${formatPlain(s.altimeterSetting)} hPa`]]
        : [
            [`from p_s = ${kPa(s.staticPressure)} (${ft} ft)`, `p_s = ${kPa(s.staticPressure)}`],
            [`set to QNH ${formatPlain(s.altimeterSetting)} hPa`, `QNH ${formatPlain(s.altimeterSetting)} hPa`],
            Math.abs(err) < 0.5
              ? [`true altitude ${whole(s.altitude)} m: no error`, `true ${whole(s.altitude)} m`]
              : [`true ${whole(s.altitude)} m: reads ${fmt(Math.abs(err))} m ${err > 0 ? 'high' : 'low'}`, `reads ${fmt(Math.abs(err))} m ${err > 0 ? 'high' : 'low'}`],
          ],
    );
  }

  function drawIsaGraph(ctx, r, px, pad, s, p) {
    const rect = graphFrame(ctx, r, px, pad, ['Altitude from static pressure (ISA)', 'Altitude from p_s']);
    const hInd = s.indicatedAltitude;
    const yMin = Math.min(0, Math.floor(Math.min(s.altitude, hInd) / 1000) * 1000);
    const yMax = 12000;
    const vp = viewport({ x: [0, 120], y: [yMin, yMax], rect });
    drawAxes(ctx, vp, pal, { px, layer: 'under', xCount: 6, yCount: 6 });

    const curve = (shift, colour, width, dash) => {
      ctx.save();
      ctx.beginPath();
      let first = true;
      for (let h = yMin; h <= yMax + 1e-9; h += 100) {
        const hh = h + shift;
        if (hh < ISA.H_MIN || hh > ISA.H_MAX) continue;
        const X = vp.toX(isa(hh).p / 1000);
        const Y = vp.toY(h);
        if (first) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
        first = false;
      }
      ctx.setLineDash(dash);
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    };
    const settingShift = pressureAltitude(s.altimeterSetting * 100);
    const differs = Math.abs(s.altimeterSetting - s.seaLevelPressure) > 1e-9;
    curve(s.atmosphereShift, pal.series[0], 3, []);
    if (differs) curve(settingShift, pal.series[1], 2.5, [10, 6]);

    // Read the curve backwards: up from p_s to the curve, across to the altitude.
    const X = vp.toX(s.staticPressure / 1000);
    const Yt = vp.toY(s.altitude);
    const Yi = vp.toY(hInd);
    const axisX = vp.toX(0);
    const base = vp.toY(Math.max(yMin, 0));
    dashedLine(ctx, X, base, X, Math.min(Yt, Yi), pal.muted);
    dashedLine(ctx, axisX, Yt, X, Yt, pal.muted);
    if (differs) dashedLine(ctx, axisX, Yi, X, Yi, pal.series[1], 1.5);
    marker(ctx, X, Yt, 7, { fill: pal.ink });
    if (differs) marker(ctx, X, Yi, 6, { fill: pal.series[1], square: true });

    const lx = axisX + px * 0.5;
    const above = Yi < Yt;
    rich(ctx, `true altitude ${whole(s.altitude)} m`, lx, Yt + (differs && above ? px * 1.4 : -px * 0.5), { colour: pal.ink, px, kind: 'strong', box: pal.bg, padding: 2 });
    if (differs) rich(ctx, `altimeter ${whole(hInd)} m`, lx, Yi + (above ? -px * 0.5 : px * 1.4), { colour: pal.ink, px, kind: 'strong', box: pal.bg, padding: 2 });
    rich(ctx, `p_s = ${siPrefix(s.staticPressure, 'Pa', { sigfigs: 4 })}`, X - px * 0.5, base - px * 0.6, { colour: pal.ink, px, align: 'right', box: pal.bg, padding: 2 });

    // The inverted ISA, with its numbers, in the empty region to the right of the curve.
    const fx = rect.x + rect.w - px * 0.4;
    let fy = Math.max(rect.y + px * 3, vp.toY(9500));
    // Room to the left of fx before the curve, at the height of a text line.
    const roomAt = (y) => fx - vp.toX(isa(Math.min(ISA.H_MAX, Math.max(ISA.H_MIN, vp.fromY(y + px * 0.4) + s.atmosphereShift))).p / 1000) - px;
    const box = { colour: pal.ink, px, align: 'right', box: pal.bg, padding: 3 };
    const k = formatNumber(ISA.T0 / ISA.LAPSE, { sigfigs: 5 });
    const nExp = (1 / ISA_EXPONENT).toFixed(4);
    richFit(ctx, ['h = (T_0/L) × [1 − (p/p_0)^n],  n = RL/g_0', 'h = (T_0/L) × [1 − (p/p_0)^n]', 'inverse ISA'], fx, fy, roomAt(fy), box);
    fy += px * 1.7;
    richFit(ctx, [`= ${k} m × [1 − (p/${formatNumber(ISA.P0, { sigfigs: 6 })} Pa)^{${nExp}}]`, `= ${k} m × [1 − (p/p_0)^{${nExp}}]`, `n = ${nExp}`], fx, fy, roomAt(fy), box);
    if (differs) {
      fy += px * 1.7;
      richFit(ctx, ['altimeter reads H(p_s) − H(QNH)', 'reads H(p_s) − H(QNH)'], fx, fy, roomAt(fy), box);
      fy += px * 1.6;
      const legend = (text, colour, width, dash) => {
        const w = richWidth(ctx, text, px);
        ctx.save();
        ctx.fillStyle = pal.bg;
        ctx.fillRect(fx - w - px * 3.2, fy - px * 1.0, w + px * 3.4, px * 1.4);
        ctx.strokeStyle = colour;
        ctx.lineWidth = width;
        ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(fx - w - px * 3, fy - px * 0.35);
        ctx.lineTo(fx - w - px * 0.6, fy - px * 0.35);
        ctx.stroke();
        ctx.restore();
        rich(ctx, text, fx, fy, { colour: pal.ink, px, align: 'right' });
        fy += px * 1.4;
      };
      legend("today's air", pal.series[0], 3, []);
      legend("altimeter's ISA (QNH)", pal.series[1], 2.5, [10, 6]);
    }

    drawAxes(ctx, vp, pal, { px, layer: 'over', xCount: 6, yCount: 6 });
    axisTitles(ctx, vp, px, 'p (kPa)', 'h (m)');
  }

  return {
    draw,
    resize: () => surface.resize(),
    setTheme() {
      pal = palette();
    },
    destroy: () => surface.destroy(),
  };
}
