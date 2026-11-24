// Wave machine view: transverse and longitudinal travelling waves, superposition of two waves or
// pulses, and standing waves on a string or in open and closed pipes with labelled N and A. Drawing only.
import { viewport, axisMargins, drawAxes, arrow, niceTicks } from '../../engine-kit.js';
import {
  MACHINE_LENGTH,
  travellingDisplacement,
  superpositionValues,
  standingFrequency,
  standingWavelength,
  standingShape,
  standingNodes,
  harmonicNumber,
  standingDisplayFrequency,
  DT,
} from './model.js';
import { formatNumber, formatPlain } from '../../format.js';
import { rich, richWidth, fit, stroke, dimension, plotFunction, traceAxes, legendItem, squareMarker, dot, xTitleOutside } from './draw-common.js';

const TWO_PI = 2 * Math.PI;
const MARK_X = 3; // m, the marked particle
const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;

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

function footer(ctx, S, pal, lines) {
  const { W, H, px } = S;
  const pad = Math.round(px * 1.1);
  const lineH = Math.round(px * 1.45);
  const fitted = lines.map((l) => fit(ctx, Array.isArray(l) ? l : [l], W - 2 * pad, { px })).filter(Boolean);
  const shown = fitted.slice(0, H < 420 ? 1 : 3);
  const topY = H - pad - shown.length * lineH;
  shown.forEach((l, i) => rich(ctx, l, pad, topY + (i + 0.8) * lineH, { colour: i === 0 ? pal.ink : pal.muted, px }));
  return topY - px * 0.4;
}

export function drawMachine(ctx, S, state, p, pal, t) {
  if (p.waveType === 'standing') return drawStanding(ctx, S, state, p, pal);
  if (p.waveType === 'superposition') return drawSuperposition(ctx, S, p, pal, t);
  if (p.waveType === 'longitudinal') return drawLongitudinal(ctx, S, p, pal, t);
  return drawTransverse(ctx, S, p, pal, t);
}

const wave1 = (p) => ({ amplitude: p.amplitude, frequency: p.frequency, speed: p.waveSpeed, direction: 'right' });

function travellingValues(p) {
  const lambda = p.waveSpeed / p.frequency;
  return [
    `v = ${formatPlain(p.waveSpeed)} m/s →   f = ${formatPlain(p.frequency)} Hz   λ = v/f = ${formatNumber(lambda)} m   A = ${formatPlain(p.amplitude)} m`,
    `v ${formatPlain(p.waveSpeed)} m/s · f ${formatPlain(p.frequency)} Hz · λ ${formatNumber(lambda)} m`,
  ];
}

/** Crest positions x = (π/2 + ωt + 2πj)/k inside [lo, hi] for a right-moving sine wave. */
function crests(p, t, lo, hi) {
  const k = (TWO_PI * p.frequency) / p.waveSpeed;
  const w = TWO_PI * p.frequency;
  const out = [];
  const j0 = Math.ceil((lo * k - Math.PI / 2 - w * t) / TWO_PI);
  for (let j = j0; ; j++) {
    const x = (Math.PI / 2 + w * t + TWO_PI * j) / k;
    if (x > hi) break;
    out.push(x);
  }
  return out;
}

