// Interference view: set-up diagram (not to scale), the screen seen face-on in the light's colour,
// and the intensity graph I/I₀ against position on the screen (y = L tan θ). Drawing only.
import { viewport, axisMargins, drawAxes, arrow } from '../../engine-kit.js';
import { apertureGeometry, interferenceOutputs, intensityProfile, screenHalfWidth, wavelengthToRgb, srgbEncode, principalMaxima, singleSlitMinima, isMissingOrder } from './model.js';
import { formatNumber, formatPlain, siPrefix, MINUS } from '../../format.js';
import { rich, richWidth, fit, stroke, dimension, rgbCss, squareMarker, xTitleOutside } from './draw-common.js';

const SCREEN_BG = '#0F1012'; // a screen in a darkened room (token --c-bg); the same in both themes
const NAMES = { single: 'Single slit', double: 'Double slit', grating: 'Diffraction grating' };
const DEG = Math.PI / 180;

const signed = (m) => (m < 0 ? `${MINUS}${-m}` : String(m));
const deg = (v) => `${formatNumber(v, { sigfigs: 3 })}°`;
const len = (v) => siPrefix(v, 'm');

/** Greedy flow of text chunks into lines no wider than maxWidth. */
function flow(ctx, chunks, maxWidth, px) {
  const gap = '   ';
  const lines = [];
  let line = '';
  for (const c of chunks) {
    const next = line ? line + gap + c : c;
    if (line && richWidth(ctx, next, { px }) > maxWidth) {
      lines.push(line);
      line = c;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export function drawInterference(ctx, S, p, pal) {
  const { W, H, px } = S;
  const pad = Math.round(px * 1.1);
  const g = apertureGeometry(p);
  const out = interferenceOutputs(p);
  const col = wavelengthToRgb(p.wavelength);
  const lightRgb = col.visible ? col.rgb.map((c) => c * col.fade) : [0.62, 0.62, 0.62];
  const lightCss = rgbCss(...lightRgb.map(srgbEncode));
  const half = screenHalfWidth(p);
  const useMm = half <= 0.2 + 1e-12;
  const k = useMm ? 1000 : 1;
  const unit = useMm ? 'mm' : 'm';

  // ---- Header: name, then the values as set (swatch beside λ so colour is never the only cue).
  const values = [`λ = ${formatPlain(p.wavelength)} nm`];
  if (g.kind === 'single') values.push(`a = ${formatPlain(p.slitWidth)} mm`);
  if (g.kind === 'double') values.push(`d = ${formatPlain(p.slitSeparation)} mm`, `a = ${formatPlain(p.slitWidth)} mm`);
  if (g.kind === 'grating') values.push(`${formatPlain(p.linesPerMm)} lines/mm`, `N = ${formatPlain(g.N)}`, `a/d = ${formatPlain(p.slitFraction)}`);
  values.push(`L = ${formatPlain(p.screenDistance)} m`);
  const titlePx = px + 4;
  const nameW = richWidth(ctx, NAMES[g.kind], { px: titlePx, kind: 'strong' });
  const swatch = Math.round(px * 0.9);
  const oneLine = nameW + px * 1.5 + swatch + 8 + richWidth(ctx, values.join('   '), { px }) <= W - 2 * pad;
  const valueText = oneLine ? values.join('   ') : fit(ctx, [values.join('   '), values.join('  '), values.join(' · ').replace(/ = /g, ' ')], W - 2 * pad - swatch - 8, { px });
  const titleBase = pad + titlePx * 0.85;
  rich(ctx, NAMES[g.kind], pad, titleBase, { colour: pal.ink, px: titlePx, kind: 'strong' });
  const vx = oneLine ? pad + nameW + px * 1.5 : pad;
  const vBase = oneLine ? titleBase : titleBase + px * 1.5;
  squareMarker(ctx, vx + swatch / 2, vBase - px * 0.32, swatch, lightCss, pal.ink);
  rich(ctx, valueText, vx + swatch + 8, vBase, { colour: pal.ink, px });
  const top = vBase + px * 1.1;

  // ---- Info lines (full width, bottom): results with their formulas, then any notes.
  const chunks = [];
  if (g.kind === 'single') {
    chunks.push('Dark fringes: a sin θ = mλ (m ≠ 0)');
    if (out.firstOrderAngle !== null) {
      chunks.push(`first minimum θ_1 = ${deg(out.firstOrderAngle)}`, `y_1 = L tan θ_1 = ${len(out.firstOrderPosition)}`);
      if (p.showSmallAngle) chunks.push(`small angle λL/a = ${len(out.smallAnglePosition)}`);
      chunks.push(`central maximum ${len(out.centralWidth)} wide`);
    }
  } else {
    chunks.push(g.kind === 'grating' ? `Maxima: d sin θ = mλ with d = 1/${formatPlain(p.linesPerMm)} mm = ${len(g.d)}` : 'Bright fringes: d sin θ = mλ');
    if (g.kind === 'grating') {
      const mTop = out.maxOrder;
      const list = mTop === 0 ? 'only m = 0' : `m = 0${Array.from({ length: Math.min(mTop, 4) }, (_, i) => `, ±${i + 1}`).join('')}${mTop > 4 ? ` … ±${mTop}` : ''}`;
      chunks.push(`orders that exist: ${list} (|m| < d/λ = ${formatNumber(g.d / g.lambda, { sigfigs: 3 })})`);
    }
    if (out.firstOrderAngle !== null) {
      chunks.push(`θ_1 = ${deg(out.firstOrderAngle)}`, `y_1 = L tan θ_1 = ${len(out.firstOrderPosition)}`);
      if (p.showSmallAngle) chunks.push(`small angle λL/d = ${len(out.smallAnglePosition)}`);
    }
    if (g.kind === 'grating' && out.maxOrder > 1) {
      const ys = principalMaxima(g.lambda, g.d).filter((o) => o.m > 0 && o.m <= 4).map((o) => formatNumber(g.L * Math.tan(o.theta)));
      chunks.push(`maxima at y = ±${ys.join(', ±')} m${out.maxOrder > 4 ? ' …' : ''}`);
    }
  }
  const notes = [];
  if (g.limited) notes.push('Slit width limited to d: the slits cannot overlap.');
  if (!col.visible) notes.push(`${p.wavelength < 380 ? 'Ultraviolet' : 'Infrared'}: invisible to the eye, so the screen is drawn in grey.`);
  if (g.N >= 2) {
    const missing = principalMaxima(g.lambda, g.d).filter((o) => o.m > 0 && isMissingOrder(o.m, g.a, g.d) && Math.abs(g.L * Math.tan(o.theta)) <= half);
    if (missing.length) notes.push(`Order${missing.length > 1 ? 's' : ''} ±${missing.slice(0, 3).map((o) => o.m).join(', ±')}${missing.length > 3 ? ' …' : ''} missing: ${missing.length > 1 ? 'they fall' : 'it falls'} on a zero of the single-slit envelope.`);
    if (g.kind === 'grating') {
      const off = principalMaxima(g.lambda, g.d).filter((o) => o.m > 0 && g.L * Math.tan(o.theta) > half);
      if (off.length) notes.push(`Beyond the screen shown: ${off.map((o) => `m = ${o.m} at ${deg(o.theta / DEG)}${isMissingOrder(o.m, g.a, g.d) ? ' (missing)' : ''}`).join(', ')}.`);
    }
  }
  if (g.kind !== 'grating' && out.firstOrderPosition !== null && out.firstOrderPosition > half) {
    const what = g.kind === 'single' ? 'The first dark fringe' : 'The first-order bright fringe';
    notes.push(`${what} (y = ${len(out.firstOrderPosition)}) is beyond the screen shown: choose a wider screen.`);
  }
  const compact = H < 420 || W < 600;
  const infoW = W - 2 * pad;
  const lines = [...flow(ctx, chunks, infoW, px), ...notes.flatMap((n) => flow(ctx, [n], infoW, px))];
  const lineH = Math.round(px * 1.45);
  const maxLines = compact ? 1 : H < 560 ? 2 : 4;
  const shown = lines.slice(0, maxLines);
  const infoTop = H - pad - shown.length * lineH;
  shown.forEach((l, i) => rich(ctx, l, pad, infoTop + (i + 0.8) * lineH, { colour: i < lines.length - notes.length ? pal.ink : pal.accentText, px }));
  const bottom = infoTop - px * 0.6;

  // ---- Regions.
  const showGeom = W >= 760 && bottom - top > 220;
  const gw = showGeom ? Math.round(Math.min(480, Math.max(280, W * 0.3))) : 0;
  const rx = pad + (showGeom ? gw + pad * 1.5 : 0);
  const rw = W - pad - rx;
  const m = axisMargins(px);
  const plotX = rx + m.left;
  const plotW = Math.max(40, rw - m.left - m.right);
  const stripLabelBase = top + px * 1.2;
  const stripTop = compact ? top + px * 0.4 : stripLabelBase + px * 0.5;
  const sh = compact ? Math.round(Math.min(40, Math.max(22, (bottom - top) * 0.14))) : Math.round(Math.min(96, Math.max(30, (bottom - top) * 0.16)));
  const graphTop = stripTop + sh + px * 2.2;
  const graphH = Math.max(40, bottom - m.bottom - graphTop);

  if (showGeom) drawGeometry(ctx, { x: pad, y: top, w: gw, h: bottom - top }, g, p, out, pal, px, lightCss);

  // ---- Intensity graph and the screen strip share one x scale.
  const vp = viewport({ x: [-half * k, half * k], y: [0, 1.32], rect: { x: plotX, y: graphTop, w: plotW, h: graphH } });
  drawAxes(ctx, vp, pal, { px, layer: 'under', yCount: 3, xCount: plotW > 700 ? 8 : plotW > 380 ? 6 : 4 });
  const cols = Math.max(2, Math.round(plotW));
  const prof = intensityProfile(p, cols, half);
  const cw = plotW / cols;

  // Screen strip: linear light I × colour, encoded to sRGB, on a dark screen.
  ctx.fillStyle = pal.screen ?? SCREEN_BG;
  ctx.fillRect(plotX, stripTop, plotW, sh);
  for (let i = 0; i < cols; i++) {
    const I = prof.I[i];
    if (I < 1e-4) continue;
    ctx.fillStyle = rgbCss(srgbEncode(lightRgb[0] * I), srgbEncode(lightRgb[1] * I), srgbEncode(lightRgb[2] * I));
    ctx.fillRect(plotX + i * cw, stripTop, cw + 0.6, sh);
  }
  stroke(ctx, pal.axis, 1);
  ctx.strokeRect(plotX + 0.5, stripTop + 0.5, plotW - 1, sh - 1);
  if (!compact) {
    rich(ctx, 'Screen, seen face-on', plotX, stripLabelBase, { colour: pal.muted, px });
    const stripNote = col.visible ? `colour of ${formatPlain(p.wavelength)} nm light (approximate)` : `${formatPlain(p.wavelength)} nm is not visible: drawn in grey`;
    if (richWidth(ctx, stripNote, { px }) + richWidth(ctx, 'Screen, seen face-on', { px }) + px * 2 < plotW) rich(ctx, stripNote, plotX + plotW, stripLabelBase, { colour: pal.muted, px, align: 'right' });
  } else rich(ctx, 'screen', rx, stripTop + sh / 2, { colour: pal.muted, px, baseline: 'middle' });

  // Envelope (dashed) and the intensity curve (solid).
  const path = (vals) => {
    ctx.beginPath();
    for (let i = 0; i < cols; i++) {
      const X = plotX + (i + 0.5) * cw;
      const Y = vp.toY(vals[i]);
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
    ctx.stroke();
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(plotX, graphTop - 2, plotW, graphH + 4);
  ctx.clip();
  if (g.N >= 2 && p.showEnvelope) {
    stroke(ctx, pal.series[1], 2.5, 'dashed');
    path(prof.envelope);
  }
  stroke(ctx, pal.series[0], 3);
  ctx.lineJoin = 'round';
  path(prof.I);
  ctx.restore();

  // Orders (maxima, or minima for a single slit), small-angle markers and the key bracket.
  const yOf = (theta) => g.L * Math.tan(theta);
  const inView = (y) => Math.abs(y) <= half * (1 + 1e-9);
  const marks = g.N >= 2 ? principalMaxima(g.lambda, g.d) : singleSlitMinima(g.lambda, g.a);
  const markY = marks.map((o) => ({ ...o, y: yOf(o.theta) })).filter((o) => inView(o.y));
  const first = markY.find((o) => o.m === 1);
  const roomy = graphH >= 190;
  if (roomy && first) {
    const dx1 = Math.abs(vp.toX(first.y * k) - vp.toX(0));
    const every = Math.max(1, Math.ceil((px * 2.6) / Math.max(1, dx1)));
    const labelBase = graphTop + px * 0.95;
    if (g.N >= 2) rich(ctx, 'm = 0', vp.toX(0), labelBase, { colour: pal.ink, px, align: 'center', box: pal.bg, padding: 2 });
    for (const o of markY) {
      if (o.m === 0 || o.m % every !== 0) continue;
      const X = vp.toX(o.y * k);
      if (g.N >= 2 && Math.abs(X - vp.toX(0)) < px * 2.4) continue;
      const missing = g.N >= 2 && isMissingOrder(o.m, g.a, g.d);
      rich(ctx, missing ? `${signed(o.m)}×` : signed(o.m), X, labelBase, { colour: missing ? pal.muted : pal.ink, px, align: 'center' });
    }
    if (g.N === 1) rich(ctx, 'm (dark)', plotX + plotW, labelBase, { colour: pal.muted, px, align: 'right', box: pal.bg, padding: 2 });
  }
  let smallAngleDrawn = 0;
  if (p.showSmallAngle && first && !compact) {
    const spacing = g.N >= 2 ? g.d : g.a;
    ctx.save();
    ctx.fillStyle = pal.series[2];
    const base = vp.toY(0);
    const s = compact ? 4 : Math.max(7, px * 0.5);
    let drawn = 0;
    for (const o of markY) {
      if (o.m === 0) continue;
      const ys = (o.m * g.lambda * g.L) / spacing;
      if (!inView(ys)) continue;
      const X = vp.toX(ys * k);
      ctx.beginPath();
      ctx.moveTo(X, base - s * 1.4);
      ctx.lineTo(X - s * 0.7, base);
      ctx.lineTo(X + s * 0.7, base);
      ctx.closePath();
      ctx.fill();
      drawn += 1;
    }
    ctx.restore();
    smallAngleDrawn = drawn;
  }
  if (first) {
    const Yb = vp.toY(1.08);
    let X0;
    let X1;
    let text;
    if (g.N >= 2) {
      X0 = vp.toX(0);
      X1 = vp.toX(first.y * k);
      text = g.kind === 'double' ? `Δy = ${len(out.fringeSpacing)}` : `y_1 = ${len(out.firstOrderPosition)}`;
    } else {
      X0 = vp.toX(-first.y * k);
      X1 = vp.toX(first.y * k);
      text = `central maximum ${len(out.centralWidth)}`;
    }
    if (X1 - X0 >= 8) {
      dimension(ctx, X0, Yb, X1, Yb, { colour: pal.ink, width: 2 });
      const tw = richWidth(ctx, text, { px });
      const cx = (X0 + X1) / 2;
      const tx = tw + 8 < X1 - X0 || g.N === 1 ? cx : X1 + 8 + tw / 2;
      rich(ctx, text, Math.min(plotX + plotW - tw / 2 - 4, tx), Yb - 8, { colour: pal.ink, px, align: 'center', kind: 'strong', box: pal.bg, padding: 2 });
    }
  }

  // Axis titles and the legend sit outside the plot, so they never cover the data.
  const xTitle = xTitleOutside(ctx, vp, pal, { px, title: compact ? `y (${unit})` : `y on screen (${unit})` });
  drawAxes(ctx, vp, pal, { px, layer: 'over', yCount: 3, xCount: plotW > 700 ? 8 : plotW > 380 ? 6 : 4, formatX: xTitle.formatX });
  xTitle.draw();
  const rowY = graphTop - px * 0.55;
  rich(ctx, 'I/I_0', rx, rowY, { colour: pal.ink, px });
  let rowX = rx + richWidth(ctx, 'I/I_0', { px }) + px * 0.6;
  const legend = smallAngleDrawn ? (g.N >= 2 ? '▲ small-angle mλL/d' : '▲ small-angle mλL/a') : '';
  const legendW = legend ? richWidth(ctx, legend, { px }) + px : 0;
  if (richWidth(ctx, 'relative intensity', { px }) + (rowX - rx) + legendW + px < rw) {
    rich(ctx, 'relative intensity', rowX, rowY, { colour: pal.muted, px });
    rowX += richWidth(ctx, 'relative intensity', { px });
  }
  if (legend && rowX + legendW <= plotX + plotW) {
    // The triangle in the legend is drawn in the marker colour (shape and colour together).
    const textW = richWidth(ctx, legend.slice(2), { px });
    rich(ctx, legend.slice(2), plotX + plotW, rowY, { colour: pal.ink, px, align: 'right' });
    rich(ctx, '▲', plotX + plotW - textW - px * 0.4, rowY, { colour: pal.series[2], px, align: 'right' });
  }
}

/** Schematic of the light, slits and screen. Angles and sizes are not to scale (stated on the figure). */
function drawGeometry(ctx, R, g, p, out, pal, px, lightCss) {
  const { x, y, w, h } = R;
  rich(ctx, 'Set-up (not to scale)', x, y + px * 1.2, { colour: pal.muted, px });
  const top = y + px * 2.4;
  const bot = y + h - px * 2.4;
  const cy = (top + bot) / 2;
  const bx = x + Math.max(w * 0.27, px * 6.8);
  const sx = x + w - px * 0.5;

  // Incoming light: a beam in the light's colour with arrows, labelled with λ.
  const beamH = Math.min(px * 4, (bot - top) * 0.3);
  const beamR = bx - 22; // leave clear space before the barrier for the slit dimension
  ctx.fillStyle = lightCss;
  ctx.fillRect(x, cy - beamH / 2, beamR - x, beamH);
  stroke(ctx, pal.ink, 1);
  ctx.strokeRect(x + 0.5, cy - beamH / 2 + 0.5, beamR - x - 1, beamH - 1);
  for (const f of [-0.22, 0.22]) arrow(ctx, x + 8, cy + f * beamH, beamR - 6, cy + f * beamH, { colour: pal.ink, width: 2, head: Math.max(9, px * 0.55) });
  rich(ctx, `λ = ${formatPlain(p.wavelength)} nm`, x, cy - beamH / 2 - px * 0.5, { colour: pal.ink, px });

  // Barrier with the slit(s).
  const gaps = [];
  if (g.kind === 'single') gaps.push([cy - 7, cy + 7]);
  else if (g.kind === 'double') gaps.push([cy - 22, cy - 14], [cy + 14, cy + 22]);
  else for (let i = -4; i <= 4; i++) gaps.push([cy + i * 11 - 2, cy + i * 11 + 2]);
  ctx.fillStyle = pal.ink;
  let from = top;
  for (const [a, b] of gaps) {
    ctx.fillRect(bx - 3, from, 6, a - from);
    from = b;
  }
  ctx.fillRect(bx - 3, from, 6, bot - from);
  const slitText = g.kind === 'single' ? `a = ${formatPlain(p.slitWidth)} mm` : g.kind === 'double' ? `d = ${formatPlain(p.slitSeparation)} mm` : `d = ${siPrefix(g.d, 'm')}`;
  if (g.kind === 'double') dimension(ctx, bx - 12, cy - 18, bx - 12, cy + 18, { colour: pal.ink, width: 1.5, tick: 5 });
  rich(ctx, slitText, bx - 14, cy + beamH / 2 + px * 1.4, { colour: pal.ink, px, align: 'right' });
  if (g.kind === 'grating') rich(ctx, `N = ${formatPlain(g.N)}`, bx - 14, cy + beamH / 2 + px * 2.8, { colour: pal.muted, px, align: 'right' });

  // Screen and the central axis.
  ctx.fillStyle = pal.ink;
  ctx.fillRect(sx - 2, top, 4, bot - top);
  rich(ctx, 'screen', sx, top - px * 0.4, { colour: pal.muted, px, align: 'right' });
  ctx.save();
  stroke(ctx, pal.axis, 1.5, 'dashed');
  ctx.beginPath();
  ctx.moveTo(bx + 3, cy);
  ctx.lineTo(sx - 2, cy);
  ctx.stroke();
  ctx.restore();

  // A ray to the first order (first dark fringe for a single slit), angle exaggerated when small.
  if (out.firstOrderAngle !== null) {
    const run = sx - bx;
    const maxA = Math.atan((cy - top - px * 1.9) / run); // keep "m = 1" clear of the "screen" label
    const drawnA = Math.min(Math.max(out.firstOrderAngle * DEG, 10 * DEG), maxA);
    const Y1 = cy - run * Math.tan(drawnA);
    ctx.save();
    stroke(ctx, pal.series[0], 3);
    ctx.beginPath();
    ctx.moveTo(bx + 3, cy);
    ctx.lineTo(sx - 2, Y1);
    ctx.stroke();
    const r = Math.min(run * 0.32, px * 3.6);
    stroke(ctx, pal.ink, 1.5);
    ctx.beginPath();
    ctx.arc(bx + 3, cy, r, -drawnA, 0);
    ctx.stroke();
    ctx.restore();
    rich(ctx, `θ_1 = ${deg(out.firstOrderAngle)}`, bx + px * 0.6, cy + px * 1.5, { colour: pal.ink, px, box: pal.bg, padding: 2 });
    squareMarker(ctx, sx, Y1, 11, pal.series[0], pal.ink);
    rich(ctx, g.kind === 'single' ? 'first dark fringe' : 'm = 1', sx - 12, Y1 - px * 0.5, { colour: pal.ink, px, align: 'right', box: pal.bg, padding: 2 });
    dimension(ctx, sx - 12, cy, sx - 12, Y1 + 8, { colour: pal.ink, width: 1.5, tick: 5 });
    rich(ctx, 'y_1', sx - 20, (cy + Y1) / 2 + px * 0.6, { colour: pal.ink, px, align: 'right' });
  }

  // Screen distance.
  const Ly = bot + px * 1.0;
  dimension(ctx, bx, Ly, sx, Ly, { colour: pal.ink, width: 1.5 });
  rich(ctx, `L = ${formatPlain(p.screenDistance)} m`, (bx + sx) / 2, Ly + px * 1.25, { colour: pal.ink, px, align: 'center' });
}
