// Modulation view: scrolling traces of the message, the carrier and the modulated signal (each with
// its own colour AND line style), plus the amplitude spectrum. Drawing only.
import { viewport, axisMargins, drawAxes } from '../../engine-kit.js';
import { messageValue, carrierValue, modulatedValue, amEnvelope, modulationIndex, modulationBandwidth, modulationSpectrum, instantaneousFrequency, SPECTRUM_HALF_WIDTH } from './model.js';
import { formatNumber, formatPlain } from '../../format.js';
import { rich, richWidth, fit, stroke, dimension, plotFunction, traceAxes, legendItem, squareMarker, xTitleOutside } from './draw-common.js';

const TITLES = { am: 'Amplitude modulation (AM)', fm: 'Frequency modulation (FM)', pm: 'Phase modulation (PM)' };
const FORMULAS = {
  am: 's(t) = [1 + m·x(t)] cos(2πf_c t)',
  fm: 's(t) = cos(2πf_c t + 2πΔf ∫x dt), so f = f_c + Δf·x(t)',
  pm: 's(t) = cos(2πf_c t + Δφ·x(t))',
};

export function drawModulation(ctx, S, p, pal, t) {
  const { W, H, px } = S;
  const pad = Math.round(px * 1.1);
  const titlePx = px + 4;

  // ---- Header.
  const shape = p.messageShape === 'square' ? 'square (digital)' : 'sine';
  const idx = p.modulation === 'am' ? `m = ${formatPlain(p.amIndex)}` : p.modulation === 'fm' ? `Δf = ${formatPlain(p.fmDeviation)} Hz, β = Δf/f_m = ${formatNumber(modulationIndex(p))}` : `Δφ = ${formatPlain(p.pmDeviation)} rad`;
  const values = `carrier f_c = ${formatPlain(p.carrierFrequency)} Hz   message f_m = ${formatPlain(p.messageFrequency)} Hz, ${shape}   ${idx}`;
  const titleBase = pad + titlePx * 0.85;
  const title = fit(ctx, [TITLES[p.modulation], p.modulation.toUpperCase()], W - 2 * pad, { px: titlePx, kind: 'strong' });
  rich(ctx, title, pad, titleBase, { colour: pal.ink, px: titlePx, kind: 'strong' });
  const tW = richWidth(ctx, title, { px: titlePx, kind: 'strong' });
  const inline = tW + px * 1.5 + richWidth(ctx, values, { px }) <= W - 2 * pad;
  let y = titleBase;
  if (inline) rich(ctx, values, pad + tW + px * 1.5, y, { colour: pal.ink, px });
  else {
    y += px * 1.45;
    rich(ctx, fit(ctx, [values, `f_c ${formatPlain(p.carrierFrequency)} Hz · f_m ${formatPlain(p.messageFrequency)} Hz · ${idx}`], W - 2 * pad, { px }), pad, y, { colour: pal.ink, px });
  }
  const compact = H < 420 || W < 600;
  if (!compact) {
    y += px * 1.45;
    rich(ctx, fit(ctx, [`${FORMULAS[p.modulation]}   (amplitudes normalised to 1; frequencies scaled down so each cycle is visible)`, FORMULAS[p.modulation]], W - 2 * pad, { px }), pad, y, { colour: pal.muted, px });
  }
  const top = y + px * 0.9;

  // ---- Regions: traces on the left, spectrum on the right (when there is room).
  const m = axisMargins(px);
  const showSpec = p.showSpectrum && W >= 760 && H >= 360;
  const specW = showSpec ? Math.round(Math.min(520, W * 0.32)) : 0;
  const traceX = pad + m.left;
  const traceR = W - pad - (showSpec ? specW + pad * 2 : m.right);
  const traceW = Math.max(60, traceR - traceX);
  const bottom = H - pad - m.bottom;
  const labelH = Math.round(px * (compact ? 1.3 : 1.5));
  const gap = Math.round(px * (compact ? 0.2 : 0.5));
  const panelH = Math.max(24, (bottom - top - 3 * labelH - 2 * gap) / 3);
  const t0 = t - p.traceWindow;
  const amp = p.modulation === 'am' ? Math.max(1.3, (1 + p.amIndex) * 1.12) : 1.3;

  const panels = [
    { name: 'Message x(t)', colour: pal.series[1], dash: [12, 7], width: 2.5, fn: (tt) => messageValue(tt, p), range: 1.3 },
    { name: 'Carrier c(t)', colour: pal.series[2], dash: [3, 4], width: 2.5, fn: (tt) => carrierValue(tt, p), range: 1.3 },
    { name: `${p.modulation.toUpperCase()} signal s(t)`, colour: pal.series[0], dash: null, width: 3, fn: (tt) => modulatedValue(tt, p), range: amp },
  ];
  let py = top;
  panels.forEach((panel, i) => {
    const rect = { x: traceX, y: py + labelH, w: traceW, h: panelH };
    const vp = viewport({ x: [t0, t], y: [-panel.range, panel.range], rect });
    const yTicks = panelH < px * 4 ? [0] : panel.range >= 2.1 && panelH > px * 7 ? [-2, -1, 0, 1, 2] : [-1, 0, 1];
    traceAxes(ctx, vp, pal, { px, xLabels: i === 2, yTicks, xCount: traceW > 600 ? 8 : 4, xTitle: 't (s)' });
    if (i === 2 && p.modulation === 'am') {
      // The envelope follows the message (dashed, the message's style), unless over-modulated.
      for (const s of [1, -1]) plotFunction(ctx, vp, (tt) => s * amEnvelope(tt, p), t0, t, { colour: pal.series[1], width: 2, dash: [12, 7], samples: 2 });
    }
    plotFunction(ctx, vp, panel.fn, t0, t, { colour: panel.colour, width: panel.width, dash: panel.dash });
    // "Now" is the right-hand edge.
    squareMarker(ctx, rect.x + rect.w, vp.toY(panel.fn(t)), 10, panel.colour, pal.ink);
    const lw = legendItem(ctx, traceX, py + labelH * 0.5, { colour: panel.colour, width: panel.width, dash: panel.dash, text: panel.name, px, textColour: pal.ink });
    if (i === 2 && p.modulation === 'am') {
      const note = p.amIndex > 1 ? 'over-modulated (m > 1): the envelope no longer follows the message' : 'dashed: envelope 1 + m·x(t)';
      const nx = traceX + lw + px * 1.2;
      const text = fit(ctx, [note, p.amIndex > 1 ? 'over-modulated (m > 1)' : 'dashed: envelope'], traceX + traceW - nx, { px });
      if (richWidth(ctx, text, { px }) <= traceX + traceW - nx) rich(ctx, text, nx, py + labelH * 0.5, { colour: p.amIndex > 1 ? pal.accentText : pal.muted, px, baseline: 'middle' });
    }
    if (i === 2 && p.modulation !== 'am') {
      const f = instantaneousFrequency(t, p);
      const text = `now: f = ${formatNumber(f)} Hz`;
      if (richWidth(ctx, text, { px }) + lw + px * 2 < traceW) rich(ctx, text, traceX + traceW, py + labelH * 0.5, { colour: pal.ink, px, baseline: 'middle', align: 'right' });
    }
    if (i === 0 && traceW > 420) rich(ctx, 'now →', traceX + traceW - 14, py + labelH * 0.5, { colour: pal.muted, px, baseline: 'middle', align: 'right' });
    py += labelH + panelH + gap;
  });
  if (showSpec) drawSpectrum(ctx, { x: W - pad - specW, y: top, w: specW, h: bottom - top }, p, pal, px);
}

