// Doppler and beats view. Doppler: expanding crests from a moving source, a moving observer, and the
// heard frequency with the sign convention stated. Beats: two close tones, their sum and its envelope.
// Drawing only.
import { viewport, axisMargins, arrow, niceTicks } from '../../engine-kit.js';
import { DOPPLER_HALF_WIDTH, DOPPLER_SLOW, sourceX, observerX, crestsAt, emissionTime, observedFrequency, dopplerWavelengths, beatsValues, beatFrequency } from './model.js';
import { formatNumber, formatPlain, MINUS } from '../../format.js';
import { rich, richWidth, fit, stroke, dimension, plotFunction, traceAxes, legendItem, squareMarker, dot } from './draw-common.js';

const TWO_PI = 2 * Math.PI;

function header(ctx, S, pal, title, values) {
  const { W, px } = S;
  const pad = Math.round(px * 1.1);
  const titlePx = px + 4;
  const base = pad + titlePx * 0.85;
  rich(ctx, title, pad, base, { colour: pal.ink, px: titlePx, kind: 'strong' });
  const tw = richWidth(ctx, title, { px: titlePx, kind: 'strong' });
  if (tw + px * 1.5 + richWidth(ctx, values[0], { px }) <= W - 2 * pad) {
    rich(ctx, values[0], pad + tw + px * 1.5, base, { colour: pal.ink, px });
    return base + px * 0.9;
  }
  rich(ctx, fit(ctx, values, W - 2 * pad, { px }), pad, base + px * 1.45, { colour: pal.ink, px });
  return base + px * 1.45 + px * 0.9;
}

function footer(ctx, S, pal, lines, colours = []) {
  const { W, H, px } = S;
  const pad = Math.round(px * 1.1);
  const lineH = Math.round(px * 1.45);
  const fitted = lines.map((l) => fit(ctx, Array.isArray(l) ? l : [l], W - 2 * pad, { px })).filter(Boolean);
  const shown = fitted.slice(0, H < 420 ? 2 : 3);
  const topY = H - pad - shown.length * lineH;
  shown.forEach((l, i) => rich(ctx, l, pad, topY + (i + 0.8) * lineH, { colour: colours[i] ?? (i === 0 ? pal.ink : pal.muted), px, kind: i === 0 ? 'strong' : 'label' }));
  return topY - px * 0.4;
}

const signedText = (v) => (v < 0 ? `${MINUS}${formatPlain(-v)}` : formatPlain(v));

export function drawDopplerBeats(ctx, S, p, pal, t) {
  if (p.dopplerMode === 'beats') return drawBeats(ctx, S, p, pal, t);
  return drawDoppler(ctx, S, p, pal, t);
}

