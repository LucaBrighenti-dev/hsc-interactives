// Circuit engine view: drawing only. Reads the parts, the solution and the editor's UI state; never
// changes the circuit. Symbols:
//   physics  the common school style: zigzag resistor, switch with open terminal circles
//   as1102   IEC 60617 shapes, which AS 1102 adopts: rectangular resistor; switch without terminal circles,
//            drawn as a make contact when open and with the blade resting on a contact bar when closed
//            (not checked against the AS 1102 text itself; see the PR)
// Both sets share the cell (long thin + plate, short thick − plate), the lamp (circle with a cross) and the
// meters (circle with A or V). Every cell and meter carries + and − glyphs, and current direction has
// arrowheads as well as moving dots, so nothing relies on colour alone (guide §6.6).
import { createSurface, readPalette, stageFontPx, label, font } from '../../engine-kit.js';
import { GRID, DOT_SPACING, CURRENT_EPS, dotPhase, dotSpeed } from './model.js';
import { formatNumber, formatPlain } from '../../format.js';

const ohms = (v) => (v >= 1000 ? `${formatPlain(v / 1000)} kΩ` : `${formatPlain(v)} Ω`);
const amps = (v) => (v === null || v === undefined ? '—' : `${formatNumber(v)} A`);
const volts = (v) => (v === null || v === undefined ? '—' : `${formatNumber(v)} V`);
const watts = (v) => (v === null || v === undefined ? '—' : `${formatNumber(v)} W`);

/** Half-length of a part's symbol body along the part, in cells. */
function bodyHalf(p) {
  switch (p.type) {
    case 'R':
      return 0.5;
    case 'L':
    case 'A':
    case 'V':
      return 0.3;
    case 'S':
      return 0.42;
    case 'B':
      return p.r > 0 ? 0.62 : 0.1;
    default:
      return 0;
  }
}

