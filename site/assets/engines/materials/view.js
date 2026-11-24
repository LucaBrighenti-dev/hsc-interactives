// materials engine view: drawing only. Reads model state; never changes physics.
// tensile      testing machine with a specimen that necks + stress–strain (or load–extension) graph
// selection    log–log strength vs density chart, constant σ/ρ guidelines, tie-rod calculator
// hardness     indenter and impression (side and plan views), formula with values, indenters compared
// fatigue-ndt  plate with a growing fatigue crack, schematic S–N and crack-growth graphs; NDT methods
import { createSurface, readPalette, stageFontPx, drawAxes, axisMargins, viewport, label, arrow, font } from '../../engine-kit.js';
import { formatNumber, formatPlain, superscript } from '../../format.js';
import { PROOF_OFFSET, specimenShape, curvePhase, crackLength, crackStage, snSchematic, ratioLineStrength, ROCKWELL_SCALES, NDT_FLAWS, NDT_MATERIALS } from './model.js';

const fmt = (v, sigfigs = 3) => formatNumber(v, { sigfigs });

export function createView(stage) {
  const surface = createSurface(stage);
  let pal = readPalette(stage);

  // ------------------------------------------------------------ small drawing helpers

  function fitText(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let s = text;
    while (s.length > 1 && ctx.measureText(`${s}…`).width > maxW) s = s.slice(0, -1);
    return `${s.trimEnd()}…`;
  }

  function wrap(ctx, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (line && ctx.measureText(t).width > maxW) {
        lines.push(line);
        line = w;
      } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }

  /** Wrapped paragraph; returns the y below it. */
  function para(ctx, text, x, y, maxW, { px, colour = pal.ink, kind = 'label', lineH = 1.3, maxLines = 99 } = {}) {
    ctx.save();
    ctx.font = font(kind, px);
    let lines = wrap(ctx, text, maxW);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = fitText(ctx, `${lines[maxLines - 1]}…`, maxW);
    }
    ctx.fillStyle = colour;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * px * lineH));
    ctx.restore();
    return y + lines.length * px * lineH;
  }

  function textWidth(ctx, text, px, kind = 'label') {
    ctx.save();
    ctx.font = font(kind, px);
    const w = ctx.measureText(text).width;
    ctx.restore();
    return w;
  }

  function rectFS(ctx, x, y, w, h, fill, stroke, lw = 1.5) {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, w, h);
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h));
    }
  }

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

  /** Marker shapes give a second cue beside colour. */
  function marker(ctx, shape, x, y, r, { fill, stroke, width = 2 }) {
    ctx.save();
    ctx.beginPath();
    if (shape === 'circle') ctx.arc(x, y, r, 0, Math.PI * 2);
    else if (shape === 'square') ctx.rect(x - r * 0.9, y - r * 0.9, r * 1.8, r * 1.8);
    else if (shape === 'triangle') {
      ctx.moveTo(x, y - r * 1.15);
      ctx.lineTo(x + r * 1.05, y + r * 0.75);
      ctx.lineTo(x - r * 1.05, y + r * 0.75);
      ctx.closePath();
    } else if (shape === 'diamond') {
      ctx.moveTo(x, y - r * 1.2);
      ctx.lineTo(x + r * 1.2, y);
      ctx.lineTo(x, y + r * 1.2);
      ctx.lineTo(x - r * 1.2, y);
      ctx.closePath();
    } else if (shape === 'cross') {
      ctx.moveTo(x - r, y - r);
      ctx.lineTo(x + r, y + r);
      ctx.moveTo(x + r, y - r);
      ctx.lineTo(x - r, y + r);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width + 1;
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Result glyphs drawn as paths: tick, tilde-like partial mark, cross. */
  function glyph(ctx, level, x, y, s, colour) {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(2.5, s * 0.18);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (level === 'yes') {
      ctx.moveTo(x - s * 0.45, y);
      ctx.lineTo(x - s * 0.12, y + s * 0.35);
      ctx.lineTo(x + s * 0.5, y - s * 0.4);
    } else if (level === 'partial') {
      ctx.moveTo(x - s * 0.5, y + s * 0.1);
      ctx.bezierCurveTo(x - s * 0.25, y - s * 0.35, x, y - s * 0.1, x, y);
      ctx.bezierCurveTo(x, y + s * 0.1, x + s * 0.25, y + s * 0.35, x + s * 0.5, y - s * 0.1);
    } else {
      ctx.moveTo(x - s * 0.4, y - s * 0.4);
      ctx.lineTo(x + s * 0.4, y + s * 0.4);
      ctx.moveTo(x + s * 0.4, y - s * 0.4);
      ctx.lineTo(x - s * 0.4, y + s * 0.4);
    }
    ctx.stroke();
    ctx.restore();
  }

  const levelColour = (level) => (level === 'yes' ? pal.series[2] : level === 'partial' ? pal.series[5] : pal.muted);
  const levelWord = (level) => (level === 'yes' ? 'Finds it' : level === 'partial' ? 'Partly' : 'Misses it');

  /** A small "SCHEMATIC" tag in a frame. */
  function schematicTag(ctx, x, y, px, align = 'right') {
    const text = 'SCHEMATIC';
    const w = textWidth(ctx, text, px, 'mono') + 12;
    const left = align === 'right' ? x - w : x;
    rectFS(ctx, left, y, w, px + 10, pal.bg, pal.axis, 1);
    label(ctx, text, left + 6, y + px + 2, { colour: pal.muted, px, kind: 'mono' });
  }

  function heading(ctx, title, sub, x, y, px, maxW) {
    ctx.save();
    ctx.font = font('strong', px + 2);
    const t = fitText(ctx, title, maxW);
    ctx.restore();
    label(ctx, t, x, y + px + 2, { colour: pal.ink, px: px + 2, kind: 'strong' });
    if (sub) {
      ctx.save();
      ctx.font = font('label', px);
      const s = fitText(ctx, sub, maxW);
      ctx.restore();
      label(ctx, s, x, y + px * 2.55, { colour: pal.muted, px });
    }
  }

  // ------------------------------------------------------------ tensile

  function drawTensile(ctx, W, H, px, { run, params }) {
    const pad = Math.round(px * 1.1);
    const mat = run.material;
    const narrow = W < 720;
    const sub = mat.custom
      ? 'Your values, drawn with the teaching model'
      : `${mat.basis === 'typical' ? 'Typical values' : 'Minimum specified values'}: ${mat.cite} · curve between them: teaching model`;
    heading(ctx, `${mat.name}: ${mat.grade}`, sub, pad, pad * 0.6, px, W - 2 * pad);
    const top = Math.round(pad * 0.6 + px * 3.6);
    const machineW = narrow ? Math.round(W * 0.3) : Math.round(Math.min(400, Math.max(240, W * 0.25)));
    drawMachine(ctx, { x: pad, y: top, w: machineW, h: H - top - pad * 0.6 }, run, px, narrow);
    const m = axisMargins(px);
    const gx = pad + machineW + Math.round(px * 1.2) + m.left;
    const rect = { x: gx, y: top + px * 0.3, w: W - gx - pad - m.right, h: H - (top + px * 0.3) - m.bottom - pad * 0.4 };
    drawTensileGraph(ctx, rect, px, run, params, narrow);
  }

  function drawMachine(ctx, R, run, px, narrow) {
    const c = run.curve;
    const e = run.strain();
    const shape = specimenShape(c, e);
    const o = run.outputs();
    const cx = R.x + R.w / 2;
    const colW = Math.max(8, Math.round(R.w * 0.07));
    const baseH = Math.max(px * 1.6, Math.round(R.h * 0.08));
    const headH = Math.max(14, Math.round(R.h * 0.06));
    const arrowRoom = px * 2.4;
    const gripW = R.w * 0.34;
    const gripL = R.h * 0.09;
    const shoulderL = R.h * 0.045;
    const w0 = R.w * 0.15;
    const gap = shape.broken ? Math.max(8, px * 0.7) : 0;
    const avail = R.h - arrowRoom - headH - baseH - 2 * gripL - 2 * shoulderL - px * 0.4 - Math.max(8, px * 0.7);
    const L0px = avail / (1 + c.eb * 1.02);
    const Lpx = L0px * shape.stretch;
    const yBottom = R.y + R.h - baseH;
    const yGaugeBot = yBottom - gripL - shoulderL;
    const yGaugeTop = yGaugeBot - Lpx;
    const yTop = yGaugeTop - shoulderL - gripL - gap;

    // Frame: two columns, base and the moving crosshead.
    const colX0 = R.x + R.w * 0.04;
    const colX1 = R.x + R.w * 0.96 - colW;
    rectFS(ctx, colX0, R.y + arrowRoom, colW, R.h - arrowRoom, pal.grid, pal.axis);
    rectFS(ctx, colX1, R.y + arrowRoom, colW, R.h - arrowRoom, pal.grid, pal.axis);
    rectFS(ctx, R.x, yBottom, R.w, baseH, pal.grid, pal.axis);
    rectFS(ctx, colX0 - 2, yTop - headH, colX1 + colW - colX0 + 4, headH, pal.grid, pal.axis);

    // Specimen outline: half-width along the length.
    const hw0 = (w0 / 2) * shape.width;
    const neckG = (s) => {
      if (c.kind === 'polymer') {
        const half = 0.05 + 0.43 * shape.drawn;
        const d = Math.abs(s - 0.5) - half;
        return d <= 0 ? 1 : Math.exp(-((d / 0.05) ** 2));
      }
      return Math.exp(-(((s - 0.5) / 0.1) ** 2));
    };
    const gaugeHalf = (s) => hw0 * (1 - shape.neckDepth * neckG(s));
    const shoulderHalf = (t, hwEnd) => hwEnd + (gripW / 2 - hwEnd) * (0.5 - 0.5 * Math.cos(Math.PI * t));

    const piece = (sFrom, sTo, yOff, withBottom, withTop) => {
      const right = [];
      if (withBottom) {
        right.push([yBottom, gripW / 2], [yBottom - gripL, gripW / 2]);
        for (let i = 1; i <= 10; i++) right.push([yBottom - gripL - (shoulderL * i) / 10, shoulderHalf(1 - i / 10, gaugeHalf(0))]);
      }
      const nS = 60;
      for (let i = 0; i <= nS; i++) {
        const s = sFrom + ((sTo - sFrom) * i) / nS;
        right.push([yGaugeBot - s * Lpx - yOff, gaugeHalf(s)]);
      }
      if (withTop) {
        const yT = yGaugeTop - yOff;
        for (let i = 1; i <= 10; i++) right.push([yT - (shoulderL * i) / 10, shoulderHalf(i / 10, gaugeHalf(1))]);
        right.push([yT - shoulderL - gripL, gripW / 2]);
      }
      ctx.beginPath();
      right.forEach(([y, h], i) => (i ? ctx.lineTo(cx + h, y) : ctx.moveTo(cx + h, y)));
      // Fracture face across the top of the lower piece or the bottom of the upper piece.
      const endY = right[right.length - 1][0];
      const endH = right[right.length - 1][1];
      if (!withTop && shape.broken) fractureEdge(ctx, cx, endY, endH, +1, c.kind);
      for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(cx - right[i][1], right[i][0]);
      if (!withBottom && shape.broken) fractureEdge(ctx, cx, right[0][0], right[0][1], -1, c.kind);
      ctx.closePath();
      ctx.fillStyle = pal.panel;
      ctx.fill();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    if (shape.broken) {
      piece(0, 0.5, 0, true, false);
      piece(0.5, 1, gap, false, true);
    } else piece(0, 1, 0, true, true);

    // Grip jaws.
    const jawW = Math.max(6, gripW * 0.16);
    for (const yJ of [yBottom - gripL, yTop]) {
      rectFS(ctx, cx - gripW / 2 - jawW, yJ, jawW, gripL, pal.axis, null);
      rectFS(ctx, cx + gripW / 2, yJ, jawW, gripL, pal.axis, null);
    }

    // Gauge marks and the gauge length.
    if (!shape.broken) {
      for (const yM of [yGaugeBot, yGaugeTop]) line(ctx, cx - hw0 - 8, yM, cx + hw0 + 8, yM, pal.accentText, 2.5);
    }
    const xDim = cx + gripW / 2 + jawW + Math.max(10, R.w * 0.04);
    if (xDim + 10 < colX1) {
      arrow(ctx, xDim, (yGaugeBot + yGaugeTop) / 2, xDim, yGaugeTop - gap, { colour: pal.muted, width: 1.5, head: 8 });
      arrow(ctx, xDim, (yGaugeBot + yGaugeTop) / 2, xDim, yGaugeBot, { colour: pal.muted, width: 1.5, head: 8 });
      label(ctx, 'L', xDim + 6, (yGaugeBot + yGaugeTop) / 2 + px * 0.35, { colour: pal.ink, px, kind: 'strong' });
    }

    // Pull: an arrow above the crosshead with the load.
    const ay = yTop - headH;
    if (!shape.broken) arrow(ctx, cx, ay - 2, cx, Math.max(R.y + 2, ay - arrowRoom + px * 0.2), { colour: pal.ink, width: 3, head: Math.max(10, px * 0.6) });
    const loadText = shape.broken ? `Broke at F = ${fmt(o.load)} kN` : `F = ${fmt(o.load)} kN`;
    label(ctx, loadText, Math.min(cx + px * 0.7, R.x + R.w - textWidth(ctx, loadText, px)), Math.max(R.y + px, ay - arrowRoom * 0.45), { colour: pal.ink, px, box: pal.bg });

    // Gauge length text inside the base.
    const lText = narrow ? `L = ${fmt(run.gaugeLength + o.extension)} mm` : `L₀ = ${formatPlain(run.gaugeLength)} mm → L = ${fmt(run.gaugeLength + o.extension)} mm`;
    ctx.save();
    ctx.font = font('mono', px);
    const lt = fitText(ctx, lText, R.w - 12);
    ctx.restore();
    label(ctx, lt, cx, yBottom + baseH / 2 + px * 0.32, { colour: pal.ink, px: px, kind: 'mono', align: 'center' });
  }

  function fractureEdge(ctx, cx, y, h, dir, kind) {
    // dir +1: top of the lower piece (drawn right → left); dir −1: bottom of the upper piece (left → right).
    if (kind === 'brittle') {
      // Flat, jagged break: no necking.
      const n = 6;
      for (let i = 0; i <= n; i++) {
        const x = dir > 0 ? cx + h - (2 * h * i) / n : cx - h + (2 * h * i) / n;
        ctx.lineTo(x, y + (i % 2 ? -3 : 3));
      }
    } else if (kind === 'ductile') {
      // Cup and cone: the lower end dips (cup), the upper end points down into it (cone).
      ctx.lineTo(cx, y + Math.min(5, h * 0.6));
    }
  }

  function drawTensileGraph(ctx, rect, px, run, params, narrow) {
    if (rect.w < 60 || rect.h < 60) return;
    const c = run.curve;
    const L0 = run.gaugeLength;
    const A0 = run.area;
    const ss = params.graph !== 'load-extension';
    const X = ss ? (e) => e * 100 : (e) => e * L0;
    const Y = ss ? (s) => s : (s) => (s * A0) / 1000;
    let eMax = c.eb * 1.06;
    if (params.zoom === 'start') {
      if (c.kind === 'polymer') eMax = c.ey * 1.3;
      else if (c.kind === 'ductile') eMax = Math.min(c.eb * 1.04, Math.max((4 * c.sy) / c.E + 0.004, 0.005));
    }
    const vp = viewport({ x: [0, X(eMax)], y: [0, Y(c.su * 1.28)], rect });
    drawAxes(ctx, vp, pal, { px, layer: 'under', xAxisAt: 'bottom', yAxisAt: 'left' });

    const meas = run.measure();
    const count = run.count;
    const es = run.strains;
    const sg = run.stresses;
    const step = Math.max(1, Math.floor(count / (rect.w * 1.5)));
    const P = (e, s) => [vp.toX(X(e)), vp.toY(Y(s))];

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y - 2, rect.w + 2, rect.h + 4);
    ctx.clip();

    // Toughness: the area under the curve (flat translucent fill).
    if (params.showArea && count > 1) {
      ctx.beginPath();
      ctx.moveTo(...P(0, 0));
      for (let i = 0; i < count; i += step) ctx.lineTo(...P(es[i], sg[i]));
      ctx.lineTo(...P(es[count - 1], sg[count - 1]));
      ctx.lineTo(...P(es[count - 1], 0));
      ctx.closePath();
      ctx.save();
      ctx.globalAlpha = 0.13;
      ctx.fillStyle = pal.series[0];
      ctx.fill();
      ctx.restore();
    }

    const Em = meas.modulus;
    // Elastic slope (fitted) and the 0.2% offset line.
    if (Em) {
      const sTop = Math.min(c.su * 1.1, (c.sy ?? c.su) * 1.15);
      line(ctx, ...P(0, 0), ...P(sTop / Em, sTop), pal.series[1], 2, [8, 6]);
      if (c.kind !== 'brittle' && c.kind !== 'polymer' && meas.yieldStrength !== null) {
        const sy = meas.yieldStrength;
        line(ctx, ...P(PROOF_OFFSET, 0), ...P(PROOF_OFFSET + sy / Em, sy), pal.series[1], 2, [8, 6]);
      }
    }

    // The curve so far.
    if (count > 1) {
      ctx.beginPath();
      ctx.moveTo(...P(0, 0));
      for (let i = step; i < count; i += step) ctx.lineTo(...P(es[i], sg[i]));
      ctx.lineTo(...P(es[count - 1], sg[count - 1]));
      ctx.strokeStyle = pal.series[0];
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    const done = run.isComplete();
    // Elastic recovery after fracture: the permanent elongation.
    if (done && Em && c.kind !== 'brittle') {
      const eb = es[count - 1];
      const sf = sg[count - 1];
      line(ctx, ...P(eb, sf), ...P(eb - sf / Em, 0), pal.muted, 2, [4, 5]);
    }
    ctx.restore();

    // Markers and their labels (outside the clip so labels can sit on the margin boxes).
    const labels = [];
    const inside = (x, y) => x >= rect.x - 1 && x <= rect.x + rect.w + 1 && y >= rect.y - 1 && y <= rect.y + rect.h + 1;
    if (Em) {
      const sT = Math.min((c.sy ?? c.su) * 0.55, c.su * 0.55);
      const [x, y] = P(sT / Em, sT);
      if (inside(x, y) && !narrow) labels.push({ text: `E = ${fmt(Em / 1000)} GPa`, x: x + 10, y, colour: pal.series[1] });
    }
    if (meas.yieldStrength !== null && Em) {
      const sy = meas.yieldStrength;
      const ey = c.kind === 'polymer' ? es[meas.utsIndex] : PROOF_OFFSET + sy / Em;
      const [x, y] = P(ey, sy);
      if (inside(x, y)) {
        marker(ctx, 'circle', x, y, 6, { fill: pal.bg, stroke: pal.series[1], width: 2.5 });
        const name = c.kind === 'polymer' ? 'Yield point' : c.plateau ? 'Yield stress' : '0.2% proof stress';
        if (!narrow) labels.push({ text: `${name} ${fmt(Y(sy))} ${ss ? 'MPa' : 'kN'}`, x: x + 12, y: y + px * 1.5, colour: pal.ink });
      }
    }
    const pastPeak = done || (c.kind !== 'brittle' && sg[count - 1] < meas.uts * 0.995 && count - 1 > meas.utsIndex);
    if (meas.uts !== null && pastPeak && c.kind !== 'polymer') {
      const [x, y] = P(es[meas.utsIndex], meas.uts);
      if (inside(x, y)) {
        marker(ctx, 'square', x, y, 6, { fill: pal.series[0], stroke: pal.ink, width: 1.5 });
        if (!narrow) labels.push({ text: `UTS ${fmt(Y(meas.uts))} ${ss ? 'MPa' : 'kN'}`, x, y: y - 14, colour: pal.ink, align: 'center' });
      }
    }
    if (done) {
      const [x, y] = P(es[count - 1], sg[count - 1]);
      if (inside(x, y)) {
        marker(ctx, 'cross', x, y, 7, { stroke: pal.ink, width: 2 });
        const t = c.kind === 'brittle' ? 'Fracture: no necking' : 'Fracture';
        labels.push({ text: t, x: x - 12, y: y + (c.kind === 'brittle' ? -14 : px * 1.6), colour: pal.ink, align: 'right' });
      }
      if (Em && c.kind !== 'brittle') {
        const ef = es[count - 1] - sg[count - 1] / Em;
        const [x0] = P(ef, 0);
        const txt = ss ? `A = ${fmt(ef * 100)}%` : `ΔL = ${fmt(ef * L0)} mm`;
        if (x0 > rect.x && x0 < rect.x + rect.w) labels.push({ text: txt, x: x0 - 6, y: rect.y + rect.h - px * 1.9 - 14, colour: pal.ink, align: 'right' });
      }
    } else if (count > 1) {
      const [x, y] = P(es[count - 1], sg[count - 1]);
      if (inside(x, y)) {
        ctx.fillStyle = pal.series[0];
        ctx.fillRect(x - 6, y - 6, 12, 12);
      }
    }

    drawAxes(ctx, vp, pal, { px, layer: 'over', xAxisAt: 'bottom', yAxisAt: 'left', xTitle: ss ? 'Strain ε (%)' : 'Extension δ (mm)', yTitle: ss ? 'Stress σ (MPa)' : 'Load F (kN)' });
    if (count <= 1) label(ctx, 'Press play to start the machine', rect.x + rect.w / 2, rect.y + rect.h / 2, { colour: pal.muted, px: px + 2, align: 'center', box: pal.bg });

    for (const l of labels) {
      const w = textWidth(ctx, l.text, px);
      let x = l.x;
      if (l.align === 'center') x = Math.min(Math.max(x, rect.x + w / 2 + 4), rect.x + rect.w - w / 2 - 4);
      else if (l.align === 'right') x = Math.max(x, rect.x + w + 4);
      else x = Math.min(x, rect.x + rect.w - w - 4);
      label(ctx, l.text, x, Math.min(Math.max(l.y, rect.y + px + 4), rect.y + rect.h - 6), { colour: l.colour, px, align: l.align ?? 'left', box: pal.bg });
    }

    // Phase of the test, top right of the graph.
    const phaseText = {
      elastic: 'Elastic: σ = Eε',
      yielding: c.kind === 'polymer' ? 'Yielding' : 'Yielding: plateau',
      hardening: 'Strain hardening',
      necking: 'Necking',
      drawing: 'Neck drawing along the specimen',
      fractured: 'Fractured',
    }[curvePhase(c, run.strain())];
    const zoomNote = params.zoom === 'start' ? ' · zoomed' : '';
    const pt = `${phaseText}${zoomNote}`;
    if (!narrow) label(ctx, pt, rect.x + rect.w - 6, rect.y + px + 6, { colour: pal.ink, px, kind: 'strong', align: 'right', box: pal.bg });
  }

  // ------------------------------------------------------------ selection

  const FAMILY = {
    metal: { shape: 'circle', colour: () => pal.series[1], name: 'Metals' },
    polymer: { shape: 'square', colour: () => pal.series[2], name: 'Polymers' },
    ceramic: { shape: 'triangle', colour: () => pal.series[3], name: 'Ceramics' },
    composite: { shape: 'diamond', colour: () => pal.series[5], name: 'Composites' },
  };

  function drawSelection(ctx, W, H, px, { solution, params }) {
    const pad = Math.round(px * 1.1);
    const side = W >= 980 ? Math.round(Math.min(500, W * 0.33)) : 0;
    const m = axisMargins(px);
    heading(
      ctx,
      'Strength against density (log–log)',
      params.strengthBasis === 'uts' ? 'Strength plotted: tensile strength (UTS)' : 'Strength plotted: yield (0.2% proof) stress',
      pad,
      pad * 0.6,
      px,
      W - side - 2 * pad,
    );
    const top = Math.round(pad * 0.6 + px * 3.8);
    const rect = { x: pad + m.left + px * 0.4, y: top, w: W - side - (pad + m.left + px * 0.4) - pad, h: H - top - m.bottom - px * 1.4 };
    if (rect.w < 80 || rect.h < 80) return;
    const xr = [500, 20000];
    const yr = [10, 3000];
    const lx0 = Math.log10(xr[0]);
    const lx1 = Math.log10(xr[1]);
    const ly0 = Math.log10(yr[0]);
    const ly1 = Math.log10(yr[1]);
    const X = (v) => rect.x + ((Math.log10(v) - lx0) / (lx1 - lx0)) * rect.w;
    const Y = (v) => rect.y + rect.h - ((Math.log10(v) - ly0) / (ly1 - ly0)) * rect.h;

    // Grid at 1, 2, 5 × 10ⁿ.
    const ticks = (lo, hi) => {
      const out = [];
      for (let k = Math.floor(Math.log10(lo)); k <= Math.ceil(Math.log10(hi)); k++) for (const f of [1, 2, 5]) {
        const v = f * 10 ** k;
        if (v >= lo * 0.999 && v <= hi * 1.001) out.push({ v, major: f === 1 });
      }
      return out;
    };
    ctx.save();
    for (const t of ticks(...xr)) line(ctx, Math.round(X(t.v)) + 0.5, rect.y, Math.round(X(t.v)) + 0.5, rect.y + rect.h, t.major ? pal.axis : pal.grid, t.major ? 1.2 : 1);
    for (const t of ticks(...yr)) line(ctx, rect.x, Math.round(Y(t.v)) + 0.5, rect.x + rect.w, Math.round(Y(t.v)) + 0.5, t.major ? pal.axis : pal.grid, t.major ? 1.2 : 1);
    ctx.restore();
    rectFS(ctx, rect.x, rect.y, rect.w, rect.h, null, pal.axis, 1.5);
    ctx.save();
    ctx.font = font('mono', px);
    ctx.fillStyle = pal.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const crowdedX = rect.w < 520;
    for (const t of ticks(...xr)) if (t.major || !crowdedX) ctx.fillText(fmt(t.v, 1), X(t.v), rect.y + rect.h + 6);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const crowdedY = rect.h < 300;
    for (const t of ticks(...yr)) if (t.major || !crowdedY) ctx.fillText(fmt(t.v, 1), rect.x - 8, Y(t.v));
    ctx.restore();
    label(ctx, 'Density ρ (kg/m³)', rect.x + rect.w - 4, rect.y + rect.h - 8, { colour: pal.ink, px, align: 'right', box: pal.bg });
    label(ctx, 'Strength σ (MPa)', rect.x + 8, rect.y + px + 6, { colour: pal.ink, px, box: pal.bg });

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    const { sel, cmp } = solution;
    // Region above the selected material's σ/ρ line: better strength-to-weight.
    const kSel = sel.specific;
    ctx.beginPath();
    ctx.moveTo(X(xr[0]), Y(ratioLineStrength(kSel, xr[0])));
    ctx.lineTo(X(xr[1]), Y(ratioLineStrength(kSel, xr[1])));
    ctx.lineTo(rect.x + rect.w, rect.y);
    ctx.lineTo(rect.x, rect.y);
    ctx.closePath();
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = pal.series[0];
    ctx.fill();
    ctx.restore();
    // Guidelines of constant σ/ρ.
    const slopeAngle = Math.atan2(-(rect.h / (ly1 - ly0)), rect.w / (lx1 - lx0));
    const GUIDES = [10, 30, 100, 300];
    const compact = rect.w < 480;
    if (params.guidelines) {
      for (const k of GUIDES) {
        line(ctx, X(xr[0]), Y(ratioLineStrength(k, xr[0])), X(xr[1]), Y(ratioLineStrength(k, xr[1])), pal.muted, 1.5, [6, 6]);
      }
    }
    line(ctx, X(xr[0]), Y(ratioLineStrength(kSel, xr[0])), X(xr[1]), Y(ratioLineStrength(kSel, xr[1])), pal.series[0], 2.5);
    ctx.restore();

    if (params.guidelines && !compact) {
      for (const k of GUIDES) {
        // Label each guideline just inside where it leaves the top or the right of the chart.
        const rho = Math.min(xr[1], (yr[1] * 1e3) / k) / 1.08;
        const s = ratioLineStrength(k, rho);
        if (s < yr[0] * 2) continue;
        ctx.save();
        ctx.translate(X(rho), Y(s));
        ctx.rotate(slopeAngle);
        label(ctx, `${k} kN·m/kg`, 0, -6, { colour: pal.muted, px: px, kind: 'mono', align: 'right', box: pal.bg, padding: 2 });
        ctx.restore();
      }
    }

    // Materials: markers first, then labels placed greedily so they avoid each other and the markers.
    const pts = solution.rows.map((r) => ({ r, x: X(r.density), y: Y(r.strength), isSel: r.id === sel.material.id, isCmp: r.id === cmp.material.id }));
    for (const p of pts) {
      const fam = FAMILY[p.r.family];
      if (p.isSel) marker(ctx, 'circle', p.x, p.y, 15, { stroke: pal.series[0], width: 3 });
      if (p.isCmp && !p.isSel) marker(ctx, 'circle', p.x, p.y, 15, { stroke: pal.ink, width: 2 });
      const hollow = p.r.kind === 'fracture';
      marker(ctx, fam.shape, p.x, p.y, 8, { fill: hollow ? pal.bg : fam.colour(), stroke: fam.colour(), width: 3 });
    }
    const boxes = pts.map((p) => ({ x0: p.x - 11, y0: p.y - 11, x1: p.x + 11, y1: p.y + 11 }));
    const hit = (b) => boxes.some((o) => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
    const order = [...pts].sort((a, b) => Number(b.isSel || b.isCmp) - Number(a.isSel || a.isCmp));
    for (const p of order) {
      if (compact && !p.isSel && !p.isCmp) continue;
      const strong = p.isSel || p.isCmp;
      const w = textWidth(ctx, p.r.label, px, strong ? 'strong' : 'label') + 4;
      const gap = strong ? 20 : 14;
      const candidates = [
        { dx: gap, dy: px * 0.35, align: 'left' },
        { dx: -gap, dy: px * 0.35, align: 'right' },
        { dx: 8, dy: -14, align: 'left' },
        { dx: 8, dy: px + 14, align: 'left' },
        { dx: -8, dy: -14, align: 'right' },
        { dx: -8, dy: px + 14, align: 'right' },
      ];
      const boxOf = (c) => {
        const left = c.align === 'left' ? p.x + c.dx - 2 : p.x + c.dx - w + 2;
        return { x0: left, y0: p.y + c.dy - px - 2, x1: left + w, y1: p.y + c.dy + 4 };
      };
      const fits = (b) => b.x0 >= rect.x + 2 && b.x1 <= rect.x + rect.w - 2 && b.y0 >= rect.y + px * 1.6 && b.y1 <= rect.y + rect.h - 2;
      const pick = candidates.find((c) => fits(boxOf(c)) && !hit(boxOf(c))) ?? candidates.find((c) => fits(boxOf(c))) ?? candidates[0];
      boxes.push(boxOf(pick));
      label(ctx, p.r.label, p.x + pick.dx, p.y + pick.dy, {
        colour: p.isSel ? pal.accentText : pal.ink,
        px,
        kind: strong ? 'strong' : 'label',
        align: pick.align,
        box: pal.bg,
        padding: 2,
      });
    }

    // Selected line label.
    if (!compact) {
      const rho = Math.min(xr[1] / 1.25, (yr[1] * 1e3) / kSel / 1.25);
      const x = X(rho);
      const y = Y(ratioLineStrength(kSel, rho));
      if (x > rect.x + 40 && y > rect.y + 10) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(slopeAngle);
        label(ctx, `σ/ρ = ${fmt(kSel)} kN·m/kg`, 0, -8, { colour: pal.accentText, px, kind: 'strong', align: 'right', box: pal.bg, padding: 2 });
        ctx.restore();
      }
    }
    if (rect.w > 700) label(ctx, 'Above the orange line: stronger for the same mass', rect.x + 10, rect.y + px * 2.7 + 8, { colour: pal.accentText, px, box: pal.bg });

    if (side) drawTieCalculator(ctx, { x: W - side - pad * 0.2, y: top, w: side - pad * 0.6, h: rect.h }, px, solution, params);
    else if (rect.w > 560) {
      // Legend along the bottom of the chart when there is no side panel.
      const legendY = rect.y + rect.h - px * 2.2 - 8;
      let lxp = rect.x + 12;
      for (const f of Object.values(FAMILY)) {
        marker(ctx, f.shape, lxp + 8, legendY - px * 0.35, 7, { fill: f.colour(), stroke: f.colour(), width: 2 });
        label(ctx, f.name, lxp + 22, legendY, { colour: pal.ink, px, box: pal.bg, padding: 2 });
        lxp += 22 + textWidth(ctx, f.name, px) + 18;
      }
    }
  }

  /** Legend in two columns: shape = family, hollow = fracture strength. */
  function legendGrid(ctx, x, y, w, px) {
    const items = [...Object.values(FAMILY).map((f) => ({ ...f, hollow: false })), { shape: 'circle', colour: () => pal.ink, name: 'Hollow: fracture strength', hollow: true }];
    const lh = px * 1.45;
    items.forEach((r, i) => {
      const col = i < 4 ? i % 2 : 0;
      const row = Math.floor(i / 2);
      const xx = x + col * (w / 2);
      const yy = y + row * lh;
      marker(ctx, r.shape, xx + 8, yy - px * 0.35, 7, { fill: r.hollow ? pal.bg : r.colour(), stroke: r.colour(), width: 2 });
      label(ctx, r.name, xx + 24, yy, { colour: pal.ink, px });
    });
  }

  function drawTieCalculator(ctx, R, px, { sel, cmp, massRatio }, params) {
    rectFS(ctx, R.x, R.y, R.w, R.h, pal.panel, pal.grid, 1);
    const x = R.x + px;
    const maxW = R.w - 2 * px;
    const carries = `Carries F = ${formatPlain(params.tieLoad)} kN over L = ${formatPlain(params.tieLength)} m with factor of safety n = ${formatPlain(params.factorOfSafety)}.`;
    ctx.save();
    ctx.font = font('label', px);
    const carriesLines = wrap(ctx, carries, maxW).length;
    ctx.restore();
    const kindName = (k) => (k === 'fracture' ? 'fracture' : k === 'uts' ? 'UTS' : 'yield');
    const rows = [
      ['σ (MPa)', fmt(sel.strength), fmt(cmp.strength)],
      ['σ measure', kindName(sel.kind), kindName(cmp.kind)],
      ['ρ (kg/m³)', fmt(sel.density), fmt(cmp.density)],
      ['σ/ρ (kN·m/kg)', fmt(sel.specific), fmt(cmp.specific)],
      ['A (mm²)', fmt(sel.area), fmt(cmp.area)],
      ['m (kg)', fmt(sel.mass), fmt(cmp.mass)],
    ];
    // Measured layout: drop the description, then the legend, if the panel is short.
    const core = px * (1.6 + 1.8 + 1.4 + 1.6 + 2.0 + rows.length * 1.5 + 0.3 + 2.8);
    const carriesH = px * (carriesLines * 1.3 + 0.5);
    const legendH = px * (3 * 1.45 + 1.4);
    const avail = R.h - px;
    const showCarries = core + carriesH <= avail;
    const showLegend = core + (showCarries ? carriesH : 0) + legendH <= avail;

    let y = R.y + px * 1.6;
    label(ctx, 'Strength-to-weight: a tie rod', x, y, { colour: pal.ink, px: px + 2, kind: 'strong' });
    y += px * 1.7;
    if (showCarries) y = para(ctx, carries, x, y, maxW, { px, colour: pal.muted }) + px * 0.5;
    label(ctx, 'A = nF/σ     m = ρAL = ρLnF/σ', x, y, { colour: pal.ink, px, kind: 'mono' });
    y += px * 1.8;
    ctx.save();
    ctx.font = font('strong', px);
    const nameA = fitText(ctx, `A: ${sel.material.label}`, maxW);
    const nameB = fitText(ctx, `B: ${cmp.material.label}`, maxW);
    ctx.restore();
    label(ctx, nameA, x, y, { colour: pal.accentText, px, kind: 'strong' });
    y += px * 1.4;
    label(ctx, nameB, x, y, { colour: pal.ink, px, kind: 'strong' });
    y += px * 1.6;
    const colA = x + maxW * 0.71;
    const colB = x + maxW;
    label(ctx, 'A', colA, y, { colour: pal.accentText, px, kind: 'strong', align: 'right' });
    label(ctx, 'B', colB, y, { colour: pal.ink, px, kind: 'strong', align: 'right' });
    y += px * 0.6;
    line(ctx, x, y, x + maxW, y, pal.grid, 1);
    y += px * 1.4;
    const bottom = R.y + R.h - (showLegend ? legendH : 0);
    for (const [k, a, b] of rows) {
      if (y > bottom - px * 0.5) break;
      label(ctx, k, x, y, { colour: pal.ink, px });
      label(ctx, a, colA, y, { colour: pal.ink, px, kind: 'mono', align: 'right' });
      label(ctx, b, colB, y, { colour: pal.ink, px, kind: 'mono', align: 'right' });
      y += px * 1.5;
    }
    y += px * 0.3;
    if (y < bottom - px * 1.2) {
      const text =
        sel.material.id === cmp.material.id
          ? 'Pick a different material B to compare.'
          : `Tie A has ${fmt(massRatio)} × the mass of tie B${massRatio < 1 ? ': lighter for the same job.' : ': heavier for the same job.'}`;
      para(ctx, text, x, y, maxW, { px, colour: pal.ink, kind: 'strong', maxLines: Math.max(1, Math.floor((bottom - y) / (px * 1.3))) });
    }
    if (showLegend) {
      const ly = R.y + R.h - legendH;
      line(ctx, x, ly, x + maxW, ly, pal.grid, 1);
      legendGrid(ctx, x, ly + px * 1.5, maxW, px);
    }
  }

  // ------------------------------------------------------------ hardness

  function drawHardness(ctx, W, H, px, { solution }) {
    const h = solution;
    const pad = Math.round(px * 1.1);
    const names = { brinell: 'Brinell hardness test', vickers: 'Vickers hardness test', rockwell: 'Rockwell hardness test' };
    const subs = {
      brinell: 'A hard ball is pressed in; measure the impression diameter',
      vickers: 'A diamond square pyramid is pressed in; measure the diagonals',
      rockwell: 'Measure how deep the indenter goes: read off a dial',
    };
    heading(ctx, names[h.method], subs[h.method], pad, pad * 0.6, px, W - 2 * pad);
    const top = Math.round(pad * 0.6 + px * 3.6);
    const stripH = H > 520 ? Math.round(Math.max(px * 4.2, H * 0.17)) : 0;
    const bodyH = H - top - stripH - pad * (stripH ? 1.2 : 0.6);
    const wide = W >= 820;
    const leftW = wide ? Math.round(W * 0.56) : W - 2 * pad;
    const ill = { x: pad, y: top, w: leftW, h: wide ? bodyH : bodyH * 0.42 };
    const fx = wide ? pad + leftW + pad : pad;
    const fy = wide ? top : top + ill.h + px * 0.4;
    const fw = wide ? W - fx - pad : W - 2 * pad;
    if (h.method === 'brinell') drawBrinell(ctx, ill, px, h);
    else if (h.method === 'vickers') drawVickers(ctx, ill, px, h);
    else drawRockwell(ctx, ill, px, h);
    drawHardnessFormula(ctx, { x: fx, y: fy, w: fw, h: wide ? bodyH : bodyH - ill.h - px * 0.4 }, px, h, wide);
    if (stripH) drawIndenterStrip(ctx, { x: pad, y: H - stripH - pad * 0.6, w: W - 2 * pad, h: stripH }, px, h.method);
  }

  /** The specimen block with a curved or V-shaped dip drawn by `dip(ctx)` along its top surface. */
  function block(ctx, x0, x1, ySurf, yBot, dip) {
    ctx.beginPath();
    ctx.moveTo(x0, yBot);
    ctx.lineTo(x0, ySurf);
    dip(ctx);
    ctx.lineTo(x1, ySurf);
    ctx.lineTo(x1, yBot);
    ctx.closePath();
    ctx.fillStyle = pal.grid;
    ctx.fill();
    ctx.strokeStyle = pal.axis;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function dimension(ctx, x0, y0, x1, y1, text, px, { colour = pal.ink, offset = 0, align = 'center', below = false } = {}) {
    arrow(ctx, (x0 + x1) / 2, (y0 + y1) / 2, x0, y0, { colour, width: 1.5, head: 8 });
    arrow(ctx, (x0 + x1) / 2, (y0 + y1) / 2, x1, y1, { colour, width: 1.5, head: 8 });
    const tx = align === 'left' ? Math.max(x0, x1) + 8 : (x0 + x1) / 2;
    const ty = (below ? Math.max(y0, y1) + px * 1.2 : Math.min(y0, y1) - 8) + offset;
    label(ctx, text, tx, ty, { colour, px, align: align === 'left' ? 'left' : 'center', box: pal.bg, padding: 2 });
  }

  function drawBrinell(ctx, R, px, h) {
    const plan = R.w >= 520;
    const sideW = plan ? R.w * 0.6 : R.w;
    const cx = R.x + sideW / 2;
    const ySurf = R.y + R.h * 0.6;
    const k = Math.max(1, Math.min(sideW * 0.55, ySurf - R.y - px * 3.4)) / h.D; // px per mm (magnified view)
    const depth = h.depth * k;
    const r = (h.D / 2) * k;
    const half = (h.d / 2) * k;
    const cy = ySurf + depth - r;
    // Block with the spherical cap.
    const a0 = Math.atan2(ySurf - cy, -half);
    const a1 = Math.atan2(ySurf - cy, half);
    block(ctx, R.x + 4, R.x + sideW - 4, ySurf, R.y + R.h - 4, (c) => {
      c.lineTo(cx - half, ySurf);
      c.arc(cx, cy, r, a0, a1, true);
    });
    // Ball.
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = pal.panel;
    ctx.fill();
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    arrow(ctx, cx, Math.max(R.y + 4, cy - r - px * 3), cx, cy - r - 4, { colour: pal.ink, width: 3, head: 12 });
    label(ctx, `F = ${formatPlain(h.F)} kgf`, cx + 12, Math.max(R.y + px, cy - r - px * 1.8), { colour: pal.ink, px, box: pal.bg });
    dimension(ctx, cx - r, cy, cx + r, cy, `D = ${formatPlain(h.D)} mm`, px);
    dimension(ctx, cx - half, ySurf + depth + px * 0.6, cx + half, ySurf + depth + px * 0.6, `d = ${formatPlain(h.d)} mm`, px, { below: true });
    if (R.h > 260) label(ctx, 'Side section, magnified', R.x + 6, R.y + R.h - 10, { colour: pal.muted, px, box: pal.grid, padding: 2 });

    // Plan view of the impression.
    if (!plan) return;
    const pw = R.w - sideW;
    const pcx = R.x + sideW + pw / 2;
    const pcy = R.y + R.h * 0.5;
    const rr = Math.min(pw * 0.36, R.h * 0.28);
    rectFS(ctx, pcx - pw * 0.45, pcy - R.h * 0.36, pw * 0.9, R.h * 0.72, pal.grid, pal.axis);
    ctx.beginPath();
    ctx.arc(pcx, pcy, rr, 0, Math.PI * 2);
    ctx.fillStyle = pal.bg;
    ctx.fill();
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    dimension(ctx, pcx - rr, pcy, pcx + rr, pcy, 'd', px);
    label(ctx, 'Plan view', pcx, pcy + R.h * 0.36 - 10, { colour: pal.muted, px, align: 'center', box: pal.grid, padding: 2 });
  }

  function drawVickers(ctx, R, px, h) {
    const plan = R.w >= 520;
    const sideW = plan ? R.w * 0.6 : R.w;
    const cx = R.x + sideW / 2;
    const ySurf = R.y + R.h * 0.55;
    const a = sideW * 0.5; // impression width across the faces (edge length d/√2), magnified
    const k = a / (h.d / Math.SQRT2);
    const depth = h.depth * k;
    block(ctx, R.x + 4, R.x + sideW - 4, ySurf, R.y + R.h - 4, (c) => {
      c.lineTo(cx - a / 2, ySurf);
      c.lineTo(cx, ySurf + depth);
      c.lineTo(cx + a / 2, ySurf);
    });
    // Indenter: faces at 68° to the axis, so it rises 1 unit for every tan 68° across.
    const t68 = Math.tan((68 * Math.PI) / 180);
    const hUp = Math.min(R.h * 0.42, ySurf + depth - R.y - px * 2.5);
    const spread = (hUp + 0) * t68;
    const tipY = ySurf + depth;
    const wTop = Math.min(spread, sideW * 0.46);
    const yTop = tipY - wTop / t68;
    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(cx + wTop, yTop);
    ctx.lineTo(cx + wTop, yTop - px * 1.2);
    ctx.lineTo(cx - wTop, yTop - px * 1.2);
    ctx.lineTo(cx - wTop, yTop);
    ctx.closePath();
    ctx.fillStyle = pal.panel;
    ctx.fill();
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    // 136° between opposite faces.
    const rArc = Math.min(wTop * 0.55, 60);
    ctx.beginPath();
    ctx.arc(cx, tipY, rArc, -Math.PI / 2 - (68 * Math.PI) / 180, -Math.PI / 2 + (68 * Math.PI) / 180);
    ctx.strokeStyle = pal.series[1];
    ctx.lineWidth = 2;
    ctx.stroke();
    label(ctx, '136°', cx, tipY - rArc - 8, { colour: pal.series[1], px, kind: 'strong', align: 'center', box: pal.panel, padding: 2 });
    arrow(ctx, cx, Math.max(R.y + 4, yTop - px * 1.2 - px * 2.6), cx, yTop - px * 1.2 - 4, { colour: pal.ink, width: 3, head: 12 });
    label(ctx, `F = ${formatPlain(h.F)} kgf`, cx + 12, Math.max(R.y + px, yTop - px * 2.8), { colour: pal.ink, px, box: pal.bg });
    if (R.h > 260) label(ctx, 'Side section, magnified', R.x + 6, R.y + R.h - 10, { colour: pal.muted, px, box: pal.grid, padding: 2 });

    // Plan view: a square impression seen corner-up, with both diagonals.
    if (!plan) return;
    const pw = R.w - sideW;
    const pcx = R.x + sideW + pw / 2;
    const pcy = R.y + R.h * 0.5;
    const half = Math.min(pw * 0.36, R.h * 0.3);
    rectFS(ctx, pcx - pw * 0.45, pcy - R.h * 0.38, pw * 0.9, R.h * 0.76, pal.grid, pal.axis);
    ctx.beginPath();
    ctx.moveTo(pcx, pcy - half);
    ctx.lineTo(pcx + half, pcy);
    ctx.lineTo(pcx, pcy + half);
    ctx.lineTo(pcx - half, pcy);
    ctx.closePath();
    ctx.fillStyle = pal.bg;
    ctx.fill();
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    line(ctx, pcx - half, pcy, pcx + half, pcy, pal.muted, 1, [4, 4]);
    line(ctx, pcx, pcy - half, pcx, pcy + half, pal.muted, 1, [4, 4]);
    dimension(ctx, pcx - half, pcy + half + px * 0.8, pcx + half, pcy + half + px * 0.8, 'd₁', px, { below: true });
    dimension(ctx, pcx + half + px * 0.6, pcy - half, pcx + half + px * 0.6, pcy + half, 'd₂', px, { align: 'left', offset: half + px * 0.3 });
    label(ctx, 'Plan view', pcx, pcy - R.h * 0.38 + px + 8, { colour: pal.muted, px, align: 'center', box: pal.grid, padding: 2 });
  }

  function drawRockwell(ctx, R, px, h) {
    const sc = ROCKWELL_SCALES[h.scale];
    const ball = h.scale === 'B';
    const panels = [
      { title: `1  Minor load ${sc.minorLoad} kgf`, sub: 'set the dial to zero', extra: 0 },
      { title: `2  Total load ${sc.totalLoad} kgf`, sub: 'indenter sinks further', extra: 1 },
      { title: `3  Back to ${sc.minorLoad} kgf`, sub: 'measure the depth h', extra: 0.5 },
    ];
    const pw = R.w / 3;
    const ySurf = R.y + R.h * 0.5;
    // Depths are schematic: h (the measured part) is drawn in proportion to the value set.
    const unit = Math.min((R.h * 0.25) / 0.34, pw * 0.59); // px per mm; the 120° cone's impression is 3.46 × its depth wide
    const d0 = 0.03 * unit;
    const dH = Math.max(2, h.h * unit);
    const dEl = 0.05 * unit;
    panels.forEach((p, i) => {
      const x0 = R.x + i * pw;
      const cx = x0 + pw / 2;
      const depth = d0 + (i === 0 ? 0 : i === 1 ? dH + dEl : dH);
      const tipY = ySurf + depth;
      const halfAngle = ball ? 0 : (60 * Math.PI) / 180;
      const holeW = ball ? Math.min(pw * 0.2, 2 * Math.sqrt(Math.max(0, 2 * 22 * depth - depth * depth))) : 2 * depth * Math.tan(halfAngle);
      block(ctx, x0 + 6, x0 + pw - 6, ySurf, R.y + R.h - 4, (c) => {
        c.lineTo(cx - holeW / 2, ySurf);
        c.lineTo(cx, tipY);
        c.lineTo(cx + holeW / 2, ySurf);
      });
      // Indenter.
      ctx.beginPath();
      if (ball) {
        ctx.arc(cx, tipY - 22, 22, 0, Math.PI * 2);
      } else {
        const up = Math.min(R.h * 0.3, pw * 0.3);
        ctx.moveTo(cx, tipY);
        ctx.lineTo(cx + up * Math.tan(halfAngle) * 0.55, tipY - up * 0.55);
        ctx.lineTo(cx + up * Math.tan(halfAngle) * 0.55, tipY - up);
        ctx.lineTo(cx - up * Math.tan(halfAngle) * 0.55, tipY - up);
        ctx.lineTo(cx - up * Math.tan(halfAngle) * 0.55, tipY - up * 0.55);
        ctx.closePath();
      }
      ctx.fillStyle = pal.panel;
      ctx.fill();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Reference line (zero under the minor load) and the depth h.
      line(ctx, x0 + 10, ySurf + d0, x0 + pw - 10, ySurf + d0, pal.series[1], 1.5, [6, 5]);
      if (i === 2) {
        const xd = cx + pw * 0.28;
        arrow(ctx, xd, ySurf + d0 + dH / 2, xd, ySurf + d0, { colour: pal.accentText, width: 2, head: 7 });
        arrow(ctx, xd, ySurf + d0 + dH / 2, xd, ySurf + d0 + dH, { colour: pal.accentText, width: 2, head: 7 });
        line(ctx, cx, tipY, xd + 6, tipY, pal.accentText, 1.5, [3, 3]);
        label(ctx, 'h', xd + 8, ySurf + d0 + dH / 2 + px * 0.35, { colour: pal.accentText, px, kind: 'strong' });
      }
      ctx.save();
      ctx.font = font('strong', px);
      const t = fitText(ctx, p.title, pw - 12);
      ctx.restore();
      label(ctx, t, x0 + 6, R.y + px + 2, { colour: pal.ink, px, kind: 'strong' });
      ctx.save();
      ctx.font = font('label', px);
      const s = fitText(ctx, p.sub, pw - 12);
      ctx.restore();
      label(ctx, s, x0 + 6, R.y + px * 2.4 + 2, { colour: pal.muted, px });
    });
    label(ctx, `Depths drawn to show the idea, not to scale. Zero line: blue dashes.`, R.x + 6, R.y + R.h - 10, { colour: pal.muted, px, box: pal.grid, padding: 2 });
  }

  function drawHardnessFormula(ctx, R, px, h, wide) {
    if (R.h < px * 3) return;
    const x = R.x;
    let y = R.y + px * 1.4;
    const big = Math.round(px * (wide ? 2.2 : 1.6));
    const mono = (t, yy, colour = pal.ink, size = px) => {
      ctx.save();
      ctx.font = font('mono', size);
      const s = fitText(ctx, t, R.w);
      ctx.restore();
      label(ctx, s, x, yy, { colour, px: size, kind: 'mono' });
    };
    if (h.method === 'brinell') {
      mono('HB = 2F / (πD(D − √(D² − d²)))', y);
      y += px * 1.7;
      mono(`   = 2 × ${formatPlain(h.F)} / (π × ${formatPlain(h.D)} × (${formatPlain(h.D)} − √(${formatPlain(h.D)}² − ${formatPlain(h.d)}²)))`, y);
      y += big * 1.5;
      mono(`HB = ${formatNumber(h.value, { sigfigs: 4 })}`, y, pal.accentText, big);
      y += px * 2.1;
      y = para(ctx, `F = ${formatPlain(h.F)} kgf = ${fmt(h.forceN / 1000)} kN. Impression depth h = ${fmt(h.depth)} mm.`, x, y, R.w, { px, colour: pal.ink });
      y += px * 0.6;
      const ok = h.check.ok && !h.clipped;
      glyph(ctx, ok ? 'yes' : 'no', x + px * 0.5, y - px * 0.35, px, ok ? pal.series[2] : pal.accentText);
      const ratio = h.d / h.D;
      const msg = h.clipped
        ? 'd must be smaller than the ball diameter D.'
        : ok
          ? `d/D = ${fmt(ratio, 2)}: inside 0.24 to 0.6, a valid test.`
          : `d/D = ${fmt(ratio, 2)}: outside 0.24 to 0.6. ${ratio < 0.24 ? 'Use a larger load.' : 'Use a smaller load.'}`;
      para(ctx, msg, x + px * 1.4, y, R.w - px * 1.4, { px, colour: pal.ink, kind: 'strong' });
    } else if (h.method === 'vickers') {
      mono('HV = 1.8544 F / d²', y);
      y += px * 1.7;
      mono(`   = 1.8544 × ${formatPlain(h.F)} / ${formatPlain(h.d)}²`, y);
      y += big * 1.5;
      mono(`HV = ${formatNumber(h.value, { sigfigs: 4 })}`, y, pal.accentText, big);
      y += px * 2.1;
      y = para(ctx, `F = ${formatPlain(h.F)} kgf = ${fmt(h.forceN)} N. d is the mean of the two diagonals, d = (d₁ + d₂)/2. Depth ≈ d/7 = ${fmt(h.depth)} mm.`, x, y, R.w, { px, colour: pal.ink });
      y += px * 0.4;
      para(ctx, '1.8544 = 2 sin 68°: it turns d² into the sloping area of the pyramid impression.', x, y, R.w, { px, colour: pal.muted });
    } else {
      const sc = ROCKWELL_SCALES[h.scale];
      mono(`${sc.name} = ${sc.N} − h / 0.002 mm`, y);
      y += px * 1.7;
      mono(`    = ${sc.N} − ${formatPlain(h.h)} / 0.002`, y);
      y += big * 1.5;
      mono(`${sc.name} = ${formatNumber(h.value, { sigfigs: 3 })}`, y, pal.accentText, big);
      y += px * 2.1;
      y = para(ctx, `Indenter: ${sc.indenter}. Total load ${sc.totalLoad} kgf. Used for ${sc.use}.`, x, y, R.w, { px, colour: pal.ink });
      y += px * 0.4;
      para(ctx, 'Each 0.002 mm of extra depth is one Rockwell point: deeper means softer. Quick, and no microscope needed.', x, y, R.w, { px, colour: pal.muted });
    }
  }

  function drawIndenterStrip(ctx, R, px, method) {
    const cards = [
      { id: 'brinell', title: 'Brinell', what: 'Ball (10 mm usual)', measures: 'measures the diameter' },
      { id: 'vickers', title: 'Vickers', what: 'Diamond pyramid, 136°', measures: 'measures the diagonals' },
      { id: 'rockwell', title: 'Rockwell', what: 'Diamond cone or ball', measures: 'measures the depth' },
    ];
    const gap = px;
    const cw = (R.w - 2 * gap) / 3;
    cards.forEach((c, i) => {
      const x = R.x + i * (cw + gap);
      const on = c.id === method;
      rectFS(ctx, x, R.y, cw, R.h, pal.panel, on ? pal.series[0] : pal.grid, on ? 3 : 1);
      const icon = Math.min(R.h * 0.55, px * 2.4);
      const ix = x + px + icon / 2;
      const iy = R.y + R.h / 2;
      ctx.save();
      ctx.strokeStyle = pal.ink;
      ctx.fillStyle = pal.bg;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (c.id === 'brinell') ctx.arc(ix, iy, icon / 2.2, 0, Math.PI * 2);
      else if (c.id === 'vickers') {
        ctx.moveTo(ix, iy + icon / 2);
        ctx.lineTo(ix + icon / 2, iy - icon / 4);
        ctx.lineTo(ix - icon / 2, iy - icon / 4);
        ctx.closePath();
      } else {
        ctx.moveTo(ix, iy + icon / 2);
        ctx.lineTo(ix + icon * 0.35, iy - icon * 0.05);
        ctx.lineTo(ix + icon * 0.35, iy - icon / 2);
        ctx.lineTo(ix - icon * 0.35, iy - icon / 2);
        ctx.lineTo(ix - icon * 0.35, iy - icon * 0.05);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      const tx = x + px * 1.6 + icon;
      const tw = cw - (tx - x) - px * 0.5;
      ctx.save();
      ctx.font = font('strong', px);
      const t1 = fitText(ctx, on ? `${c.title} (shown)` : c.title, tw);
      ctx.font = font('label', px);
      const t2 = fitText(ctx, c.what, tw);
      const t3 = fitText(ctx, c.measures, tw);
      ctx.restore();
      const lines = R.h > px * 4.4 ? [t1, t2, t3] : [t1, t3];
      const y0 = R.y + R.h / 2 - ((lines.length - 1) * px * 1.25) / 2 + px * 0.35;
      lines.forEach((t, j) => label(ctx, t, tx, y0 + j * px * 1.25, { colour: j === 0 ? (on ? pal.accentText : pal.ink) : pal.ink, px, kind: j === 0 ? 'strong' : 'label' }));
    });
  }

  // ------------------------------------------------------------ fatigue and NDT

  function drawFatigue(ctx, W, H, px, { run, params }) {
    const pad = Math.round(px * 1.1);
    const phi = run.life();
    const stage = crackStage(phi);
    heading(ctx, 'Fatigue: a crack grows from a hole under repeated loading', 'Cyclic load far below the UTS, applied millions of times', pad, pad * 0.6, px, W - 2 * pad);
    const top = Math.round(pad * 0.6 + px * 3.8);
    const wide = W >= 820;
    const leftW = wide ? Math.round(W * 0.38) : Math.round(W * 0.42);
    drawPlate(ctx, { x: pad, y: top, w: leftW, h: H - top - pad * 0.6 }, px, run, phi, stage);
    const m = axisMargins(px);
    const gx = pad + leftW + pad + m.left;
    const gw = W - gx - pad - px;
    const gh = (H - top - pad * 0.6 - m.bottom * 2 - px * 2.2) / 2;
    if (gw > 80 && gh > 60) {
      drawSN(ctx, { x: gx, y: top + px * 0.6, w: gw, h: gh }, px, params);
      drawCrackGraph(ctx, { x: gx, y: top + px * 0.6 + gh + m.bottom + px * 1.6, w: gw, h: gh }, px, run, phi);
    }
  }

  function drawPlate(ctx, R, px, run, phi, stage) {
    const cx = R.x + R.w / 2;
    const pw = Math.min(R.w * 0.8, R.h * 0.6);
    const ph = R.h - px * 7.5;
    const py = R.y + px * 3;
    const cy = py + ph / 2;
    const r = pw * 0.09;
    const broken = phi >= 1;
    const a = crackLength(phi, run) / run.ac; // 0 … 1 of the ligament
    const lig = pw / 2 - r;
    const crackEnd = cx + r + a * lig;
    const gap = broken ? px * 0.6 : 0;
    // Plate (two halves once broken).
    const half = (sign) => {
      const yEdge = cy + sign * gap;
      ctx.beginPath();
      ctx.moveTo(cx - pw / 2, yEdge);
      ctx.lineTo(cx - r, yEdge);
      ctx.arc(cx, yEdge, r, Math.PI, 0, sign > 0);
      ctx.lineTo(cx + pw / 2, yEdge);
      ctx.lineTo(cx + pw / 2, sign > 0 ? py + ph + gap : py - gap);
      ctx.lineTo(cx - pw / 2, sign > 0 ? py + ph + gap : py - gap);
      ctx.closePath();
      ctx.fillStyle = pal.grid;
      ctx.fill();
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    if (broken) {
      half(-1);
      half(1);
      // The left ligament never cracked in this schematic: the final overload tears it.
    } else {
      rectFS(ctx, cx - pw / 2, py, pw, ph, pal.grid, pal.axis);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = pal.bg;
      ctx.fill();
      ctx.strokeStyle = pal.axis;
      ctx.stroke();
      // Crack: a thin dark line opening slightly.
      if (a > 0.004) {
        ctx.beginPath();
        ctx.moveTo(cx + r, cy - 2.5);
        ctx.lineTo(crackEnd, cy);
        ctx.lineTo(cx + r, cy + 2.5);
        ctx.closePath();
        ctx.fillStyle = pal.ink;
        ctx.fill();
        line(ctx, cx + r, cy, crackEnd, cy, pal.ink, 2);
      }
      marker(ctx, 'circle', crackEnd, cy, 4, { fill: pal.series[0], stroke: pal.series[0] });
      label(ctx, 'crack tip', Math.min(crackEnd + 8, cx + pw / 2 - textWidth(ctx, 'crack tip', px) - 4), cy - 10, { colour: pal.ink, px, box: pal.grid, padding: 2 });
    }
    // Cyclic load arrows at both ends.
    const arrowL = px * 2.2;
    arrow(ctx, cx, py - 4 - gap, cx, py - 4 - gap - arrowL, { colour: pal.ink, width: 3, head: 12 });
    arrow(ctx, cx, py + ph + 4 + gap, cx, py + ph + 4 + gap + arrowL, { colour: pal.ink, width: 3, head: 12 });
    label(ctx, 'cyclic load', cx + 12, py - gap - arrowL * 0.45, { colour: pal.ink, px });
    // Stage text.
    const stageText = {
      initiation: 'Stage 1: a crack starts at the hole, where stress is concentrated',
      growth: 'Stage 2: the crack grows a little with every cycle',
      fracture: 'Stage 3: the rest cannot carry the load: sudden fracture',
    }[stage];
    para(ctx, stageText, R.x, py + ph + arrowL + px * 2.2, R.w, { px, colour: stage === 'fracture' ? pal.accentText : pal.ink, kind: 'strong', maxLines: 2 });
  }

  function drawSN(ctx, R, px, params) {
    const lx0 = 3;
    const lx1 = 9;
    const X = (l) => R.x + ((l - lx0) / (lx1 - lx0)) * R.w;
    const Y = (s) => R.y + R.h - (s / 1.08) * R.h;
    rectFS(ctx, R.x, R.y, R.w, R.h, null, pal.axis, 1.5);
    ctx.save();
    ctx.font = font('mono', px);
    ctx.fillStyle = pal.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let l = lx0; l <= lx1; l++) {
      line(ctx, X(l), R.y, X(l), R.y + R.h, pal.grid, 1);
      ctx.fillText(`10${superscript(l)}`, X(l), R.y + R.h + 6);
    }
    ctx.restore();
    const show = params.snCurves;
    const curve = (kind, colour, dash) => {
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const l = lx0 + ((lx1 - lx0) * i) / 120;
        const x = X(l);
        const y = Y(snSchematic(kind, l));
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.strokeStyle = colour;
      ctx.lineWidth = 3;
      if (dash) ctx.setLineDash(dash);
      ctx.stroke();
      ctx.restore();
    };
    if (show !== 'aluminium') {
      curve('steel', pal.series[1], null);
      const yE = Y(snSchematic('steel', 9));
      label(ctx, 'Steel: endurance limit (flat)', X(8.9), yE - 10, { colour: pal.series[1], px, kind: 'strong', align: 'right', box: pal.bg, padding: 2 });
    }
    if (show !== 'steel') {
      curve('aluminium', pal.series[2], [10, 7]);
      const yA = Y(snSchematic('aluminium', 8.2));
      label(ctx, 'Aluminium: no endurance limit (dashed)', X(8.9), yA + px + 10, { colour: pal.series[2], px, kind: 'strong', align: 'right', box: pal.bg, padding: 2 });
    }
    label(ctx, 'Stress amplitude S', R.x + 8, R.y + px + 6, { colour: pal.ink, px, box: pal.bg });
    label(ctx, 'Cycles to failure N (log)', R.x + R.w - 4, R.y + R.h - 8, { colour: pal.ink, px, align: 'right', box: pal.bg });
    schematicTag(ctx, R.x + R.w - 6, R.y + 6, px);
  }

  function drawCrackGraph(ctx, R, px, run, phi) {
    const X = (f) => R.x + f * R.w;
    const Y = (r) => R.y + R.h - r * R.h * 0.95;
    rectFS(ctx, R.x, R.y, R.w, R.h, null, pal.axis, 1.5);
    // Stage bands.
    line(ctx, X(0.1), R.y, X(0.1), R.y + R.h, pal.muted, 1.5, [5, 5]);
    ctx.save();
    ctx.font = font('mono', px);
    ctx.fillStyle = pal.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const f of [0, 0.25, 0.5, 0.75, 1]) ctx.fillText(`${f * 100}%`, X(f), R.y + R.h + 6);
    ctx.restore();
    const path = (to, colour, width) => {
      ctx.beginPath();
      const n = Math.max(2, Math.ceil(to * 200));
      for (let i = 0; i <= n; i++) {
        const f = (to * i) / n;
        const x = X(f);
        const y = Y(crackLength(f, run) / run.ac);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.stroke();
    };
    path(1, pal.grid, 2);
    if (phi > 0) path(phi, pal.series[0], 3);
    const x = X(phi);
    const y = Y(crackLength(phi, run) / run.ac);
    ctx.fillStyle = pal.series[0];
    ctx.fillRect(x - 6, y - 6, 12, 12);
    label(ctx, 'Crack length a', R.x + 8, R.y + px + 6, { colour: pal.ink, px, box: pal.bg });
    label(ctx, 'Fatigue life used', R.x + R.w - 4, R.y + R.h - 8, { colour: pal.ink, px, align: 'right', box: pal.bg });
    label(ctx, 'starts slowly', X(0.12) + 4, Y(0.08) - 8, { colour: pal.muted, px, box: pal.bg, padding: 2 });
    label(ctx, 'then speeds up', X(0.94), Y(0.55), { colour: pal.muted, px, align: 'right', box: pal.bg, padding: 2 });
    schematicTag(ctx, R.x + R.w - 6, R.y + 6, px);
  }

  function drawNdt(ctx, W, H, px, { run, solution, params }) {
    const pad = Math.round(px * 1.1);
    const cur = solution.current;
    const flaw = NDT_FLAWS.find((f) => f.id === params.flaw);
    const mat = NDT_MATERIALS.find((m) => m.id === params.ndtMaterial);
    heading(ctx, `Non-destructive testing: ${cur.method.name}`, `${flaw.name} in ${mat.name.toLowerCase()}`, pad, pad * 0.6, px, W - 2 * pad);
    const top = Math.round(pad * 0.6 + px * 3.8);
    const wide = W >= 900;
    const leftW = wide ? Math.round(W * 0.4) : W - 2 * pad;
    const leftH = H - top - pad * 0.6;
    drawNdtPart(ctx, { x: pad, y: top, w: leftW, h: leftH }, px, params, cur, run.life());
    if (wide) drawNdtTable(ctx, { x: pad + leftW + pad * 1.2, y: top, w: W - leftW - pad * 3.2, h: H - top - pad * 0.6 }, px, solution, params);
  }

  /**
   * The part in section with its flaw, and the method at work. `scan` (0 → 1, the run's progress) moves
   * the probe, eye or magnet across the part, runs the dye penetrant steps, or builds up the X-ray exposure.
   */
  function drawNdtPart(ctx, R, px, params, cur, scan) {
    const method = params.ndtMethod;
    const flaw = params.flaw;
    const level = cur.level;
    const found = level !== 'no';
    const partW = R.w * 0.86;
    const partH = Math.min(R.h * 0.3, partW * 0.4);
    const px0 = R.x + (R.w - partW) / 2;
    const toolTop = R.y + px * 0.4;
    const py0 = R.y + px * 4.6;
    const fx = px0 + partW * 0.58;
    const toolX = px0 + partW * (0.08 + 0.84 * scan);
    const passed = toolX >= fx - 2;

    // Part cross-section; composite layers drawn as lines (a second cue beside the label).
    rectFS(ctx, px0, py0, partW, partH, pal.grid, pal.axis);
    if (params.ndtMaterial === 'cfrp') {
      for (let i = 1; i < 8; i++) line(ctx, px0, py0 + (partH * i) / 8, px0 + partW, py0 + (partH * i) / 8, pal.axis, 1);
    }
    label(ctx, { steel: 'Steel', aluminium: 'Aluminium', cfrp: 'CFRP (layers)' }[params.ndtMaterial], px0 + 8, py0 + partH - 10, { colour: pal.muted, px, box: pal.grid, padding: 2 });

    // The flaw.
    let flawY;
    ctx.save();
    ctx.fillStyle = pal.ink;
    if (flaw === 'surface-crack') {
      ctx.beginPath();
      ctx.moveTo(fx - 5, py0);
      ctx.lineTo(fx + 1, py0 + partH * 0.38);
      ctx.lineTo(fx + 5, py0);
      ctx.closePath();
      ctx.fill();
      flawY = py0 + partH * 0.2;
    } else if (flaw === 'subsurface-crack') {
      line(ctx, fx - partW * 0.06, py0 + partH * 0.12, fx + partW * 0.06, py0 + partH * 0.22, pal.ink, 3);
      flawY = py0 + partH * 0.17;
    } else if (flaw === 'internal-void') {
      ctx.beginPath();
      ctx.ellipse(fx, py0 + partH * 0.58, partW * 0.05, partH * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      flawY = py0 + partH * 0.58;
    } else {
      ctx.beginPath();
      ctx.ellipse(fx, py0 + partH * 0.5, partW * 0.16, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      flawY = py0 + partH * 0.5;
    }
    ctx.restore();

    /** A ring on the surface marking an indication the inspector has found. */
    const indication = () => {
      if (!found || !passed) return;
      ctx.save();
      ctx.strokeStyle = pal.series[0];
      ctx.lineWidth = 3;
      if (level === 'partial') ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.ellipse(fx, py0, partW * 0.06, px * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    let y = py0 + partH + px * 1.2; // flow position below the part
    let stepText = '';
    if (method === 'visual') {
      const ey = toolTop + px * 1.3;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(toolX, ey, px * 1.3, px * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = pal.bg;
      ctx.fill();
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(toolX, ey, px * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = pal.ink;
      ctx.fill();
      ctx.restore();
      line(ctx, toolX - px * 0.5, ey + px * 0.6, toolX - partW * 0.06, py0, pal.series[1], 2, [6, 5]);
      line(ctx, toolX + px * 0.5, ey + px * 0.6, toolX + partW * 0.06, py0, pal.series[1], 2, [6, 5]);
      indication();
      stepText = 'Look along the surface';
    } else if (method === 'dye') {
      const stage = Math.min(3, Math.floor(scan * 4));
      const devH = px * 0.9;
      const surfaceCrack = flaw === 'surface-crack' && params.ndtMaterial !== 'cfrp';
      const crackDye = () => {
        ctx.save();
        ctx.fillStyle = pal.series[0];
        ctx.beginPath();
        ctx.moveTo(fx - 4, py0);
        ctx.lineTo(fx + 1, py0 + partH * 0.36);
        ctx.lineTo(fx + 4, py0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      if (stage <= 1) {
        rectFS(ctx, px0, py0 - 5, partW, 5, pal.series[0], null);
        if (surfaceCrack && stage === 1) crackDye();
        stepText = stage === 0 ? '1 Apply red dye to the clean surface' : '2 Wait: dye seeps into open cracks';
      } else if (stage === 2) {
        if (surfaceCrack) crackDye();
        stepText = '3 Wipe the surface dye off';
      } else {
        rectFS(ctx, px0, py0 - devH, partW, devH, pal.panel, pal.axis, 1);
        if (surfaceCrack) {
          crackDye();
          ctx.save();
          ctx.fillStyle = pal.series[0];
          ctx.beginPath();
          ctx.ellipse(fx, py0 - devH / 2, partW * 0.05, devH * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        stepText = surfaceCrack ? '4 White developer draws the dye out: a red line' : '4 White developer: no red line appears';
      }
    } else if (method === 'magnetic') {
      const legW = px * 1.1;
      const span = partW * 0.18;
      const yl = toolX - span;
      const yr = toolX + span;
      ctx.save();
      ctx.fillStyle = pal.panel;
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(yl - legW / 2, py0);
      ctx.lineTo(yl - legW / 2, toolTop + px);
      ctx.lineTo(yr + legW / 2, toolTop + px);
      ctx.lineTo(yr + legW / 2, py0);
      ctx.lineTo(yr - legW / 2, py0);
      ctx.lineTo(yr - legW / 2, toolTop + px + legW);
      ctx.lineTo(yl + legW / 2, toolTop + px + legW);
      ctx.lineTo(yl + legW / 2, py0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      label(ctx, 'N', yl, py0 - px * 0.5, { colour: pal.ink, px, kind: 'strong', align: 'center', box: pal.panel, padding: 1 });
      label(ctx, 'S', yr, py0 - px * 0.5, { colour: pal.ink, px, kind: 'strong', align: 'center', box: pal.panel, padding: 1 });
      if (params.ndtMaterial === 'steel') {
        for (let i = 1; i <= 3; i++) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(yl, py0 + 2);
          ctx.quadraticCurveTo(toolX, py0 + partH * 0.24 * i, yr, py0 + 2);
          ctx.strokeStyle = pal.series[1];
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]);
          ctx.stroke();
          ctx.restore();
        }
        // Particles collect at the crack once the field has passed over it.
        if (found && passed) {
          ctx.fillStyle = pal.ink;
          const n = level === 'yes' ? 14 : 6;
          for (let i = 0; i < n; i++) ctx.fillRect(fx - 10 + (20 * i) / (n - 1) - 1.5, py0 - 4 - Math.sin((i / (n - 1)) * Math.PI) * 7 - 1.5, 3, 3);
        }
        stepText = found ? 'Iron particles gather where the field leaks out' : 'The field passes the flaw without leaking out';
      } else stepText = 'Not magnetic: there is no field to leak';
    } else if (method === 'ultrasonic') {
      const probeW = px * 2.2;
      rectFS(ctx, toolX - probeW / 2, py0 - px * 1.4, probeW, px * 1.4, pal.panel, pal.ink, 2);
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = pal.series[1];
      ctx.beginPath();
      ctx.moveTo(toolX - probeW * 0.35, py0);
      ctx.lineTo(toolX + probeW * 0.35, py0);
      ctx.lineTo(toolX + probeW * 0.6, py0 + partH);
      ctx.lineTo(toolX - probeW * 0.6, py0 + partH);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      indication();
      // A-scan: initial pulse, flaw echo when the probe is over the flaw, back-wall echo.
      const over = Math.abs(toolX - fx) < (flaw === 'delamination' ? partW * 0.16 : probeW * 0.7);
      const ah = Math.min(px * 3.4, R.h * 0.16);
      label(ctx, 'A-scan (echo against time)', px0, y + px * 0.2, { colour: pal.ink, px });
      y += px * 0.7;
      rectFS(ctx, px0, y, partW, ah, pal.bg, pal.axis, 1);
      const base = y + ah - 4;
      const spike = (t, hgt, colour) => {
        const x = px0 + 8 + t * (partW - 16);
        line(ctx, x, base, x, base - hgt * (ah - 10), colour, 3);
      };
      line(ctx, px0 + 4, base, px0 + partW - 4, base, pal.axis, 1);
      spike(0.02, 1, pal.ink);
      const blocked = over && found && flaw === 'delamination';
      spike(0.96, blocked ? 0.15 : 0.7, pal.ink);
      if (over && found) spike(0.02 + 0.94 * ((flawY - py0) / partH), level === 'yes' ? 0.6 : 0.3, pal.series[0]);
      y += ah + px * 0.6;
      stepText = over && found ? 'Echo from the flaw (orange) before the back wall' : 'Only the back-wall echo here';
    } else if (method === 'xray') {
      const sx = fx;
      const sy = toolTop + px * 0.5;
      rectFS(ctx, sx - px * 1.2, sy - px * 0.5, px * 2.4, px * 1.1, pal.panel, pal.ink, 2);
      label(ctx, 'X-ray source', sx + px * 1.6, sy + px * 0.35, { colour: pal.ink, px });
      const detY = py0 + partH + px * 0.5;
      for (const t of [-1, -0.5, 0, 0.5, 1]) line(ctx, sx, sy + px * 0.6, sx + t * partW * 0.42, detY, pal.series[1], 1.2, [4, 4]);
      rectFS(ctx, px0, detY, partW, px * 1.2, pal.panel, pal.axis, 1);
      ctx.save();
      ctx.globalAlpha = 0.35 * scan;
      ctx.fillStyle = pal.ink;
      ctx.fillRect(px0 + 1, detY + 1, partW - 2, px * 1.2 - 2);
      if (found) {
        ctx.globalAlpha = (level === 'yes' ? 0.6 : 0.25) * scan;
        const spotW = flaw === 'internal-void' ? partW * 0.12 : flaw === 'delamination' ? partW * 0.3 : partW * 0.03;
        ctx.fillRect(fx - spotW / 2, detY + 1, spotW, px * 1.2 - 2);
      }
      ctx.restore();
      y = detY + px * 2.6;
      label(ctx, `Detector (exposure ${Math.round(scan * 100)}%)`, px0, y - px * 0.5, { colour: pal.muted, px });
      stepText = found ? 'Less material in the beam: a darker patch' : 'Nothing changes along the beam: no shadow';
    }

    if (scan === 0 && method !== 'dye') stepText = 'Press play to inspect the part';
    // On short stages the result matters more than the step caption.
    if (stepText && R.y + R.h - y >= px * 9.5) {
      y = para(ctx, stepText, px0, y + px * 0.8, partW, { px, colour: pal.ink, kind: 'strong', maxLines: 2 });
    }

    // Result: what this method can do here (the prediction to check).
    const ry = Math.max(y + px * 1.2, R.y + R.h - px * 4.6);
    if (ry + px * 2 > R.y + R.h) return;
    glyph(ctx, level, R.x + px * 0.8, ry, px * 1.4, levelColour(level));
    label(ctx, levelWord(level), R.x + px * 2, ry + px * 0.45, { colour: pal.ink, px: px + 4, kind: 'strong' });
    para(ctx, cur.reason, R.x, ry + px * 2, R.w, { px, colour: pal.ink, maxLines: 2 });
  }

  function drawNdtTable(ctx, R, px, solution, params) {
    if (R.w < 200) return;
    const cols = [
      { key: 'name', title: 'Method', w: 0.22 },
      { key: 'finds', title: 'Finds', w: 0.36 },
      { key: 'suits', title: 'Suits', w: 0.27 },
      { key: 'result', title: 'This flaw', w: 0.15 },
    ];
    let x = R.x;
    const xs = cols.map((c) => {
      const at = x;
      x += c.w * R.w;
      return at;
    });
    let y = R.y + px * 1.2;
    cols.forEach((c, i) => label(ctx, c.title, xs[i], y, { colour: pal.muted, px, kind: 'strong' }));
    y += px * 0.7;
    line(ctx, R.x, y, R.x + R.w, y, pal.axis, 1.5);
    const lineH = px * 1.25;
    ctx.save();
    ctx.font = font('label', px);
    const rows = solution.results.map((r) => {
      const finds = wrap(ctx, r.method.finds, cols[1].w * R.w - px);
      const suits = wrap(ctx, r.method.suits, cols[2].w * R.w - px);
      ctx.font = font('strong', px);
      const name = wrap(ctx, r.method.name, cols[0].w * R.w - px * 1.2);
      ctx.font = font('label', px);
      return { r, finds, suits, name, n: Math.max(finds.length, suits.length, name.length) };
    });
    ctx.restore();
    const avail = R.y + R.h - y - px;
    const need = rows.reduce((s, r) => s + r.n * lineH + px * 0.9, 0);
    const squeeze = need > avail;
    for (const row of rows) {
      const n = squeeze ? Math.min(row.n, 2) : row.n;
      const hRow = n * lineH + px * 0.9;
      if (y + hRow > R.y + R.h) break;
      const on = row.r.method.id === params.ndtMethod;
      if (on) {
        rectFS(ctx, R.x - px * 0.4, y + 2, R.w + px * 0.4, hRow - 4, pal.panel, null);
        ctx.fillStyle = pal.series[0];
        ctx.fillRect(R.x - px * 0.4, y + 2, 4, hRow - 4);
      }
      const ty = y + px * 0.45 + px;
      const cut = (lines) => (lines.length > n ? [...lines.slice(0, n - 1), `${lines[n - 1]}…`] : lines);
      cut(row.name).forEach((t, j) => label(ctx, t, xs[0] + (on ? 6 : 0), ty + j * lineH, { colour: on ? pal.accentText : pal.ink, px, kind: 'strong' }));
      cut(row.finds).forEach((t, j) => label(ctx, t, xs[1], ty + j * lineH, { colour: pal.ink, px }));
      cut(row.suits).forEach((t, j) => label(ctx, t, xs[2], ty + j * lineH, { colour: pal.ink, px }));
      const colour = levelColour(row.r.level);
      glyph(ctx, row.r.level, xs[3] + px * 0.6, ty - px * 0.35, px, colour);
      label(ctx, row.r.level === 'yes' ? 'Yes' : row.r.level === 'partial' ? 'Partly' : 'No', xs[3] + px * 1.5, ty, { colour: pal.ink, px, kind: 'strong' });
      y += hRow;
      line(ctx, R.x, y, R.x + R.w, y, pal.grid, 1);
    }
  }

  // ------------------------------------------------------------ entry points

  function draw(setup, state) {
    const { ctx, width: W, height: H } = surface;
    const px = stageFontPx(W);
    surface.begin(pal.bg);
    if (W < 40 || H < 40) return;
    if (setup === 'tensile') drawTensile(ctx, W, H, px, state);
    else if (setup === 'selection') drawSelection(ctx, W, H, px, state);
    else if (setup === 'hardness') drawHardness(ctx, W, H, px, state);
    else if (state.params.fatigueView === 'ndt') drawNdt(ctx, W, H, px, state);
    else drawFatigue(ctx, W, H, px, state);
  }

  return {
    draw,
    resize: () => surface.resize(),
    setTheme() {
      pal = readPalette(stage);
    },
    destroy: () => surface.destroy(),
  };
}