function drawDoppler(ctx, S, p, pal, t) {
  const { W, px } = S;
  const pad = Math.round(px * 1.1);
  const v = p.soundSpeed;
  const values = [
    `f = ${formatPlain(p.sourceFrequency)} Hz   v = ${formatPlain(v)} m/s   v_s = ${signedText(p.sourceSpeed)} m/s   v_o = ${signedText(p.observerSpeed)} m/s`,
    `f ${formatPlain(p.sourceFrequency)} Hz · v_s ${signedText(p.sourceSpeed)} · v_o ${signedText(p.observerSpeed)} m/s`,
  ];
  const top = header(ctx, S, pal, 'Doppler effect', values);

  // The heard frequency with the signs as they apply now (they flip once the source has passed).
  const { sigma } = emissionTime(t, p);
  const vo = sigma * p.observerSpeed; // observer velocity towards the source
  const vs = sigma * p.sourceSpeed; // source velocity towards the observer
  const fHeard = observedFrequency(t, p);
  const plusMinus = (a, op, b) => (b < 0 ? `${a} ${op === '+' ? MINUS : '+'} ${formatPlain(-b)}` : `${a} ${op === '+' ? '+' : MINUS} ${formatPlain(b)}`);
  const formula = `f′ = f (v + v_o)/(v − v_s) = ${formatPlain(p.sourceFrequency)} × (${plusMinus(formatPlain(v), '+', vo)})/(${plusMinus(formatPlain(v), '−', vs)}) = ${formatNumber(fHeard, { sigfigs: 4 })} Hz`;
  const passed = sigma < 0 ? ' (source has passed: signs flip)' : '';
  const every = [1, 2, 5, 10, 20, 50, 100].find((k) => (k * v) / p.sourceFrequency >= 1.2) ?? 100;
  const crestText = every === 1 ? 'every crest drawn' : every === 2 ? 'every 2nd crest drawn' : `every ${every}th crest drawn`;
  const { ahead, behind } = dopplerWavelengths(p);
  const bottom = footer(ctx, S, pal, [
    [formula + passed, formula, `f′ = ${formatNumber(fHeard, { sigfigs: 4 })} Hz`],
    ['Sign convention: v_s > 0 when the source moves towards the observer; v_o > 0 when the observer moves towards the source.', 'v_s > 0: source towards observer; v_o > 0: observer towards source', '+v_s: towards observer · +v_o: towards source'],
    [`Slow motion: ${formatPlain(1 / DOPPLER_SLOW)} times slower than real time · ${crestText} · λ in front ${formatNumber(ahead)} m, behind ${formatNumber(behind)} m · still air`, `Slow motion ×${formatPlain(1 / DOPPLER_SLOW)} · ${crestText}`],
  ]);

  const rect = { x: pad, y: top + px * 0.4, w: W - 2 * pad, h: Math.max(60, bottom - top - px * 0.4 - px * 2.2) };
  const vp = viewport({ x: [-DOPPLER_HALF_WIDTH, DOPPLER_HALF_WIDTH], y: [-1, 1], rect, equal: true });
  const rMax = Math.hypot(vp.x[1] - vp.x[0], vp.y[1] - vp.y[0]) + 5;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  // Axis line and crests.
  stroke(ctx, pal.grid, 1.5);
  ctx.beginPath();
  ctx.moveTo(rect.x, vp.toY(0));
  ctx.lineTo(rect.x + rect.w, vp.toY(0));
  ctx.stroke();
  stroke(ctx, pal.axis, 1.5);
  for (const c of crestsAt(t, p, every, rMax)) {
    if (c.r <= 0) continue;
    ctx.beginPath();
    ctx.arc(vp.toX(c.x), vp.toY(0), c.r * vp.scaleX, 0, TWO_PI);
    ctx.stroke();
  }
  ctx.restore();
  stroke(ctx, pal.axis, 1);
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);

  // Distance scale along the bottom edge.
  const { ticks } = niceTicks(-DOPPLER_HALF_WIDTH, DOPPLER_HALF_WIDTH, rect.w > 700 ? 10 : 5);
  const titleW = richWidth(ctx, 'x (m)', { px });
  for (const x of ticks) {
    const X = vp.toX(x);
    stroke(ctx, pal.axis, 1.5);
    ctx.beginPath();
    ctx.moveTo(X, rect.y + rect.h);
    ctx.lineTo(X, rect.y + rect.h + 6);
    ctx.stroke();
    if (X + px * 1.5 > rect.x + rect.w - titleW - px * 0.5 || X - px * 1.5 < rect.x) continue; // keep clear of the title and edges
    rich(ctx, signedText(x), X, rect.y + rect.h + px * 1.25, { colour: pal.muted, px, kind: 'mono', align: 'center' });
  }
  rich(ctx, 'x (m)', rect.x + rect.w, rect.y + rect.h + px * 1.25, { colour: pal.ink, px, align: 'right' });

  // Source (orange circle) and observer (ink square): shape as well as colour.
  const xs = sourceX(t, p);
  const xo = observerX(t, p);
  const Y0 = vp.toY(0);
  // Centred labels, kept inside the view when an object reaches an edge.
  const centred = (text, X, Y, opts = {}) => {
    const w = richWidth(ctx, text, { px, kind: opts.kind });
    const cx = Math.min(rect.x + rect.w - w / 2 - 6, Math.max(rect.x + w / 2 + 6, X));
    rich(ctx, text, cx, Y, { colour: pal.ink, px, align: 'center', box: pal.bg, padding: 3, ...opts });
  };
  const vScale = (4 / 150) * vp.scaleX; // 150 m/s ↦ a 4 m arrow
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (p.sourceSpeed !== 0) {
    const dir = Math.sign(p.sourceSpeed);
    const X = vp.toX(xs) + dir * 14;
    arrow(ctx, X, Y0, X + p.sourceSpeed * vScale + dir * 10, Y0, { colour: pal.series[0], width: 3.5, head: 14 });
  }
  if (p.observerSpeed !== 0) {
    const dir = -Math.sign(p.observerSpeed);
    const X = vp.toX(xo) + dir * 16;
    arrow(ctx, X, Y0, X - p.observerSpeed * vScale + dir * 10, Y0, { colour: pal.ink, width: 3.5, head: 14 });
  }
  ctx.restore();
  if (p.sourceSpeed !== 0) centred(`v_s = ${formatPlain(Math.abs(p.sourceSpeed))} m/s`, vp.toX(xs) + (p.sourceSpeed * vScale) / 2, Y0 + px * 1.6);
  if (p.observerSpeed !== 0) centred(`v_o = ${formatPlain(Math.abs(p.observerSpeed))} m/s`, vp.toX(xo) - (p.observerSpeed * vScale) / 2, Y0 + px * (p.sourceSpeed !== 0 && Math.abs(vp.toX(xs) - vp.toX(xo)) < px * 8 ? 3 : 1.6));
  ctx.fillStyle = pal.series[0];
  ctx.beginPath();
  ctx.arc(vp.toX(xs), Y0, 12, 0, TWO_PI);
  ctx.fill();
  stroke(ctx, pal.ink, 2);
  ctx.stroke();
  squareMarker(ctx, vp.toX(xo), Y0, 22, pal.ink);
  const sLabel = `source ${formatPlain(p.sourceFrequency)} Hz`;
  const oLabel = `observer hears ${formatNumber(fHeard, { sigfigs: 4 })} Hz`;
  const close = Math.abs(vp.toX(xs) - vp.toX(xo)) < (richWidth(ctx, sLabel, { px }) + richWidth(ctx, oLabel, { px })) / 2 + 20;
  centred(sLabel, vp.toX(xs), Y0 - px * (close ? 2.6 : 1.3));
  centred(oLabel, vp.toX(xo), Y0 - px * 1.3, { kind: 'strong' });
}

