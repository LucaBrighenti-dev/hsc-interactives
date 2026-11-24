// statsim view: drawing only. Reads model state; never changes it.
// Colour code on every stage: orange = random draws (simulated), blue = theory. Second cues: filled bars
// vs a line (with ring markers for a pmf), solid vs dashed, filled vs hollow vs crossed squares, plus a legend.
import { createSurface, readPalette, stageFontPx, axisMargins, viewport, label, arrow, niceTicks, font, drawAxes, tickText } from '../../engine-kit.js';
import { formatNumber, formatPlain, formatInteger, MINUS } from '../../format.js';
import { normalPdf, binomialPmf, samplingTheory, decayTheory, decayProbability, halvingTimes, decaySteps, DECAY_DT } from './model.js';

const f3 = (x) => formatNumber(x, { sigfigs: 3 });
const f4 = (x) => formatNumber(x, { sigfigs: 4 });
const int = formatInteger; // counts: "344", "10 000"

/**
 * Probability to 4 decimal places (the precision of a classroom table), with a true minus sign. It is
 * rounded first, so a tiny negative error such as −4.07 × 10⁻⁵ shows as "0.0000", never "−0.0000".
 */
export function formatProbability(x) {
  if (!Number.isFinite(x)) return formatNumber(x);
  const digits = Math.abs(x).toFixed(4);
  return x < 0 && digits !== '0.0000' ? MINUS + digits : digits;
}
const p4 = formatProbability;

/** Short description of the population being sampled. */
export function populationLabel(params) {
  switch (params.population) {
    case 'bernoulli':
      return `Bernoulli, p = ${formatPlain(params.p)}`;
    case 'die':
      return 'Fair die, 1 to 6';
    case 'uniform':
      return 'Uniform on [0, 1]';
    case 'normal':
      return 'Normal N(0, 1)';
    case 'exponential':
      return `Exponential, λ = ${formatPlain(params.rate)}`;
    case 'skewed':
      return 'Right-skewed, 0 to 5';
    case 'ushaped':
      return 'U-shaped on [0, 1]';
    default:
      return params.population;
  }
}