function drawTransverse(ctx, S, p, pal, t) {
  const { W, px } = S;
  const pad = Math.round(px * 1.1);
  const m = axisMargins(px);
  const top = header(ctx, S, pal, 'Transverse wave', travellingValues(p));
  const bottom = footer(ctx, S, pal, [
    ['Each particle moves up and down (perpendicular to the direction the wave travels); the energy moves along the rope.', 'Particles move perpendicular to the wave direction.'],
    [`Marked particle at x = ${MARK_X} m. Lower graph: its displacement against time, period T = 1/f = ${formatNumber(1 / p.frequency)} s.`, `Lower graph: marked particle, T = ${formatNumber(1 / p.frequency)} s.`],
  ]);
  const avail = bottom - top;
  const split = avail > 300;
  const h1 = split ? avail * 0.58 - m.bottom : avail - m.bottom - px;
  const rect = { x: pad + m.left, y: top + px * 1.2, w: W - 2 * pad - m.left - m.right, h: h1 - px * 1.2 };
  const vp = viewport({ x: [0, MACHINE_LENGTH], y: [-1.25, 1.25], rect });
  drawAxes(ctx, vp, pal, { px, layer: 'under', yCount: 4 });
  rich(ctx, fit(ctx, ['Displacement–position graph (a snapshot of the rope)', 'Snapshot of the rope'], rect.w, { px }), rect.x, top + px * 0.6, { colour: pal.muted, px });
  const y = (x) => travellingDisplacement(x, t, wave1(p));
  plotFunction(ctx, vp, y, 0, MACHINE_LENGTH, { colour: pal.series[0], width: 3 });
  const lambda = p.waveSpeed / p.frequency;
  // At least 6 particles per wavelength (fewer would alias); none if they would be under 6 px apart.
  const spacing = Math.min(0.4, lambda / 6);
  if (p.showParticles && spacing * vp.scaleX >= 6) {
    for (let i = 0; i * spacing <= MACHINE_LENGTH + 1e-9; i++) dot(ctx, vp.toX(i * spacing), vp.toY(y(i * spacing)), 3.5, pal.ink);
  }

  // λ and A on a crest near the left.
  // Start the λ bracket clear of the y-axis title.
  const c = crests(p, t, 1.8, MACHINE_LENGTH - 0.6).find((x) => x + lambda <= MACHINE_LENGTH - 0.3);
  if (c !== undefined && lambda * vp.scaleX > px * 4) {
    const Yb = vp.toY(Math.min(1.12, p.amplitude + 0.18));
    dimension(ctx, vp.toX(c), Yb, vp.toX(c + lambda), Yb, { colour: pal.ink, width: 2 });
    rich(ctx, `λ = ${formatNumber(lambda)} m`, vp.toX(c + lambda / 2), Yb - 8, { colour: pal.ink, px, align: 'center', kind: 'strong', box: pal.bg, padding: 2 });
  }
  const cA = crests(p, t, 0.4, MACHINE_LENGTH - 2).find((x) => Math.abs(x - MARK_X) > 1.2); // clear of the marked particle
  if (cA !== undefined && p.amplitude * vp.scaleY > px * 1.2) {
    dimension(ctx, vp.toX(cA), vp.toY(0), vp.toX(cA), vp.toY(p.amplitude), { colour: pal.series[1], width: 2, tick: 5 });
    rich(ctx, `A = ${formatPlain(p.amplitude)} m`, vp.toX(cA) + 8, vp.toY(p.amplitude / 2), { colour: pal.ink, px, baseline: 'middle', box: pal.bg, padding: 2 });
  }

  // Marked particle and its velocity (vertical): v_y = ∂y/∂t = −Aω cos(kx − ωt).
  const k = (TWO_PI * p.frequency) / p.waveSpeed;
  const w = TWO_PI * p.frequency;
  const vy = -p.amplitude * w * Math.cos(k * MARK_X - w * t);
  const X = vp.toX(MARK_X);
  const Y = vp.toY(y(MARK_X));
  const scale = 0.55 / Math.max(1e-9, p.amplitude * w);
  arrow(ctx, X, Y, X, vp.toY(y(MARK_X) + vy * scale), { colour: pal.series[1], width: 3, head: 12 });
  squareMarker(ctx, X, Y, 14, pal.series[1], pal.ink);
  axesOver(ctx, vp, pal, px, 'x (m)', 'y (m)');

  if (split) {
    const r2 = { x: rect.x, y: top + avail * 0.58 + px * 1.4, w: rect.w, h: Math.max(30, avail * 0.42 - px * 1.4 - m.bottom) };
    const win = 8;
    const vp2 = viewport({ x: [t - win, t], y: [-1.25, 1.25], rect: r2 });
    traceAxes(ctx, vp2, pal, { px, yTicks: [-1, 0, 1], xCount: 8, xTitle: 't (s)' });
    const yt = (tt) => travellingDisplacement(MARK_X, tt, wave1(p));
    plotFunction(ctx, vp2, yt, t - win, t, { colour: pal.series[1], width: 2.5 });
    squareMarker(ctx, r2.x + r2.w, vp2.toY(yt(t)), 10, pal.series[1], pal.ink);
    rich(ctx, `Marked particle: displacement–time graph (y in m)`, r2.x, r2.y - px * 0.45, { colour: pal.muted, px });
  }
}

