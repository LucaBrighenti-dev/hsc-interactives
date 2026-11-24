// argand view: drawing only. Reads params and model results; never changes them.
// Layout: an equal-aspect Argand plane (circles stay circular) and, on wide stages, an info column with
// exact forms (1 + 3i, √10, 3π/4). On narrow stages the key result sits in a strip over the plane.
import { createSurface, readPalette, stageFontPx, viewport, axisMargins, drawAxes, arrow, label, font, tickText } from '../../engine-kit.js';
import { superscript } from '../../format.js';
import {
  complex,
  fromPolar,
  add,
  sub,
  mul,
  conj,
  modulus,
  principalArg,
  wrapAngle,
  isFiniteZ,
  numText,
  complexText,
  modulusText,
  angleText,
  computeOperation,
  conditionFromParams,
  conditionText,
  cartesianText,
  conditionWords,
  zMinus,
  conditionValue,
  satisfies,
  boundaryPieces,
  pieceCurve,
  rasteriseRegion,
  clipPiece,
  intersections,
  polyCoefficients,
  polyRoots,
  polyText,
  rootGroups,
} from './model.js';

const TAU = 2 * Math.PI;
const SUB = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
const subscript = (n) => String(n).split('').map((d) => SUB[Number(d)]).join('');
const POLYGON = { 2: 'two points opposite each other', 3: 'an equilateral triangle', 4: 'a square', 5: 'a regular pentagon', 6: 'a regular hexagon', 7: 'a regular heptagon', 8: 'a regular octagon', 9: 'a regular nonagon', 10: 'a regular decagon', 11: 'a regular hendecagon', 12: 'a regular dodecagon' };

/** Imaginary-axis ticks read 2i, i, 0, −i. */
function imTick(v) {
  if (v === 0) return '0';
  if (Math.abs(v) === 1) return v < 0 ? '−i' : 'i';
  return `${tickText(v)}i`;
}

