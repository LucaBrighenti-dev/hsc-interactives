// Statics engine view: drawing only. Reads the computed model; never changes physics.
// One draw function per setup. Colour always comes with a second cue (§6.6):
//   tension     blue, solid line, "T"        compression  orange, dashed line, "C"
//   zero force  grey, thin line, "0"         reactions    green arrows, labelled
//   + / − regions of the SFD and BMD carry "+" and "−" glyphs.
import { createSurface, readPalette, stageFontPx, font, label, arrow, niceTicks, viewport, axisMargins, drawAxes } from '../../engine-kit.js';
import { formatNumber, formatPlain, MINUS } from '../../format.js';
import { jointName, memberName, forceState, jointIndex, SUPPORT_REACTIONS } from './model.js';

const fmt = (v, s = 3) => formatNumber(v, { sigfigs: s });
const fmtSigned = (v, s = 3) => (v > 0 ? `+${fmt(v, s)}` : fmt(v, s));
const deg = (v) => `${fmt(v)}°`;

export function createView(stage, setup) {
  const surface = createSurface(stage);
  const { ctx } = surface;
  let pal = readPalette(stage);
  let layout = null; // truss picking geometry from the last draw
  // Truss viewport held still while editing, so the structure doesn't jump under the pointer.
  // While dragging it is always used; after an edit it is kept while every joint still fits.
  let frozen = null;
  let dragging = false;

  /* ------------------------------------------------------------------ shared helpers */

  /** Text with `_{sub}` subscripts, kept inside the stage. Returns the drawn width. */
  function rich(text, x, y, { colour = pal.ink, px = 18, kind = 'label', align = 'left', baseline = 'alphabetic', box = null, frame = null } = {}) {
    const parts = [];
    const re = /_\{([^}]*)\}/g;
    let last = 0;
    let m;
    while ((m = re.exec(text))) {
      if (m.index > last) parts.push({ t: text.slice(last, m.index), sub: false });
      parts.push({ t: m[1], sub: true });
      last = re.lastIndex;
    }
    if (last < text.length) parts.push({ t: text.slice(last), sub: false });
    const subPx = Math.round(px * 0.8);
    ctx.save();
    ctx.textBaseline = baseline;
    ctx.textAlign = 'left';
    const widths = parts.map((p) => {
      ctx.font = font(kind, p.sub ? subPx : px);
      return ctx.measureText(p.t).width;
    });
    const w = widths.reduce((a, b) => a + b, 0);
    let x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    x0 = Math.min(Math.max(x0, 8), Math.max(8, surface.width - w - 8));
    if (box || frame) {
      const top = baseline === 'middle' ? y - px * 0.6 : baseline === 'top' ? y - 2 : y - px * 0.85;
      const h = px * 1.2;
      if (box) {
        ctx.fillStyle = box;
        ctx.fillRect(x0 - 5, top - 3, w + 10, h + 6);
      }
      if (frame) {
        ctx.strokeStyle = frame;
        ctx.lineWidth = 2;
        ctx.strokeRect(x0 - 5, top - 3, w + 10, h + 6);
      }
    }
    ctx.fillStyle = colour;
    parts.forEach((p, i) => {
      ctx.font = font(kind, p.sub ? subPx : px);
      ctx.fillText(p.t, x0, p.sub ? y + px * 0.22 : y);
      x0 += widths[i];
    });
    ctx.restore();
    return w;
  }

  function textWidth(text, px, kind = 'label') {
    ctx.save();
    ctx.font = font(kind, px);
    const w = ctx.measureText(text.replace(/_\{([^}]*)\}/g, '$1')).width;
    ctx.restore();
    return w;
  }

  function wrap(text, maxW, px, kind = 'label') {
    ctx.save();
    ctx.font = font(kind, px);
    const lines = [];
    let line = '';
    for (const word of text.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    ctx.restore();
    return lines;
  }

  function messageHeight(body, w, px) {
    return px * 1.2 + px * 1.9 + wrap(body, w - px * 2, px).length * px * 1.35 + px * 0.6;
  }

  /** A calm framed message (no shadow). Returns its height. */
  function messageBox(title, body, x, y, w, px, { anchor = 'top' } = {}) {
    const lines = wrap(body, w - px * 2, px);
    const h = messageHeight(body, w, px);
    const top = anchor === 'bottom' ? y - h : y;
    ctx.save();
    ctx.fillStyle = pal.panel;
    ctx.fillRect(x, top, w, h);
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, top + 1, w - 2, h - 2);
    ctx.restore();
    label(ctx, title, x + px, top + px * 0.9 + px, { colour: pal.accentText, px: px + 2, kind: 'strong' });
    lines.forEach((ln, i) => label(ctx, ln, x + px, top + px * 3.1 + i * px * 1.35 + px * 0.1, { colour: pal.ink, px }));
    return h;
  }

  function line(x0, y0, x1, y1, { colour = pal.ink, width = 2, dash = null } = {}) {
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

  /** Hatched ground (or wall) along the segment, hatching on the side of the normal (nx, ny). */
  function ground(x0, y0, x1, y1, nx, ny, px) {
    line(x0, y0, x1, y1, { colour: pal.ink, width: 2 });
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(3, Math.floor(len / (px * 0.55)));
    const tx = (x1 - x0) / len;
    const ty = (y1 - y0) / len;
    const hl = px * 0.55;
    ctx.save();
    ctx.strokeStyle = pal.muted;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const sx = x0 + (x1 - x0) * (i / n);
      const sy = y0 + (y1 - y0) * (i / n);
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + nx * hl - tx * hl * 0.6, sy + ny * hl - ty * hl * 0.6);
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Support glyph with its apex at (X, Y). `n` is the unit vector (screen) pointing into the ground or wall.
   * type: 'pin' | 'roller' | 'side' (side rollers are rollers against a wall). Returns the far point (beyond the ground).
   */
  function supportGlyph(X, Y, type, [nx, ny], px, apexGap = 0) {
    const tx = -ny;
    const ty = nx;
    const gh = px * 1.45;
    const gw = px * 0.95;
    const ax = X + nx * apexGap;
    const ay = Y + ny * apexGap;
    const bx = X + nx * gh;
    const by = Y + ny * gh;
    ctx.save();
    ctx.fillStyle = pal.panel;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx + tx * gw, by + ty * gw);
    ctx.lineTo(bx - tx * gw, by - ty * gw);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    let gx = bx;
    let gy = by;
    if (type === 'roller' || type === 'side') {
      const cr = px * 0.3;
      for (const s of [-0.55, 0.55]) {
        ctx.beginPath();
        ctx.arc(bx + tx * gw * s + nx * cr, by + ty * gw * s + ny * cr, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      gx = bx + nx * cr * 2;
      gy = by + ny * cr * 2;
    }
    ctx.restore();
    const half = gw * 1.45;
    ground(gx - tx * half, gy - ty * half, gx + tx * half, gy + ty * half, nx, ny, px);
    return { gx, gy, gw, depth: Math.hypot(gx - X, gy - Y) + px * 0.55 };
  }

  /** A turning arrow (moment sense) centred at (cx, cy): 'cw' or 'acw' as seen on screen. */
  function turnArrow(cx, cy, r, sense, colour, width = 2.5) {
    const a0 = (-160 * Math.PI) / 180;
    const a1 = (70 * Math.PI) / 180;
    const cw = sense === 'cw';
    const start = cw ? a0 : Math.PI - a0;
    const end = cw ? a1 : Math.PI - a1;
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.fillStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end, !cw);
    ctx.stroke();
    const ex = cx + r * Math.cos(end);
    const ey = cy + r * Math.sin(end);
    // Tangent in the direction of travel.
    const tx = cw ? -Math.sin(end) : Math.sin(end);
    const ty = cw ? Math.cos(end) : -Math.cos(end);
    const h = Math.max(7, r * 0.55);
    ctx.beginPath();
    ctx.moveTo(ex + tx * h * 0.5, ey + ty * h * 0.5);
    ctx.lineTo(ex - tx * h * 0.5 - ty * h * 0.45, ey - ty * h * 0.5 + tx * h * 0.45);
    ctx.lineTo(ex - tx * h * 0.5 + ty * h * 0.45, ey - ty * h * 0.5 - tx * h * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function title(text, px, pad) {
    label(ctx, text, pad, pad + px + 2, { colour: pal.ink, px: px + 4, kind: 'strong' });
  }

  /* ------------------------------------------------------------------ truss */

  function drawTruss(model, params, ui) {
    const W = surface.width;
    const H = surface.height;
    const px = stageFontPx(W);
    const compact = W < 760;
    const pad = Math.round(px * 1.1);
    const titleText = compact ? model.title.split(' · ')[0] : model.title;
    const titlePx = compact ? px + 1 : px + 4;
    label(ctx, titleText, pad, pad + px + 2, { colour: pal.ink, px: titlePx, kind: 'strong' });
    let headerH = pad + px * 3.6;
    const footY = H - pad * 0.7;

    if (model.error) {
      layout = null;
      messageBox('The structure text has a problem', model.error, pad, headerH, Math.min(W - 2 * pad, 900), px);
      return;
    }
    const { truss, result: r } = model;
    const d = r.determinacy;
    const solved = r.status === 'solved';
    const show = solved && params.showForces;
    // Footer text: an edit note or warning first; the tool hint only on wider stages.
    let foot = ui.note || (compact ? '' : ui.hint);
    let footAlert = Boolean(ui.note);
    if (model.missingJoint && params.load > 0) {
      foot = compact ? `No joint ${params.loadAt}: P not applied.` : `There is no joint ${params.loadAt} in this truss, so P is not applied. ${ui.hint}`;
      footAlert = true;
    } else if (!show && solved && !ui.note) {
      foot = compact ? 'Forces hidden: predict T or C.' : `Forces hidden: predict T or C for each member, then turn on Show forces. ${ui.hint}`;
    } else if (!solved && compact && !ui.note) {
      // Small stages: one line instead of the message box, so the structure stays in view.
      foot = { mechanism: 'Can move: add a member or support.', indeterminate: 'Too many members or reactions to solve.', unstable: 'Unstable geometry: no single solution.' }[r.status];
      footAlert = true;
    }
    const footerH = foot ? px * 2.4 : px * 0.6;
    const rel = d.index === 0 ? '=' : d.index < 0 ? '<' : '>';
    const verdict = { solved: 'statically determinate', mechanism: 'mechanism', indeterminate: 'statically indeterminate', unstable: 'unstable' }[r.status];
    const shortVerdict = { solved: 'determinate', mechanism: 'mechanism', indeterminate: 'indeterminate', unstable: 'unstable' }[r.status];
    const status = compact ? `m + r = ${d.m + d.r} ${rel} 2j = ${2 * d.j}: ${shortVerdict}` : `m = ${d.m}   r = ${d.r}   j = ${d.j}    m + r = ${d.m + d.r} ${rel} 2j = ${2 * d.j}    ${verdict}`;
    label(ctx, status, pad, pad + px * 2.75, { colour: solved ? pal.muted : pal.accentText, px, kind: 'mono' });

    // Legend: colour plus line style plus letter. Top right if it fits beside the title, else beside
    // the status line, else on a row of its own.
    if (show) {
      const items = compact
        ? [['T', pal.series[1], null, 5], ['C', pal.series[0], [10, 6], 5], ['0', pal.axis, null, 2]]
        : [['T  tension', pal.series[1], null, 5], ['C  compression', pal.series[0], [10, 6], 5], ['0  zero force', pal.axis, null, 2]];
      const note = compact ? 'kN' : 'Forces in kN';
      const sample = compact ? 24 : 34;
      const widths = items.map(([t]) => sample + px * 0.5 + textWidth(t, px));
      const legendW = widths.reduce((a, b) => a + b, 0) + px * 1.2 * items.length + textWidth(note, px);
      const fitsRow1 = pad + textWidth(titleText, titlePx, 'strong') + px * 2 + legendW <= W - pad;
      const fitsRow2 = pad + textWidth(status, px, 'mono') + px * 2 + legendW <= W - pad;
      let ly;
      let lx;
      if (fitsRow1 || fitsRow2) {
        ly = fitsRow1 ? pad + px * 0.9 : pad + px * 2.4;
        lx = W - pad - legendW;
      } else {
        ly = pad + px * 4;
        lx = pad;
        headerH += px * 1.5;
      }
      items.forEach(([text, colour, dash, w], i) => {
        line(lx, ly, lx + sample, ly, { colour, width: w, dash });
        label(ctx, text, lx + sample + px * 0.5, ly + px * 0.35, { colour: pal.ink, px });
        lx += widths[i] + px * 1.2;
      });
      label(ctx, note, lx, ly + px * 0.35, { colour: pal.muted, px });
    }

    // Plot area and the structure's viewport (equal scale). Margins leave room for load arrows above,
    // supports and reaction arrows below and reaction labels at the sides.
    const plot = { x0: pad, y0: headerH, x1: W - pad, y1: H - footerH };
    const xs = truss.joints.map((p) => p.x);
    const ys = truss.joints.map((p) => p.y);
    let [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    if (maxX - minX < 1) [minX, maxX] = [(minX + maxX) / 2 - 0.5, (minX + maxX) / 2 + 0.5];
    if (maxY - minY < 1) [minY, maxY] = [(minY + maxY) / 2 - 0.5, (minY + maxY) / 2 + 0.5];
    const reactLen = compact ? px * 1.8 : px * 2.6;
    const loadLen = compact ? px * 2.4 : px * 3.2;
    const labelRows = compact ? 1 : 2;
    const jr = Math.max(6, px * 0.4);

    // Supports: orientation. Walls when two or more supports share the leftmost or rightmost x.
    const supportAt = new Map(truss.supports.map((s) => [s.joint, s.type]));
    const orient = (j) => {
      const type = supportAt.get(j);
      const p = truss.joints[j];
      const shareX = truss.supports.filter((s) => Math.abs(truss.joints[s.joint].x - p.x) < 1e-9).length >= 2;
      const atMin = Math.abs(p.x - Math.min(...xs)) < 1e-9;
      const atMax = Math.abs(p.x - Math.max(...xs)) < 1e-9;
      if (type === 'side') return atMax && !atMin ? [1, 0] : [-1, 0];
      if (type === 'pin' && shareX && (atMin || atMax)) return atMin ? [-1, 0] : [1, 0];
      return [0, 1];
    };
    // Load arrows point at their joint from outside, or hang away from it when members fill that side.
    const loadStyle = (l) => {
      const mag = Math.hypot(l.fx, l.fy);
      const dw = [l.fx / mag, l.fy / mag]; // world direction
      const P = truss.joints[l.joint];
      const occupied = truss.members.some(([a, b]) => {
        if (a !== l.joint && b !== l.joint) return false;
        const Q = truss.joints[a === l.joint ? b : a];
        const len = Math.hypot(Q.x - P.x, Q.y - P.y) || 1;
        return (-dw[0] * (Q.x - P.x) - dw[1] * (Q.y - P.y)) / len > 0.35;
      });
      const onSupport = supportAt.has(l.joint) && dw[1] < -0.5;
      return { mag, ds: [dw[0], -dw[1]], hangs: occupied && !onSupport };
    };

    // Margins from what is drawn outside the structure's bounding box.
    const relY = (y) => (maxY - minY > 0 ? (y - minY) / (maxY - minY) : 0.5);
    const relX = (x) => (maxX - minX > 0 ? (x - minX) / (maxX - minX) : 0.5);
    const need = { top: px * 1.7, bottom: px * 1.7, left: compact ? px * 2 : px * 4.4, right: compact ? px * 2 : px * 4.4 };
    const grow = (k, v) => {
      need[k] = Math.max(need[k], v);
    };
    for (const l of truss.loads) {
      if (!(Math.hypot(l.fx, l.fy) > 0)) continue;
      const { ds, hangs } = loadStyle(l);
      const out = hangs ? ds : [-ds[0], -ds[1]]; // the side the arrow and its label occupy
      const e = jr + 4 + loadLen + px * 1.6;
      const p = truss.joints[l.joint];
      if (out[1] < -0.3 && relY(p.y) > 0.6) grow('top', e * -out[1]);
      if (out[1] > 0.3 && relY(p.y) < 0.4) grow('bottom', e * out[1]);
      if (out[0] < -0.3 && relX(p.x) < 0.4) grow('left', e * -out[0] + px * 2);
      if (out[0] > 0.3 && relX(p.x) > 0.6) grow('right', e * out[0] + px * 2);
    }
    const reactStack = show ? px * 0.9 + reactLen + px * 0.3 + labelRows * px * 1.45 : px * 0.3;
    for (const s of truss.supports) {
      const n = orient(s.joint);
      const glyph = px * (s.type === 'pin' ? 2 : 2.6);
      if (n[1] > 0) {
        grow('bottom', glyph + reactStack);
        continue;
      }
      // A support on a wall: its labels go sideways, but a vertical reaction is drawn along the wall,
      // below the joint when it pushes up and above when it pulls down, and the labels stack upwards.
      grow(n[0] < 0 ? 'left' : 'right', glyph + (show ? px * 0.9 + reactLen + px * 9 : px));
      if (!show) continue;
      const p = truss.joints[s.joint];
      const ry = r.reactions.find((rec) => rec.joint === s.joint)?.ry ?? 0;
      const along = px * 1.9 + reactLen;
      if (ry > 0 && relY(p.y) < 0.4) grow('bottom', along);
      if (ry < 0 && relY(p.y) > 0.6) grow('top', along);
      if (relY(p.y) > 0.6) grow('top', px * 3.6);
    }
    // Wide stages explain an unsolvable truss in a box below the structure; small ones use the footer.
    const msgW = Math.min(W - 2 * pad, 980);
    const boxed = !solved && !compact;
    const msgH = boxed ? messageHeight(r.message.replace(/^[^:]*:\s*/, ''), msgW, px) : 0;
    if (boxed) need.bottom += msgH + px * 0.8;
    const rect = { x: plot.x0 + need.left, y: plot.y0 + need.top, w: plot.x1 - plot.x0 - need.left - need.right, h: plot.y1 - plot.y0 - need.top - need.bottom };
    rect.w = Math.max(rect.w, 40);
    rect.h = Math.max(rect.h, 40);
    let vp = viewport({ x: [minX, maxX], y: [minY, maxY], rect, equal: true });
    if (frozen) {
      const fits = truss.joints.every((p) => {
        const X = frozen.toX(p.x);
        const Y = frozen.toY(p.y);
        return X >= rect.x - 2 && X <= rect.x + rect.w + 2 && Y >= rect.y - 2 && Y <= rect.y + rect.h + 2;
      });
      if (dragging || fits) vp = frozen;
      else frozen = null;
    }
    const toPx = (p) => [vp.toX(p.x), vp.toY(p.y)];
    const jp = truss.joints.map(toPx);

    // Grid: 1 m squares when that is at least 24 px, else a coarser nice step.
    let step = 1;
    while (step * vp.scaleX < 24) step *= 2;
    ctx.save();
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = Math.ceil(vp.fromX(plot.x0) / step) * step; gx <= vp.fromX(plot.x1); gx += step) {
      const X = Math.round(vp.toX(gx)) + 0.5;
      ctx.moveTo(X, plot.y0);
      ctx.lineTo(X, plot.y1);
    }
    for (let gy = Math.ceil(vp.fromY(plot.y1) / step) * step; gy <= vp.fromY(plot.y0); gy += step) {
      const Y = Math.round(vp.toY(gy)) + 0.5;
      ctx.moveTo(plot.x0, Y);
      ctx.lineTo(plot.x1, Y);
    }
    ctx.stroke();
    ctx.restore();

    // Members.
    const forces = show ? r.forces : null;
    const fmax = forces ? Math.max(1e-12, ...forces.map(Math.abs)) : 1;
    const styleOf = (k) => {
      if (!forces) return { colour: pal.ink, width: 4, dash: null, state: null };
      const f = forces[k];
      const st = forceState(f);
      const w = 3 + 4 * (Math.abs(f) / fmax);
      if (st === 'T') return { colour: pal.series[1], width: w, dash: null, state: 'T' };
      if (st === 'C') return { colour: pal.series[0], width: w, dash: [Math.max(10, w * 2.4), Math.max(6, w * 1.4)], state: 'C' };
      return { colour: pal.axis, width: 2, dash: null, state: '0' };
    };
    const order = truss.members.map((_, k) => k).sort((a, b) => (styleOf(a).state === '0' ? -1 : 0) - (styleOf(b).state === '0' ? -1 : 0));
    for (const k of order) {
      const [a, b] = truss.members[k];
      const s = styleOf(k);
      line(jp[a][0], jp[a][1], jp[b][0], jp[b][1], { colour: s.colour, width: s.width, dash: s.dash });
    }

    // Rubber band while connecting joints.
    if (ui.rubber) line(jp[ui.rubber.from][0], jp[ui.rubber.from][1], ui.rubber.x, ui.rubber.y, { colour: pal.accent, width: 2.5, dash: [8, 6] });

    // Supports and reactions.
    for (const s of truss.supports) {
      const [X, Y] = jp[s.joint];
      const n = orient(s.joint);
      const g = supportGlyph(X, Y, s.type, n, px, jr);
      if (!show) continue;
      const rec = r.reactions.find((rr) => rr.joint === s.joint);
      const comps = SUPPORT_REACTIONS[s.type].map((dir) => ({ dir, v: dir === 'x' ? rec.rx : rec.ry }));
      const name = jointName(s.joint);
      const La = reactLen;
      const gap = px * 0.35;
      const lines = [];
      const nearD = px * 0.55 + gap; // beyond the hatching
      for (const { dir, v } of comps) {
        lines.push({ text: `R_{${name}${dir}} = ${fmt(v)} kN`, v });
        if (v === 0) continue;
        const vs = dir === 'x' ? [Math.sign(v), 0] : [0, -Math.sign(v)]; // screen direction of the force
        const alongN = vs[0] * n[0] + vs[1] * n[1];
        if (Math.abs(alongN) > 0.5) {
          // Normal to the ground: drawn beyond the ground line.
          const near = [g.gx + n[0] * nearD, g.gy + n[1] * nearD];
          const far = [near[0] + n[0] * La, near[1] + n[1] * La];
          if (alongN < 0) arrow(ctx, far[0], far[1], near[0], near[1], { colour: pal.series[2], width: 3.5, head: px * 0.8 });
          else arrow(ctx, near[0], near[1], far[0], far[1], { colour: pal.series[2], width: 3.5, head: px * 0.8 });
        } else {
          // Along the ground: beside the glyph, pointing in the force's direction.
          const t = [-n[1], n[0]];
          const sgn = Math.sign(vs[0] * t[0] + vs[1] * t[1]);
          const mid = [X + n[0] * px * 0.9, Y + n[1] * px * 0.9];
          const headP = [mid[0] - t[0] * sgn * (g.gw + gap), mid[1] - t[1] * sgn * (g.gw + gap)];
          const tailP = [headP[0] - t[0] * sgn * La, headP[1] - t[1] * sgn * La];
          arrow(ctx, tailP[0], tailP[1], headP[0], headP[1], { colour: pal.series[2], width: 3.5, head: px * 0.8 });
        }
      }
      // Reaction labels beyond the ground, stacked.
      const nonZero = lines.filter((l) => l.v !== 0);
      const shown = compact ? (nonZero.length ? nonZero.slice(0, 1) : lines.slice(-1)) : lines;
      const base = [g.gx + n[0] * (nearD + La + px * 0.2), g.gy + n[1] * (nearD + La + px * 0.2)];
      const selected = isJoint(params.probeJoint, s.joint);
      // Last line first, so the first line's frame (the support being read out) is drawn on top.
      for (let i = shown.length - 1; i >= 0; i--) {
        const l = shown[i];
        const frame = selected && i === 0 ? pal.ink : null;
        if (n[1] > 0) {
          rich(l.text, base[0], base[1] + px * 0.3 + i * px * 1.45, { colour: pal.ink, px, kind: 'mono', align: 'center', baseline: 'top', box: pal.bg, frame });
        } else {
          const align = n[0] < 0 ? 'right' : 'left';
          rich(l.text, base[0] - n[0] * px * 0.2, Y - px * 2.3 + i * px * 1.45, { colour: pal.ink, px, kind: 'mono', align, baseline: 'top', box: pal.bg, frame });
        }
      }
    }

    // Member labels (after supports so they sit on top).
    // Each label tries a few spots along its member and skips spots that would cover another label
    // or a joint; the full text ("11.2 kN C") gives way to the short one ("11.2 C") when crowded.
    if (truss.members.length && (show || (solved && !params.showForces))) {
      const placed = jp.map(([X, Y]) => ({ x0: X - jr - 3, y0: Y - jr - 3, x1: X + jr + 3, y1: Y + jr + 3 }));
      const boxAt = (cx, cy, w) => ({ x0: cx - w / 2 - 5, x1: cx + w / 2 + 5, y0: cy - px * 0.62 - 3, y1: cy + px * 0.62 + 3 });
      const free = (b) => !placed.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
      truss.members.forEach(([a, b], k) => {
        const lenPx = Math.hypot(jp[b][0] - jp[a][0], jp[b][1] - jp[a][1]);
        const selected = sameMember(params.probeMember, truss.members[k]);
        let texts;
        let colour = pal.ink;
        let kind = 'mono';
        if (!show) {
          texts = ['?'];
          kind = 'strong';
        } else {
          const f = forces[k];
          const st = forceState(f);
          const full = st === '0' ? '0' : `${fmt(Math.abs(f))} kN ${st}`;
          const short = st === '0' ? '0' : `${fmt(Math.abs(f))} ${st}`;
          texts = compact || textWidth(full, px, 'mono') + 24 > lenPx ? [short] : [full, short];
          colour = st === 'T' ? pal.series[1] : st === 'C' ? pal.accentText : pal.muted;
        }
        let spot = null;
        for (const text of texts) {
          const w = textWidth(text, px, kind);
          for (const t of [0.5, 0.36, 0.64, 0.27, 0.73]) {
            const cx = jp[a][0] + (jp[b][0] - jp[a][0]) * t;
            const cy = jp[a][1] + (jp[b][1] - jp[a][1]) * t;
            const box = boxAt(cx, cy, w);
            if (free(box)) {
              spot = { text, cx, cy, box };
              break;
            }
          }
          if (spot) break;
        }
        if (!spot) {
          if (compact) return; // colour and line style still show T or C
          const text = texts[texts.length - 1];
          const cx = (jp[a][0] + jp[b][0]) / 2;
          const cy = (jp[a][1] + jp[b][1]) / 2;
          spot = { text, cx, cy, box: boxAt(cx, cy, textWidth(text, px, kind)) };
        }
        placed.push(spot.box);
        rich(spot.text, spot.cx, spot.cy, { colour, px, kind, align: 'center', baseline: 'middle', box: pal.bg, frame: selected ? pal.ink : null });
      });
    }

    // Loads.
    for (const l of truss.loads) {
      if (!(Math.hypot(l.fx, l.fy) > 0)) continue;
      const { mag, ds, hangs } = loadStyle(l);
      const [X, Y] = jp[l.joint];
      const off = jr + 4;
      const out = hangs ? ds : [-ds[0], -ds[1]];
      const near = [X + out[0] * off, Y + out[1] * off];
      const far = [X + out[0] * (off + loadLen), Y + out[1] * (off + loadLen)];
      if (hangs) arrow(ctx, near[0], near[1], far[0], far[1], { colour: pal.ink, width: 3.5, head: px * 0.85 });
      else arrow(ctx, far[0], far[1], near[0], near[1], { colour: pal.ink, width: 3.5, head: px * 0.85 });
      const text = l.main ? `P = ${formatPlain(params.load)} kN` : `${fmt(mag)} kN`;
      const lx = far[0] + out[0] * px * 0.5;
      const ly = far[1] + out[1] * px * 0.5;
      const align = out[0] < -0.5 ? 'right' : out[0] > 0.5 ? 'left' : 'center';
      const baseline = out[1] < -0.3 ? 'bottom' : out[1] > 0.3 ? 'top' : 'middle';
      rich(text, lx, ly + (baseline === 'bottom' ? -px * 0.3 : baseline === 'top' ? px * 0.3 : 0), { colour: pal.ink, px, kind: 'strong', align, baseline, box: pal.bg });
    }

    // Joints and letters.
    jp.forEach(([X, Y], i) => {
      ctx.save();
      ctx.fillStyle = pal.panel;
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(X, Y, jr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (ui.pending === i) {
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(X, Y, jr + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      // Letter in the emptiest direction.
      const blocked = [];
      for (const [a, b] of truss.members) {
        if (a === i || b === i) {
          const o = a === i ? b : a;
          blocked.push(Math.atan2(jp[o][1] - Y, jp[o][0] - X));
        }
      }
      if (supportAt.has(i)) {
        const n = orient(i);
        blocked.push(Math.atan2(n[1], n[0]));
      }
      for (const l of truss.loads) {
        if (l.joint !== i) continue;
        blocked.push(Math.atan2(l.fy, -l.fx));
        blocked.push(Math.atan2(-l.fy, l.fx));
      }
      let best = -Math.PI * 0.75;
      let bestScore = -1;
      for (let s = 0; s < 16; s++) {
        const a = -Math.PI * 0.75 + (s * Math.PI) / 8;
        const score = blocked.length ? Math.min(...blocked.map((bk) => Math.abs(Math.atan2(Math.sin(a - bk), Math.cos(a - bk))))) : Math.PI;
        if (score > bestScore + 1e-6) {
          bestScore = score;
          best = a;
        }
      }
      const dist = jr + px * 0.85;
      label(ctx, jointName(i), X + Math.cos(best) * dist, Y + Math.sin(best) * dist, { colour: pal.ink, px: px + 2, kind: 'strong', align: 'center', baseline: 'middle' });
    });

    // Unsolved, on wide stages: a calm message where the reactions would be (small stages use the footer).
    if (boxed) {
      const titles = { mechanism: 'Mechanism', indeterminate: 'Statically indeterminate', unstable: 'Unstable' };
      messageBox(titles[r.status], r.message.replace(/^[^:]*:\s*/, ''), (W - msgW) / 2, plot.y1 - 4, msgW, px, { anchor: 'bottom' });
    }

    // Footer: the tool hint or the last edit note; a missing load joint is flagged.
    if (foot) {
      label(ctx, foot, pad, footY, { colour: footAlert ? pal.accentText : pal.muted, px });
      const gridNote = `Grid squares: ${formatPlain(step)} m`;
      if (!compact && W - 2 * pad - textWidth(gridNote, px) > textWidth(foot, px) + px * 2) label(ctx, gridNote, W - pad, footY, { colour: pal.muted, px, align: 'right' });
    }

    layout = { vp, jp, jr, plot, members: truss.members };
  }

  function isJoint(letter, j) {
    return jointIndex(letter) === j;
  }

  function sameMember(name, m) {
    if (!name || name.length !== 2) return false;
    const n = name.toUpperCase();
    return n === memberName(m) || n === memberName([m[1], m[0]]);
  }

  /* ------------------------------------------------------------------ beam */

  function beamAxis(X0, X1, L) {
    return (x) => X0 + ((X1 - X0) * x) / L;
  }

  function drawBeamBody(X0, X1, Y, bt) {
    ctx.save();
    ctx.fillStyle = pal.panel;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2.5;
    ctx.fillRect(X0, Y - bt / 2, X1 - X0, bt);
    ctx.strokeRect(X0, Y - bt / 2, X1 - X0, bt);
    ctx.restore();
  }

  function drawBeam(model, params) {
    const W = surface.width;
    const H = surface.height;
    const px = stageFontPx(W);
    const pad = Math.round(px * 1.1);
    const { beam, res, probe } = model;
    const cant = beam.type === 'cantilever';
    const L = beam.L;
    const compact = W < 760;
    title(`${cant ? 'Cantilever' : compact ? 'Beam' : 'Simply supported beam'} · L = ${formatPlain(L)} m`, px, pad);
    const sideW = W >= 980 ? Math.round(Math.min(380, W * 0.25)) : 0;
    const m = axisMargins(px);
    const mainR = W - pad - (sideW ? sideW + pad : 0);
    const X0 = pad + m.left;
    const X1 = mainR - px * 1.5;
    const X = beamAxis(X0, X1, L);
    const top = pad + px * 2.6;
    const avail = H - top - pad * 0.5;
    // Beam panel: room below the beam for supports, reaction arrows and their labels (7.2 px rows).
    const hb = compact ? avail * 0.3 : Math.min(Math.max(avail * 0.38, px * 13.5), avail * 0.46);
    const hd = (avail - hb) / 2;
    const bt = Math.max(10, px * 0.75);
    const beamY = compact ? top + hb * 0.55 : Math.max(top + hb * 0.45, top + hb - px * 7.2);
    const R = res.R;

    // Loads.
    const hasUdl = beam.udls.length > 0;
    const udlH = px * 1.6;
    const la = Math.min(px * 2.8, hb * 0.28);
    for (const u of beam.udls) {
      const xa = X(u.x1);
      const xb = X(u.x2);
      const yTop = beamY - bt / 2 - udlH - 2;
      ctx.save();
      ctx.fillStyle = pal.series[3];
      ctx.globalAlpha = 0.14;
      ctx.fillRect(xa, yTop, xb - xa, udlH);
      ctx.restore();
      line(xa, yTop, xb, yTop, { colour: pal.ink, width: 2 });
      const n = Math.max(2, Math.round((xb - xa) / (px * 1.4)));
      for (let i = 0; i <= n; i++) {
        const xx = xa + ((xb - xa) * i) / n;
        arrow(ctx, xx, yTop, xx, beamY - bt / 2 - 2, { colour: pal.ink, width: 2, head: px * 0.5 });
      }
      label(ctx, `w = ${formatPlain(u.w)} kN/m`, (xa + xb) / 2, yTop - px * 0.4, { colour: pal.ink, px, kind: 'strong', align: 'center', box: pal.bg });
    }
    const pointTop = beamY - bt / 2 - (hasUdl ? udlH + px * 1.8 : 0) - la;
    const labelled = [];
    for (const p of beam.points) {
      const xx = X(p.x);
      arrow(ctx, xx, pointTop, xx, beamY - bt / 2 - 2, { colour: pal.ink, width: 3.5, head: px * 0.8 });
      const text = `${p.name} = ${formatPlain(p.P)} kN`;
      const w = textWidth(text, px, 'strong');
      let ly = pointTop - px * 0.4;
      if (labelled.some((q) => Math.abs(q.x - xx) < (q.w + w) / 2 + 8 && Math.abs(q.y - ly) < px)) ly -= px * 1.3;
      labelled.push({ x: xx, y: ly, w });
      label(ctx, text, xx, ly, { colour: pal.ink, px, kind: 'strong', align: 'center', box: pal.bg });
    }

    // Beam, supports, reactions.
    drawBeamBody(X0, X1, beamY, bt);
    const ra = Math.min(px * 2.4, hb * 0.22);
    if (cant) {
      ground(X0, beamY - bt * 2.6, X0, beamY + bt * 2.6, -1, 0, px);
      const ry = beamY + bt / 2 + ra + px * 0.4;
      arrow(ctx, X0 + px * 1.6, ry, X0 + px * 1.6, beamY + bt / 2 + 3, { colour: pal.series[2], width: 3.5, head: px * 0.8 });
      rich(`R_{A} = ${fmt(R.RA)} kN`, X0 + px * 1.6, ry + px * 0.3, { colour: pal.ink, px, kind: 'mono', align: 'left', baseline: 'top', box: pal.bg });
      if (R.MA !== 0) {
        turnArrow(X0, beamY, px * 1.9, R.MA > 0 ? 'acw' : 'cw', pal.series[2], 3);
        rich(`M_{A} = ${fmt(Math.abs(R.MA))} kN·m`, X0 + px * 0.6, beamY - px * 2.6, { colour: pal.ink, px, kind: 'mono', align: 'left', baseline: 'bottom', box: pal.bg });
      }
    } else {
      for (const [xx, type, name, v] of [
        [X0, 'pin', 'A', R.RA],
        [X1, 'roller', 'B', R.RB],
      ]) {
        const g = supportGlyph(xx, beamY + bt / 2, type, [0, 1], px * 0.9);
        const y0 = g.gy + px * 0.7;
        if (v !== 0) {
          if (v > 0) arrow(ctx, xx, y0 + ra, xx, y0, { colour: pal.series[2], width: 3.5, head: px * 0.8 });
          else arrow(ctx, xx, y0, xx, y0 + ra, { colour: pal.series[2], width: 3.5, head: px * 0.8 });
        }
        // Small stages: the readouts under the stage give the reactions.
        if (!compact) rich(`R_{${name}} = ${fmt(v)} kN`, xx, y0 + ra + px * 0.3, { colour: pal.ink, px, kind: 'mono', align: name === 'A' ? 'left' : 'right', baseline: 'top', box: pal.bg });
      }
    }
    if (cant) label(ctx, 'A', X0 - px * 1.2, beamY - bt * 2.6 - px * 0.3, { colour: pal.ink, px: px + 2, kind: 'strong', align: 'right' });
    else label(ctx, 'A', X0 - px * 0.4, beamY - bt / 2 - px * 0.4, { colour: pal.ink, px: px + 2, kind: 'strong', align: 'right' });
    if (!cant) label(ctx, 'B', X1 + px * 0.4, beamY - bt / 2 - px * 0.4, { colour: pal.ink, px: px + 2, kind: 'strong', align: 'left' });

    // SFD and BMD.
    const diagram = (y0, h, key, colour, yTitle, valueText) => {
      const rect = { x: X0, y: y0 + m.top + px * 0.3, w: X1 - X0, h: h - m.top - m.bottom - px * 0.3 };
      const vals = res.samples.map((s) => s[key]);
      let lo = Math.min(0, ...vals);
      let hi = Math.max(0, ...vals);
      if (hi - lo < 1e-9) [lo, hi] = [-1, 1];
      const padV = (hi - lo) * 0.18;
      const vp = viewport({ x: [0, L], y: [lo - (lo < 0 ? padV : 0), hi + (hi > 0 ? padV : 0)], rect });
      const yCount = compact ? 2 : 4;
      const xCount = Math.min(10, Math.max(3, Math.round(rect.w / 110)));
      drawAxes(ctx, vp, pal, { px, layer: 'under', yCount, xCount });
      // Filled area to the axis, then the line.
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(vp.toX(0), vp.toY(0));
      for (const s of res.samples) ctx.lineTo(vp.toX(s.x), vp.toY(s[key]));
      ctx.lineTo(vp.toX(L), vp.toY(0));
      ctx.closePath();
      ctx.fillStyle = colour;
      ctx.globalAlpha = 0.16;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      res.samples.forEach((s, i) => (i ? ctx.lineTo(vp.toX(s.x), vp.toY(s[key])) : ctx.moveTo(vp.toX(s.x), vp.toY(s[key]))));
      ctx.strokeStyle = colour;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
      // + and − glyphs at the largest positive and negative values.
      const iMax = vals.indexOf(Math.max(...vals));
      const iMin = vals.indexOf(Math.min(...vals));
      const glyph = (i, sign) => {
        const s = res.samples[i];
        const gx = Math.min(Math.max(vp.toX(s.x), rect.x + px), rect.x + rect.w - px);
        const gy = (vp.toY(0) + vp.toY(s[key])) / 2;
        if (Math.abs(vp.toY(0) - vp.toY(s[key])) < px * 1.4) return;
        label(ctx, sign, gx + (s.x > L / 2 ? -px * 1.2 : px * 1.2), gy, { colour: pal.ink, px: px + 6, kind: 'strong', align: 'center', baseline: 'middle' });
      };
      if (vals[iMax] > 0) glyph(iMax, '+');
      if (vals[iMin] < 0) glyph(iMin, MINUS);
      drawAxes(ctx, vp, pal, { px, layer: 'over', yCount, xCount, xTitle: compact ? undefined : 'x (m)', yTitle: compact ? undefined : yTitle });
      // Small stages: the y title sits at the top right, clear of the section probe near the left.
      if (compact) label(ctx, yTitle, rect.x + rect.w - 4, rect.y + 4, { colour: pal.ink, px, align: 'right', baseline: 'top', box: pal.bg });
      return vp;
    };
    const sfd = diagram(top + hb, hd, 'V', pal.series[1], 'V (kN)');
    const bmd = diagram(top + hb + hd, hd, 'M', pal.series[0], compact ? 'M (kN·m)' : 'M (kN·m), sagging +');

    // Labels beside a point inside a diagram: above it unless that would hit the axis title row.
    const besideY = (vp, yy) => {
      const lo = vp.rect.y + px * 1.7;
      const hi = vp.rect.y + vp.rect.h - px * 0.5;
      const above = yy - px * 0.9;
      const below = yy + px * 0.9;
      return above >= lo ? above : below <= hi ? below : Math.min(Math.max(yy, lo), hi);
    };

    // Peak moment marker.
    const mx = bmd.toX(res.maxMomentAt);
    const my = bmd.toY(res.maxMoment);
    if (res.maxMoment !== 0) {
      ctx.fillStyle = pal.ink;
      ctx.fillRect(mx - 5, my - 5, 10, 10);
    }
    if (res.maxMoment !== 0 && !compact) {
      const text = `M_{max} = ${fmt(res.maxMoment)} kN·m at x = ${fmt(res.maxMomentAt)} m`;
      const tw = textWidth(text, px, 'mono');
      const right = mx + 12 + tw < X1;
      rich(text, right ? mx + 12 : mx - 12, besideY(bmd, my), { colour: pal.ink, px, kind: 'mono', align: right ? 'left' : 'right', baseline: 'middle', box: pal.bg });
    }

    // Section probe: a dashed line through all three panels.
    const xp = X(probe.x);
    line(xp, top + px * 0.2, xp, bmd.rect.y + bmd.rect.h, { colour: pal.muted, width: 2, dash: [6, 6] });
    if (!compact) label(ctx, `x = ${fmt(probe.x)} m`, xp + 6, top + px * 0.9, { colour: pal.muted, px, kind: 'mono', box: pal.bg });
    const atPeak = res.maxMoment !== 0 && Math.abs(probe.x - res.maxMomentAt) < L * 0.02;
    for (const [vp, v, text] of [
      [sfd, probe.V, compact ? '' : `V = ${fmt(probe.V)} kN`],
      [bmd, probe.M, atPeak || compact ? '' : `M = ${fmt(probe.M)} kN·m`],
    ]) {
      const yy = vp.toY(v);
      ctx.save();
      ctx.fillStyle = pal.panel;
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(xp, yy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      if (!text) continue;
      const right = xp + 12 + textWidth(text, px, 'mono') < X1;
      label(ctx, text, right ? xp + 12 : xp - 12, besideY(vp, yy), { colour: pal.ink, px, kind: 'mono', align: right ? 'left' : 'right', baseline: 'middle', box: pal.bg });
    }

    // Notes for loads moved onto the beam.
    const notes = [];
    if (beam.points.some((p) => p.outside)) notes.push('A point load past the end of the beam acts at the end.');
    if (probe.outside) notes.push('The section is past the end of the beam, so it is read at x = L.');
    if (model.udlEmpty) notes.push('The UDL has zero length on this beam.');
    notes.forEach((n, i) => label(ctx, n, X1, top + px * (0.9 + 1.3 * i), { colour: pal.accentText, px, align: 'right', box: pal.bg }));

    // Section and bending stress panel.
    if (sideW) drawSection(mainR + pad, top, sideW, avail, px, model, params);
    else if (!compact) rich(`σ at x = ${fmt(probe.sigma)} MPa · σ_{max} = ${fmt(model.maxStress)} MPa`, W - pad, pad + px + 2, { colour: pal.ink, px, kind: 'mono', align: 'right' });
  }

  function drawSection(x, y, w, h, px, model, params) {
    const { section, probe } = model;
    ctx.save();
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - px * 0.5 + 0.5, y);
    ctx.lineTo(x - px * 0.5 + 0.5, y + h);
    ctx.stroke();
    ctx.restore();
    label(ctx, `Section at x = ${fmt(probe.x)} m`, x, y + px, { colour: pal.ink, px, kind: 'strong' });
    const lpx = w < 330 ? Math.max(14, px - 2) : px;
    // Rectangle b × d to scale, with the neutral axis (dashed).
    const maxH = Math.min(h * 0.28, px * 8);
    const maxW = w * 0.3;
    const s = Math.min(maxH / params.sectionD, maxW / params.sectionB);
    const rw = Math.max(6, params.sectionB * s);
    const rh = Math.max(6, params.sectionD * s);
    const rx = x + px * 0.4;
    const ry = y + px * 3.4;
    ctx.save();
    ctx.fillStyle = pal.panel;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.restore();
    const na = ry + rh / 2;
    line(rx - 8, na, rx + rw + 8, na, { colour: pal.muted, width: 1.5, dash: [6, 4] });
    // Stress profile beside it: σ = My/I, linear through the depth, zero at the neutral axis.
    const px0 = rx + rw + px * 1.4;
    const half = Math.max(10, (x + w - px * 0.4 - px0) / 2);
    const sx = px0 + half;
    const sigTop = probe.M === 0 ? 0 : -probe.M * (section.y / section.I) * 1e6; // MPa, tension +
    const sigBot = -sigTop;
    const span = Math.max(1e-9, Math.abs(sigTop));
    const k = half / span;
    line(sx, ry - 6, sx, ry + rh + 6, { colour: pal.ink, width: 2 });
    if (probe.M !== 0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sx, ry);
      ctx.lineTo(sx + sigTop * k, ry);
      ctx.lineTo(sx + sigBot * k, ry + rh);
      ctx.lineTo(sx, ry + rh);
      ctx.closePath();
      ctx.fillStyle = pal.series[3];
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + sigTop * k, ry);
      ctx.lineTo(sx + sigBot * k, ry + rh);
      ctx.stroke();
      ctx.restore();
    }
    // Stress values at the top and bottom fibres, kept inside the profile's width; C or T as text.
    const tc = (v) => (v > 0 ? ' T' : v < 0 ? ' C' : '');
    const fibre = (v, yy) => {
      const tip = sx + v * k;
      label(ctx, `${fmt(Math.abs(v))} MPa${tc(v)}`, v === 0 ? sx : tip, yy, { colour: pal.ink, px: lpx, kind: 'mono', align: v < 0 ? 'left' : v > 0 ? 'right' : 'center', box: pal.bg });
    };
    fibre(sigTop, ry - px * 0.5);
    fibre(sigBot, ry + rh + px * 1.3);

    // Working.
    const lines = [
      `b × d = ${formatPlain(params.sectionB)} × ${formatPlain(params.sectionD)} mm`,
      `I = bd³/12 = ${fmt(section.I)} mm⁴`,
      `y = d/2 = ${formatPlain(section.y)} mm`,
      `M = ${fmt(probe.M)} kN·m`,
      `σ = My/I = ${fmt(probe.sigma)} MPa`,
      `σ_{max} = ${fmt(model.maxStress)} MPa at x = ${fmt(model.res.maxMomentAt)} m`,
    ];
    let ly = ry + rh + px * 3.3;
    for (const t of lines) {
      if (ly > y + h - px * 0.3) break;
      for (const part of textWidth(t, lpx, 'mono') > w - px * 0.4 ? t.split(' at ').map((p, i) => (i ? `  at ${p}` : p)) : [t]) {
        rich(part, x, ly, { colour: pal.ink, px: lpx, kind: 'mono' });
        ly += lpx * 1.45;
      }
    }
  }

  /* ------------------------------------------------------------------ moments */

  function drawMoments(model, params) {
    const W = surface.width;
    const H = surface.height;
    const px = stageFontPx(W);
    const compact = W < 760;
    const pad = Math.round(px * 1.1);
    const { res, L, loads, xA, xB, pivotX } = model;
    const conv = params.momentSign === 'acw' ? 'anticlockwise' : 'clockwise';
    const about = params.momentsAbout === 'point' ? 'O' : params.momentsAbout;
    title(compact ? `Moments about ${about}` : `Moments about ${about} · ${conv} positive`, px, pad);
    // Convention badge (top right).
    const badge = `${conv} +`;
    const bw = textWidth(badge, px, 'strong');
    label(ctx, badge, W - pad, pad + px + 2, { colour: pal.ink, px, kind: 'strong', align: 'right' });
    turnArrow(W - pad - bw - px * 1.3, pad + px * 0.6, px * 0.7, params.momentSign === 'acw' ? 'acw' : 'cw', pal.ink, 2.5);

    if (!res.ok) {
      messageBox('Check the supports', res.message, pad, pad + px * 3.4, Math.min(W - 2 * pad, 900), px);
      return;
    }
    const X0 = pad + px * 4;
    const X1 = W - pad - px * 4;
    const X = beamAxis(X0, X1, L);
    const top = pad + px * 2.8;
    const tpx0 = compact ? Math.max(13, px - 1) : px;
    // On small stages the table gives way to one summary line (the readouts carry the numbers).
    const tableH = compact ? px * 2.4 : (res.terms.length + 3.2) * tpx0 * 1.45;
    const beamH = compact ? H - top - tableH : Math.max((H - top) * 0.42, H - top - tableH - pad * 0.5);
    const bt = Math.max(10, px * 0.7);
    const beamY = top + beamH * (compact ? 0.42 : 0.46);
    const la = Math.min(px * 3, beamH * 0.28);
    const sign = params.momentSign === 'acw' ? -1 : 1;

    // Ruler under everything in the beam panel.
    const rulerY = top + beamH - px * 0.4;
    if (!compact) {
      line(X0, rulerY, X1, rulerY, { colour: pal.axis, width: 1.5 });
      const { ticks } = niceTicks(0, L, Math.max(3, Math.round((X1 - X0) / 120)));
      for (const t of ticks) {
        line(X(t), rulerY - 5, X(t), rulerY + 5, { colour: pal.axis, width: 1.5 });
        label(ctx, `${formatPlain(t)}`, X(t), rulerY - 8, { colour: pal.muted, px, kind: 'mono', align: 'center' });
      }
      label(ctx, 'x (m)', X1 + px * 0.6, rulerY + px * 0.35, { colour: pal.muted, px, kind: 'mono' });
    }

    drawBeamBody(X0, X1, beamY, bt);
    // Supports and reactions.
    for (const [xx, type, name, v] of [
      [xA, 'pin', 'A', res.RA],
      [xB, 'roller', 'B', res.RB],
    ]) {
      const Xs = X(xx);
      const g = supportGlyph(Xs, beamY + bt / 2, type, [0, 1], px * 0.85);
      label(ctx, name, Xs + px * 1.3, beamY + bt / 2 + px * 1.6, { colour: pal.ink, px: px + 2, kind: 'strong' });
      const y0 = g.gy + px * 0.6;
      const ra = Math.min(px * 3.4, Math.max(px * 1.6, rulerY - y0 - px * 2.6));
      if (params.showReactions) {
        if (v !== 0) {
          if (v > 0) arrow(ctx, Xs, y0 + ra, Xs, y0, { colour: pal.series[2], width: 3.5, head: px * 0.8 });
          else arrow(ctx, Xs, y0, Xs, y0 + ra, { colour: pal.series[2], width: 3.5, head: px * 0.8 });
        }
        rich(`R_{${name}} = ${fmt(v)} kN`, Xs, y0 + ra + px * 0.2, { colour: pal.ink, px, kind: 'mono', align: 'center', baseline: 'top', box: pal.bg });
      } else {
        arrow(ctx, Xs, y0 + ra, Xs, y0, { colour: pal.series[2], width: 3, head: px * 0.8, dashed: true });
        rich(`R_{${name}} = ?`, Xs, y0 + ra + px * 0.2, { colour: pal.ink, px, kind: 'mono', align: 'center', baseline: 'top', box: pal.bg });
      }
    }
    // Loads with their turning sense about the pivot.
    const placed = [];
    for (const l of loads) {
      const xx = X(l.x);
      arrow(ctx, xx, beamY - bt / 2 - la, xx, beamY - bt / 2 - 2, { colour: pal.ink, width: 3.5, head: px * 0.8 });
      const text = `${l.label} = ${formatPlain(l.P)} kN`;
      const w = textWidth(text, px, 'strong');
      let ly = beamY - bt / 2 - la - px * 0.4;
      while (placed.some((q) => Math.abs(q.x - xx) < (q.w + w) / 2 + 10 && Math.abs(q.y - ly) < px)) ly -= px * 1.35;
      placed.push({ x: xx, y: ly, w });
      label(ctx, text, xx, ly, { colour: pal.ink, px, kind: 'strong', align: 'center', box: pal.bg });
      const t = res.terms.find((tt) => tt.name === l.name);
      if (t && t.sense !== 'none') turnArrow(xx + w / 2 + px * 0.9, ly - px * 0.35, px * 0.55, t.sense, pal.accentText, 2.2);
    }
    // Pivot marker.
    const Xp = X(pivotX);
    ctx.save();
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(Xp, beamY, Math.max(9, px * 0.55), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    if (params.momentsAbout === 'point') label(ctx, 'O', Xp, beamY - bt - px * 0.5, { colour: pal.accentText, px: px + 2, kind: 'strong', align: 'center', box: pal.bg });

    if (compact) {
      const summary = params.showReactions
        ? `Σ M_{${about}} = ${fmt(res.net)} kN·m: in equilibrium`
        : `Loads: ${fmt(Math.abs(res.loadMoment))} kN·m ${res.loadMoment * sign >= 0 ? 'clockwise' : 'anticlockwise'}`;
      rich(summary, pad, H - pad * 0.8, { colour: pal.ink, px, kind: 'label' });
      if (model.outside) label(ctx, 'Read at x = L', W - pad, top + px * 0.2, { colour: pal.accentText, px, align: 'right', box: pal.bg });
      return;
    }

    // Table of moments about the pivot.
    const rows = res.terms;
    const cols = [['Force', 0], ['Size (kN)', 0.16], [`Distance from ${about} (m)`, 0.33], [`Moment (kN·m, ${conv} +)`, 0.58]];
    const tx = pad;
    const tw = W - 2 * pad;
    let ty = top + beamH + px * 1.6;
    const tpx = tpx0;
    cols.forEach(([h, f]) => label(ctx, h, tx + tw * f, ty, { colour: pal.muted, px: tpx }));
    line(tx, ty + tpx * 0.5, tx + tw, ty + tpx * 0.5, { colour: pal.grid, width: 1.5 });
    ty += tpx * 1.55;
    const rowH = tpx * 1.45;
    for (const t of rows) {
      if (ty > H - rowH * 1.6) break;
      const hidden = t.reaction && !params.showReactions;
      const name = t.reaction ? t.name.replace('_', '_{') + '}' : `F_{${t.name.slice(1)}}`;
      const size = hidden ? '?' : fmt(Math.abs(t.Fy));
      const dist = fmt(Math.abs(t.arm));
      const mom = hidden ? (t.arm === 0 ? '0 (through the pivot)' : '?') : t.moment === 0 ? '0' : fmtSigned(t.moment);
      [name, size, dist, mom].forEach((v, i) => rich(v, tx + tw * cols[i][1], ty, { colour: pal.ink, px: tpx, kind: i === 0 ? 'strong' : 'mono' }));
      if (!hidden && t.sense !== 'none') {
        const mx = tx + tw * cols[cols.length - 1][1] + textWidth(mom, tpx, 'mono') + tpx * 1.2;
        turnArrow(mx, ty - tpx * 0.35, tpx * 0.5, t.sense, pal.ink, 2);
        label(ctx, t.sense === 'cw' ? 'clockwise' : 'anticlockwise', mx + tpx * 1.1, ty, { colour: pal.muted, px: tpx });
      }
      ty += rowH;
    }
    // Equation line.
    line(tx, ty - tpx * 0.7, tx + tw, ty - tpx * 0.7, { colour: pal.grid, width: 1.5 });
    let eq;
    if (params.showReactions) {
      eq = `Σ M = ${fmt(res.net)} kN·m, so the beam is in equilibrium (Σ clockwise ${fmt(res.sumCw)} = Σ anticlockwise ${fmt(res.sumAcw)})`;
    } else {
      eq = `Loads give ${fmt(Math.abs(res.loadMoment))} kN·m ${res.loadMoment * sign >= 0 ? 'clockwise' : 'anticlockwise'} about ${about}. Which reaction balances it?`;
    }
    if (ty < H - px * 0.3) rich(eq, tx, ty + tpx * 0.35, { colour: pal.ink, px: tpx, kind: 'label' });
    // Taking moments about one support solves for the other: R = Σ(F d) / (distance between supports).
    if (params.showReactions && params.momentsAbout !== 'point' && ty + rowH < H - px * 0.3) {
      const other = params.momentsAbout === 'A' ? 'B' : 'A';
      const d = (other === 'B' ? xB : xA) - pivotX;
      const cwLoads = sign * res.loadMoment; // clockwise moment of the loads about the pivot
      const R = other === 'B' ? res.RB : res.RA;
      const solve = `Σ M_{${about}} = 0 gives R_{${other}} = (clockwise moment of the loads) / (${fmt(d)} m) = ${fmt(cwLoads)} / ${fmt(d)} = ${fmt(R)} kN`;
      rich(solve, tx, ty + tpx * 0.35 + rowH, { colour: pal.muted, px: tpx, kind: 'label' });
    }
    if (model.outside) label(ctx, 'Positions past the end of the beam are read at x = L.', W - pad, top + px * 0.2, { colour: pal.accentText, px, align: 'right', box: pal.bg });
  }

  /* ------------------------------------------------------------------ concurrent forces */

  function drawConcurrent(model, params) {
    if (model.mode === 'boom') return drawBoom(model, params);
    const W = surface.width;
    const H = surface.height;
    const px = stageFontPx(W);
    const pad = Math.round(px * 1.1);
    const compact = W < 760;
    const { forces, R, E } = model;
    title('Concurrent forces', px, pad);
    const colours = [pal.series[0], pal.series[1], pal.series[3], pal.series[5]];
    const top = pad + px * 2.6;
    const bottom = H - pad - px * 2.8;
    const split = compact ? W : W * 0.55;

    // Space diagram: forces from one point.
    const cx = split / 2;
    const cy = (top + bottom) / 2;
    const maxF = Math.max(1e-9, ...forces.map((f) => f.F), R.magnitude);
    const k = (Math.min(split - 2 * pad, bottom - top) * 0.36) / maxF;
    line(pad, cy, split - pad, cy, { colour: pal.grid, width: 1.5 });
    line(cx, top, cx, bottom, { colour: pal.grid, width: 1.5 });
    if (!compact) {
      label(ctx, '+x', split - pad, cy + px * 1.3, { colour: pal.muted, px, kind: 'mono', align: 'right' });
      label(ctx, '+y', cx - 8, top + px, { colour: pal.muted, px, kind: 'mono', align: 'right' });
    }
    forces.forEach((f, i) => {
      const ex = cx + f.fx * k;
      const ey = cy - f.fy * k;
      if (params.showComponents && f.F > 0) {
        line(ex, ey, ex, cy, { colour: colours[i], width: 1.5, dash: [5, 5] });
        line(ex, ey, cx, ey, { colour: colours[i], width: 1.5, dash: [5, 5] });
      }
      arrow(ctx, cx, cy, ex, ey, { colour: colours[i], width: 3.5, head: px * 0.85 });
      if (f.F > 0) {
        const ux = f.fx / f.F;
        const uy = -f.fy / f.F;
        rich(`${f.name} = ${formatPlain(f.F)} N, ${formatPlain(f.angle)}°`, ex + ux * px * 0.8, ey + uy * px * 0.8 + (uy > 0 ? px * 0.6 : 0), { colour: pal.ink, px, kind: 'mono', align: ux < -0.3 ? 'right' : ux > 0.3 ? 'left' : 'center', baseline: uy > 0.3 ? 'top' : 'bottom', box: pal.bg });
      }
    });
    if (R.magnitude > 0) {
      arrow(ctx, cx, cy, cx + R.fx * k, cy - R.fy * k, { colour: pal.ink, width: 3, head: px * 0.85, dashed: true });
      arrow(ctx, cx, cy, cx + E.fx * k, cy - E.fy * k, { colour: pal.series[2], width: 3, head: px * 0.85 });
      const ux = R.fx / R.magnitude;
      const uy = -R.fy / R.magnitude;
      label(ctx, 'R', cx + R.fx * k + ux * px * 0.9, cy - R.fy * k + uy * px * 0.9, { colour: pal.ink, px: px + 2, kind: 'strong', align: 'center', baseline: 'middle', box: pal.bg });
      label(ctx, 'E', cx + E.fx * k - ux * px * 0.9, cy - E.fy * k - uy * px * 0.9, { colour: pal.ink, px: px + 2, kind: 'strong', align: 'center', baseline: 'middle', box: pal.bg });
    }
    ctx.fillStyle = pal.ink;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Force polygon: tip to tail.
    if (!compact) {
      const px0 = split + pad;
      const pw = W - pad - px0;
      label(ctx, 'Force polygon (tip to tail)', px0, top + px * 0.2, { colour: pal.ink, px, kind: 'strong' });
      const pts = [[0, 0]];
      for (const f of forces) pts.push([pts[pts.length - 1][0] + f.fx, pts[pts.length - 1][1] + f.fy]);
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      const vp = viewport({ x: [Math.min(...xs), Math.max(...xs) + 1e-9], y: [Math.min(...ys), Math.max(...ys) + 1e-9], rect: { x: px0 + px * 2, y: top + px * 2.6, w: pw - px * 4, h: bottom - top - px * 3.6 }, equal: true });
      forces.forEach((f, i) => {
        const [a, b] = [pts[i], pts[i + 1]];
        arrow(ctx, vp.toX(a[0]), vp.toY(a[1]), vp.toX(b[0]), vp.toY(b[1]), { colour: colours[i], width: 3.5, head: px * 0.85 });
        if (f.F > 0) rich(f.name, (vp.toX(a[0]) + vp.toX(b[0])) / 2 + 8, (vp.toY(a[1]) + vp.toY(b[1])) / 2 - 8, { colour: pal.ink, px, kind: 'strong', box: pal.bg });
      });
      const end = pts[pts.length - 1];
      if (R.magnitude > 0) {
        arrow(ctx, vp.toX(0), vp.toY(0), vp.toX(end[0]), vp.toY(end[1]), { colour: pal.ink, width: 3, head: px * 0.85, dashed: true });
        label(ctx, 'R', (vp.toX(0) + vp.toX(end[0])) / 2 - 10, (vp.toY(0) + vp.toY(end[1])) / 2 + px, { colour: pal.ink, px: px + 2, kind: 'strong', box: pal.bg });
      } else {
        label(ctx, 'The polygon closes', px0 + pw / 2, bottom - px * 0.5, { colour: pal.ink, px, kind: 'strong', align: 'center' });
      }
    }

    // Summary.
    const y1 = H - pad - px * 1.3;
    let summary;
    if (R.magnitude === 0) summary = compact ? 'R = 0: in equilibrium' : `ΣFx = 0, ΣFy = 0: R = 0, so the forces are in equilibrium${forces.length === 3 ? ' (three forces: concurrent and a closed triangle)' : ''}.`;
    else summary = compact ? `R = ${fmt(R.magnitude)} N at ${deg(R.angle)}` : `ΣFx = ${fmt(R.fx)} N   ΣFy = ${fmt(R.fy)} N   R = ${fmt(R.magnitude)} N at ${deg(R.angle)}   E = ${fmt(E.magnitude)} N at ${deg(E.angle)}`;
    label(ctx, summary, pad, y1, { colour: pal.ink, px, kind: R.magnitude === 0 ? 'strong' : 'mono' });
    label(ctx, compact ? 'R dashed; E green' : 'Angles anticlockwise from +x. R dashed; equilibrant E solid green.', pad, y1 + px * 1.35, { colour: pal.muted, px });
  }

  function drawBoom(model, params) {
    const W = surface.width;
    const H = surface.height;
    const px = stageFontPx(W);
    const pad = Math.round(px * 1.1);
    const compact = W < 760;
    const b = model.boom;
    const L = params.boomLength;
    const h = params.cableHeight;
    title('Three-force body: boom, cable and load', px, pad);
    const top = pad + px * 3;
    const bottom = H - pad - px * 3.2;
    const sceneW = compact ? W - 2 * pad : W * 0.6;
    const vp = viewport({ x: [-0.25 * L, L * 1.12], y: [-0.18 * h - 0.35, h * 1.1], rect: { x: pad + px * 2, y: top, w: sceneW - px * 4, h: bottom - top }, equal: true });
    const P = (x, y) => [vp.toX(x), vp.toY(y)];
    const [Ax, Ay] = P(0, 0);
    const [Bx, By] = P(L, 0);
    const [Cx, Cy] = P(0, h);
    const [Wx, Wy] = P(b.x, 0);
    const [Ox, Oy] = P(b.O.x, b.O.y);
    // Wall.
    ground(Ax, vp.toY(h * 1.08), Ax, vp.toY(-0.15 * h - 0.3), -1, 0, px);
    // Lines of action (dashed, extended).
    line(Wx, vp.toY(h * 1.05), Wx, vp.toY(-0.12 * h - 0.25), { colour: pal.muted, width: 1.5, dash: [8, 6] });
    const ext = (x0, y0, x1, y1, t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    const c2 = ext(Cx, Cy, Bx, By, 1.15);
    line(Cx, Cy, c2[0], c2[1], { colour: pal.muted, width: 1.5, dash: [8, 6] });
    if (b.RA > 0) {
      const o2 = ext(Ax, Ay, Ox, Oy, Math.max(1.25, 1));
      line(Ax, Ay, o2[0], o2[1], { colour: pal.muted, width: 1.5, dash: [8, 6] });
    }
    // Cable and boom.
    line(Bx, By, Cx, Cy, { colour: pal.series[1], width: 3 });
    ctx.save();
    ctx.fillStyle = pal.panel;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2.5;
    const bt = Math.max(10, px * 0.65);
    ctx.fillRect(Ax, Ay - bt / 2, Bx - Ax, bt);
    ctx.strokeRect(Ax, Ay - bt / 2, Bx - Ax, bt);
    ctx.restore();
    for (const [x, y, n] of [
      [Ax, Ay, 'A'],
      [Bx, By, 'B'],
      [Cx, Cy, 'C'],
    ]) {
      ctx.save();
      ctx.fillStyle = pal.panel;
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      label(ctx, n, x + (n === 'B' ? px * 0.6 : px * 0.5), y + (n === 'C' ? -px * 0.4 : px * 1.4), { colour: pal.ink, px: px + 2, kind: 'strong' });
    }
    // Forces at their points of application.
    const fl = px * 4;
    arrow(ctx, Wx, Wy + bt / 2, Wx, Wy + bt / 2 + fl, { colour: pal.ink, width: 3.5, head: px * 0.85 });
    label(ctx, `W = ${formatPlain(params.boomLoad)} kN`, Wx + px * 0.5, Wy + bt / 2 + fl, { colour: pal.ink, px, kind: 'strong', box: pal.bg });
    const tl = Math.hypot(Cx - Bx, Cy - By);
    const tu = [(Cx - Bx) / tl, (Cy - By) / tl];
    arrow(ctx, Bx, By, Bx + tu[0] * fl, By + tu[1] * fl, { colour: pal.series[1], width: 3.5, head: px * 0.85 });
    label(ctx, `T = ${fmt(b.T)} kN`, Bx + tu[0] * fl + px * 0.5, By + tu[1] * fl - px * 0.3, { colour: pal.ink, px, kind: 'mono', box: pal.bg });
    if (b.RA > 0) {
      const ru = [b.Ax / b.RA, -b.Ay / b.RA];
      arrow(ctx, Ax, Ay, Ax + ru[0] * fl, Ay + ru[1] * fl, { colour: pal.series[2], width: 3.5, head: px * 0.85 });
      rich(`R_{A} = ${fmt(b.RA)} kN`, Ax + ru[0] * fl + px * 0.3, Ay + ru[1] * fl + (ru[1] < 0 ? -px * 0.5 : px * 1.2), { colour: pal.ink, px, kind: 'mono', box: pal.bg });
    }
    // O: where the lines of action meet.
    ctx.save();
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(Ox, Oy, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    label(ctx, 'O', Ox + 14, Oy - 10, { colour: pal.accentText, px: px + 2, kind: 'strong', box: pal.bg });

    // Force triangle.
    if (!compact) {
      const x0 = sceneW + pad;
      const w = W - pad - x0;
      label(ctx, 'Force triangle', x0, top + px * 0.2, { colour: pal.ink, px, kind: 'strong' });
      const W0 = params.boomLoad;
      const pts = [
        [0, 0],
        [0, -W0],
        [b.Tx, -W0 + b.Ty],
      ];
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      const tv = viewport({ x: [Math.min(...xs) - 1e-9, Math.max(...xs) + 1e-9], y: [Math.min(...ys) - 1e-9, Math.max(...ys) + 1e-9], rect: { x: x0 + px * 2.5, y: top + px * 2.4, w: w - px * 5, h: (bottom - top) * 0.62 }, equal: true });
      const seg = (a, c, colour, name) => {
        arrow(ctx, tv.toX(a[0]), tv.toY(a[1]), tv.toX(c[0]), tv.toY(c[1]), { colour, width: 3.5, head: px * 0.85 });
        rich(name, (tv.toX(a[0]) + tv.toX(c[0])) / 2 + 10, (tv.toY(a[1]) + tv.toY(c[1])) / 2, { colour: pal.ink, px, kind: 'strong', baseline: 'middle', box: pal.bg });
      };
      seg(pts[0], pts[1], pal.ink, 'W');
      seg(pts[1], pts[2], pal.series[1], 'T');
      if (b.RA > 0) seg(pts[2], pts[0], pal.series[2], 'R_{A}');
    }
    const y1 = H - pad - px * 1.3;
    rich('The lines of action of W and T meet at O, so the pin reaction R_{A} must also pass through O.', pad, y1, { colour: pal.ink, px });
    rich(`T = W a √(L² + h²) / (L h) = ${fmt(b.T)} kN    R_{A} at ${deg(b.RAangle)} above horizontal`, pad, y1 + px * 1.35, { colour: pal.muted, px, kind: 'mono' });
    if (model.outside) label(ctx, 'The load is past the end of the boom, so it acts at B.', W - pad, top, { colour: pal.accentText, px, align: 'right', box: pal.bg });
  }

  /* ------------------------------------------------------------------ incline */

  function drawIncline(model, params) {
    const W = surface.width;
    const H = surface.height;
    const px = stageFontPx(W);
    const pad = Math.round(px * 1.1);
    const compact = W < 760;
    const { r } = model;
    title(params.angle === 0 ? 'Block on a horizontal surface' : `Block on a ${formatPlain(params.angle)}° slope`, px, pad);
    label(ctx, `g = ${formatPlain(params.g)} m/s²`, W - pad, pad + px + 2, { colour: pal.ink, px, kind: 'mono', align: 'right' });

    const sceneW = compact ? W : W * 0.56;
    const top = pad + px * 2.6;
    const bottom = H - pad - (compact ? px * 3.2 : px * 0.5);
    const th = (params.angle * Math.PI) / 180;
    // Slope: hypotenuse of fixed screen length, rising to the right.
    const avW = sceneW - 2 * pad;
    const avH = bottom - top;
    const Lh = Math.min((avW * 0.9) / Math.max(Math.cos(th), 0.2), (avH * 0.78) / Math.max(Math.sin(th), 0.05), avW * 0.95);
    const x0 = pad + (avW - Lh * Math.cos(th)) / 2;
    // Base line low enough for the slope, but high enough that the block sits near mid-height,
    // leaving room for the weight arrow below it (a flat surface sits in the middle of the scene).
    const bhEst = px * 3;
    const yb = Math.min(bottom - px * 0.5, top + avH * 0.52 + (Lh * Math.sin(th)) / 2 + (bhEst / 2) * Math.cos(th));
    const x1 = x0 + Lh * Math.cos(th);
    const y1 = yb - Lh * Math.sin(th);
    ctx.save();
    ctx.fillStyle = pal.grid;
    ctx.beginPath();
    ctx.moveTo(x0, yb);
    ctx.lineTo(x1, yb);
    ctx.lineTo(x1, y1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
    ground(x0 - px, yb, x1 + px, yb, 0, 1, px);
    if (params.angle > 0) {
      ctx.save();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x0, yb, px * 3, -th, 0);
      ctx.stroke();
      ctx.restore();
      if (!compact) label(ctx, `θ = ${formatPlain(params.angle)}°`, x0 + px * 3.4, yb - px * 0.4, { colour: pal.ink, px, kind: 'mono' });
    }
    // Block on the middle of the slope.
    const u = [Math.cos(th), -Math.sin(th)]; // up the slope (screen)
    const nrm = [-Math.sin(th), -Math.cos(th)]; // away from the surface (screen)
    const mx = (x0 + x1) / 2;
    const my = (yb + y1) / 2;
    const bw = px * 4.6;
    const bh = px * 3;
    const cx = mx + nrm[0] * (bh / 2);
    const cy = my + nrm[1] * (bh / 2);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-th);
    ctx.fillStyle = pal.panel;
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2.5;
    ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    ctx.restore();

    // Free body diagram from the block's centre (a particle), arrows to one scale that keeps every
    // arrow and its label on the stage.
    const ph = (params.appliedAngle * Math.PI) / 180;
    const appliedDir = [u[0] * Math.cos(ph) + nrm[0] * Math.sin(ph), u[1] * Math.cos(ph) + nrm[1] * Math.sin(ph)];
    const fs = Math.sign(r.friction);
    const vectors = [
      [[0, 1], r.W],
      [nrm, r.N],
      [[u[0] * fs, u[1] * fs], Math.abs(r.friction)],
      [appliedDir, params.applied],
    ];
    const forcesMax = Math.max(1e-9, ...vectors.map((v) => v[1]));
    let k = (Math.min(avW, avH) * 0.34) / forcesMax;
    const box = { x0: pad + px, x1: sceneW - px, y0: top + px * 1.8, y1: H - pad - px * 1.6 };
    for (const [[vx, vy], mag] of vectors) {
      if (!(mag > 0)) continue;
      if (vx > 1e-6) k = Math.min(k, (box.x1 - cx) / (vx * mag));
      if (vx < -1e-6) k = Math.min(k, (box.x0 - cx) / (vx * mag));
      if (vy > 1e-6) k = Math.min(k, (box.y1 - cy) / (vy * mag));
      if (vy < -1e-6) k = Math.min(k, (box.y0 - cy) / (vy * mag));
    }
    k = Math.max(k, 0);
    ctx.fillStyle = pal.ink;
    ctx.fillRect(cx - 4, cy - 4, 8, 8);
    const tip = (vx, vy, mag) => [cx + vx * mag * k, cy + vy * mag * k];
    const lbl = (text, [ex, ey], [vx, vy], colour = pal.ink) => {
      rich(text, ex + vx * px * 0.7, ey + vy * px * 0.7, { colour, px, kind: 'mono', align: vx < -0.35 ? 'right' : vx > 0.35 ? 'left' : 'center', baseline: vy > 0.35 ? 'top' : vy < -0.35 ? 'bottom' : 'middle', box: pal.bg });
    };
    if (params.showComponents && params.angle > 0) {
      const a = tip(-u[0], -u[1], r.Wpar);
      const b2 = tip(-nrm[0], -nrm[1], r.Wperp);
      arrow(ctx, cx, cy, a[0], a[1], { colour: pal.muted, width: 2, head: px * 0.65, dashed: true });
      arrow(ctx, cx, cy, b2[0], b2[1], { colour: pal.muted, width: 2, head: px * 0.65, dashed: true });
      // Components' labels sit inside the wedge (below the down-slope arrow, right of the into-slope
      // arrow) so they never share a spot with friction or the weight.
      const inA = [-u[0] - nrm[0] * 1.6, -u[1] - nrm[1] * 1.6];
      const nA = Math.hypot(inA[0], inA[1]);
      if (!compact) {
        lbl(`W sin θ = ${fmt(r.Wpar)} N`, a, [inA[0] / nA, inA[1] / nA], pal.muted);
        lbl(`W cos θ = ${fmt(r.Wperp)} N`, b2, [1, 0], pal.muted);
      }
    }
    const wTip = tip(0, 1, r.W);
    arrow(ctx, cx, cy, wTip[0], wTip[1], { colour: pal.ink, width: 3.5, head: px * 0.85 });
    lbl(`W = ${fmt(r.W)} N`, wTip, [0, 1]);
    if (r.N > 0) {
      const nTip = tip(nrm[0], nrm[1], r.N);
      arrow(ctx, cx, cy, nTip[0], nTip[1], { colour: pal.series[1], width: 3.5, head: px * 0.85 });
      lbl(`N = ${fmt(r.N)} N`, nTip, nrm);
    }
    if (r.friction !== 0) {
      const s = Math.sign(r.friction);
      const fTip = tip(u[0] * s, u[1] * s, Math.abs(r.friction));
      arrow(ctx, cx, cy, fTip[0], fTip[1], { colour: pal.series[0], width: 3.5, head: px * 0.85 });
      lbl(`f = ${fmt(Math.abs(r.friction))} N`, fTip, [u[0] * s, u[1] * s]);
    }
    if (params.applied > 0) {
      const aTip = tip(appliedDir[0], appliedDir[1], params.applied);
      arrow(ctx, cx, cy, aTip[0], aTip[1], { colour: pal.series[2], width: 3.5, head: px * 0.85 });
      lbl(`F = ${formatPlain(params.applied)} N`, aTip, appliedDir);
    }

    // Working and verdict.
    const verdict = r.liftsOff ? 'LIFTS OFF THE SURFACE' : r.slipping ? `SLIPS ${r.direction === 'up' ? (params.angle === 0 ? 'FORWARD' : 'UP THE SLOPE') : params.angle === 0 ? 'BACKWARD' : 'DOWN THE SLOPE'}` : 'STAYS AT REST';
    if (compact) {
      label(ctx, verdict, pad, H - pad - px * 1.4, { colour: r.slipping ? pal.accentText : pal.ink, px: px + 2, kind: 'strong' });
      label(ctx, `needs ${fmt(r.needed)} N · μsN = ${fmt(r.frictionMax)} N`, pad, H - pad, { colour: pal.ink, px, kind: 'mono' });
      return;
    }
    const x = sceneW + pad;
    const w = W - pad - x;
    let y = top + px * 0.6;
    label(ctx, verdict, x, y, { colour: r.slipping ? pal.accentText : pal.ink, px: px + 6, kind: 'strong' });
    y += px * 2;
    const lines = [
      `W = mg = ${formatPlain(params.mass)} × ${formatPlain(params.g)} = ${fmt(r.W)} N`,
      params.angle > 0 ? `W along slope = W sin θ = ${fmt(r.Wpar)} N` : null,
      `W into ${params.angle > 0 ? 'slope' : 'surface'} = W cos θ = ${fmt(r.Wperp)} N`,
      params.applied > 0 ? `F along = ${fmt(r.Fpar)} N, F off surface = ${fmt(r.Fperp)} N` : null,
      `N = ${params.applied > 0 && r.Fperp !== 0 ? 'W cos θ − F off' : 'W cos θ'} = ${fmt(r.N)} N`,
    ].filter(Boolean);
    for (const t of lines) {
      label(ctx, t, x, y, { colour: pal.ink, px, kind: 'mono' });
      y += px * 1.5;
    }
    if (r.liftsOff) {
      y += px * 0.5;
      for (const t of wrap('The applied force pulls harder than the block presses on the surface, so there is no contact and no friction.', w, px)) {
        label(ctx, t, x, y, { colour: pal.ink, px });
        y += px * 1.4;
      }
      return;
    }
    // Bars: friction needed vs available.
    y += px * 0.6;
    const barMax = Math.max(r.needed, r.frictionMax, 1e-9);
    const bwid = w - px * 0.5;
    const bar = (value, colour, text, dashed) => {
      label(ctx, text, x, y, { colour: pal.ink, px });
      y += px * 0.5;
      const len = (bwid * value) / barMax;
      ctx.save();
      ctx.fillStyle = colour;
      ctx.globalAlpha = dashed ? 0.25 : 0.9;
      ctx.fillRect(x, y, len, px * 0.9);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 1.5;
      if (dashed) ctx.setLineDash([6, 4]);
      ctx.strokeRect(x, y, Math.max(len, 1), px * 0.9);
      ctx.restore();
      y += px * 2.1;
    };
    bar(r.needed, pal.series[0], `Friction needed to hold it: ${fmt(r.needed)} N`, false);
    bar(r.frictionMax, pal.series[1], `Most static friction can give, μs N: ${fmt(r.frictionMax)} N`, true);
    const rel = r.slipping ? '>' : '≤';
    label(ctx, `${fmt(r.needed)} ${rel} ${fmt(r.frictionMax)}  →  ${r.slipping ? 'slips' : 'holds'}`, x, y, { colour: pal.ink, px, kind: 'strong' });
    y += px * 1.6;
    if (params.applied === 0 && params.angle > 0) {
      label(ctx, `tan θ = ${fmt(Math.tan(th))} ${r.slipping ? '>' : '≤'} μs = ${formatPlain(params.muS)}`, x, y, { colour: pal.ink, px, kind: 'mono' });
      y += px * 1.5;
    }
    if (r.slipping) {
      label(ctx, `Kinetic friction μk N = ${fmt(Math.abs(r.friction))} N`, x, y, { colour: pal.ink, px, kind: 'mono' });
      y += px * 1.5;
      label(ctx, `a = ${fmt(Math.abs(r.a))} m/s² ${r.direction === 'up' ? (params.angle === 0 ? 'forward' : 'up the slope') : params.angle === 0 ? 'backward' : 'down the slope'}`, x, y, { colour: pal.ink, px, kind: 'mono' });
      y += px * 1.5;
      if (r.muKCapped) {
        for (const t of wrap(`μk is set above μs, which real surfaces don't do, so μk = μs = ${formatPlain(params.muS)} is used.`, w, px)) {
          label(ctx, t, x, y, { colour: pal.accentText, px });
          y += px * 1.35;
        }
      }
    } else {
      label(ctx, `a = 0: static friction f = ${fmt(Math.abs(r.friction))} N, not μs N`, x, y, { colour: pal.ink, px, kind: 'mono' });
    }
  }

  /* ------------------------------------------------------------------ dispatch */

  const DRAW = { truss: drawTruss, beam: drawBeam, moments: drawMoments, concurrent: drawConcurrent, incline: drawIncline };

  function draw(model, params, ui = {}) {
    surface.begin(pal.bg);
    ctx.lineCap = 'butt';
    DRAW[setup](model, params, ui);
  }

  /** What is under a canvas point (truss only): a joint, a member, empty plot space, or null. */
  function pick(x, y) {
    if (!layout) return null;
    const { plot, jp, jr, members, vp } = layout;
    if (x < plot.x0 || x > plot.x1 || y < plot.y0 || y > plot.y1) return null;
    let best = -1;
    let bestD = Math.max(22, jr + 14); // generous for fingers and for joints snapped to the grid
    jp.forEach(([X, Y], i) => {
      const d = Math.hypot(x - X, y - Y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0) return { kind: 'joint', index: best };
    let bm = -1;
    let bmD = 10;
    members.forEach(([a, b], k) => {
      const [x0, y0] = jp[a];
      const [x1, y1] = jp[b];
      const dx = x1 - x0;
      const dy = y1 - y0;
      const L2 = dx * dx + dy * dy || 1;
      const t = Math.min(1, Math.max(0, ((x - x0) * dx + (y - y0) * dy) / L2));
      const d = Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy));
      if (d < bmD) {
        bmD = d;
        bm = k;
      }
    });
    if (bm >= 0) return { kind: 'member', index: bm };
    return { kind: 'empty', wx: vp.fromX(x), wy: vp.fromY(y) };
  }

  return {
    canvas: surface.canvas,
    draw,
    pick,
    toWorld(x, y) {
      const { plot, vp } = layout;
      const cx = Math.min(Math.max(x, plot.x0), plot.x1);
      const cy = Math.min(Math.max(y, plot.y0), plot.y1);
      return [vp.fromX(cx), vp.fromY(cy)];
    },
    jointPx: (i) => layout?.jp[i] ?? [0, 0],
    /** Hold the current truss viewport: always while dragging; afterwards while everything fits. */
    hold() {
      if (layout) frozen = layout.vp;
      dragging = true;
    },
    endDrag() {
      dragging = false;
    },
    /** Refit the truss to the stage on the next draw (a control changed the structure). */
    refit() {
      frozen = null;
      dragging = false;
    },
    resize() {
      frozen = null;
      return surface.resize();
    },
    setTheme() {
      pal = readPalette(stage);
    },
    destroy: () => surface.destroy(),
  };
}
