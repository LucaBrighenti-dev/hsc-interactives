// Reference engine view: drawing only. Reads model state; never changes physics.
// Left: a rotating phasor of length A. Right: the y–t graph on the same vertical scale, so the
// phasor tip's height lines up with the graph point (dashed connector).
import { createSurface, readPalette, stageFontPx, drawAxes, axisMargins, viewport, label, arrow } from '../../engine-kit.js';
import { displacement, angularFrequency } from './model.js';
import { formatPlain, formatAngle } from '../../format.js';

export function createView(stage) {
  const surface = createSurface(stage);
  let pal = readPalette(stage);

  function draw(state, params) {
    const { ctx, width: W, height: H } = surface;
    const px = stageFontPx(W);
    const m = axisMargins(px);
    surface.begin(pal.bg);

    const pad = Math.round(px * 1.4);
    const top = pad + px * 2.6; // room for the equation line
    const plotH = Math.max(80, H - top - m.bottom - pad);
    const ymax = Math.max(1, Math.ceil(params.amplitude * 1.25));

    // Phasor panel on the left (square, same vertical scale as the graph).
    const showPhasor = params.showPhasor && W > 560;
    const phasorW = showPhasor ? Math.min(plotH, W * 0.28) : 0;
    const graphX = pad + phasorW + (showPhasor ? pad : 0) + m.left;
    const vp = viewport({ x: [0, params.duration], y: [-ymax, ymax], rect: { x: graphX, y: top, w: W - graphX - pad, h: plotH } });

    drawAxes(ctx, vp, pal, { px, layer: 'under' });

    // Whole run, faint; the part already traced, in the accent colour.
    const curve = (t0, t1, colour, width) => {
      const n = Math.max(2, Math.ceil(((t1 - t0) / params.duration) * vp.rect.w));
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const t = t0 + ((t1 - t0) * i) / n;
        const X = vp.toX(t);
        const Y = vp.toY(displacement(t, params));
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      }
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.stroke();
    };
    curve(0, params.duration, pal.grid, 2);
    if (state.t > 0) curve(0, state.t, pal.series[0], 3);

    const y = displacement(state.t, params);
    const gx = vp.toX(state.t);
    const gy = vp.toY(y);

    if (showPhasor) {
      const cx = pad + phasorW / 2;
      const cy = vp.toY(0);
      const r = params.amplitude * vp.scaleY;
      const theta = angularFrequency(params.frequency) * state.t + (params.phase * Math.PI) / 180;
      const tipX = cx + r * Math.cos(theta);
      const tipY = cy - r * Math.sin(theta);

      ctx.strokeStyle = pal.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.moveTo(cx - r - 10, cy);
      ctx.lineTo(cx + r + 10, cy);
      ctx.stroke();

      // Dashed connector from the phasor tip to the graph point: same height, same y.
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = pal.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(gx, gy);
      ctx.stroke();
      ctx.restore();

      arrow(ctx, cx, cy, tipX, tipY, { colour: pal.ink, width: 3, head: Math.max(10, px * 0.7) });
      // Projection onto the vertical: the displacement itself.
      ctx.strokeStyle = pal.series[0];
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, tipY);
      ctx.stroke();

      if (params.phasorLabels) {
        label(ctx, `A = ${formatPlain(params.amplitude)} m`, cx, Math.min(cy + r + px * 1.6, H - 6), { colour: pal.ink, px, align: 'center' });
        label(ctx, 'θ = 2πft + φ', cx, Math.max(cy - r - px * 0.8, top + px), { colour: pal.muted, px, align: 'center' });
      }
    }

    // Current point on the graph.
    ctx.fillStyle = pal.series[0];
    ctx.fillRect(gx - 6, gy - 6, 12, 12);

    drawAxes(ctx, vp, pal, { px, layer: 'over', xTitle: 't (s)', yTitle: 'y (m)' });

    // Equation with the values as entered. φ in the chosen unit.
    const phase = params.phaseUnit === 'rad' ? formatAngle(params.phase, { from: 'deg', to: 'pi' }) : `${formatPlain(params.phase)}°`;
    label(ctx, `y = ${formatPlain(params.amplitude)} sin(2π × ${formatPlain(params.frequency)} t + ${phase})`, pad, pad + px, {
      colour: pal.ink,
      px: px + 4,
      kind: 'strong',
    });
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