export function createView(stage, setup) {
  const surface = createSurface(stage);
  let pal = readPalette(stage);
  let frame = { vp: null, handles: [], px: 18 };
  let maskCanvas = null;
  let regionCanvas = null;

  // -------------------------------------------------------------------------------------------
  // Layout and shared drawing helpers
  // -------------------------------------------------------------------------------------------

  function layout(W, H, px) {
    const m = axisMargins(px);
    const pad = Math.round(px * 0.7);
    const wide = W >= 720 && W / H >= 1.25;
    const infoW = wide ? Math.round(Math.min(Math.max(W * 0.33, px * 17), px * 25)) : 0;
    // Narrow stages: two lines of results in a strip above the plane instead of the info column.
    const stripH = wide ? 0 : Math.round(px * 3.3);
    const plot = {
      x: pad + m.left,
      y: pad + stripH + m.top,
      w: Math.max(80, W - infoW - pad * 2 - m.left - m.right),
      h: Math.max(80, H - pad * 2 - stripH - m.top - m.bottom),
    };
    const info = wide ? { x: W - infoW - pad, y: pad, w: infoW, h: H - pad * 2 } : null;
    const strip = wide ? null : { x: pad, y: pad, w: W - pad * 2, h: stripH };
    return { plot, info, strip };
  }

  /** Labels with flat background boxes, nudged round their anchor until they don't overlap. */
  function createPlacer(ctx, bounds, px) {
    const boxes = [];
    const fits = (r) =>
      r.x >= bounds.x + 2 && r.y >= bounds.y + 2 && r.x + r.w <= bounds.x + bounds.w - 2 && r.y + r.h <= bounds.y + bounds.h - 2 &&
      !boxes.some((b) => r.x < b.x + b.w && r.x + r.w > b.x && r.y < b.y + b.h && r.y + r.h > b.y);
    return {
      block(x, y, w, h) {
        boxes.push({ x, y, w, h });
      },
      /** dir: preferred direction in canvas px (any length). Returns false if an optional label found no room. */
      place(text, X, Y, dir = [1, -1], { optional = false, colour = pal.ink, kind = 'label', gap = px * 0.75 } = {}) {
        ctx.save();
        ctx.font = font(kind, px);
        const w = ctx.measureText(text).width + 8;
        ctx.restore();
        const h = px * 1.3;
        const len = Math.hypot(dir[0], dir[1]) || 1;
        const base = Math.atan2(dir[1] / len, dir[0] / len);
        let chosen = null;
        for (const turn of [0, 0.6, -0.6, 1.2, -1.2, 1.9, -1.9, Math.PI]) {
          const a = base + turn;
          const ux = Math.cos(a);
          const uy = Math.sin(a);
          // Side, corner or centre placement, `gap` clear of the anchor on each axis it moves along.
          const x = ux > 0.3 ? X + gap : ux < -0.3 ? X - gap - w : X - w / 2;
          const y = uy > 0.3 ? Y + gap : uy < -0.3 ? Y - gap - h : Y - h / 2;
          const r = { x, y, w, h };
          if (fits(r)) {
            chosen = r;
            break;
          }
        }
        if (!chosen) {
          if (optional) return false;
          const cx = Math.min(bounds.x + bounds.w - w / 2 - 2, Math.max(bounds.x + w / 2 + 2, X + (dir[0] >= 0 ? 1 : -1) * (gap + w / 2)));
          const cy = Math.min(bounds.y + bounds.h - h / 2 - 2, Math.max(bounds.y + h / 2 + 2, Y + (dir[1] >= 0 ? 1 : -1) * (gap + h / 2)));
          chosen = { x: cx - w / 2, y: cy - h / 2, w, h };
        }
        boxes.push(chosen);
        ctx.save();
        ctx.fillStyle = pal.bg;
        ctx.fillRect(chosen.x, chosen.y, chosen.w, chosen.h);
        ctx.restore();
        label(ctx, text, chosen.x + chosen.w / 2, chosen.y + chosen.h / 2 + 1, { colour, px, kind, align: 'center', baseline: 'middle' });
        return true;
      },
    };
  }

  const P = (vp, z) => [vp.toX(z.re), vp.toY(z.im)];

  function line(ctx, x0, y0, x1, y1, colour, width = 1.5, dash = null) {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }

  function vector(ctx, vp, from, to, colour, width, px, dashed = false) {
    const [x0, y0] = P(vp, from);
    const [x1, y1] = P(vp, to);
    arrow(ctx, x0, y0, x1, y1, { colour, width, head: Math.max(11, px * 0.8), dashed });
  }

  function dot(ctx, X, Y, colour, r, { open = false, square = false, width = 2.5 } = {}) {
    ctx.save();
    ctx.lineWidth = width;
    ctx.strokeStyle = colour;
    ctx.fillStyle = open ? pal.bg : colour;
    ctx.beginPath();
    if (square) ctx.rect(X - r, Y - r, 2 * r, 2 * r);
    else ctx.arc(X, Y, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  /** A draggable point: a filled disc with a background ring, so it reads as a handle. */
  function handle(ctx, X, Y, colour, px, id, placer) {
    const r = Math.max(7, px * 0.5);
    ctx.save();
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.arc(X, Y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = pal.bg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(X, Y, r * 0.5, 0, TAU);
    ctx.stroke();
    ctx.restore();
    frame.handles.push({ id, X, Y });
    placer?.block(X - r, Y - r, 2 * r, 2 * r);
  }

  /** Arc round (cx, cy) from world angle a0 to a1 (a1 < a0 runs clockwise), with an optional arrowhead. */
  function arcAt(ctx, cx, cy, R, a0, a1, colour, { width = 2, head = 0, dashed = false } = {}) {
    if (!(R > 3) || Math.abs(a1 - a0) < 1e-6) return;
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.fillStyle = colour;
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, R, -a0, -a1, a1 > a0);
    ctx.stroke();
    ctx.setLineDash([]);
    const h = Math.min(head, R * Math.abs(a1 - a0) * 0.6);
    if (h > 4) {
      const s = a1 > a0 ? 1 : -1;
      const ex = cx + R * Math.cos(a1);
      const ey = cy - R * Math.sin(a1);
      const tx = -Math.sin(a1) * s;
      const ty = -Math.cos(a1) * s;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - tx * h - ty * h * 0.45, ey - ty * h + tx * h * 0.45);
      ctx.lineTo(ex - tx * h + ty * h * 0.45, ey - ty * h - tx * h * 0.45);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /** Label an arc at its middle angle, just outside it. */
  function arcLabel(placer, cx, cy, R, a0, a1, text, px, opts = {}) {
    const mid = (a0 + a1) / 2;
    const ux = Math.cos(mid);
    const uy = -Math.sin(mid);
    return placer.place(text, cx + ux * R, cy + uy * R, [ux, uy], { optional: true, gap: px * 0.35, ...opts });
  }

  /** Label a point outward from the origin. Narrow stages show the name only ("z₁"); the strip has values. */
  function pointLabel(placer, vp, z, text, px, opts = {}) {
    const [X, Y] = P(vp, z);
    const m = modulus(z);
    const dir = m > 1e-9 ? [z.re / m, -z.im / m] : [1, -1];
    return placer.place(frame.compact ? text.split(' = ')[0] : text, X, Y, dir, opts);
  }

  // -------------------------------------------------------------------------------------------
  // Info column
  // -------------------------------------------------------------------------------------------

  const head = (text) => ({ kind: 'head', text });
  const row = (text, swatch = null, extra = {}) => ({ kind: 'row', text, swatch, ...extra });
  const note = (text) => ({ kind: 'note', text });
  const gap = () => ({ kind: 'gap' });

  function wrap(ctx, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const w of words) {
      const next = current ? `${current} ${w}` : w;
      if (current && ctx.measureText(next).width > maxW) {
        lines.push(current);
        current = w;
      } else current = next;
    }
    if (current) lines.push(current);
    return lines;
  }

  function swatchAt(ctx, sw, x, y, px) {
    const s = px * 0.55;
    ctx.save();
    if (sw.type === 'line' || sw.type === 'dashed') {
      ctx.strokeStyle = sw.colour;
      ctx.lineWidth = 3;
      if (sw.type === 'dashed') ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + px * 1.1, y);
      ctx.stroke();
    } else if (sw.type === 'square') {
      ctx.fillStyle = sw.colour;
      ctx.fillRect(x + px * 0.55 - s / 2, y - s / 2, s, s);
    } else if (sw.type === 'dot' || sw.type === 'open') {
      ctx.fillStyle = sw.type === 'open' ? pal.panel : sw.colour;
      ctx.strokeStyle = sw.colour;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x + px * 0.55, y, s / 2, 0, TAU);
      ctx.fill();
      ctx.stroke();
    } else if (sw.type === 'hatch') {
      const x0 = x + px * 0.1;
      const y0 = y - px * 0.45;
      const w = px * 0.9;
      ctx.beginPath();
      ctx.rect(x0, y0, w, w);
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = sw.colour;
      ctx.fill();
      ctx.restore();
      ctx.clip();
      ctx.strokeStyle = sw.colour;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = -w; k < w; k += 6) {
        ctx.moveTo(x0 + k, y0 + w);
        ctx.lineTo(x0 + k + w, y0);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawInfo(ctx, rect, lines, px) {
    ctx.save();
    ctx.fillStyle = pal.panel;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(rect.x) + 0.5, Math.round(rect.y) + 0.5, Math.round(rect.w) - 1, Math.round(rect.h) - 1);
    const left = rect.x + px * 0.9;
    const textX = left + px * 1.6;
    const maxW = rect.x + rect.w - px * 0.8 - textX;
    const lh = px * 1.42;
    let y = rect.y + px * 1.5;
    const bottom = rect.y + rect.h - px * 0.6;
    for (const ln of lines) {
      if (y > bottom) break;
      if (ln.kind === 'gap') {
        y += px * 0.55;
        continue;
      }
      if (ln.kind === 'head') {
        label(ctx, ln.text.toUpperCase(), left, y, { colour: pal.accentText, px, kind: 'mono' });
        y += lh;
        continue;
      }
      const kind = ln.strong ? 'strong' : 'label';
      ctx.font = font(kind, px);
      const parts = wrap(ctx, ln.text, maxW);
      if (ln.swatch) swatchAt(ctx, ln.swatch, left, y - px * 0.32, px);
      for (const part of parts) {
        if (y > bottom) break;
        label(ctx, part, ln.swatch || ln.kind === 'row' ? textX : left, y, { colour: ln.kind === 'note' ? pal.muted : pal.ink, px, kind });
        y += lh;
      }
    }
    ctx.restore();
  }

  /** Narrow stages: up to two short lines in a strip above the plane. */
  function drawStrip(ctx, rect, lines, px) {
    ctx.save();
    ctx.fillStyle = pal.panel;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h - px * 0.3);
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(rect.x) + 0.5, Math.round(rect.y) + 0.5, Math.round(rect.w) - 1, Math.round(rect.h - px * 0.3) - 1);
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    lines.slice(0, 2).forEach((text, k) => {
      label(ctx, text, rect.x + px * 0.6, rect.y + px * (1.25 + 1.4 * k), { colour: pal.ink, px, kind: k === 0 ? 'strong' : 'label' });
    });
    ctx.restore();
  }

  // -------------------------------------------------------------------------------------------
  // Operations
  // -------------------------------------------------------------------------------------------

  function drawOperations(ctx, vp, px, params, placer) {
    const r = computeOperation(params);
    const [C1, C2, CR] = [pal.series[1], pal.series[2], pal.series[0]];
    const unit = params.angleUnit;
    const range = unit === 'deg' ? '(−180°, 180°]' : '(−π, π]';
    const ppu = vp.scaleX;
    const [ox, oy] = P(vp, complex(0, 0));
    const { z1, z2 } = r;
    const t1 = principalArg(z1);
    const t2 = principalArg(z2);
    const lines = [];
    let strip = [];
    const ok = (z) => z && isFiniteZ(z);
    const arcR = (z, k = 1) => Math.min(px * 2.3 * k, modulus(z) * ppu * 0.55 * k);
    const tip = Math.max(8, px * 0.55);

    const pointRows = (name, z, colour, swType = 'line') => [
      row(`${name} = ${complexText(z)}`, { type: swType, colour }),
      row(`|${name}| = ${modulusText(modulus(z))},  arg ${name} = ${angleText(principalArg(z), unit)}`),
    ];

    if (r.op === 'add' || r.op === 'sub') {
      const res = r.result;
      if (r.op === 'add') {
        vector(ctx, vp, z1, res, C2, 2, px, true); // copy of z₂ from the tip of z₁
        vector(ctx, vp, z2, res, C1, 2, px, true); // copy of z₁ from the tip of z₂
        vector(ctx, vp, complex(0, 0), res, CR, 3.5, px);
      } else {
        vector(ctx, vp, z2, z1, CR, 2.5, px, true); // z₁ − z₂ joins z₂ to z₁
        vector(ctx, vp, res, z1, C2, 2, px, true); // the parallelogram's other side
        vector(ctx, vp, complex(0, 0), res, CR, 3.5, px);
      }
      vector(ctx, vp, complex(0, 0), z1, C1, 2.5, px);
      vector(ctx, vp, complex(0, 0), z2, C2, 2.5, px);
      const [rx, ry] = P(vp, res);
      dot(ctx, rx, ry, CR, Math.max(5, px * 0.3));
      const name = r.op === 'add' ? 'z₁ + z₂' : 'z₁ − z₂';
      handle(ctx, ...P(vp, z1), C1, px, 'z1', placer);
      handle(ctx, ...P(vp, z2), C2, px, 'z2', placer);
      pointLabel(placer, vp, res, `${name} = ${complexText(res)}`, px);
      pointLabel(placer, vp, z1, `z₁ = ${complexText(z1)}`, px);
      pointLabel(placer, vp, z2, `z₂ = ${complexText(z2)}`, px);
      lines.push(head(r.op === 'add' ? 'Add: parallelogram rule' : 'Subtract: joining two points'));
      lines.push(...pointRows('z₁', z1, C1), ...pointRows('z₂', z2, C2), gap());
      lines.push(row(`${name} = ${complexText(res)}`, { type: 'line', colour: CR }, { strong: true }));
      lines.push(row(`|${name}| = ${modulusText(modulus(res))}`));
      lines.push(row(`arg(${name}) = ${angleText(principalArg(res), unit)}`));
      lines.push(gap());
      if (r.op === 'add') lines.push(note(`Triangle inequality: |z₁ + z₂| ≤ |z₁| + |z₂|, here ${numText(modulus(res))} ≤ ${numText(modulus(z1) + modulus(z2))}.`));
      else lines.push(note(`|z₁ − z₂| = ${numText(modulus(res))} is the distance from z₂ to z₁, and arg(z₁ − z₂) is the direction from z₂ to z₁.`));
      strip = [`${name} = ${complexText(res)}`, `|${name}| = ${modulusText(modulus(res))}, arg = ${angleText(principalArg(res), unit)}`];
    } else if (r.op === 'mul' || r.op === 'div') {
      const isMul = r.op === 'mul';
      const res = r.result;
      const name = isMul ? 'z₁z₂' : 'z₁/z₂';
      const defined = ok(res);
      if (params.similarTriangles && defined && modulus(z2) > 0) {
        // Triangle 0, 1, z₂ scaled by z₁ (multiply) or by z₁/z₂ (divide) is the triangle the result makes.
        const k = isMul ? z1 : res;
        const tri = (a, b, c, colour) => {
          ctx.save();
          ctx.strokeStyle = colour;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(...P(vp, a));
          ctx.lineTo(...P(vp, b));
          ctx.lineTo(...P(vp, c));
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        };
        const one = complex(1, 0);
        tri(complex(0, 0), one, z2, C2);
        tri(complex(0, 0), k, mul(k, z2), CR);
        const [x1, y1] = P(vp, one);
        dot(ctx, x1, y1, pal.ink, Math.max(4, px * 0.22));
        placer.place('1', x1, y1, [0.3, 1], { optional: true });
      }
      if (defined) vector(ctx, vp, complex(0, 0), res, CR, 3.5, px);
      vector(ctx, vp, complex(0, 0), z1, C1, 2.5, px);
      vector(ctx, vp, complex(0, 0), z2, C2, 2.5, px);
      if (params.showArcs && modulus(z1) > 0 && modulus(z2) > 0 && defined) {
        // arg z₁ and arg z₂ at the origin.
        arcAt(ctx, ox, oy, arcR(z1), 0, t1, C1, { width: 2, head: tip });
        arcLabel(placer, ox, oy, arcR(z1), 0, t1, 'θ₁', px);
        const r2 = Math.min(arcR(z2, 1.45), arcR(z1) + px * 1.1);
        arcAt(ctx, ox, oy, r2, 0, t2, C2, { width: 2, head: tip });
        arcLabel(placer, ox, oy, r2, 0, t2, 'θ₂', px);
        // Rotate z₁ by ±θ₂ (the arc it sweeps at radius |z₁|), then scale by |z₂| along the ray.
        const sign = isMul ? 1 : -1;
        const turned = mul(z1, fromPolar(1, sign * t2));
        const R1 = modulus(z1) * ppu;
        arcAt(ctx, ox, oy, R1, t1, t1 + sign * t2, C2, { width: 2, head: tip, dashed: true });
        arcLabel(placer, ox, oy, R1, t1, t1 + sign * t2, isMul ? 'rotate θ₂' : 'rotate −θ₂', px, { colour: pal.ink });
        const [gx, gy] = P(vp, turned);
        const [rx, ry] = P(vp, res);
        line(ctx, gx, gy, rx, ry, CR, 2, [6, 5]);
        dot(ctx, gx, gy, C1, Math.max(4, px * 0.25), { open: true, width: 2 });
        placer.place(isMul ? '× |z₂|' : '÷ |z₂|', (gx + rx) / 2, (gy + ry) / 2, [-(ry - gy), rx - gx], { optional: true });
      }
      if (defined) {
        const [rx, ry] = P(vp, res);
        dot(ctx, rx, ry, CR, Math.max(5, px * 0.3));
      }
      handle(ctx, ...P(vp, z1), C1, px, 'z1', placer);
      handle(ctx, ...P(vp, z2), C2, px, 'z2', placer);
      if (defined) pointLabel(placer, vp, res, `${name} = ${complexText(res)}`, px);
      pointLabel(placer, vp, z1, `z₁ = ${complexText(z1)}`, px);
      pointLabel(placer, vp, z2, `z₂ = ${complexText(z2)}`, px);

      lines.push(head(isMul ? 'Multiply: rotate and scale' : 'Divide: rotate back and scale'));
      lines.push(...pointRows('z₁', z1, C1), ...pointRows('z₂', z2, C2), gap());
      if (!defined) {
        lines.push(row('z₂ = 0, so z₁/z₂ is undefined', { type: 'line', colour: CR }, { strong: true }));
        strip = ['z₂ = 0, so z₁/z₂ is undefined'];
      } else {
        lines.push(row(`${name} = ${complexText(res)}`, { type: 'line', colour: CR }, { strong: true }));
        const m = isMul ? `|z₁z₂| = |z₁| × |z₂| = ${modulusText(modulus(res))}` : `|z₁/z₂| = |z₁| ÷ |z₂| = ${modulusText(modulus(res))}`;
        lines.push(row(m));
        if (modulus(res) === 0) lines.push(note(`${name} = 0, so its argument is undefined.`));
        else {
          const sum = isMul ? t1 + t2 : t1 - t2;
          const op = isMul ? '+' : '−';
          lines.push(row(`arg z₁ ${op} arg z₂ = ${angleText(t1, unit)} ${op} ${angleText(t2, unit)} = ${angleText(sum, unit)}`));
          const principal = principalArg(res);
          if (Math.abs(principal - sum) > 1e-9) {
            const shift = principal > sum ? `+ ${unit === 'deg' ? '360°' : '2π'}` : `− ${unit === 'deg' ? '360°' : '2π'}`;
            lines.push(note(`Outside ${range}, so arg(${name}) = ${angleText(sum, unit)} ${shift} = ${angleText(principal, unit)}`));
          } else lines.push(row(`arg(${name}) = ${angleText(principal, unit)}`));
        }
        strip = [`${name} = ${complexText(res)}`, `|${name}| = ${modulusText(modulus(res))}, arg = ${angleText(principalArg(res), unit)}`];
      }
    } else if (r.op === 'conj') {
      const res = r.result;
      const [x1, y1] = P(vp, z1);
      const [x2, y2] = P(vp, res);
      line(ctx, x1, y1, x2, y2, pal.muted, 1.5, [5, 5]);
      if (Math.abs(z1.im) > 1e-12) {
        // Right-angle mark where the mirror line crosses the real axis, and equal-length ticks.
        const s = px * 0.5;
        const dir = z1.re >= 0 ? 1 : -1;
        ctx.save();
        ctx.strokeStyle = pal.muted;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(dir > 0 ? x1 : x1 - s, oy - s, s, s);
        ctx.beginPath();
        for (const ym of [(y1 + oy) / 2, (y2 + oy) / 2]) {
          ctx.moveTo(x1 - s * 0.6, ym);
          ctx.lineTo(x1 + s * 0.6, ym);
        }
        ctx.stroke();
        ctx.restore();
      }
      vector(ctx, vp, complex(0, 0), res, CR, 3.5, px);
      vector(ctx, vp, complex(0, 0), z1, C1, 2.5, px);
      if (params.showArcs && modulus(z1) > 0) {
        arcAt(ctx, ox, oy, arcR(z1), 0, t1, C1, { head: tip });
        arcLabel(placer, ox, oy, arcR(z1), 0, t1, 'θ', px);
        arcAt(ctx, ox, oy, arcR(z1) * 1.25, 0, principalArg(res) === t1 ? t1 : -t1, CR, { head: tip });
        if (principalArg(res) !== t1) arcLabel(placer, ox, oy, arcR(z1) * 1.25, 0, -t1, '−θ', px);
      }
      dot(ctx, x2, y2, CR, Math.max(5, px * 0.3));
      handle(ctx, x1, y1, C1, px, 'z1', placer);
      pointLabel(placer, vp, z1, `z₁ = ${complexText(z1)}`, px);
      pointLabel(placer, vp, res, `z̄₁ = ${complexText(res)}`, px);
      const m = modulus(z1);
      lines.push(head('Conjugate: reflect in the real axis'));
      lines.push(...pointRows('z₁', z1, C1), gap());
      lines.push(row(`z̄₁ = ${complexText(res)}`, { type: 'line', colour: CR }, { strong: true }));
      lines.push(row(`|z̄₁| = |z₁| = ${modulusText(m)}`));
      if (m > 0) lines.push(row(Math.abs(z1.im) < 1e-12 ? `z₁ is real, so z̄₁ = z₁` : `arg z̄₁ = −arg z₁ = ${angleText(principalArg(res), unit)}`));
      lines.push(gap());
      lines.push(row(`z₁ + z̄₁ = 2 Re z₁ = ${numText(2 * z1.re)}`));
      lines.push(row(`z₁ − z̄₁ = 2i Im z₁ = ${complexText(complex(0, 2 * z1.im))}`));
      lines.push(row(`z₁ z̄₁ = |z₁|² = ${numText(m * m)}`));
      strip = [`z̄₁ = ${complexText(res)}`, `z₁ z̄₁ = |z₁|² = ${numText(m * m)}`];
    } else if (r.op === 'power') {
      const n = params.powerN;
      const pw = r.powers;
      const rho = modulus(z1);
      // Unit circle for reference.
      ctx.save();
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(ox, oy, ppu, 0, TAU);
      ctx.stroke();
      ctx.restore();
      if (rho > 0) {
        // Radial lines to every power (equal angles θ between them).
        for (let k = 1; k < n; k++) {
          const [x, y] = P(vp, pw[k]);
          line(ctx, ox, oy, x, y, pal.axis, 1);
        }
        // The spiral rᵗ cis(tθ), 0 ≤ t ≤ n, through every power.
        ctx.save();
        ctx.strokeStyle = CR;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const steps = Math.max(60, n * 40);
        for (let i = 0; i <= steps; i++) {
          const t = (n * i) / steps;
          const z = fromPolar(rho ** t, t * t1);
          const X = Math.max(-1e5, Math.min(1e5, vp.toX(z.re)));
          const Y = Math.max(-1e5, Math.min(1e5, vp.toY(z.im)));
          if (i === 0) ctx.moveTo(X, Y);
          else ctx.lineTo(X, Y);
        }
        ctx.stroke();
        ctx.restore();
      }
      vector(ctx, vp, complex(0, 0), pw[n], CR, 3.5, px);
      vector(ctx, vp, complex(0, 0), z1, C1, 2.5, px);
      if (params.showArcs && rho > 0) {
        arcAt(ctx, ox, oy, arcR(z1), 0, t1, C1, { head: tip });
        arcLabel(placer, ox, oy, arcR(z1), 0, t1, 'θ', px);
      }
      for (let k = 0; k <= n; k++) {
        const [x, y] = P(vp, pw[k]);
        dot(ctx, x, y, CR, Math.max(4, px * 0.24), { open: k === 0 });
      }
      handle(ctx, ...P(vp, z1), C1, px, 'z1', placer);
      pointLabel(placer, vp, pw[n], `z${superscript(n)} = ${complexText(pw[n])}`, px);
      pointLabel(placer, vp, z1, `z = ${complexText(z1)}`, px);
      if (n > 1) pointLabel(placer, vp, pw[0], '1', px, { optional: true });
      for (let k = 2; k < n; k++) pointLabel(placer, vp, pw[k], `z${superscript(k)}`, px, { optional: true });

      const nt = n * t1;
      const res = pw[n];
      lines.push(head('Powers: de Moivre'));
      lines.push(row(`z = ${complexText(z1)}`, { type: 'line', colour: C1 }));
      lines.push(row(`r = |z| = ${modulusText(rho)},  θ = arg z = ${angleText(t1, unit)}`));
      lines.push(note('Each multiplication by z rotates by θ and scales by r.'));
      lines.push(gap());
      lines.push(row(`z${superscript(n)} = ${complexText(res)}`, { type: 'line', colour: CR }, { strong: true }));
      lines.push(row(`|z${superscript(n)}| = r${superscript(n)} = ${modulusText(modulus(res))}`));
      if (rho > 0) {
        lines.push(row(`${n}θ = ${angleText(nt, unit)}`));
        if (Math.abs(wrapAngle(nt) - nt) > 1e-9) lines.push(note(`Outside ${range}, so arg z${superscript(n)} = ${angleText(wrapAngle(nt), unit)}`));
      }
      lines.push(gap());
      lines.push(note(`de Moivre: (r cis θ)${superscript(n)} = r${superscript(n)} cis ${n}θ`));
      strip = [`z${superscript(n)} = ${complexText(res)}`, `|z${superscript(n)}| = ${modulusText(modulus(res))}, arg = ${angleText(principalArg(res), unit)}`];
    } else if (r.op === 'roots') {
      const n = params.rootN;
      const { roots, w } = r;
      const ofUnity = params.rootsOf !== 'w';
      const rho = modulus(roots[0]);
      ctx.save();
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(ox, oy, rho * ppu, 0, TAU);
      ctx.stroke();
      ctx.restore();
      if (rho > 0) {
        for (const z of roots) line(ctx, ox, oy, ...P(vp, z), pal.axis, 1);
        ctx.save();
        ctx.strokeStyle = CR;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        roots.forEach((z, k) => (k === 0 ? ctx.moveTo(...P(vp, z)) : ctx.lineTo(...P(vp, z))));
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        vector(ctx, vp, complex(0, 0), roots[0], CR, 3.5, px);
        if (params.showArcs) {
          const t0 = principalArg(roots[0]) || 0;
          const R = Math.min(rho * ppu * 0.5, px * 3.2);
          arcAt(ctx, ox, oy, R, t0, t0 + TAU / n, CR, { head: tip });
          arcLabel(placer, ox, oy, R, t0, t0 + TAU / n, angleText(TAU / n, unit), px, { colour: pal.ink });
        }
      }
      if (!ofUnity) {
        vector(ctx, vp, complex(0, 0), w, C1, 2.5, px);
        handle(ctx, ...P(vp, w), C1, px, 'z1', placer);
        pointLabel(placer, vp, w, `w = ${complexText(w)}`, px);
      }
      roots.forEach((z, k) => {
        const [x, y] = P(vp, z);
        dot(ctx, x, y, CR, Math.max(5, px * 0.3));
      });
      const names = roots.map((_, k) => (ofUnity ? (k === 0 ? '1' : k === 1 ? 'ω' : `ω${superscript(k)}`) : `z${subscript(k)}`));
      roots.forEach((z, k) => pointLabel(placer, vp, z, k === 0 && !ofUnity ? `z₀ = ${complexText(z)}` : names[k], px, { optional: k > 0 }));

      const sum = roots.reduce((s, z) => add(s, z), complex(0, 0));
      lines.push(head(ofUnity ? 'Roots of unity' : 'Roots of a complex number'));
      lines.push(row(`Solve z${superscript(n)} = ${ofUnity ? '1' : 'w'}`, null, { strong: true }));
      if (!ofUnity) lines.push(row(`w = ${complexText(w)} (drag it, or set z₁)`, { type: 'line', colour: C1 }), row(`|w| = ${modulusText(modulus(w))},  arg w = ${angleText(principalArg(w), unit)}`));
      const radical = n === 2 ? '√' : `${superscript(n)}√`;
      const ks = n === 2 ? 'k = 0, 1' : n === 3 ? 'k = 0, 1, 2' : `k = 0, 1, …, ${n - 1}`;
      lines.push(row(`${n} roots, all with modulus ${ofUnity ? '1' : `${radical}|w| = ${numText(rho)}`}`, { type: 'dot', colour: CR }));
      lines.push(row(ofUnity ? `ω = cis(2π/${n}), roots 1, ω, ω², …, ω${superscript(n - 1)}` : `Roots ${radical}|w| cis((arg w + 2kπ)/${n}), ${ks}`));
      lines.push(row(`Spacing ${angleText(TAU / n, unit)}: ${POLYGON[n]}`));
      lines.push(gap());
      lines.push(row(`Principal root ${ofUnity ? '1' : `z₀ = ${complexText(roots[0])}`}`, { type: 'line', colour: CR }, { strong: true }));
      if (!ofUnity) lines.push(row(`arg z₀ = arg w ÷ ${n} = ${angleText(principalArg(roots[0]), unit)}`));
      lines.push(row(`Sum of the roots = ${complexText(sum)}`));
      if (rho === 0) lines.push(note('w = 0, so every root is 0.'));
      strip = [ofUnity ? `z${superscript(n)} = 1: ${POLYGON[n]}` : `z${superscript(n)} = ${complexText(w)}: ${POLYGON[n]}`, `|z| = ${modulusText(rho)}, spacing ${angleText(TAU / n, unit)}`];
    }
    return { lines, strip };
  }


  // -------------------------------------------------------------------------------------------
  // Loci
  // -------------------------------------------------------------------------------------------

  function ensureCanvases() {
    if (!maskCanvas) maskCanvas = document.createElement('canvas');
    if (!regionCanvas) regionCanvas = document.createElement('canvas');
  }

  /** Shade every point satisfying all `conds`: a per-pixel test on a reduced grid, flat tint plus hatching. */
  function shadeRegion(ctx, vp, plot, conds, colour) {
    ensureCanvases();
    const cell = 2;
    const cols = Math.ceil(plot.w / cell);
    const rows = Math.ceil(plot.h / cell);
    const mask = rasteriseRegion(conds, { x0: vp.fromX(plot.x), x1: vp.fromX(plot.x + cols * cell), y0: vp.fromY(plot.y + rows * cell), y1: vp.fromY(plot.y), cols, rows });
    if (!mask.some(Boolean)) return false;
    maskCanvas.width = cols;
    maskCanvas.height = rows;
    const mctx = maskCanvas.getContext('2d');
    const img = mctx.createImageData(cols, rows);
    for (let i = 0; i < mask.length; i++) img.data[i * 4 + 3] = mask[i] ? 255 : 0;
    mctx.putImageData(img, 0, 0);

    const dpr = surface.dpr;
    regionCanvas.width = Math.round(plot.w * dpr);
    regionCanvas.height = Math.round(plot.h * dpr);
    const rctx = regionCanvas.getContext('2d');
    rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rctx.clearRect(0, 0, plot.w, plot.h);
    rctx.globalAlpha = 0.16;
    rctx.fillStyle = colour;
    rctx.fillRect(0, 0, plot.w, plot.h);
    rctx.globalAlpha = 0.75;
    rctx.strokeStyle = colour;
    rctx.lineWidth = 1.5;
    rctx.beginPath();
    const spacing = 11;
    for (let k = -plot.h; k < plot.w + plot.h; k += spacing) {
      rctx.moveTo(k, plot.h);
      rctx.lineTo(k + plot.h, 0);
    }
    rctx.stroke();
    rctx.globalAlpha = 1;
    rctx.globalCompositeOperation = 'destination-in';
    rctx.imageSmoothingEnabled = false;
    rctx.drawImage(maskCanvas, 0, 0, cols * cell, rows * cell);
    rctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(regionCanvas, plot.x, plot.y, plot.w, plot.h);
    return true;
  }

  function strokeCurve(ctx, vp, piece, box, colour, width, dashed) {
    const curve = pieceCurve(piece, box);
    if (!curve) return;
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([10, 7]);
    ctx.beginPath();
    if (piece.kind === 'circle') {
      ctx.arc(vp.toX(piece.c.re), vp.toY(piece.c.im), piece.r * vp.scaleX, 0, TAU);
    } else {
      ctx.moveTo(...P(vp, curve.at(curve.t0)));
      ctx.lineTo(...P(vp, curve.at(curve.t1)));
    }
    ctx.stroke();
    ctx.restore();
  }

  function strokeRuns(ctx, vp, runs, colour, width, dashed) {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    if (dashed) ctx.setLineDash([10, 7]);
    for (const run of runs) {
      ctx.beginPath();
      run.forEach((z, k) => (k === 0 ? ctx.moveTo(...P(vp, z)) : ctx.lineTo(...P(vp, z))));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLoci(ctx, vp, px, params, placer, plot) {
    const [C1, C2, CR] = [pal.series[1], pal.series[2], pal.series[0]];
    const unit = params.angleUnit;
    const entries = [1, 2]
      .map((i) => ({ i, c: conditionFromParams(params, i), colour: i === 1 ? C1 : C2, sub: i === 1 ? '₁' : '₂' }))
      .filter((e) => e.c);
    const box = { x0: vp.x[0], x1: vp.x[1], y0: vp.y[0], y1: vp.y[1] };
    const eqs = entries.filter((e) => e.c.rel === 'eq');
    const ineqs = entries.filter((e) => e.c.rel !== 'eq');
    let shaded = false;
    let emptyRegion = false;
    if (!eqs.length) {
      shaded = shadeRegion(ctx, vp, plot, ineqs.map((e) => e.c), CR);
      emptyRegion = !shaded;
    }

    // Construction: dashed reference line through each arg vertex, and the segment a–b for bisectors.
    for (const e of entries) {
      const [ax, ay] = P(vp, e.c.a);
      if (e.c.type === 'argument') {
        line(ctx, ax, ay, Math.min(plot.x + plot.w, ax + px * 4.5), ay, pal.axis, 1.5, [4, 5]);
        const R = px * 2.4;
        arcAt(ctx, ax, ay, R, 0, e.c.theta, e.colour, { width: 2, head: Math.max(8, px * 0.55) });
        arcLabel(placer, ax, ay, R, 0, e.c.theta, `θ${e.sub} = ${angleText(e.c.theta, unit)}`, px);
      }
      if (e.c.type === 'bisector') {
        const [bx, by] = P(vp, e.c.b);
        line(ctx, ax, ay, bx, by, pal.axis, 1.5, [4, 5]);
        // Equal-length marks on each half.
        const len = Math.hypot(bx - ax, by - ay);
        if (len > px * 2) {
          const [ux, uy] = [(bx - ax) / len, (by - ay) / len];
          ctx.save();
          ctx.strokeStyle = pal.muted;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (const f of [0.25, 0.75]) {
            const [mx, my] = [ax + (bx - ax) * f, ay + (by - ay) * f];
            ctx.moveTo(mx - uy * px * 0.4, my + ux * px * 0.4);
            ctx.lineTo(mx + uy * px * 0.4, my - ux * px * 0.4);
          }
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Boundaries: thin in full, bold where they bound the region; an equality locus bold in orange.
    const locusEnds = [];
    for (const e of entries) {
      const others = entries.filter((o) => o !== e).map((o) => o.c);
      for (const piece of boundaryPieces(e.c)) {
        // With shading, the cut ray (arg = π) is drawn only where it bounds the region.
        if (!piece.cut || eqs.length) strokeCurve(ctx, vp, piece, box, e.colour, 1.5, !piece.included);
        if (e.c.rel === 'eq') {
          if (eqs.length === 2) continue;
          const { runs, ends } = clipPiece(piece, others, box);
          strokeRuns(ctx, vp, runs, CR, 4, false);
          locusEnds.push(...ends);
        } else if (!eqs.length && shaded) {
          const { runs } = clipPiece(piece, others, box);
          strokeRuns(ctx, vp, runs, e.colour, 3.5, !piece.included);
        }
      }
    }
    for (const end of locusEnds) dot(ctx, ...P(vp, end.z), CR, Math.max(5, px * 0.32), { open: !end.included });
    let meets = null;
    if (eqs.length === 2) {
      meets = intersections(eqs[0].c, eqs[1].c, box);
      if (meets.coincide) {
        for (const piece of boundaryPieces(eqs[0].c)) {
          const { runs } = clipPiece(piece, [], box);
          strokeRuns(ctx, vp, runs, CR, 4, false);
        }
      } else {
        for (const z of meets) {
          const [x, y] = P(vp, z);
          dot(ctx, x, y, CR, Math.max(6, px * 0.38));
          placer.block(x - px * 0.4, y - px * 0.4, px * 0.8, px * 0.8);
        }
      }
    }
    // Arg vertices are never in the set: open circles.
    for (const e of entries) if (e.c.type === 'argument') dot(ctx, ...P(vp, e.c.a), e.colour, Math.max(6, px * 0.36), { open: true });

    // Handles: centres and vertices a, points b, radius and angle grips, and the test point z.
    for (const e of entries) {
      const [ax, ay] = P(vp, e.c.a);
      if (e.c.type === 'modulus') {
        let grip = null;
        for (const t of [-Math.PI / 4, Math.PI / 4, (-3 * Math.PI) / 4, (3 * Math.PI) / 4, 0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
          const z = add(e.c.a, fromPolar(e.c.r, t));
          const [x, y] = P(vp, z);
          if (vp.contains(x, y)) {
            grip = [x, y];
            break;
          }
        }
        if (grip) {
          dot(ctx, grip[0], grip[1], e.colour, Math.max(5, px * 0.3), { open: true, square: true, width: 2.5 });
          frame.handles.push({ id: `r${e.i}`, X: grip[0], Y: grip[1] });
          placer.place(`r${e.sub} = ${numText(e.c.r)}`, grip[0], grip[1], [1, 0.4], { optional: true });
        }
      }
      if (e.c.type === 'argument') {
        const curve = pieceCurve({ kind: 'ray', from: e.c.a, angle: e.c.theta }, box);
        if (curve) {
          const d = Math.min(curve.t1 * 0.6, Math.max(curve.t0, Math.min(params.viewRange * 0.45, 2.5)));
          const z = curve.at(Math.max(curve.t0, d));
          const [x, y] = P(vp, z);
          dot(ctx, x, y, e.colour, Math.max(5, px * 0.3), { open: true, square: true, width: 2.5 });
          frame.handles.push({ id: `theta${e.i}`, X: x, Y: y });
        }
      }
      if (e.c.type === 'bisector') {
        const [bx, by] = P(vp, e.c.b);
        handle(ctx, bx, by, e.colour, px, `b${e.i}`, placer);
        placer.place(`b${e.sub} = ${complexText(e.c.b)}`, bx, by, [0.5, 1], { optional: true });
      }
      if (e.c.type === 'argument') frame.handles.push({ id: `a${e.i}`, X: ax, Y: ay });
      else handle(ctx, ax, ay, e.colour, px, `a${e.i}`, placer);
      placer.place(`a${e.sub} = ${complexText(e.c.a)}`, ax, ay, [-0.6, 1], { optional: true });
    }
    if (meets && !meets.coincide) for (const z of meets) pointLabel(placer, vp, z, complexText(z), px, { optional: true, kind: 'strong' });

    const z = complex(params.zRe, params.zIm);
    const inside = entries.every((e) => satisfies(e.c, z));
    if (params.showProbe) {
      const [zx, zy] = P(vp, z);
      for (const e of entries) {
        line(ctx, zx, zy, ...P(vp, e.c.a), pal.muted, 1.5, [3, 4]);
        if (e.c.type === 'bisector') line(ctx, zx, zy, ...P(vp, e.c.b), pal.muted, 1.5, [3, 4]);
      }
      const rr = Math.max(7, px * 0.5);
      ctx.save();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = pal.bg;
      ctx.beginPath();
      ctx.arc(zx, zy, rr, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(zx - rr * 0.6, zy);
      ctx.lineTo(zx + rr * 0.6, zy);
      ctx.moveTo(zx, zy - rr * 0.6);
      ctx.lineTo(zx, zy + rr * 0.6);
      ctx.stroke();
      ctx.restore();
      frame.handles.push({ id: 'z', X: zx, Y: zy });
      placer.block(zx - rr, zy - rr, rr * 2, rr * 2);
      placer.place(`z ${inside ? '(in)' : '(out)'}`, zx, zy, [1, -1], { kind: 'strong' });
    }

    // Info column.
    const lines = [];
    const strip = [];
    entries.forEach((e, idx) => {
      lines.push(head(entries.length > 1 ? (idx === 0 ? 'Condition 1' : 'and condition 2') : 'Condition'));
      const sw = e.c.rel === 'eq' && eqs.length === 1 ? { type: 'line', colour: CR } : e.c.rel === 'eq' ? { type: 'line', colour: e.colour } : { type: e.c.rel === 'lt' || e.c.rel === 'gt' ? 'dashed' : 'line', colour: e.colour };
      const text = conditionText(e.c, unit);
      lines.push(row(text, sw, { strong: true }));
      const cart = cartesianText(e.c);
      if (cart) lines.push(row(cart));
      lines.push(note(conditionWords(e.c)));
      lines.push(gap());
      strip.push(text);
    });
    if (eqs.length === 2 && meets && !meets.coincide) {
      lines.push(head('Where they meet'));
      lines.push(row(meets.length ? meets.map((p) => complexText(p)).join(',  ') : 'They do not meet in view', { type: 'dot', colour: CR }));
      lines.push(gap());
    } else if (eqs.length === 2 && meets?.coincide) {
      lines.push(note('The two conditions describe the same curve.'), gap());
    }
    if (emptyRegion) lines.push(note('No point in view satisfies every condition.'), gap());
    if (params.showProbe) {
      lines.push(head('Test point'));
      lines.push(row(`z = ${complexText(z)}`, { type: 'open', colour: pal.ink }));
      for (const e of entries) lines.push(row(probeText(e.c, z, unit)));
      lines.push(row(inside ? `Satisfies ${entries.length > 1 ? 'both conditions' : 'the condition'}` : `Does not satisfy ${entries.length > 1 ? 'both conditions' : 'the condition'}`, null, { strong: true }));
      lines.push(gap());
    }
    if (!eqs.length) lines.push(row('Region satisfying every condition', { type: 'hatch', colour: CR }));
    lines.push(row('Boundary included', { type: 'line', colour: pal.muted }));
    lines.push(row('Boundary not included', { type: 'dashed', colour: pal.muted }));
    lines.push(row('Point not included', { type: 'open', colour: pal.muted }));
    return { lines, strip };
  }

  function probeText(c, z, unit) {
    const v = conditionValue(c, z);
    const yes = satisfies(c, z) ? 'yes' : 'no';
    const rel = { eq: '=', lt: '<', le: '≤', gt: '>', ge: '≥' }[c.rel];
    const za = zMinus(c.a);
    if (c.type === 'modulus') return `|${za}| = ${numText(v + c.r)} ${rel} ${numText(c.r)}? ${yes}`;
    if (c.type === 'bisector') return `|${za}| = ${numText(modulus(sub(z, c.a)))} ${rel} |${zMinus(c.b)}| = ${numText(modulus(sub(z, c.b)))}? ${yes}`;
    const a = principalArg(sub(z, c.a));
    const name = za === 'z' ? 'arg z' : `arg(${za})`;
    return `${name} = ${angleText(a, unit)} ${rel} ${angleText(c.theta, unit)}? ${Number.isFinite(a) ? yes : 'undefined, so no'}`;
  }

  // -------------------------------------------------------------------------------------------
  // Polynomial roots
  // -------------------------------------------------------------------------------------------

  function drawPolynomial(ctx, vp, px, params, placer) {
    const [C1, CR] = [pal.series[1], pal.series[0]];
    const coeffs = polyCoefficients(params);
    const roots = polyRoots(coeffs);
    const groups = rootGroups(roots);
    const realCoeffs = coeffs.every((c) => c.im === 0);
    const r = Math.max(6, px * 0.36);
    const [, oy] = P(vp, complex(0, 0));

    if (realCoeffs) {
      // Conjugate pairs: a dashed mirror line through the real axis with equal-length marks.
      for (const g of groups) {
        if (!(g.z.im > 0)) continue;
        const [x, y1] = P(vp, g.z);
        const y2 = vp.toY(-g.z.im);
        line(ctx, x, y1, x, y2, CR, 2, [6, 5]);
        ctx.save();
        ctx.strokeStyle = pal.muted;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (const ym of [(y1 + oy) / 2, (y2 + oy) / 2]) {
          for (const dy of [-3, 3]) {
            ctx.moveTo(x - px * 0.45, ym + dy);
            ctx.lineTo(x + px * 0.45, ym + dy);
          }
        }
        ctx.stroke();
        ctx.restore();
      }
    } else {
      // Mirror images of the roots are not roots now: hollow dashed rings.
      for (const g of groups) {
        if (Math.abs(g.z.im) < 1e-12) continue;
        const mirror = conj(g.z);
        if (groups.some((h) => modulus(sub(h.z, mirror)) < 1e-6)) continue;
        const [x, y] = P(vp, mirror);
        ctx.save();
        ctx.strokeStyle = pal.muted;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }
    for (const g of groups) {
      const [x, y] = P(vp, g.z);
      const isReal = g.z.im === 0;
      dot(ctx, x, y, isReal ? C1 : CR, r, { square: isReal });
      placer.block(x - r, y - r, 2 * r, 2 * r);
    }
    for (const g of groups) {
      const [x, y] = P(vp, g.z);
      const text = `${complexText(g.z)}${g.multiplicity > 1 ? ` (×${g.multiplicity})` : ''}`;
      placer.place(text, x, y, [0.4, g.z.im < 0 ? 1 : -1]);
    }

    const lines = [];
    const n = coeffs.length - 1;
    let lead = 0;
    while (lead < coeffs.length && coeffs[lead].re === 0 && coeffs[lead].im === 0) lead++;
    const eff = coeffs.slice(lead);
    lines.push(head('Polynomial'));
    lines.push(row(`P(z) = ${polyText(coeffs)}`, null, { strong: true }));
    if (lead > 0) lines.push(note(eff.length > 1 ? `The leading coefficient is 0, so P has degree ${eff.length - 1}.` : 'P is constant, so it has no roots.'));
    lines.push(gap());
    lines.push(head(`Roots (${roots.length})`));
    for (const g of groups) {
      const isReal = g.z.im === 0;
      lines.push(row(`${complexText(g.z)}${g.multiplicity > 1 ? `, repeated ×${g.multiplicity}` : ''}${isReal ? ' (real)' : ''}`, { type: isReal ? 'square' : 'dot', colour: isReal ? C1 : CR }));
    }
    lines.push(note(realCoeffs ? 'Real coefficients, so non-real roots come in conjugate pairs: mirror images in the real axis.' : 'The constant is not real, so roots need not be mirror images. Hollow rings show where the mirror images would be.'));
    if (eff.length > 1) {
      const m = eff.length - 1;
      const a = eff[0];
      const sum = roots.reduce((s, z) => add(s, z), complex(0, 0));
      const prod = roots.reduce((s, z) => mul(s, z), complex(1, 0));
      lines.push(gap());
      lines.push(head('Sum and product'));
      const lowName = m - 1 === 0 ? 'the constant' : m - 1 === 1 ? 'z' : `z${superscript(m - 1)}`;
      lines.push(row(`Sum = ${complexText(sum)} = −(coefficient of ${lowName}) ÷ ${complexText(a)}`));
      lines.push(row(`Product = ${complexText(prod)} = (−1)${superscript(m)} × constant ÷ ${complexText(a)}`));
    }
    const strip = [`P(z) = ${polyText(coeffs)}`, `Roots: ${groups.map((g) => complexText(g.z) + (g.multiplicity > 1 ? ` ×${g.multiplicity}` : '')).join(', ') || 'none'}`];
    return { lines, strip };
  }

  // -------------------------------------------------------------------------------------------
  // Frame
  // -------------------------------------------------------------------------------------------

  function draw(params) {
    const { ctx, width: W, height: H } = surface;
    const px = stageFontPx(W);
    surface.begin(pal.bg);
    const { plot, info, strip } = layout(W, H, px);
    const R = params.viewRange;
    const vp = viewport({ x: [-R, R], y: [-R, R], rect: plot, equal: true });
    frame = { vp, handles: [], px, compact: !info };

    // Same tick step on both axes (equal scale), wide enough apart for the x labels (about 3.4 text heights).
    const span = vp.y[1] - vp.y[0];
    const step = niceStep(Math.max((px * 3.4) / vp.scaleX, span / 24));
    const axisOpts = { px, xTitle: 'Re', yTitle: 'Im', formatY: imTick, xCount: ((vp.x[1] - vp.x[0]) / step) * (1 + 1e-9), yCount: (span / step) * (1 + 1e-9) };
    drawAxes(ctx, vp, pal, { ...axisOpts, layer: 'under' });

    const placer = createPlacer(ctx, plot, px);
    // Keep labels off the axis titles.
    const axisY = vp.toY(0);
    const axisX = vp.toX(0);
    placer.block(plot.x + plot.w - px * 2.4, axisY - px * 1.9, px * 2.4, px * 1.6);
    placer.block(axisX + px * 0.4, plot.y, px * 2.4, px * 1.6);

    ctx.save();
    ctx.beginPath();
    ctx.rect(plot.x, plot.y, plot.w, plot.h);
    ctx.clip();
    let out;
    if (setup === 'operations') out = drawOperations(ctx, vp, px, params, placer);
    else if (setup === 'loci') out = drawLoci(ctx, vp, px, params, placer, plot);
    else out = drawPolynomial(ctx, vp, px, params, placer);
    ctx.restore();

    drawAxes(ctx, vp, pal, { ...axisOpts, layer: 'over' });
    if (info) drawInfo(ctx, info, out.lines, px);
    else drawStrip(ctx, strip, out.strip, px);
  }

  function niceStep(raw) {
    const mag = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw * (1 - 1e-9)) ?? 10 * mag;
  }

  return {
    canvas: surface.canvas,
    draw,
    /** The draggable point under (x, y) in CSS px, or null. */
    hit(x, y) {
      const reach = Math.max(22, frame.px * 1.3);
      let best = null;
      let bestD = reach;
      for (const h of frame.handles) {
        const d = Math.hypot(h.X - x, h.Y - y);
        if (d <= bestD) {
          bestD = d;
          best = h.id;
        }
      }
      return best;
    },
    toWorld: (x, y) => complex(frame.vp.fromX(x), frame.vp.fromY(y)),
    pxPerUnit: () => frame.vp.scaleX,
    resize: () => surface.resize(),
    setTheme() {
      pal = readPalette(stage);
    },
    destroy() {
      surface.destroy();
      maskCanvas = null;
      regionCanvas = null;
    },
  };
}