function drawLongitudinal(ctx, S, p, pal, t) {
  const { W, px } = S;
  const pad = Math.round(px * 1.1);
  const m = axisMargins(px);
  const top = header(ctx, S, pal, 'Longitudinal wave', travellingValues(p));
  const k = (TWO_PI * p.frequency) / p.waveSpeed;
  const notes = [['Particles move back and forth along the direction the wave travels. C: compression, R: rarefaction.', 'C compression · R rarefaction']];
  if (p.amplitude * k >= 1) notes.push('Amplitude is large for this wavelength: real particles could not pass one another.');
  else notes.push(['Lower graph: displacement of each particle from its rest position (positive = to the right).', 'Lower graph: displacement (+ = right).']);
  const bottom = footer(ctx, S, pal, notes);
  const avail = bottom - top;
  const rect = { x: pad + m.left, y: top + px * 2.2, w: W - 2 * pad - m.left - m.right, h: avail * 0.36 };
  const vpT = viewport({ x: [0, MACHINE_LENGTH], y: [0, 1], rect });
  const xi = (x) => travellingDisplacement(x, t, wave1(p));

  // C and R labels at compression (kx − ωt = π) and rarefaction (kx − ωt = 0) centres. When the
  // wavelength is short on screen, only every `every`-th wavelength is labelled, so letters never merge.
  const w = TWO_PI * p.frequency;
  const lam = TWO_PI / k;
  const lamPx = lam * vpT.scaleX;
  const every = Math.max(1, Math.ceil((px * 3.6) / lamPx));
  const showR = lamPx / 2 >= px * 1.6; // R sits half a wavelength from C: label it only when there is room
  const labels = [];
  for (const [phase, text] of showR ? [[Math.PI, 'C'], [0, 'R']] : [[Math.PI, 'C']]) {
    const x0 = (phase + w * t) / k;
    const j0 = Math.ceil(-x0 / lam);
    for (let j = j0; x0 + j * lam <= MACHINE_LENGTH; j++) {
      const x = x0 + j * lam;
      if (j % every === 0 && x >= 0.3 && x <= MACHINE_LENGTH - 0.3) labels.push([x, text]);
    }
  }
  for (const [x, text] of labels) rich(ctx, text, vpT.toX(x), rect.y - px * 0.5, { colour: text === 'C' ? pal.accentText : pal.series[1], px, kind: 'strong', align: 'center' });

  // Rows of particles in a tube: at least 8 per wavelength so the bunching is never aliased.
  stroke(ctx, pal.axis, 1.5);
  ctx.strokeRect(rect.x - 6, rect.y, rect.w + 12, rect.h);
  const rows = 6;
  const spacing = Math.min(0.2, lam / 8);
  const spacingPx = spacing * vpT.scaleX;
  const markY = rect.y + (2.5 / rows) * rect.h; // on the third row, in place of that particle's dot
  if (spacingPx >= 3) {
    const r = Math.min(Math.max(2.5, px * 0.17), spacingPx * 0.4);
    for (let row = 0; row < rows; row++) {
      const Y = rect.y + ((row + 0.5) / rows) * rect.h;
      for (let i = 0; i * spacing <= MACHINE_LENGTH + 1e-9; i++) {
        const x0 = i * spacing;
        const xs = x0 + xi(x0);
        if (xs < -0.1 || xs > MACHINE_LENGTH + 0.1) continue;
        dot(ctx, vpT.toX(xs), Y, r, pal.ink);
      }
    }
  } else {
    rich(ctx, 'Wavelength too short to draw the particles at this size: see the graph below.', rect.x + rect.w / 2, rect.y + rect.h * 0.75, { colour: pal.muted, px, align: 'center', box: pal.bg });
  }
  squareMarker(ctx, vpT.toX(MARK_X + xi(MARK_X)), markY, 14, pal.series[1], pal.ink);
  // Rest position of the marked particle: a tick under the tube.
  stroke(ctx, pal.ink, 2);
  ctx.beginPath();
  ctx.moveTo(vpT.toX(MARK_X), rect.y + rect.h + 2);
  ctx.lineTo(vpT.toX(MARK_X), rect.y + rect.h + 10);
  ctx.stroke();
  rich(ctx, `marked particle (rest position x = ${MARK_X} m)`, vpT.toX(MARK_X) - 6, rect.y + rect.h + px * 1.3, { colour: pal.muted, px });

  // Displacement graph underneath (the transverse picture of a longitudinal wave).
  const r2 = { x: rect.x, y: rect.y + rect.h + px * 2.6, w: rect.w, h: Math.max(30, bottom - (rect.y + rect.h + px * 2.6) - m.bottom) };
  const vp = viewport({ x: [0, MACHINE_LENGTH], y: [-1.25, 1.25], rect: r2 });
  drawAxes(ctx, vp, pal, { px, layer: 'under', yCount: 4 });
  for (const [x, text] of labels) {
    ctx.save();
    stroke(ctx, text === 'C' ? pal.accentText : pal.series[1], 1.5, 'dotted');
    ctx.beginPath();
    ctx.moveTo(vp.toX(x), r2.y);
    ctx.lineTo(vp.toX(x), r2.y + r2.h);
    ctx.stroke();
    ctx.restore();
  }
  plotFunction(ctx, vp, xi, 0, MACHINE_LENGTH, { colour: pal.series[0], width: 3 });
  squareMarker(ctx, vp.toX(MARK_X), vp.toY(xi(MARK_X)), 12, pal.series[1], pal.ink);
  axesOver(ctx, vp, pal, px, 'rest position x (m)', 'displacement (m)');
}