export function createView(stage, setup) {
  const surface = createSurface(stage);
  let pal = readPalette(stage);

  // ---------------------------------------------------------------- shared helpers

  function text(str, x, y, opts = {}) {
    label(surface.ctx, str, x, y, { colour: pal.ink, ...opts });
  }

  function measure(str, kind, px) {
    const { ctx } = surface;
    ctx.save();
    ctx.font = font(kind, px);
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  }

  /** Legend swatch + text items, right-aligned at xRight, vertically centred on y. Returns its width. */
  function legend(items, xRight, y, px, { draw = true } = {}) {
    const { ctx } = surface;
    const sw = Math.round(px * 1.5);
    const gap = Math.round(px * 0.45);
    const between = Math.round(px * 1.1);
    const widths = items.map((it) => sw + gap + measure(it.text, 'label', px));
    const total = widths.reduce((a, b) => a + b, 0) + between * Math.max(0, items.length - 1);
    if (!draw) return total;
    let x = xRight - total;
    // Flat background so guide lines passing behind the legend never cross its text.
    ctx.fillStyle = pal.bg;
    ctx.fillRect(x - 4, y - px * 0.75, total + 8, px * 1.5);
    items.forEach((it, i) => {
      swatch(ctx, it.kind, x, y, sw, px, it.colour, it.width);
      text(it.text, x + sw + gap, y, { px, baseline: 'middle', colour: pal.ink });
      x += widths[i] + between;
    });
    return total;
  }

  /** kinds: bar, hollow (bar outline), square, box (square outline), crossed (box with a cross), hatch, line, dashed, ring. */
  function swatch(ctx, kind, x, y, sw, px, colour, width = 2) {
    const h = Math.round(px * 0.8);
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = colour;
    ctx.fillStyle = colour;
    if (kind === 'bar') ctx.fillRect(x + sw * 0.2, y - h / 2, sw * 0.6, h);
    else if (kind === 'hollow') {
      ctx.lineWidth = 2;
      ctx.strokeRect(x + sw * 0.2 + 1, y - h / 2 + 1, sw * 0.6 - 2, h - 2);
    } else if (kind === 'square') ctx.fillRect(x + sw / 2 - h / 2, y - h / 2, h, h);
    else if (kind === 'box' || kind === 'crossed') {
      ctx.lineWidth = width;
      const d = h - width;
      const x0 = x + sw / 2 - h / 2 + width / 2;
      const y0 = y - h / 2 + width / 2;
      ctx.strokeRect(x0, y0, d, d);
      if (kind === 'crossed') {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + d, y0 + d);
        ctx.moveTo(x0 + d, y0);
        ctx.lineTo(x0, y0 + d);
        ctx.stroke();
      }
    } else if (kind === 'hatch') {
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 1, y - h / 2, sw - 2, h);
      ctx.beginPath();
      ctx.rect(x + 1, y - h / 2, sw - 2, h);
      ctx.clip();
      ctx.beginPath();
      for (let k = -h; k < sw + h; k += 6) {
        ctx.moveTo(x + k, y + h / 2);
        ctx.lineTo(x + k + h, y - h / 2);
      }
      ctx.stroke();
    } else {
      if (kind === 'dashed') ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + sw, y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (kind === 'ring') {
        ctx.fillStyle = pal.bg;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(x + sw / 2, y, px * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /** Integer-friendly ticks for a count axis (steps of 1, 2, 5 × 10ⁿ). */
  function countTicks(max, count = 5) {
    const raw = Math.max(1, max / count);
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].map((k) => k * mag).find((s) => s >= raw) ?? 10 * mag;
    const ticks = [];
    for (let v = 0; v <= max + 1e-9; v += step) ticks.push(v);
    return ticks;
  }

  /**
   * Axes pinned to the left and bottom edges with caller-chosen ticks. The kit's drawAxes (with
   * xAxisAt 'bottom', yAxisAt 'left') picks its own ticks, but histograms need ticks only where values
   * can occur (whole X, no "−0.2" under proportions), whole-number count ticks (no "2.5" on a
   * frequency axis), and x tick labels that give way to the x title on the same row.
   */
  function edgeAxes(vp, { px, layer, xTicks, yTicks: allY, fmtX = tickText, fmtY = tickText, xTitle, yTitle, xLabels = true }) {
    const { ctx } = surface;
    const { rect } = vp;
    // A tick label centred on the very top edge would poke into the header row above the plot.
    const yTicks = allY.filter((t) => vp.toY(t) >= rect.y + px * 0.6);
    ctx.save();
    if (layer === 'under') {
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const t of yTicks) {
        const Y = Math.round(vp.toY(t)) + 0.5;
        ctx.moveTo(rect.x, Y);
        ctx.lineTo(rect.x + rect.w, Y);
      }
      for (const t of xTicks) {
        const X = Math.round(vp.toX(t)) + 0.5;
        ctx.moveTo(X, rect.y);
        ctx.lineTo(X, rect.y + rect.h);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.strokeStyle = pal.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y);
    ctx.lineTo(rect.x, rect.y + rect.h);
    ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
    ctx.stroke();
    ctx.font = font('mono', px);
    const tick = (str, x, y, align, baseline) => {
      ctx.textAlign = align;
      ctx.textBaseline = baseline;
      const w = ctx.measureText(str).width;
      const left = align === 'center' ? x - w / 2 : x - w;
      const top = baseline === 'top' ? y : y - px / 2;
      ctx.fillStyle = pal.bg;
      ctx.fillRect(left - 3, top - 1, w + 6, px + 2);
      ctx.fillStyle = pal.muted;
      ctx.fillText(str, x, y);
      return [left, left + w];
    };
    // x title sits at the right end of the tick-label row; ticks that would collide with it are skipped.
    let titleLeft = rect.x + rect.w + 1;
    if (xTitle) {
      const w = measure(xTitle, 'strong', px);
      titleLeft = rect.x + rect.w - w;
      label(ctx, xTitle, rect.x + rect.w, rect.y + rect.h + 6, { colour: pal.ink, px, kind: 'strong', align: 'right', baseline: 'top' });
    }
    if (xLabels) {
      let lastRight = -Infinity;
      for (const t of xTicks) {
        const s = fmtX(t);
        const X = vp.toX(t);
        const w = ctx.measureText(s).width;
        if (X - w / 2 < lastRight + 8 || X + w / 2 > titleLeft - 10) continue;
        lastRight = tick(s, X, rect.y + rect.h + 6, 'center', 'top')[1];
      }
    }
    for (const t of yTicks) tick(fmtY(t), rect.x - 10, vp.toY(t), 'right', 'middle');
    if (yTitle) label(ctx, yTitle, rect.x + 10, rect.y + 6, { colour: pal.ink, px, align: 'left', baseline: 'top', box: pal.bg });
    ctx.restore();
  }

  function dashedLine(x0, y0, x1, y1, colour, width = 2, dash = [8, 6]) {
    const { ctx } = surface;
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

  /** Header row: an uppercase panel title on the left, optional legend on the right. */
  function headerRow(title, y, px, { left, right, legendItems = [], rightText = null, rightColour, rightKind = 'mono' } = {}) {
    const titleW = measure(title, 'strong', px);
    text(title, left, y, { px, kind: 'strong', baseline: 'middle', box: pal.bg, padding: 3 });
    const used = left + titleW + px;
    if (rightText) {
      const w = measure(rightText, rightKind, px);
      if (used + w < right) text(rightText, right, y, { px, kind: rightKind, baseline: 'middle', align: 'right', colour: rightColour ?? pal.ink, box: pal.bg, padding: 3 });
      return;
    }
    if (legendItems.length) {
      const w = legend(legendItems, right, y, px, { draw: false });
      if (used + w < right) legend(legendItems, right, y, px);
    }
  }

  // ---------------------------------------------------------------- sampling

  function drawSampling(state, params) {
    const { ctx, width: W, height: H } = surface;
    const px = stageFontPx(W);
    const m = axisMargins(px);
    surface.begin(pal.bg);
    const binomialMode = params.mode === 'binomial';
    const zoom = !binomialMode && params.meansAxis === 'zoom';
    const theory = samplingTheory(params);
    const { pop, bins } = state;
    const accent = pal.series[0];
    const blue = pal.series[1];

    const pad = Math.round(px * 0.9);
    const rowH = Math.round(px * 1.75);
    const compact = H < 440 || W < 620;
    const L = pad + m.left;
    const R = W - pad - m.right;
    const plotW = Math.max(40, R - L);
    const showPop = !binomialMode && !compact;

    // Vertical budget.
    const popH = showPop ? Math.round(Math.min(170, Math.max(70, H * 0.19))) : 0;
    const sampH = Math.round(Math.min(96, Math.max(compact ? 34 : 48, H * (binomialMode ? 0.12 : 0.1))));
    const zoomTicksH = zoom && !compact ? m.bottom : 0;
    let y = pad;
    const popTop = y + rowH;
    if (showPop) y = popTop + popH + Math.round(px * 0.4);
    const sampHeadY = y;
    const sampTop = y + rowH;
    y = sampTop + sampH + zoomTicksH + Math.round(px * 0.4);
    const histHeadY = y;
    const histTop = y + rowH;
    const histH = Math.max(60, H - histTop - m.bottom - Math.round(px * 0.4));

    const popRange = binomialMode ? bins.view : pop.range;
    const vpPop = viewport({ x: popRange, y: [0, 1], rect: { x: L, y: sampTop, w: plotW, h: sampH } });
    const N = state.count;
    const relative = params.yScale === 'relative';
    const scale = relative ? (N ? 1 / N : 0) : 1;

    // Theoretical height of each bin (expected frequency, or probability when relative).
    const perBin = relative ? 1 : N;
    const curveOn = params.showCurve && (relative || N > 0);
    let theoryPeak = 0;
    if (binomialMode) {
      for (let i = 0; i < bins.count; i++) theoryPeak = Math.max(theoryPeak, binomialPmf(params.n, params.p, Math.round(bins.start + 0.5 + i)));
    } else {
      theoryPeak = normalPdf(0) / theory.sd * bins.width;
    }
    theoryPeak *= perBin;
    let obsMax = 0;
    for (let i = 0; i < bins.count; i++) obsMax = Math.max(obsMax, state.hist[i] * scale);
    const floor = relative ? 0.05 : 5;
    const yMax = Math.max(obsMax, curveOn ? theoryPeak : 0, floor) * 1.2;
    const vpHist = viewport({ x: bins.view, y: [0, yMax], rect: { x: L, y: histTop, w: plotW, h: histH } });
    // x ticks only where values can occur (no "−0.2" under a histogram of proportions).
    const [supLo, supHi] = binomialMode ? [0, params.n] : pop.binRange;
    const onSupport = (t) => t >= supLo - 1e-9 && t <= supHi + 1e-9;
    const xTicks = niceTicks(bins.view[0], bins.view[1], Math.max(3, Math.min(10, Math.floor(plotW / (px * 5))))).ticks.filter((t) => onSupport(t) && (!binomialMode || Number.isInteger(t)));
    const yTicks = relative ? niceTicks(0, yMax, Math.max(2, Math.min(5, Math.floor(histH / (px * 2.4))))).ticks : countTicks(yMax, Math.max(2, Math.min(5, Math.floor(histH / (px * 2.4)))));

    // ---- population panel (means mode)
    if (showPop) {
      const vp = viewport({ x: pop.range, y: [0, pop.displayMax * 1.3], rect: { x: L, y: popTop, w: plotW, h: popH } });
      const ticks = niceTicks(pop.range[0], pop.range[1], Math.max(3, Math.min(10, Math.floor(plotW / (px * 5))))).ticks;
      ctx.save();
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const t of ticks) {
        const X = Math.round(vp.toX(t)) + 0.5;
        ctx.moveTo(X, popTop);
        ctx.lineTo(X, popTop + popH);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(L, popTop, plotW, popH);
      ctx.clip();
      if (pop.discrete) {
        const bw = Math.min(vp.scaleX * 0.5, px * 3.5);
        pop.values.forEach((v, i) => {
          const X = vp.toX(v);
          const Y = vp.toY(pop.probs[i]);
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = blue;
          ctx.fillRect(X - bw / 2, Y, bw, popTop + popH - Y);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = blue;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(X - bw / 2, Y, bw, popTop + popH - Y);
          if (popH > px * 3 && bw > px * 1.6) text(formatNumber(pop.probs[i], { sigfigs: 2 }), X, Y - 6, { px, kind: 'mono', align: 'center', colour: pal.muted });
        });
      } else {
        const pts = [];
        const steps = Math.ceil(plotW / 2);
        for (let s = 0; s <= steps; s++) {
          const x = pop.range[0] + ((pop.range[1] - pop.range[0]) * s) / steps;
          pts.push([vp.toX(x), vp.toY(Math.min(pop.pdf(x), pop.displayMax * 1.5))]);
        }
        ctx.beginPath();
        ctx.moveTo(pts[0][0], popTop + popH);
        for (const [X, Y] of pts) ctx.lineTo(X, Y);
        ctx.lineTo(pts[pts.length - 1][0], popTop + popH);
        ctx.closePath();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = blue;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        pts.forEach(([X, Y], i) => (i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)));
        ctx.strokeStyle = blue;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();
      // μ and σ markers.
      const muX = vp.toX(pop.mean);
      dashedLine(muX, popTop, muX, popTop + popH, blue, 2);
      const sigPx = pop.sd * vp.scaleX;
      const aY = popTop + popH * 0.42;
      if (sigPx > px * 1.8) {
        arrow(ctx, muX, aY, muX + sigPx, aY, { colour: pal.ink, width: 2, head: Math.max(9, px * 0.55) });
        text('σ', muX + sigPx / 2, aY - 6, { px, kind: 'strong', align: 'center', box: pal.bg, padding: 2 });
      }
      text('μ', muX + 6, popTop + px * 0.9, { px, kind: 'strong', colour: blue, box: pal.bg, padding: 2 });
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(L, popTop + popH);
      ctx.lineTo(L + plotW, popTop + popH);
      ctx.stroke();
      headerRow(`POPULATION · ${populationLabel(params)}`, pad + rowH / 2, px, {
        left: L - m.left,
        right: R,
        rightText: `μ = ${f3(pop.mean)}   σ = ${f3(pop.sd)}`,
        rightColour: blue,
      });
    }

    // ---- latest sample
    const sampBase = sampTop + sampH;
    if (!binomialMode) {
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(L, sampBase);
      ctx.lineTo(L + plotW, sampBase);
      ctx.stroke();
    }
    let dropFrom = null; // where the latest statistic leaves the sample strip
    if (binomialMode) {
      drawTrials(state, params, { x: L - m.left, y: sampTop, w: plotW + m.left, h: sampH - 6 }, px);
    } else if (state.latest) {
      if (!showPop) {
        // Compact: the population scale still needs its grid so dots read as positions.
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const t of niceTicks(pop.range[0], pop.range[1], 6).ticks) {
          const X = Math.round(vpPop.toX(t)) + 0.5;
          ctx.moveTo(X, sampTop);
          ctx.lineTo(X, sampBase);
        }
        ctx.stroke();
      }
      drawDots(state.latest, vpPop, sampTop, sampBase, pop, px);
      const X = vpPop.toX(Math.min(pop.range[1], Math.max(pop.range[0], state.latestValue)));
      ctx.fillStyle = accent;
      ctx.fillRect(X - 2, sampTop - 2, 4, sampH + 2);
      ctx.beginPath();
      ctx.moveTo(X - 8, sampTop - 10);
      ctx.lineTo(X + 8, sampTop - 10);
      ctx.lineTo(X, sampTop);
      ctx.closePath();
      ctx.fill();
      dropFrom = [X, sampBase];
    }
    if (zoom && !compact) {
      // The sample's own axis (the population scale) and guides showing the zoomed range below.
      const ticks = niceTicks(pop.range[0], pop.range[1], Math.max(3, Math.min(10, Math.floor(plotW / (px * 5))))).ticks;
      ctx.save();
      ctx.font = font('mono', px);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = pal.muted;
      for (const t of ticks.filter(onSupport)) ctx.fillText(tickText(t), vpPop.toX(t), sampBase + 6);
      ctx.restore();
    }

    // ---- histogram
    edgeAxes(vpHist, { px, layer: 'under', xTicks, yTicks });
    if (zoom) {
      const a = vpPop.toX(bins.view[0]);
      const b = vpPop.toX(bins.view[1]);
      const top = sampBase + (compact ? 0 : zoomTicksH);
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = blue;
      ctx.fillRect(a, sampTop, Math.max(2, b - a), sampH);
      ctx.restore();
      dashedLine(a, top, L, histTop, pal.muted, 1.5, [4, 4]);
      dashedLine(b, top, L + plotW, histTop, pal.muted, 1.5, [4, 4]);
    }
    // Drop line: from the latest sample's statistic down to the bar it landed in.
    if (dropFrom && state.lastBin !== null) {
      const xb = vpHist.toX(state.latestValue);
      const yb = vpHist.toY(state.hist[state.lastBin] * scale);
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(dropFrom[0], dropFrom[1] + (zoom && !compact ? zoomTicksH : 0));
      ctx.lineTo(xb, histTop);
      ctx.lineTo(xb, yb);
      ctx.stroke();
      ctx.restore();
    }
    // Bars.
    const discreteBars = bins.lattice && bins.perBin === 1;
    ctx.fillStyle = accent;
    for (let i = 0; i < bins.count; i++) {
      const c = state.hist[i];
      if (!c) continue;
      const x0 = bins.start + i * bins.width;
      let X0 = vpHist.toX(x0);
      let X1 = vpHist.toX(x0 + bins.width);
      const bw = X1 - X0;
      const inset = discreteBars && bw > 8 ? bw * 0.12 : bw >= 4 ? 0.5 : 0;
      X0 += inset;
      X1 -= inset;
      const Y = vpHist.toY(c * scale);
      ctx.fillRect(X0, Y, Math.max(1, X1 - X0), histTop + histH - Y);
    }
    if (state.lastBin !== null && N > 0) {
      const i = state.lastBin;
      const x0 = bins.start + i * bins.width;
      const X0 = vpHist.toX(x0);
      const X1 = vpHist.toX(x0 + bins.width);
      const Y = vpHist.toY(state.hist[i] * scale);
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(X0, Y, Math.max(2, X1 - X0), histTop + histH - Y);
    }
    // Theory overlay.
    if (curveOn) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(L, histTop - 2, plotW, histH + 2);
      ctx.clip();
      ctx.strokeStyle = blue;
      ctx.lineWidth = 3;
      if (binomialMode) {
        const pts = [];
        for (let i = 0; i < bins.count; i++) {
          const k = Math.round(bins.start + 0.5 + i);
          pts.push([vpHist.toX(k), vpHist.toY(binomialPmf(params.n, params.p, k) * perBin)]);
        }
        ctx.lineWidth = 2;
        ctx.beginPath();
        pts.forEach(([X, Y], i) => (i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)));
        ctx.stroke();
        const r = Math.max(3, Math.min(px * 0.32, vpHist.scaleX * 0.3));
        ctx.fillStyle = pal.bg;
        ctx.lineWidth = 2.5;
        for (const [X, Y] of pts) {
          ctx.beginPath();
          ctx.arc(X, Y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      } else {
        const steps = Math.ceil(plotW / 2);
        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const x = bins.view[0] + ((bins.view[1] - bins.view[0]) * s) / steps;
          const Y = vpHist.toY(normalPdf(x, theory.mean, theory.sd) * bins.width * perBin);
          if (s) ctx.lineTo(vpHist.toX(x), Y);
          else ctx.moveTo(vpHist.toX(x), Y);
        }
        ctx.stroke();
      }
      ctx.restore();
      // Mean and spread markers.
      const muX = vpHist.toX(theory.mean);
      if (muX >= L && muX <= L + plotW) {
        dashedLine(muX, histTop, muX, histTop + histH, blue, 2);
        const sdPx = theory.sd * vpHist.scaleX;
        const yA = vpHist.toY(normalPdf(0) / theory.sd * bins.width * perBin * Math.exp(-0.5));
        const what = binomialMode ? 'σ' : 'σ/√n';
        if (sdPx > px * 2.2) {
          arrow(ctx, muX, yA, muX + sdPx, yA, { colour: pal.ink, width: 2, head: Math.max(9, px * 0.55) });
          const lab = `${what} = ${f3(theory.sd)}`;
          const lw = measure(lab, 'label', px);
          const lx = muX + sdPx + 8 + lw < L + plotW ? muX + sdPx + 8 : muX - 8 - lw;
          text(lab, lx, yA, { px, baseline: 'middle', box: pal.bg, padding: 3 });
        }
        text(binomialMode ? 'np' : 'μ', muX + 6, histTop + px * 2.3, { px, kind: 'strong', colour: blue, box: pal.bg, padding: 2 });
      }
    }
    // Values beyond the axis, and the empty-state prompt.
    if (state.under + state.over > 0) {
      const k = state.under + state.over;
      text(`${int(k)} beyond the axis`, L + plotW - 6, histTop + histH - 8, { px, align: 'right', colour: pal.muted, box: pal.bg, padding: 3 });
    }
    if (N === 0) {
      text('Press play to draw samples', L + plotW / 2, histTop + histH * 0.45, { px: px + 2, align: 'center', baseline: 'middle', colour: pal.muted, box: pal.bg, padding: 6 });
    }
    edgeAxes(vpHist, {
      px,
      layer: 'over',
      xTicks,
      yTicks,
      xTitle: binomialMode ? 'X' : 'x̄',
      yTitle: compact ? null : relative ? 'Relative frequency' : 'Frequency', // compact: named in the header
    });

    // ---- headers (drawn last so their flat background boxes sit over the drop line)
    const sampTitle = N ? `SAMPLE ${int(N)} OF ${int(params.samples)}` : `0 OF ${int(params.samples)} SAMPLES`;
    if (binomialMode) {
      headerRow(compact ? `${sampTitle} · n = ${params.n}` : `${sampTitle} · n = ${params.n} trials · P(success) = ${formatPlain(params.p)}`, sampHeadY + rowH / 2, px, {
        left: L - m.left,
        right: R,
        rightText: state.latest ? `X = ${state.latestValue} success${state.latestValue === 1 ? '' : 'es'}` : null,
        rightColour: pal.accentText,
        rightKind: 'strong',
      });
    } else {
      headerRow(compact ? `${sampTitle} · n = ${params.n}` : `${sampTitle} · size n = ${params.n}`, sampHeadY + rowH / 2, px, {
        left: L - m.left,
        right: R,
        rightText: state.latest ? `x̄ = ${f4(state.latestValue)}` : null,
        rightColour: pal.accentText,
        rightKind: 'strong', // Inter: JetBrains Mono misplaces the combining macron of x̄
      });
    }
    const histTitle = compact ? (relative ? 'REL. FREQUENCY' : 'FREQUENCY') : binomialMode ? 'NUMBER OF SUCCESSES X' : 'SAMPLE MEANS x̄';
    const items = [{ kind: 'bar', colour: accent, text: binomialMode ? 'Simulated' : 'Simulated x̄' }];
    if (curveOn) items.push(binomialMode ? { kind: 'ring', colour: blue, text: compact ? 'B(n, p)' : `Binomial B(${params.n}, ${formatPlain(params.p)})` } : { kind: 'line', colour: blue, text: compact ? 'Normal' : 'Normal N(μ, σ²/n)' });
    headerRow(histTitle, histHeadY + rowH / 2, px, { left: L - m.left, right: R, legendItems: items });
  }

  /** Dot plot of one sample on the population axis: dots stack where values coincide. */
  function drawDots(values, vp, top, base, pop, px) {
    const { ctx } = surface;
    const n = values.length;
    const avail = base - top - 4;
    let r = Math.max(2.5, Math.min(px * 0.42, 9));
    // Stack per pixel bucket of one dot diameter.
    const place = () => {
      const stacks = new Map();
      return values.map((v) => {
        const clamped = Math.min(pop.range[1], Math.max(pop.range[0], v));
        const X = vp.toX(clamped);
        const key = pop.discrete ? v : Math.round(X / (2 * r));
        const k = stacks.get(key) ?? 0;
        stacks.set(key, k + 1);
        return { X: pop.discrete ? X : key * 2 * r, k, off: v > pop.range[1] };
      });
    };
    let placed = place();
    let maxK = Math.max(...placed.map((d) => d.k)) + 1;
    if (maxK * 2 * r > avail) {
      r = Math.max(1.5, avail / (2 * maxK));
      placed = place();
      maxK = Math.max(...placed.map((d) => d.k)) + 1;
    }
    const step = Math.min(2 * r, avail / maxK);
    ctx.fillStyle = pal.ink;
    for (const d of placed) {
      const Y = base - r - 2 - d.k * step;
      if (d.off) {
        // Off the right of the axis: a pointer, not a dot at the wrong value.
        ctx.beginPath();
        ctx.moveTo(d.X - r, Y - r);
        ctx.lineTo(d.X + r, Y);
        ctx.lineTo(d.X - r, Y + r);
        ctx.closePath();
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      ctx.arc(d.X, Y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return n;
  }

  /** The n Bernoulli trials of the latest sample: filled squares are successes, hollow are failures. */
  function drawTrials(state, params, box, px) {
    const { ctx } = surface;
    const n = params.n;
    const gapOf = (s) => Math.max(2, Math.round(s * 0.22));
    let rows = 1;
    let s = 0;
    for (rows = 1; rows <= 6; rows++) {
      const perRow = Math.ceil(n / rows);
      const byW = Math.floor(box.w / perRow);
      const byH = Math.floor(box.h / rows);
      s = Math.min(px * 2, byW, byH);
      if (s - gapOf(s) >= Math.max(7, px * 0.55)) break;
    }
    rows = Math.min(rows, 6);
    const perRow = Math.ceil(n / rows);
    const size = s - gapOf(s);
    const totalW = perRow * s - gapOf(s);
    const x0 = box.x + (box.w - totalW) / 2;
    const y0 = box.y + (box.h - rows * s + gapOf(s)) / 2;
    if (!state.latest) {
      ctx.strokeStyle = pal.grid;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < n; i++) ctx.strokeRect(x0 + (i % perRow) * s + 0.75, y0 + Math.floor(i / perRow) * s + 0.75, size - 1.5, size - 1.5);
      return;
    }
    for (let i = 0; i < n; i++) {
      const X = x0 + (i % perRow) * s;
      const Y = y0 + Math.floor(i / perRow) * s;
      if (state.latest[i] === 1) {
        ctx.fillStyle = pal.series[0];
        ctx.fillRect(X, Y, size, size);
      } else {
        ctx.strokeStyle = pal.muted;
        ctx.lineWidth = 2;
        ctx.strokeRect(X + 1, Y + 1, size - 2, size - 2);
      }
    }
  }

  // ---------------------------------------------------------------- normal approximation

  function drawNormalApprox(state, params) {
    const { ctx, width: W, height: H } = surface;
    const px = stageFontPx(W);
    const m = axisMargins(px);
    surface.begin(pal.bg);
    const r = state.result;
    const n = params.trials;
    const p = params.prob;
    const k = params.k;
    const accent = pal.series[0];
    const blue = pal.series[1];
    const pad = Math.round(px * 0.9);
    const big = px + 4;
    const compact = W < 760;

    // Header: the two distributions and the three numbers.
    const lineH = Math.round(big * 1.45);
    const sym = { le: '≤', ge: '≥', eq: '=' }[params.event];
    const exactText = `P(X ${sym} ${k})`;
    let approxText;
    if (params.event === 'le') approxText = `P(Y ≤ ${formatPlain(r.upper)})`;
    else if (params.event === 'ge') approxText = `P(Y ≥ ${formatPlain(r.lower)})`;
    else approxText = params.continuity ? `P(${formatPlain(r.lower)} ≤ Y ≤ ${formatPlain(r.upper)})` : `P(Y = ${k})`;
    const left = pad;
    const first = pad + big * 0.8; // baseline of the first header line
    const np = formatPlain(Number(r.mean.toPrecision(10)));
    const model = `Y ~ N(${np}, ${f4(r.sd)}²)`;
    const results = [
      [`Exact ${exactText}`, p4(r.exact), pal.accentText],
      [`Normal ${approxText}`, p4(r.approx), blue],
      ['Error (normal − exact)', p4(r.error), pal.ink],
    ];
    const resStep = Math.round(px * 1.55);
    let resX;
    let resTop;
    let colW;
    if (compact) {
      // Phones: one line for both models, then exact and normal (the error is in the readouts).
      text(`X ~ B(${n}, ${formatPlain(p)})`, left, first, { px: big, kind: 'strong' });
      text(model, W - pad, first, { px: big, kind: 'strong', colour: blue, align: 'right' });
      results.length = 2;
      resX = left;
      resTop = first + lineH;
      colW = W - 2 * pad;
    } else {
      text(`X ~ B(${n}, ${formatPlain(p)})`, left, first, { px: big, kind: 'strong' });
      text(`np = ${np}, √(np(1 − p)) = ${f4(r.sd)}`, left, first + lineH, { px, colour: pal.muted });
      text(model, left, first + 2 * lineH, { px: big, kind: 'strong', colour: blue });
      colW = Math.min(W * 0.52, px * 30);
      resX = W - pad - colW;
      resTop = first;
    }
    results.forEach(([name, value, colour], i) => {
      const yy = resTop + i * resStep;
      text(name, resX, yy, { px, colour: pal.ink });
      text(value, resX + colW, yy, { px: big, kind: 'mono', align: 'right', colour });
    });
    const headerBottom = Math.max(resTop + (results.length - 1) * resStep, compact ? first : first + 2 * lineH) + px * 0.5;

    // Legend row.
    const legendY = headerBottom + px * 0.9;
    const items = [
      { kind: 'bar', colour: accent, text: compact ? 'In event' : 'P(X = k) in the event' },
      { kind: 'hollow', colour: pal.muted, text: compact ? 'Outside' : 'P(X = k) outside it' },
      { kind: 'line', colour: blue, text: compact ? 'Normal' : 'Normal density' },
      { kind: 'hatch', colour: blue, text: compact ? 'Area' : 'Normal area' },
    ];
    if (legend(items, 0, 0, px, { draw: false }) < W - 2 * pad) legend(items, W - pad, legendY, px);

    // Plot.
    const top = legendY + px * 1.2;
    const rect = { x: pad + m.left, y: top, w: W - 2 * pad - m.left - m.right, h: Math.max(60, H - top - m.bottom - pad * 0.5) };
    let lo = Math.max(0, Math.floor(r.mean - 4.5 * r.sd));
    let hi = Math.min(n, Math.ceil(r.mean + 4.5 * r.sd));
    lo = Math.min(lo, Math.max(0, k - 1));
    hi = Math.max(hi, Math.min(n, k + 1));
    while (hi - lo < 8 && (lo > 0 || hi < n)) {
      if (lo > 0) lo--;
      if (hi - lo < 8 && hi < n) hi++;
    }
    const x0 = lo - 1;
    const x1 = hi + 1;
    let peak = 0;
    for (let j = lo; j <= hi; j++) peak = Math.max(peak, state.pmf[j]);
    peak = Math.max(peak, normalPdf(0) / r.sd);
    const vp = viewport({ x: [x0, x1], y: [0, peak * 1.18], rect });
    const xTicks = niceTicks(x0, x1, Math.max(3, Math.min(12, Math.floor(rect.w / (px * 4))))).ticks.filter((t) => Number.isInteger(t) && t >= lo && t <= hi);
    const yTicks = niceTicks(0, peak * 1.18, Math.max(2, Math.min(5, Math.floor(rect.h / (px * 2.4))))).ticks;
    edgeAxes(vp, { px, layer: 'under', xTicks, yTicks });

    // Bars: width 1, so each bar's area is P(X = k) on the same scale as the normal density.
    const base = rect.y + rect.h;
    for (let j = lo; j <= hi; j++) {
      const X0 = vp.toX(j - 0.5) + 0.5;
      const X1 = vp.toX(j + 0.5) - 0.5;
      const Y = vp.toY(state.pmf[j]);
      const inEvent = j >= r.kFrom && j <= r.kTo;
      if (inEvent) {
        ctx.fillStyle = accent;
        ctx.fillRect(X0, Y, X1 - X0, base - Y);
      } else {
        ctx.strokeStyle = pal.muted;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(X0 + 0.75, Y + 0.75, X1 - X0 - 1.5, base - Y - 0.75);
      }
    }

    // Shaded normal area over the approximating interval: translucent fill plus hatching.
    const a = Math.max(r.lower, x0);
    const b = Math.min(r.upper, x1);
    if (b > a) {
      const steps = Math.max(8, Math.ceil(((b - a) * vp.scaleX) / 2));
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(vp.toX(a), base);
      for (let s = 0; s <= steps; s++) {
        const x = a + ((b - a) * s) / steps;
        ctx.lineTo(vp.toX(x), vp.toY(normalPdf(x, r.mean, r.sd)));
      }
      ctx.lineTo(vp.toX(b), base);
      ctx.closePath();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = blue;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.clip();
      ctx.strokeStyle = blue;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const span = rect.h + rect.w;
      for (let d = -rect.h; d < span; d += 11) {
        ctx.moveTo(rect.x + d, base);
        ctx.lineTo(rect.x + d + rect.h, rect.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Normal density curve.
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.beginPath();
    const steps = Math.ceil(rect.w / 2);
    for (let s = 0; s <= steps; s++) {
      const x = x0 + ((x1 - x0) * s) / steps;
      const Y = vp.toY(normalPdf(x, r.mean, r.sd));
      if (s) ctx.lineTo(vp.toX(x), Y);
      else ctx.moveTo(vp.toX(x), Y);
    }
    ctx.strokeStyle = blue;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Boundaries of the normal interval.
    const bounds = [r.lower, r.upper].filter((v, i, arr) => Number.isFinite(v) && arr.indexOf(v) === i);
    bounds.forEach((v, i) => {
      if (v < x0 || v > x1) return;
      const X = vp.toX(v);
      dashedLine(X, rect.y, X, base, pal.ink, 2, [7, 5]);
      const lab = `x = ${formatPlain(v)}`;
      const w = measure(lab, 'label', px);
      const right = bounds.length === 2 && i === 0;
      text(lab, right ? X - 8 - w : X + 8, rect.y + px * (2.4 + i * 1.5), { px, box: pal.bg, padding: 3 });
    });
    if (params.event === 'eq' && !params.continuity) {
      text('A single point has no area: P(Y = k) = 0', rect.x + rect.w - 8, rect.y + px * 1.2, { px, align: 'right', colour: pal.muted, box: pal.bg, padding: 3 });
    }

    edgeAxes(vp, { px, layer: 'over', xTicks, yTicks, xTitle: 'k', yTitle: 'Probability' });
  }

  // ---------------------------------------------------------------- decay

  function drawDecay(state, params) {
    const { ctx, width: W, height: H } = surface;
    const px = stageFontPx(W);
    const m = axisMargins(px);
    surface.begin(pal.bg);
    const accent = pal.series[0];
    const blue = pal.series[1];
    const pad = Math.round(px * 0.9);
    const rowH = Math.round(px * 1.75);
    const n0 = state.n0;
    const compact = W < 760;

    // Grid of nuclei (left). On narrow stages the graph's legend joins the grid's, under the grid.
    const legendRows = compact ? (params.showCurve ? 5 : 4) : 1;
    const legendH = Math.round(px * 1.5) * legendRows + Math.round(px * 0.4);
    const side = Math.max(60, Math.floor(Math.min(H - 2 * pad - rowH - legendH - px * 0.6, W * (compact ? 0.36 : 0.4))));
    const cols = Math.ceil(Math.sqrt(n0));
    const rows = Math.ceil(n0 / cols);
    const cell = Math.max(1, Math.floor(side / cols));
    const gap = cell >= 9 ? 2 : cell >= 5 ? 1 : 0;
    const size = cell - gap; // drawn size of one nucleus
    const gx = pad;
    const gy = pad + rowH;
    // Shape as well as colour: undecayed = filled orange square; decayed in the last step = ink box with a
    // cross ('large' cells) or an ink outline ('small'); decayed earlier = thin grey outline ('large') or a
    // faint fill. Ink sits at the far end of the lightness scale from the background in both themes. Only
    // 'tiny' cells (under 3 px, phones with thousands of nuclei) fall back to fills.
    const tier = size >= 6 ? 'large' : size >= 3 ? 'small' : 'tiny';
    const freshW = tier === 'large' ? (size >= 12 ? 2 : 1.5) : 1;
    const { status, step } = state;
    const paths = { parent: new Path2D(), fresh: new Path2D(), old: new Path2D() };
    for (let i = 0; i < n0; i++) {
      const X = gx + (i % cols) * cell;
      const Y = gy + Math.floor(i / cols) * cell;
      const s = status[i];
      if (s === 0) paths.parent.rect(X, Y, size, size);
      else if (s === step) {
        if (tier === 'tiny') {
          paths.fresh.rect(X, Y, size, size);
          continue;
        }
        const o = freshW / 2;
        const d = size - freshW;
        paths.fresh.rect(X + o, Y + o, d, d);
        if (tier === 'large') {
          paths.fresh.moveTo(X + o, Y + o);
          paths.fresh.lineTo(X + o + d, Y + o + d);
          paths.fresh.moveTo(X + o + d, Y + o);
          paths.fresh.lineTo(X + o, Y + o + d);
        }
      } else if (tier === 'large') paths.old.rect(X + 0.5, Y + 0.5, size - 1, size - 1);
      else paths.old.rect(X, Y, size, size);
    }
    ctx.fillStyle = accent;
    ctx.fill(paths.parent);
    if (tier === 'large') {
      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1;
      ctx.stroke(paths.old);
    } else {
      ctx.fillStyle = pal.grid;
      ctx.fill(paths.old);
    }
    if (tier === 'tiny') {
      ctx.fillStyle = pal.ink;
      ctx.fill(paths.fresh);
    } else {
      ctx.strokeStyle = pal.ink;
      ctx.lineWidth = freshW;
      ctx.stroke(paths.fresh);
    }
    const gridW = cols * cell;
    const gridH = rows * cell;
    text(compact ? `N₀ = ${int(n0)}` : `${int(n0)} NUCLEI`, gx, pad + rowH / 2, { px, kind: 'strong', baseline: 'middle' });
    // Legend under the grid: the same shapes as the cells, drawn larger.
    const items = [
      { kind: 'square', colour: accent, text: 'Undecayed' },
      tier === 'large' ? { kind: 'box', colour: pal.axis, width: 1.5, text: 'Decayed' } : { kind: 'square', colour: pal.grid, text: 'Decayed' },
      { kind: { large: 'crossed', small: 'box', tiny: 'square' }[tier], colour: pal.ink, width: 2, text: compact ? 'Just now' : 'In the last step' },
    ];
    if (compact) {
      items.push({ kind: 'line', colour: accent, text: 'Simulated N' });
      if (params.showCurve) items.push({ kind: 'dashed', colour: blue, text: 'Theory' });
      items.forEach((it, i) => legend([it], gx + legend([it], 0, 0, px, { draw: false }), gy + gridH + px * (1 + i * 1.5), px));
    } else {
      legend(items, gx + legend(items, 0, 0, px, { draw: false }), gy + gridH + px * 1.2, px);
    }

    // Graph (right).
    const gL = gx + Math.max(gridW, compact ? 0 : side) + pad + m.left;
    const top = pad + rowH;
    const rect = { x: gL, y: top, w: Math.max(60, W - pad - m.right - gL), h: Math.max(60, H - top - m.bottom - pad * 0.5) };
    const duration = decaySteps(params) * DECAY_DT;
    const vp = viewport({ x: [0, duration], y: [0, n0 * 1.08], rect });
    const fmtCount = (v) => tickText(v);
    // A time series: axes pinned to the plot's left and bottom edges.
    const axisOpts = { px, xAxisAt: 'bottom', yAxisAt: 'left', xCount: Math.max(3, Math.min(8, Math.floor(rect.w / (px * 4)))), yCount: Math.max(2, Math.min(5, Math.floor(rect.h / (px * 2.4)))) };
    drawAxes(ctx, vp, pal, { ...axisOpts, layer: 'under' });
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y - 4, rect.w + 4, rect.h + 4);
    ctx.clip();
    if (params.showCurve) {
      ctx.strokeStyle = blue;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      const steps = Math.ceil(rect.w / 2);
      for (let s = 0; s <= steps; s++) {
        const t = (duration * s) / steps;
        const Y = vp.toY(decayTheory(t, n0, params.halfLife));
        if (s) ctx.lineTo(vp.toX(t), Y);
        else ctx.moveTo(vp.toX(t), Y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Measured halvings.
    const times = halvingTimes(state.history, n0, 3);
    times.forEach((t, j) => {
      const level = n0 / 2 ** (j + 1);
      const X = vp.toX(t);
      const Y = vp.toY(level);
      dashedLine(vp.toX(0), Y, X, Y, pal.muted, 1.5, [4, 4]);
      dashedLine(X, Y, X, vp.toY(0), pal.muted, 1.5, [4, 4]);
    });
    // Simulated N.
    const hist = state.history;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    hist.forEach((nk, kk) => {
      const X = vp.toX(kk * DECAY_DT);
      const Y = vp.toY(nk);
      if (kk) ctx.lineTo(X, Y);
      else ctx.moveTo(X, Y);
    });
    ctx.stroke();
    const spacing = vp.scaleX * DECAY_DT;
    if (spacing >= 7) {
      ctx.fillStyle = accent;
      const s = Math.min(8, spacing * 0.6);
      hist.forEach((nk, kk) => ctx.fillRect(vp.toX(kk * DECAY_DT) - s / 2, vp.toY(nk) - s / 2, s, s));
    }
    const lastX = vp.toX(state.step * DECAY_DT);
    const lastY = vp.toY(state.remaining);
    ctx.fillStyle = accent;
    ctx.fillRect(lastX - 6, lastY - 6, 12, 12);
    ctx.restore();
    // Labels for the halvings, after the curves so they sit on top.
    times.forEach((t, j) => {
      const level = n0 / 2 ** (j + 1);
      const lab = j === 0 ? `t½ = ${f3(t)} s` : `+${f3(t - times[j - 1])} s`;
      text(lab, vp.toX(t) + 8, vp.toY(level) - 8, { px, box: pal.bg, padding: 3 });
    });
    // The current count, exactly: below and to the right of the point (the halving labels sit above it).
    if (state.step > 0) {
      const lab = `N = ${int(state.remaining)}`;
      const w = measure(lab, 'strong', px);
      const right = lastX + 12 + w < rect.x + rect.w;
      const y = Math.min(rect.y + rect.h - px * 1.6, lastY + px + 8);
      text(lab, right ? lastX + 12 : lastX - 12 - w, y, { px, kind: 'strong', colour: pal.accentText, box: pal.bg, padding: 3 });
    }
    drawAxes(ctx, vp, pal, { ...axisOpts, layer: 'over', xTitle: 't (s)', yTitle: 'N remaining', formatY: fmtCount });
    // Header over the graph: the decay rule and the legend.
    const p = decayProbability(params.halfLife);
    const rule = compact ? `p = ${f3(p)} per ${DECAY_DT} s` : `Each ${DECAY_DT} s step: p = 1 − 2^(−1/${formatPlain(params.halfLife)}) = ${f3(p)}`;
    text(rule, rect.x - m.left, pad + rowH / 2, { px, baseline: 'middle', colour: pal.ink });
    if (!compact) {
      const gItems = [{ kind: 'line', colour: accent, text: 'Simulated N' }];
      if (params.showCurve) gItems.push({ kind: 'dashed', colour: blue, text: 'N₀(½)^(t/H)' });
      const ruleW = measure(rule, 'label', px);
      const gw = legend(gItems, 0, 0, px, { draw: false });
      if (rect.x - m.left + ruleW + px + gw < W - pad) legend(gItems, W - pad, pad + rowH / 2, px);
      else legend(gItems, rect.x + rect.w, rect.y + rect.h * 0.35, px);
    }
  }

  // ---------------------------------------------------------------- dispatch

  function draw(state, params) {
    if (setup === 'sampling') drawSampling(state, params);
    else if (setup === 'normal-approx') drawNormalApprox(state, params);
    else drawDecay(state, params);
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