function drawBeats(ctx, S, p, pal, t) {
  const { W, px } = S;
  const pad = Math.round(px * 1.1);
  const m = axisMargins(px);
  const f1 = p.toneFrequency1;
  const f2 = p.toneFrequency2;
  const fb = beatFrequency(f1, f2);
  const values = [`f_1 = ${formatPlain(f1)} Hz   f_2 = ${formatPlain(f2)} Hz   beat frequency |f_1 − f_2| = ${formatNumber(fb)} Hz`, `f_1 ${formatPlain(f1)} Hz · f_2 ${formatPlain(f2)} Hz · f_{beat} ${formatNumber(fb)} Hz`];
  const top = header(ctx, S, pal, 'Beats', values);
  const bottom = footer(ctx, S, pal, [
    fb > 0
      ? [`y_1 + y_2 = 2 cos(πΔf t) cos(π(f_1 + f_2)t): the loudness rises and falls ${formatNumber(fb)} times a second (beat period ${formatNumber(1 / fb)} s).`, `Beat period ${formatNumber(1 / fb)} s`]
      : ['Equal frequencies: no beats, the sum has a steady amplitude.', 'No beats'],
    ['Top: the two waves over a few cycles, view locked to wave 1’s crests. Bottom: their sum, with its envelope (dashed).', 'Top: two waves · Bottom: sum and envelope'],
  ]);
  const avail = bottom - top;
  const lab = px * 1.5;
  const tickRow = px * 1.7;

  // Top: a few cycles of each wave. The window starts at a crest of wave 1, so wave 1 stands still and
  // wave 2 drifts past it at the beat frequency: in step (loud), then out of step (quiet).
  const cycles = 6;
  const t0 = Math.floor(t * f1) / f1;
  const spanMs = (cycles / f1) * 1000;
  const r1 = { x: pad + m.left, y: top + lab, w: W - 2 * pad - m.left - m.right, h: Math.max(30, avail * 0.38 - lab - tickRow) };
  const vp1 = viewport({ x: [0, spanMs], y: [-1.3, 1.3], rect: r1 });
  traceAxes(ctx, vp1, pal, { px, yTicks: r1.h > px * 4 ? [-1, 0, 1] : [0], xCount: 6, formatX: (v) => formatPlain(v), xTitle: 'time (ms)' });
  const s1 = { colour: pal.series[1], width: 2.5, dash: [12, 7] };
  const s2 = { colour: pal.series[2], width: 2.5, dash: [3, 4] };
  plotFunction(ctx, vp1, (ms) => beatsValues(t0 + ms / 1000, p).y1, 0, spanMs, s1);
  plotFunction(ctx, vp1, (ms) => beatsValues(t0 + ms / 1000, p).y2, 0, spanMs, s2);
  let lx = r1.x;
  lx += legendItem(ctx, lx, top + lab * 0.45, { ...s1, text: `y_1 (${formatPlain(f1)} Hz)`, px, textColour: pal.ink }) + px * 1.4;
  lx += legendItem(ctx, lx, top + lab * 0.45, { ...s2, text: `y_2 (${formatPlain(f2)} Hz)`, px, textColour: pal.ink }) + px * 1.4;
  const env = beatsValues(t, p).envelope;
  const state = fb === 0 ? 'always in step: steady' : env > 1.6 ? 'nearly in step: loud' : env < 0.4 ? 'nearly opposite: quiet' : 'drifting out of step';
  if (lx + richWidth(ctx, `now: ${state}`, { px }) < r1.x + r1.w) rich(ctx, `now: ${state}`, r1.x + r1.w, top + lab * 0.45, { colour: pal.ink, px, kind: 'strong', align: 'right', baseline: 'middle' });
  // Bottom: the sum over the time shown, with its envelope ±2|cos(πΔf t)|.
  const yTop2 = r1.y + r1.h + tickRow + px * 0.4;
  const r2 = { x: r1.x, y: yTop2 + lab, w: r1.w, h: Math.max(30, bottom - yTop2 - lab - tickRow) };
  const tw0 = t - p.beatWindow;
  const vp2 = viewport({ x: [tw0, t], y: [-2.5, 3.4], rect: r2 });
  traceAxes(ctx, vp2, pal, { px, yTicks: r2.h > px * 7 ? [-2, -1, 0, 1, 2] : r2.h > px * 4 ? [-2, 0, 2] : [0], xCount: 8, xTitle: 't (s)' });
  const sumStyle = { colour: pal.series[0], width: 2, dash: null };
  const envStyle = { colour: pal.series[1], width: 2.5, dash: [12, 7] };
  const cyclesPerPx = (((f1 + f2) / 2) * p.beatWindow) / r2.w;
  if (cyclesPerPx > 0.25) {
    // Too many cycles to draw one by one: fill between the envelopes (the band the signal fills).
    ctx.save();
    ctx.fillStyle = pal.series[0];
    ctx.globalAlpha = 0.45;
    const cols = Math.ceil(r2.w);
    for (let c = 0; c < cols; c++) {
      const tt = tw0 + ((c + 0.5) / cols) * p.beatWindow;
      const e = beatsValues(tt, p).envelope;
      ctx.fillRect(r2.x + c, vp2.toY(e), 1.2, vp2.toY(-e) - vp2.toY(e));
    }
    ctx.restore();
  } else plotFunction(ctx, vp2, (tt) => beatsValues(tt, p).sum, tw0, t, sumStyle);
  for (const s of [1, -1]) plotFunction(ctx, vp2, (tt) => s * beatsValues(tt, p).envelope, tw0, t, { ...envStyle, samples: 2 });
  squareMarker(ctx, r2.x + r2.w, vp2.toY(beatsValues(t, p).sum), 10, pal.series[0], pal.ink);
  // Beat period between two envelope maxima (t = k/Δf).
  if (fb > 0) {
    const k0 = Math.ceil(tw0 * fb);
    const ta = k0 / fb;
    const tb = (k0 + 1) / fb;
    if (tb <= t && (tb - ta) * vp2.scaleX > px * 5) {
      const Yb = vp2.toY(2.45);
      dimension(ctx, vp2.toX(ta), Yb, vp2.toX(tb), Yb, { colour: pal.ink, width: 2 });
      rich(ctx, `T_{beat} = ${formatNumber(1 / fb)} s`, vp2.toX((ta + tb) / 2), Yb - 8, { colour: pal.ink, px, align: 'center', kind: 'strong', box: pal.bg, padding: 2 });
    }
  }
  lx = r2.x;
  lx += legendItem(ctx, lx, yTop2 + lab * 0.45, { ...sumStyle, width: 3, text: 'y_1 + y_2', px, textColour: pal.ink }) + px * 1.4;
  lx += legendItem(ctx, lx, yTop2 + lab * 0.45, { ...envStyle, text: 'envelope ±2|cos(πΔf t)|', px, textColour: pal.ink }) + px * 1.4;
  if (cyclesPerPx > 0.25 && lx + richWidth(ctx, 'cycles too close to draw: band shows their extent', { px }) < r2.x + r2.w) {
    rich(ctx, 'cycles too close to draw: band shows their extent', r2.x + r2.w, yTop2 + lab * 0.45, { colour: pal.muted, px, align: 'right', baseline: 'middle' });
  }
}