/** Ticks and titles over the data layer, with the x title in the tick row under the plot (not over the data). */
function axesOver(ctx, vp, pal, px, xTitle, yTitle) {
  const xt = xTitleOutside(ctx, vp, pal, { px, title: xTitle });
  drawAxes(ctx, vp, pal, { px, layer: 'over', yCount: 4, yTitle, formatX: xt.formatX });
  xt.draw();
}

function drawSuperposition(ctx, S, p, pal, t) {
  const { W, px } = S;
  const pad = Math.round(px * 1.1);
  const m = axisMargins(px);
  const pulses = p.superShape === 'pulses';
  const values = pulses
    ? [`pulse heights A_1 = ${formatPlain(p.amplitude)} m, A_2 = ${formatPlain(p.amplitude2)} m   v = ${formatPlain(p.waveSpeed)} m/s`, `A_1 ${formatPlain(p.amplitude)} m · A_2 ${formatPlain(p.amplitude2)} m`]
    : [`f_1 = ${formatPlain(p.frequency1)} Hz →   f_2 = ${formatPlain(p.frequency2)} Hz ${p.direction2 === 'left' ? '←' : '→'}   A_1 = ${formatPlain(p.amplitude)} m   A_2 = ${formatPlain(p.amplitude2)} m   v = ${formatPlain(p.waveSpeed)} m/s`, `f_1 ${formatPlain(p.frequency1)} Hz · f_2 ${formatPlain(p.frequency2)} Hz`];
  const top = header(ctx, S, pal, pulses ? 'Superposition of two pulses' : 'Superposition of two waves', values);
  const notes = [['Principle of superposition: at every point the displacement is y = y_1 + y_2.', 'y = y_1 + y_2 at every point']];
  if (pulses) notes.push(['The pulses pass through each other and continue unchanged.', 'Pulses pass through unchanged.']);
  else if (p.direction2 === 'left' && p.frequency1 === p.frequency2) notes.push(['Equal waves travelling in opposite directions form a standing wave.', 'Opposite directions: a standing wave.']);
  const bottom = footer(ctx, S, pal, notes);
  const legendH = px * 1.6;
  const rect = { x: pad + m.left, y: top + legendH + px * 0.6, w: W - 2 * pad - m.left - m.right, h: Math.max(60, bottom - top - legendH - px * 0.6 - m.bottom) };
  const vp = viewport({ x: [0, MACHINE_LENGTH], y: [-2.3, 2.3], rect });
  drawAxes(ctx, vp, pal, { px, layer: 'under', yCount: 4 });
  const s1 = { colour: pal.series[1], width: 2.5, dash: [12, 7] };
  const s2 = { colour: pal.series[2], width: 2.5, dash: [3, 4] };
  const s3 = { colour: pal.series[0], width: 3.5, dash: null };
  // The sum first, then each wave on top, so y₁ and y₂ stay visible where the sum equals one of them.
  plotFunction(ctx, vp, (x) => superpositionValues(x, t, p).sum, 0, MACHINE_LENGTH, s3);
  plotFunction(ctx, vp, (x) => superpositionValues(x, t, p).y1, 0, MACHINE_LENGTH, s1);
  plotFunction(ctx, vp, (x) => superpositionValues(x, t, p).y2, 0, MACHINE_LENGTH, s2);
  axesOver(ctx, vp, pal, px, 'x (m)', 'y (m)');
  let lx = rect.x;
  const ly = top + legendH * 0.55;
  const items = [
    [s1, pulses ? 'y_1: pulse 1 →' : 'y_1: wave 1 →'],
    [s2, pulses ? 'y_2: pulse 2 ←' : `y_2: wave 2 ${p.direction2 === 'left' ? '←' : '→'}`],
    [s3, 'y_1 + y_2: what the medium does'],
  ];
  for (const [style, text] of items) {
    const w = richWidth(ctx, text, { px }) + px * 2.5;
    if (lx + w > rect.x + rect.w + m.right) break;
    lx += legendItem(ctx, lx, ly, { ...style, text, px, textColour: pal.ink }) + px * 1.6;
  }
}