export function createView(stage) {
  const surface = createSurface(stage);
  const { canvas, ctx } = surface;
  canvas.classList.add('cx-canvas');
  let pal = readPalette(stage);
  let insets = { left: 0, bottom: 0 };
  let geo = null;

  function layout() {
    const W = surface.width;
    const H = surface.height;
    const px = stageFontPx(W);
    const pad = Math.round(px * 0.6);
    // Narrow stages (phones) keep one line for messages and the legend together, so the grid stays large.
    const narrow = W < 600;
    const statusH = Math.round(px * (narrow ? 1.6 : 2.9));
    const legendH = narrow ? 0 : Math.round(px * 1.8);
    const left = insets.left + pad;
    const top = statusH;
    const bottom = H - insets.bottom - legendH;
    const availW = Math.max(40, W - pad - left);
    const availH = Math.max(40, bottom - top);
    const cell = Math.max(6, Math.min(availW / (GRID.cols + 1.4), availH / (GRID.rows + 1)));
    geo = {
      W,
      H,
      px,
      pad,
      cell,
      left,
      narrow,
      statusH,
      legendY: H - insets.bottom - legendH / 2,
      ox: left + (availW - cell * GRID.cols) / 2,
      oy: top + (availH - cell * GRID.rows) / 2,
    };
    return geo;
  }

  const toPx = (gx, gy) => [geo.ox + gx * geo.cell, geo.oy + gy * geo.cell];
  const toGrid = (x, y) => [(x - geo.ox) / geo.cell, (y - geo.oy) / geo.cell];

  /** Wrap text into lines no wider than maxW (current ctx font). */
  function wrap(text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }

  // ------------------------------------------------------------------------------------------ symbols

  function resistorShape(x0, half, h, sym, lw) {
    if (sym === 'as1102') {
      ctx.fillStyle = pal.bg;
      ctx.fillRect(x0 - half, -h, 2 * half, 2 * h);
      ctx.strokeRect(x0 - half, -h, 2 * half, 2 * h);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x0 - half, 0);
    const n = 6;
    for (let k = 0; k < n; k++) ctx.lineTo(x0 - half + ((k + 0.5) * 2 * half) / n, k % 2 ? h : -h);
    ctx.lineTo(x0 + half, 0);
    ctx.lineJoin = 'miter';
    ctx.lineWidth = lw;
    ctx.stroke();
  }

  /** Body of a part in its local frame (origin at the middle, x along the part from end 1 to end 2). */
  function drawBody(p, c, sym, colour, lw, extra) {
    ctx.strokeStyle = colour;
    ctx.fillStyle = colour;
    ctx.lineWidth = lw;
    switch (p.type) {
      case 'R':
        resistorShape(0, 0.5 * c, sym === 'as1102' ? 0.17 * c : 0.16 * c, sym, lw);
        break;
      case 'L': {
        const r = 0.3 * c;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = pal.bg;
        ctx.fill();
        if (extra.glow > 0) {
          // Flat fill whose strength follows the lamp's power (not a glow: one matte colour).
          ctx.globalAlpha = Math.min(1, extra.glow);
          ctx.fillStyle = pal.series[5];
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.stroke();
        const d = r * Math.SQRT1_2;
        ctx.beginPath();
        ctx.moveTo(-d, -d);
        ctx.lineTo(d, d);
        ctx.moveTo(-d, d);
        ctx.lineTo(d, -d);
        ctx.stroke();
        break;
      }
      case 'A':
      case 'V': {
        ctx.beginPath();
        ctx.arc(0, 0, 0.3 * c, 0, Math.PI * 2);
        ctx.fillStyle = pal.bg;
        ctx.fill();
        ctx.stroke();
        break;
      }
      case 'B': {
        const plus = p.r > 0 ? -0.38 * c : -0.1 * c;
        const minus = plus + 0.2 * c;
        ctx.beginPath();
        ctx.moveTo(plus, -0.3 * c);
        ctx.lineTo(plus, 0.3 * c);
        ctx.stroke();
        const thick = Math.max(lw * 2, 0.07 * c);
        ctx.fillRect(minus - thick / 2, -0.15 * c, thick, 0.3 * c);
        if (p.r > 0) {
          // Internal resistance: a small resistor beside the cell inside a dashed box.
          ctx.beginPath();
          ctx.moveTo(minus, 0);
          ctx.lineTo(0.02 * c, 0);
          ctx.stroke();
          resistorShape(0.28 * c, 0.26 * c, 0.1 * c, sym, lw * 0.85);
          ctx.save();
          ctx.setLineDash([Math.max(3, 0.08 * c), Math.max(3, 0.07 * c)]);
          ctx.lineWidth = Math.max(1, lw * 0.5);
          ctx.strokeStyle = extra.muted;
          ctx.strokeRect(-0.6 * c, -0.42 * c, 1.22 * c, 0.84 * c);
          ctx.restore();
        }
        break;
      }
      case 'S': {
        const a = 0.4 * c;
        const open = !p.closed;
        const tip = open ? [-a + 0.8 * c * Math.cos(Math.PI / 6), -0.8 * c * Math.sin(Math.PI / 6)] : [a, 0];
        if (sym === 'physics') {
          const tr = Math.max(3, 0.07 * c);
          ctx.beginPath();
          ctx.moveTo(-a, 0);
          ctx.lineTo(tip[0], tip[1]);
          ctx.stroke();
          for (const x of [-a, a]) {
            ctx.beginPath();
            ctx.arc(x, 0, tr, 0, Math.PI * 2);
            ctx.fillStyle = pal.bg;
            ctx.fill();
            ctx.stroke();
          }
        } else {
          // AS 1102 / IEC 60617 contacts have no terminal circles. Open: the make-contact shape (blade
          // lifted). Closed: the blade rests on a short bar at the fixed contact (the break-contact shape),
          // so a closed switch never looks like a plain wire.
          const e = 0.42 * c; // meets the leads exactly
          ctx.beginPath();
          if (open) {
            ctx.moveTo(-e, 0);
            ctx.lineTo(-e + 0.8 * c * Math.cos(Math.PI / 6), -0.8 * c * Math.sin(Math.PI / 6));
          } else {
            const bar = 0.28 * c;
            ctx.moveTo(-e, 0);
            ctx.lineTo(e + 0.05 * c, -bar * 0.8);
            ctx.moveTo(e, 0);
            ctx.lineTo(e, -bar);
          }
          ctx.stroke();
        }
        break;
      }
      default:
        break;
    }
  }

  /** A part: leads plus symbol. Returns screen geometry used for labels and dots. */
  function partGeometry(p) {
    const [x1, y1] = toPx(p.x1, p.y1);
    const [x2, y2] = toPx(p.x2, p.y2);
    const len = Math.hypot(x2 - x1, y2 - y1);
    const c = geo.cell;
    const half = bodyHalf(p) * c;
    const room = len / 2 - 0.12 * c;
    const squeeze = half > room && half > 0 ? Math.max(0.3, room / half) : 1;
    const ux = (x2 - x1) / len;
    const uy = (y2 - y1) / len;
    const horizontal = Math.abs(ux) > 0.5;
    return { x1, y1, x2, y2, len, ux, uy, mx: (x1 + x2) / 2, my: (y1 + y2) / 2, half: half * squeeze, squeeze, horizontal, angle: Math.atan2(y2 - y1, x2 - x1) };
  }

  function drawPart(p, g, sym, colour, lw, extra = {}) {
    ctx.save();
    ctx.translate(g.mx, g.my);
    ctx.rotate(g.angle);
    ctx.strokeStyle = colour;
    ctx.lineWidth = lw;
    ctx.lineCap = 'butt';
    if (extra.dashed) ctx.setLineDash([Math.max(6, geo.cell * 0.14), Math.max(4, geo.cell * 0.1)]);
    // Leads (the whole line for a wire).
    ctx.beginPath();
    if (p.type === 'W' || g.half === 0) {
      ctx.moveTo(-g.len / 2, 0);
      ctx.lineTo(g.len / 2, 0);
    } else {
      // A cell's leads stop at its plates; other leads stop at the body.
      const leftEnd = p.type === 'B' ? (p.r > 0 ? -0.38 : -0.1) * geo.cell * g.squeeze : -g.half;
      const rightEnd = p.type === 'B' ? (p.r > 0 ? 0.54 : 0.1) * geo.cell * g.squeeze : g.half;
      ctx.moveTo(-g.len / 2, 0);
      ctx.lineTo(leftEnd, 0);
      ctx.moveTo(rightEnd, 0);
      ctx.lineTo(g.len / 2, 0);
    }
    ctx.stroke();
    if (p.type !== 'W') {
      ctx.setLineDash([]);
      if (g.squeeze !== 1) ctx.scale(g.squeeze, g.squeeze);
      drawBody(p, geo.cell, sym, colour, lw / g.squeeze, { muted: pal.muted, ...extra });
    }
    ctx.restore();
  }

  /** Point at distance `s` px along the part from its middle, pushed `n` px to the side (screen space). */
  function along(g, s, n, side) {
    return [g.mx + g.ux * s + side[0] * n, g.my + g.uy * s + side[1] * n];
  }
  /** + and − glyphs go below horizontal parts and left of vertical ones; labels go on the other side. */
  const glyphSide = (g) => (g.horizontal ? [0, 1] : [-1, 0]);

  function glyph(text, x, y, colour, px) {
    label(ctx, text, x, y, { colour, px, kind: 'strong', align: 'center', baseline: 'middle' });
  }

  // ------------------------------------------------------------------------------------------ draw

  /**
   * @param {{ parts: object[], sol: object, params: object, t: number, ui: object }} s
   *   ui: { selected, hoverNode, hoverPoint, cursor, showCursor, wireStart, preview: { part, problem }, flash, problems }
   */
  function draw({ parts, sol, params, t, ui }) {
    if (!geo) layout();
    const { px, cell } = geo;
    const sym = params.symbols === 'as1102' ? 'as1102' : 'physics';
    surface.begin(pal.bg);
    const lw = Math.max(2, Math.min(3.5, cell / 22));
    const ink = pal.ink;
    const accent = pal.accent;
    const blue = pal.series[1];
    const small = px; // secondary text (readings, glyphs, legend): still ≥ 18 px at 1920 × 1080 (guide §2.8)

    // Grid points.
    ctx.fillStyle = pal.grid;
    const dot = Math.max(1.5, cell / 32);
    for (let y = 0; y <= GRID.rows; y++) {
      for (let x = 0; x <= GRID.cols; x++) {
        const [X, Y] = toPx(x, y);
        ctx.fillRect(X - dot, Y - dot, dot * 2, dot * 2);
      }
    }

    const geos = parts.map(partGeometry);
    const errorParts = new Set(sol.errors.flatMap((e) => e.parts ?? []));

    // Hovered node: its wires in blue, under everything else.
    if (ui.hoverNode >= 0) {
      ctx.save();
      ctx.strokeStyle = blue;
      ctx.lineWidth = lw + 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      sol.segments.forEach((s) => {
        if (parts[s.part].type !== 'W' || sol.nodeAt.get(`${s.a[0]},${s.a[1]}`) !== ui.hoverNode) return;
        const [ax, ay] = toPx(...s.a);
        const [bx, by] = toPx(...s.b);
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
      });
      ctx.stroke();
      ctx.fillStyle = blue;
      for (const [x, y] of sol.nodes[ui.hoverNode]?.points ?? []) {
        const [X, Y] = toPx(x, y);
        ctx.fillRect(X - lw * 1.8, Y - lw * 1.8, lw * 3.6, lw * 3.6);
      }
      ctx.restore();
    }

    // Parts.
    const maxLamp = Math.max(1e-9, params.lampRating ?? 10);
    parts.forEach((p, i) => {
      const r = sol.parts[i];
      const selected = i === ui.selected;
      const colour = selected ? accent : ink;
      const glow = p.type === 'L' && r.power > 0 ? r.power / maxLamp : 0;
      drawPart(p, geos[i], sym, colour, selected ? lw + 1 : lw, { glow });
    });
    // Error highlight: dashed accent over the parts involved.
    for (const i of errorParts) if (parts[i]) drawPart(parts[i], geos[i], sym, accent, lw + 1, { dashed: true });

    // Junction dots.
    ctx.fillStyle = ink;
    const jr = Math.max(3, cell * 0.075);
    for (const [x, y] of sol.junctions) {
      const [X, Y] = toPx(x, y);
      ctx.beginPath();
      ctx.arc(X, Y, jr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Current: dots (speed ∝ current) and an arrowhead on each branch, conventional direction.
    let capped = false;
    if (sol.ok) {
      const rd = Math.max(2.5, cell * 0.07);
      const ah = Math.max(10, cell * 0.3);
      ctx.fillStyle = accent;
      sol.segments.forEach((s) => {
        const I = s.current;
        if (!(Math.abs(I) >= CURRENT_EPS)) return;
        const p = parts[s.part];
        const [ax, ay] = toPx(...s.a);
        const [bx, by] = toPx(...s.b);
        const L = Math.hypot(bx - ax, by - ay);
        const ux = (bx - ax) / L;
        const uy = (by - ay) / L;
        const g = geos[s.part];
        const bodyLo = p.type === 'W' ? Infinity : L / 2 - g.half - rd;
        const bodyHi = p.type === 'W' ? -Infinity : L / 2 + g.half + rd;
        // Arrowhead: middle of a wire segment, or the middle of the lead where current enters a part.
        let at = null;
        if (p.type === 'W') {
          if (L >= cell * 0.99) at = L / 2;
        } else {
          const lead = L / 2 - g.half;
          if (lead >= ah * 1.2) at = I > 0 ? lead / 2 : L - lead / 2;
        }
        if (params.showDots) {
          if (dotSpeed(I, params.dotSpeed).capped) capped = true;
          const phase = dotPhase(I, t, params.dotSpeed) * cell;
          const step = DOT_SPACING * cell;
          for (let d = phase; d <= L + 1e-6; d += step) {
            if (d > bodyLo && d < bodyHi) continue;
            if (at !== null && Math.abs(d - at) < ah * 0.75) continue; // keep the arrowhead clear
            ctx.beginPath();
            ctx.arc(ax + ux * d, ay + uy * d, rd, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (at !== null) {
          const sx = Math.sign(I);
          const cx = ax + ux * at;
          const cy = ay + uy * at;
          const dx = ux * sx;
          const dy = uy * sx;
          ctx.beginPath();
          ctx.moveTo(cx + dx * ah * 0.6, cy + dy * ah * 0.6);
          ctx.lineTo(cx - dx * ah * 0.4 - dy * ah * 0.45, cy - dy * ah * 0.4 + dx * ah * 0.45);
          ctx.lineTo(cx - dx * ah * 0.4 + dy * ah * 0.45, cy - dy * ah * 0.4 - dx * ah * 0.45);
          ctx.closePath();
          ctx.fill();
        }
      });
    }

    // Symbol boxes, so a label can move rather than cover another part.
    const bodies = parts.map((p, i) => {
      if (p.type === 'W') return null;
      const g = geos[i];
      const across = 0.36 * cell * g.squeeze;
      return g.horizontal ? [g.mx - g.half, g.my - across, g.mx + g.half, g.my + across] : [g.mx - across, g.my - g.half, g.mx + across, g.my + g.half];
    });
    const covers = ([x0, y0, x1, y1], self) => bodies.some((b, j) => b && j !== self && b[0] < x1 && b[2] > x0 && b[1] < y1 && b[3] > y0);

    // Upright overlays: meter letters, + and − glyphs, labels.
    parts.forEach((p, i) => {
      if (p.type === 'W') return;
      const g = geos[i];
      const r = sol.parts[i];
      const name = sol.names[i];
      const colour = i === ui.selected ? pal.accentText : ink;
      const k = g.squeeze;
      if (p.type === 'A' || p.type === 'V') {
        const lpx = Math.round(Math.min(px * 1.3, Math.max(small, 0.36 * cell * k)));
        label(ctx, p.type, g.mx, g.my + lpx * 0.05, { colour, px: lpx, kind: 'strong', align: 'center', baseline: 'middle' });
      }
      const gs = glyphSide(g);
      if (p.type === 'A' || p.type === 'V') {
        const off = 0.3 * cell * k + small * 0.55;
        glyph('+', ...along(g, -off, small * 0.5, gs), colour, small);
        glyph('−', ...along(g, off, small * 0.5, gs), colour, small);
      } else if (p.type === 'B') {
        // Clear of the plates, and of the dashed box when the cell has internal resistance.
        const plus = (p.r > 0 ? -0.38 : -0.1) * cell * k;
        const n = (p.r > 0 ? 0.42 : 0.3) * cell * k + small * 0.6;
        glyph('+', ...along(g, plus - small * 0.25, n, gs), colour, small);
        glyph('−', ...along(g, plus + 0.2 * cell * k + small * 0.25, n, gs), colour, small);
      }

      // Name and setting; a lamp's power (the second cue for its brightness); optional readings.
      // On a small grid (phones) the optional readings are left off so labels don't pile up.
      const roomy = cell >= 34;
      const lines = [];
      if (p.type === 'R') lines.push(`${name}  ${ohms(p.value)}`);
      else if (p.type === 'L') lines.push(`${name}  ${ohms(p.value)}`, watts(r.power));
      else if (p.type === 'B') lines.push(`${name}  ${formatPlain(p.value)} V`, ...(p.r > 0 ? [`r = ${ohms(p.r)}`] : []));
      else if (p.type === 'S') lines.push(`${name}  ${p.closed ? 'closed' : 'open'}`);
      else if (p.type === 'A') lines.push(`${name}  ${amps(r.reading)}`);
      else if (p.type === 'V') lines.push(`${name}  ${volts(r.reading)}`);
      if (roomy && params.showReadings && (p.type === 'R' || p.type === 'B')) lines.push(`${amps(r.current)}, ${volts(r.voltage)}`);
      if (roomy && params.showReadings && p.type === 'L') lines[1] = `${amps(r.current)}, ${watts(r.power)}`;
      const bodyH = (p.type === 'S' ? 0.42 : p.type === 'B' && p.r > 0 ? 0.44 : p.type === 'R' ? 0.2 : 0.32) * cell * k;
      const lh = Math.round(px * 1.2);
      const style = (j) => ({ colour: j === 0 ? colour : pal.muted, px: j === 0 ? px : small, kind: j === 0 ? 'label' : 'mono', box: pal.bg, padding: 2 });
      const widest = Math.max(
        ...lines.map((text, j) => {
          ctx.font = font(j === 0 ? 'label' : 'mono', j === 0 ? px : small);
          return ctx.measureText(text).width;
        }),
      );
      const tall = lines.length * lh;
      if (g.horizontal) {
        // Above the part; below it if that would hit the message line or cover another part's symbol.
        const above = g.my - bodyH - 6 - (lines.length - 1) * lh;
        const below = g.my + bodyH + 6 + px;
        const box = (y) => [g.mx - widest / 2, y - px, g.mx + widest / 2, y - px + tall];
        const baseY = above - px < geo.statusH || (covers(box(above), i) && !covers(box(below), i)) ? below : above;
        lines.forEach((text, j) => label(ctx, text, g.mx, baseY + j * lh, { ...style(j), align: 'center', baseline: 'alphabetic' }));
      } else {
        // Right of the part; left of it if that would run off the stage or cover another part's symbol.
        const y0 = g.my - ((lines.length - 1) * lh) / 2;
        const rx = g.mx + bodyH + 8;
        const lx = g.mx - bodyH - 8;
        const rightBox = [rx, y0 - lh / 2, rx + widest, y0 - lh / 2 + tall];
        const leftBox = [lx - widest, y0 - lh / 2, lx, y0 - lh / 2 + tall];
        const right = rx + widest <= geo.W - 4 && !(covers(rightBox, i) && !covers(leftBox, i));
        lines.forEach((text, j) => label(ctx, text, right ? rx : lx, y0 + j * lh, { ...style(j), align: right ? 'left' : 'right', baseline: 'middle' }));
      }
    });

    // Node potentials (all, or the hovered one).
    const refName = (node) => sol.names[node.referencePart] ?? 'the cell';
    if (params.showVoltages && sol.ok) {
      sol.nodes.forEach((node) => {
        if (node.voltage === null || !node.points.length) return;
        const pt = node.points.find(([x, y]) => sol.junctions.some(([jx, jy]) => jx === x && jy === y)) ?? node.points[0];
        const [X, Y] = toPx(...pt);
        ctx.fillStyle = blue;
        ctx.fillRect(X - 4, Y - 4, 8, 8);
        label(ctx, node.reference ? '0 V' : volts(node.voltage), X + 8, Y + 8, { colour: blue, px: small, kind: 'mono', align: 'left', baseline: 'top', box: pal.bg, padding: 2 });
      });
    }
    // The hovered (or keyboard cursor) node: its potential beside the point, the explanation in the message line.
    const tipPoint = ui.showCursor && ui.cursor ? [ui.cursor.x, ui.cursor.y] : ui.hoverPoint;
    let hoverText = '';
    if (ui.hoverNode >= 0 && tipPoint) {
      const node = sol.nodes[ui.hoverNode];
      const [X, Y] = toPx(...tipPoint);
      let tip;
      if (!sol.ok) {
        tip = '—';
        hoverText = 'Potentials are not shown while the circuit has an error.';
      } else if (!node || node.voltage === null) {
        tip = 'no potential';
        hoverText = 'This point is not connected to a cell, so it has no defined potential.';
      } else {
        tip = node.reference ? '0 V' : volts(node.voltage);
        hoverText = `Potential at this point: ${tip}, measured from 0 V at the − terminal of ${refName(node)}.`;
      }
      ctx.font = font('mono', px);
      const w = ctx.measureText(tip).width;
      const tx = Math.min(Math.max(X + 12, 4), geo.W - w - 10);
      const ty = Y - 12 - px < geo.statusH ? Y + 12 + px : Y - 12;
      label(ctx, tip, tx, ty, { colour: blue, px, kind: 'mono', align: 'left', baseline: 'alphabetic', box: pal.bg, padding: 4 });
    }

    // Selected part: square handles on its ends.
    if (ui.selected >= 0 && parts[ui.selected]) {
      const p = parts[ui.selected];
      const hs = Math.max(5, cell * 0.09);
      ctx.fillStyle = accent;
      for (const [x, y] of [[p.x1, p.y1], [p.x2, p.y2]]) {
        const [X, Y] = toPx(x, y);
        ctx.fillRect(X - hs, Y - hs, hs * 2, hs * 2);
      }
    }

    // Drag or placement preview.
    if (ui.preview?.part) {
      const p = ui.preview.part;
      const g = partGeometry(p);
      drawPart(p, g, sym, ui.preview.problem ? pal.muted : accent, lw, { dashed: true });
      if (ui.preview.problem) label(ctx, ui.preview.problem, g.mx, g.my + 0.55 * cell + px, { colour: pal.accentText, px, align: 'center', box: pal.bg });
    }
    // Keyboard cursor and a wire being drawn from the keyboard.
    if (ui.wireStart) {
      const [X, Y] = toPx(ui.wireStart.x, ui.wireStart.y);
      ctx.fillStyle = accent;
      ctx.fillRect(X - 6, Y - 6, 12, 12);
    }
    if (ui.showCursor && ui.cursor) {
      const [X, Y] = toPx(ui.cursor.x, ui.cursor.y);
      const h = Math.max(8, cell * 0.2);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(X - h, Y - h, h * 2, h * 2);
    }

    // Message line: an error, then a message from the last edit, the hovered node, then notes.
    const textX = geo.left;
    const maxW = geo.W - textX - geo.pad;
    const err = sol.errors[0];
    let lines = [];
    let title = '';
    if (err) {
      title = `${err.title}.`;
      ctx.font = font('label', px);
      lines = wrap(`${title} ${err.message}`, maxW);
    } else {
      const msg = ui.flash || hoverText || ui.problems?.[0] || sol.notes[0]?.message || '';
      ctx.font = font('label', px);
      lines = msg ? wrap(msg, maxW) : [];
    }
    // On narrow stages the second line sits over the grid's top margin, on a flat box so it stays legible.
    const firstY = geo.narrow ? Math.round(geo.statusH / 2 + px * 0.35) : geo.pad + px;
    lines.slice(0, 2).forEach((text, j) => {
      const y = firstY + j * Math.round(px * 1.25);
      const shown = j === 1 && lines.length > 2 ? `${text.slice(0, Math.max(0, text.length - 2))}…` : text;
      if (j === 0 && title && shown.startsWith(title)) {
        label(ctx, title, textX, y, { colour: pal.accentText, px, kind: 'strong', box: pal.bg, padding: 2 });
        ctx.font = font('strong', px);
        const tw = ctx.measureText(`${title} `).width;
        label(ctx, shown.slice(title.length + 1), textX + tw, y, { colour: ink, px, box: pal.bg, padding: 2 });
      } else label(ctx, shown, textX, y, { colour: err ? ink : pal.muted, px, box: pal.bg, padding: 2 });
    });

    // Legend: conventional current, stated on the stage (on narrow stages, in the message line when free).
    if (geo.narrow && lines.length) return;
    const legendY = geo.narrow ? Math.round(geo.statusH / 2) : geo.legendY;
    ctx.font = font('label', small);
    const long = `Dots and arrows show conventional current: out of +, round the circuit to −. Dot speed ∝ current${capped ? ' (fastest dots capped)' : ''}.`;
    const short = `Conventional current, + to −. Dot speed ∝ I${capped ? ' (capped)' : ''}.`;
    const legend = ctx.measureText(long).width + small * 1.6 <= maxW ? long : short;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(textX + small * 0.35, legendY, Math.max(3, small * 0.28), 0, Math.PI * 2);
    ctx.fill();
    label(ctx, legend, textX + small * 1.1, legendY, { colour: pal.muted, px: small, baseline: 'middle' });
  }

  return {
    draw,
    layout,
    toGrid,
    toPx,
    get geometry() {
      return geo;
    },
    setInsets(next) {
      insets = { ...insets, ...next };
      layout();
    },
    resize() {
      surface.resize();
      layout();
    },
    setTheme() {
      pal = readPalette(stage);
    },
    canvas,
    destroy: () => surface.destroy(),
  };
}