function drawSpectrum(ctx, R, p, pal, px) {
  const m = axisMargins(px);
  rich(ctx, 'Spectrum (amplitude)', R.x, R.y + px * 1.0, { colour: pal.ink, px, kind: 'strong' });
  const fc = p.carrierFrequency;
  const lo = Math.max(0, fc - SPECTRUM_HALF_WIDTH);
  const hi = fc + SPECTRUM_HALF_WIDTH;
  const rect = { x: R.x + m.left, y: R.y + px * 2.2, w: R.w - m.left - m.right, h: Math.max(40, R.h - px * 2.2 - px * 3.2) };
  const vp = viewport({ x: [lo, hi], y: [0, 1.3], rect });
  drawAxes(ctx, vp, pal, { px, layer: 'under', yCount: 2, xCount: 4 });
  const spec = modulationSpectrum(p);
  if (spec) {
    for (const line of spec.lines) {
      if (line.f < lo || line.f > hi || line.amplitude < 0.005) continue; // too small to see: no marker
      const X = vp.toX(line.f);
      stroke(ctx, pal.series[0], 3);
      ctx.beginPath();
      ctx.moveTo(X, vp.toY(0));
      ctx.lineTo(X, vp.toY(line.amplitude));
      ctx.stroke();
      squareMarker(ctx, X, vp.toY(line.amplitude), 8, pal.series[0]);
    }
    const B = modulationBandwidth(p);
    if (B !== null) {
      const x0 = vp.toX(Math.max(lo, fc - B / 2));
      const x1 = vp.toX(Math.min(hi, fc + B / 2));
      const Yb = vp.toY(1.17);
      if (x1 - x0 > 4) dimension(ctx, x0, Yb, x1, Yb, { colour: pal.ink, width: 2 });
      const text = p.modulation === 'am' ? `B = 2f_m = ${formatNumber(B)} Hz` : `Carson B ≈ ${formatNumber(B)} Hz`;
      rich(ctx, text, (x0 + x1) / 2, Yb - 8, { colour: pal.ink, px, align: 'center', box: pal.bg, padding: 2 });
    }
    if (p.modulation === 'am' && p.messageShape !== 'square' && p.amIndex > 0) {
      for (const s of [-1, 1]) {
        const f = fc + s * p.messageFrequency;
        if (f < lo || f > hi) continue;
        rich(ctx, 'm/2', vp.toX(f) + s * 6, vp.toY(p.amIndex / 2) - 10, { colour: pal.muted, px, align: s < 0 ? 'right' : 'left' });
      }
      rich(ctx, 'f_c', vp.toX(fc) + 8, vp.toY(1) + px * 0.3, { colour: pal.muted, px });
    }
  } else {
    const msg = ['No simple line spectrum for', 'FM or PM of a square message.', 'Choose a sine message to see it.'];
    msg.forEach((l, i) => rich(ctx, l, rect.x + rect.w / 2, rect.y + rect.h * 0.4 + i * px * 1.4, { colour: pal.muted, px, align: 'center' }));
  }
  const xTitle = xTitleOutside(ctx, vp, pal, { px, title: 'f (Hz)' });
  drawAxes(ctx, vp, pal, { px, layer: 'over', yCount: 2, xCount: 4, formatX: xTitle.formatX });
  xTitle.draw();
  if (spec) {
    let captions = [p.modulation === 'am' ? (p.messageShape === 'square' ? 'sidebands at f_c ± f_m, ± 3f_m, …' : 'carrier and two side frequencies') : 'side frequencies at f_c ± nf_m, heights |J_n(β)|', ''];
    // Side frequencies below 0 Hz fold back onto the positive axis and add to the lines there.
    if (spec.folded) captions = ['lines below 0 Hz fold back and add to those above (0 Hz: a steady offset)', 'lines below 0 Hz fold back onto positive f', 'lines below 0 Hz fold back', ''];
    const c = fit(ctx, captions, R.w, { px });
    if (c) rich(ctx, c, R.x, R.y + R.h + px * 0.4, { colour: pal.muted, px });
  }
}