function drawStanding(ctx, S, state, p, pal) {
  const { W, px } = S;
  const pad = Math.round(px * 1.1);
  const m = axisMargins(px);
  const { boundary, harmonic: n, mediumLength: L, standingSpeed: v } = p;
  const f = standingFrequency(boundary, n, L, v);
  const lambda = standingWavelength(boundary, n, L);
  const h = harmonicNumber(boundary, n);
  const title = { string: 'Standing wave on a string', open: 'Standing wave in an open pipe', closed: 'Standing wave in a closed pipe' }[boundary];
  const values = [`L = ${formatPlain(L)} m   v = ${formatPlain(v)} m/s   mode n = ${n}: ${ordinal(h)} harmonic`, `L ${formatPlain(L)} m · v ${formatPlain(v)} m/s · ${ordinal(h)} harmonic`];
  const top = header(ctx, S, pal, title, values);

  const formula =
    boundary === 'closed'
      ? `f = (2n − 1)v/4L = ${h} × ${formatPlain(v)}/(4 × ${formatPlain(L)}) = ${formatNumber(f)} Hz   λ = 4L/(2n − 1) = ${formatNumber(lambda)} m`
      : `f = nv/2L = ${n} × ${formatPlain(v)}/(2 × ${formatPlain(L)}) = ${formatNumber(f)} Hz   λ = 2L/n = ${formatNumber(lambda)} m`;
  const allowed = [1, 2, 3, 4].map((j) => formatNumber(standingFrequency(boundary, j, L, v))).join(', ');
  const slow = f / standingDisplayFrequency(boundary, n);
  const notes = [
    [formula, `f = ${formatNumber(f)} Hz · λ = ${formatNumber(lambda)} m`],
    [`Allowed frequencies: ${allowed} Hz …${boundary === 'closed' ? ' (odd harmonics only)' : ''}   Motion slowed down ${formatNumber(slow)} times; amplitude not to scale.`, `Slowed ${formatNumber(slow)}×; amplitude not to scale.`],
  ];
  if (boundary !== 'string') notes.push(['Curves show the displacement of the air along the pipe, drawn sideways. N: displacement node, A: displacement antinode.', 'N node · A antinode (air displacement)']);
  else notes.push(['N: node (no motion), A: antinode (largest motion). Both ends are fixed, so both are nodes.', 'N node · A antinode']);
  const bottom = footer(ctx, S, pal, notes);

  const rect = { x: pad + m.left, y: top + px * 1.4, w: W - 2 * pad - m.left - m.right * 2, h: Math.max(60, bottom - top - px * 1.4 - m.bottom - px * 1.6) };
  const vp = viewport({ x: [0, L], y: [-1.75, 1.75], rect });
  const ta = state.n * DT;
  const c = Math.cos(TWO_PI * standingDisplayFrequency(boundary, n) * ta);
  const shape = (x) => standingShape(x, boundary, n, L);
  const { nodes, antinodes } = standingNodes(boundary, n, L);
  const A = 1.0;

  if (boundary === 'string') {
    // Fixed ends (clamps), envelope, the string, particles.
    ctx.fillStyle = pal.ink;
    for (const x of [0, L]) ctx.fillRect(vp.toX(x) - (x === 0 ? 10 : 0), vp.toY(0.45), 10, vp.toY(-0.45) - vp.toY(0.45));
    for (const s of [1, -1]) plotFunction(ctx, vp, (x) => s * A * Math.abs(shape(x)), 0, L, { colour: pal.axis, width: 2, dash: [10, 7], samples: 2 });
    plotFunction(ctx, vp, (x) => A * shape(x) * c, 0, L, { colour: pal.series[0], width: 3.5 });
    if (p.showParticles) for (let i = 0; i <= 40; i++) dot(ctx, vp.toX((i * L) / 40), vp.toY(A * shape((i * L) / 40) * c), 3.5, pal.ink);
  } else {
    // Pipe walls; a closed end at x = 0 for the closed pipe.
    const wall = 1.22;
    ctx.fillStyle = pal.ink;
    ctx.fillRect(vp.toX(0), vp.toY(wall) - 5, vp.toX(L) - vp.toX(0), 5);
    ctx.fillRect(vp.toX(0), vp.toY(-wall), vp.toX(L) - vp.toX(0), 5);
    if (boundary === 'closed') ctx.fillRect(vp.toX(0) - 10, vp.toY(wall) - 5, 10, vp.toY(-wall) - vp.toY(wall) + 10);
    if (p.showParticles) {
      // Air particles moving along the pipe (longitudinal), drawn faintly behind the curves.
      const rows = rect.h > 260 ? 7 : 4;
      const cols = rect.w > 700 ? 48 : 24;
      const dx = L / cols;
      for (let r = 0; r < rows; r++) {
        const Y = vp.toY(-wall + ((r + 0.5) / rows) * 2 * wall);
        for (let i = 0; i <= cols; i++) {
          const x0 = i * dx;
          const xs = Math.min(L, Math.max(0, x0 + 0.45 * dx * shape(x0) * c));
          dot(ctx, vp.toX(xs), Y, 2.5, pal.axis);
        }
      }
    }
    for (const s of [1, -1]) plotFunction(ctx, vp, (x) => s * A * Math.abs(shape(x)), 0, L, { colour: pal.series[1], width: 2.5, dash: [10, 7], samples: 2 });
    plotFunction(ctx, vp, (x) => A * shape(x) * c, 0, L, { colour: pal.series[0], width: 3.5 });
    rich(ctx, boundary === 'closed' ? 'closed end' : 'open end', vp.toX(0) - (boundary === 'closed' ? 10 : 0), vp.toY(wall) - px * 0.6, { colour: pal.muted, px });
    rich(ctx, 'open end', vp.toX(L), vp.toY(wall) - px * 0.6, { colour: pal.muted, px, align: 'right' });
  }

  // Node and antinode labels (letter + position: never colour alone).
  const labelY = vp.toY(-1.75) + px * 0.2;
  for (const x of nodes) {
    ctx.save();
    stroke(ctx, pal.ink, 2);
    ctx.beginPath();
    ctx.arc(vp.toX(x), vp.toY(0), 6, 0, TWO_PI);
    ctx.stroke();
    ctx.restore();
    rich(ctx, 'N', vp.toX(x), labelY, { colour: pal.ink, px, kind: 'strong', align: 'center' });
  }
  for (const x of antinodes) rich(ctx, 'A', vp.toX(x), labelY, { colour: pal.accentText, px, kind: 'strong', align: 'center' });

  // Length scale underneath.
  const axisY = vp.toY(-1.75) + px * 1.2;
  stroke(ctx, pal.axis, 1.5);
  ctx.beginPath();
  ctx.moveTo(vp.toX(0), axisY);
  ctx.lineTo(vp.toX(L), axisY);
  ctx.stroke();
  ctx.save();
  for (const x of niceTicks(0, L, rect.w > 600 ? 8 : 4).ticks) {
    stroke(ctx, pal.axis, 1.5);
    ctx.beginPath();
    ctx.moveTo(vp.toX(x), axisY);
    ctx.lineTo(vp.toX(x), axisY + 6);
    ctx.stroke();
    rich(ctx, formatPlain(x), vp.toX(x), axisY + px * 1.3, { colour: pal.muted, px, kind: 'mono', align: 'center' });
  }
  ctx.restore();
  rich(ctx, 'x (m)', vp.toX(0) - px * 1.2, axisY + px * 1.3, { colour: pal.ink, px, align: 'right' });
}
