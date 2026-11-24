// Styleguide (W0-03/W0-04): every token, type style and UI component, plus stage drawing in both themes.
// Built with the real UI factories, so this page doubles as a smoke test of site/assets/ui/.
import { el, icon, ICON_NAMES, button, slider, toggle, segmented, select, textField, chip, readout, panel, modal, drawer, toast, qrModal } from '/assets/ui/index.js';
import { createSurface, readPalette, drawAxes, axisMargins, viewport, arrow, label, stageFontPx, ensureFonts } from '/assets/engine-kit.js';
import { formatQuantity } from '/assets/format.js';

const root = document.getElementById('sg');
const section = (title, ...children) => el('section', {}, el('h2', { text: title }), ...children);

// ---- Colours ----
const swatch = (name, hex, note) => el('div', { class: 'sg-swatch' }, el('div', { class: 'sg-swatch__chip', style: { background: hex } }), el('div', { class: 'sg-swatch__meta' }, name, el('span', { text: `${hex}${note ? ` · ${note}` : ''}` })));
const chrome = [
  ['--c-bg', '#0F1012', 'page'],
  ['--c-surface', '#17181B', 'panels'],
  ['--c-surface-2', '#1F2024', 'raised'],
  ['--c-line', '#2C2E33', 'frames'],
  ['--c-line-strong', '#43464D', 'inputs'],
  ['--c-text', '#ECEDEE', 'text'],
  ['--c-muted', '#9DA1A8', 'secondary text'],
  ['--c-accent', '#FF4F00', 'international orange'],
  ['--c-danger', '#E5484D', 'errors'],
  ['--c-ok', '#3DD68C', 'success, live'],
];
const projector = [
  ['--k-bg', '#F6F6F4', 'stage'],
  ['--k-ink', '#121316', 'text, objects'],
  ['--k-muted', '#4A4D53', 'secondary text'],
  ['--k-grid', '#DADAD6', 'grid 1 px'],
  ['--k-axis', '#6B6E74', 'axes 1.5 px'],
  ['--k-accent-text', '#B83A00', 'small orange text'],
];
const series = [
  ['--s1', '#FF4F00', 'main, 3 px'],
  ['--s2', '#0072B2', 'dark: #56B4E9'],
  ['--s3', '#009E73', ''],
  ['--s4', '#CC79A7', ''],
  ['--s5', '#121316', 'dark: #ECEDEE'],
  ['--s6', '#E69F00', ''],
];
root.append(
  el('div', {}, el('h1', { class: 'display', style: { fontSize: '48px', textTransform: 'uppercase' }, text: 'Design language' }), el('p', { class: 'muted', style: { marginTop: '8px', maxWidth: '70ch' }, text: 'Graphite near-black, international orange, Archivo Expanded display, Inter body, JetBrains Mono data. Matte and flat, sharp frames: no shadows, gradients, glows or rounded bubbles. Simulations default to the light projector stage.' })),
  section(
    'Colour',
    el('h3', { text: 'Chrome (always graphite)' }),
    el('div', { class: 'sg-swatches' }, chrome.map(([n, h, x]) => swatch(n, h, x))),
    el('h3', { text: 'Projector stage (default inside simulations)', style: { marginTop: '24px' } }),
    el('div', { class: 'sg-swatches' }, projector.map(([n, h, x]) => swatch(n, h, x))),
    el('h3', { text: 'Data series (colour-blind aware; pair colour with a second cue)', style: { marginTop: '24px' } }),
    el('div', { class: 'sg-swatches' }, series.map(([n, h, x]) => swatch(n, h, x))),
  ),
);

// ---- Type ----
const typeRow = (name, node) => el('div', { class: 'sg-type__row' }, el('span', { class: 'eyebrow', text: name }), node);
root.append(
  section(
    'Type',
    el(
      'div',
      { class: 'sg-type' },
      typeRow('Wordmark 72', el('p', { class: 'wordmark', style: { fontSize: '72px', lineHeight: '1' }, text: 'HSC Hub' })),
      typeRow('Display 48', el('p', { class: 'display', style: { fontSize: '48px', textTransform: 'uppercase', lineHeight: '1.05' }, text: 'Projectile lab' })),
      typeRow('Display 24', el('p', { class: 'display', style: { fontSize: '24px', textTransform: 'uppercase' }, text: 'Good morning, Ms Rivera' })),
      typeRow('Body 18', el('p', { style: { fontSize: '18px' }, text: 'Predict the launch angle that gives the greatest range, then test it.' })),
      typeRow('Body 16', el('p', { text: 'Teacher notes, controls and descriptions use Inter at 16 px with 1.5 line height.' })),
      typeRow('Label 14', el('p', { class: 'muted', style: { fontSize: '14px' }, text: 'Launch speed' })),
      typeRow('Mono 32', el('p', { class: 'mono', style: { fontSize: '32px' }, text: '40.8 m   −9.80 m/s²' })),
      typeRow('Mono label 12', el('p', { class: 'eyebrow', text: 'Physics · 2017 M5 · 2025 Advanced mechanics' })),
    ),
  ),
);

// ---- Components ----
const busy = button({ label: 'Saving', variant: 'primary' });
busy.setBusy(true);
const box = (title, ...children) => el('div', { class: 'sg-box' }, el('h3', { text: title, style: { margin: 0 } }), ...children);
const colPanel = panel({ title: 'Try this', collapsible: true });
colPanel.body.append(el('p', { text: 'Collapsible panels use a disclosure button.' }));
const plainPanel = panel({ title: 'Controls', actions: [button({ label: 'Reset values', variant: 'ghost', size: 'sm', icon: 'reset' })] });
plainPanel.body.append(el('p', { class: 'muted', text: 'Panels frame groups of controls.' }));

root.append(
  section(
    'Components',
    el(
      'div',
      { class: 'sg-grid2' },
      box(
        'Buttons',
        el('div', { class: 'cluster' }, button({ label: 'Primary', variant: 'primary' }), button({ label: 'Secondary' }), button({ label: 'Ghost', variant: 'ghost' }), button({ label: 'Disabled', disabled: true })),
        el('div', { class: 'cluster' }, button({ label: 'With icon', icon: 'share' }), busy, button({ label: 'Small', size: 'sm' })),
        el('div', { class: 'cluster' }, button({ label: 'Play', icon: 'play', iconOnly: true, shortcut: 'Space' }), button({ label: 'Step', icon: 'step', iconOnly: true }), button({ label: 'Reset', icon: 'reset', iconOnly: true }), button({ label: 'Dark stage', icon: 'theme', iconOnly: true, pressed: true })),
      ),
      box(
        'Slider, toggle, segmented, select, text',
        slider({ label: 'Launch speed', unit: 'm/s', min: 0, max: 60, step: 0.5, value: 20, showScale: true }),
        toggle({ label: 'Show trail', checked: true }),
        segmented({ label: 'Air resistance', options: [['none', 'None'], ['linear', 'kv'], ['quadratic', 'kv²']], value: 'none' }),
        select({ label: 'Scenario', options: [['default', 'Standard'], ['drag', 'With air resistance']], value: 'default' }),
        textField({ label: 'f(x)', value: 'x^2 - 3x + 1', mono: true }),
      ),
      box(
        'Chips and badges',
        el('div', { class: 'cluster' }, chip({ label: 'Physics', variant: 'accent' }), chip({ label: '2025 Advanced mechanics' }), chip({ label: 'Live', variant: 'live' }), chip({ label: 'Coming soon' })),
        el('div', { class: 'cluster' }, chip({ label: 'Maths Ext 1', pressed: true, onToggle: () => {} }), chip({ label: 'Physics', pressed: false, onToggle: () => {} }), chip({ label: 'NESA link', href: '#', title: 'Link chip' })),
        el('span', { class: 'badge-founding', text: 'Founding Educator' }),
      ),
      box(
        'Readouts',
        el('div', { class: 'cluster', style: { '--cluster-gap': '32px' } }, (() => { const r = readout({ label: 'Range', unit: 'm' }); r.update(40.816); return r; })(), (() => { const r = readout({ label: 'Max height', unit: 'm' }); r.update(10.204); return r; })(), (() => { const r = readout({ label: 'Velocity', unit: 'm/s' }); r.update(-5.894); return r; })()),
      ),
      box('Panels', plainPanel, colPanel),
      box(
        'Overlays',
        el(
          'div',
          { class: 'cluster' },
          button({ label: 'Open modal', onClick: () => modal({ title: 'Save scenario', content: el('p', { text: 'Modals use native dialogs: focus is trapped and Esc closes them.' }), actions: [button({ label: 'Cancel', variant: 'ghost', onClick: (e) => e.target.closest('dialog').close() }), button({ label: 'Save', variant: 'primary' })] }).open() }),
          button({ label: 'Open drawer', onClick: () => drawer({ title: 'Teacher notes', content: el('div', { class: 'prose' }, el('h2', { text: 'Misconceptions' }), el('p', { text: 'Drawers slide in from the right for teacher notes.' })) }).open() }),
          button({ label: 'Toast', onClick: () => toast('Saved. Find it on your dashboard.', { kind: 'ok' }) }),
          button({ label: 'QR share', icon: 'qr', onClick: () => qrModal({ url: `${location.origin}/interactives/_template.html?amplitude=2`, embedUrl: `${location.origin}/interactives/_template.html?amplitude=2&embed=1` }) }),
        ),
      ),
    ),
  ),
);

// ---- Icons ----
root.append(section('Icons', el('div', { class: 'sg-icons' }, ICON_NAMES.map((n) => el('div', { class: 'sg-icon' }, icon(n), n)))));

// ---- Stage drawing in both themes ----
const stages = ['projector', 'dark'].map((theme) => {
  const canvasHost = el('div', { class: 'sg-stage__canvas', data: { theme } });
  return { theme, host: canvasHost, node: el('div', { class: 'sg-stage', data: { theme } }, canvasHost, el('div', { class: 'sg-stage__label', text: `${theme} stage` })) };
});
root.append(
  section(
    'Stage drawing',
    el('p', { class: 'muted', style: { marginBottom: '16px', maxWidth: '75ch' }, text: 'Engines draw with engine-kit.js: tokens read from CSS, text at least 18 px, main series 3 px in orange, other series 2.5 px with a second cue (dashes), vectors with filled heads and labelled magnitudes.' }),
    el('div', { class: 'sg-grid2' }, stages.map((s) => s.node)),
  ),
);

await ensureFonts();
for (const { host } of stages) {
  const surface = createSurface(host);
  const draw = () => {
    surface.resize();
    const pal = readPalette(host);
    const { ctx, width: W, height: H } = surface;
    const px = stageFontPx(W, 18);
    const m = axisMargins(px);
    surface.begin(pal.bg);
    const vp = viewport({ x: [0, 4], y: [-1.5, 1.5], rect: { x: m.left, y: m.top + px, w: W - m.left - m.right, h: H - m.top - m.bottom - px * 1.5 } });
    drawAxes(ctx, vp, pal, { px, layer: 'under' });
    pal.series.forEach((colour, i) => {
      ctx.save();
      ctx.strokeStyle = colour;
      ctx.lineWidth = i === 0 ? 3 : 2.5;
      if (i > 0) ctx.setLineDash([[], [10, 6], [2, 5], [14, 5, 2, 5], [6, 4], [18, 6]][i]);
      ctx.beginPath();
      for (let k = 0; k <= 200; k++) {
        const x = (4 * k) / 200;
        const y = Math.sin(x * Math.PI * 0.75 + i * 0.5) * (1.2 - i * 0.15);
        if (k === 0) ctx.moveTo(vp.toX(x), vp.toY(y));
        else ctx.lineTo(vp.toX(x), vp.toY(y));
      }
      ctx.stroke();
      ctx.restore();
    });
    arrow(ctx, vp.toX(0.4), vp.toY(-1.1), vp.toX(1.4), vp.toY(-0.4), { colour: pal.ink, width: 3, head: 14 });
    label(ctx, `v = ${formatQuantity(20, 'm/s')}`, vp.toX(1.45), vp.toY(-0.35), { colour: pal.ink, px, box: pal.bg });
    drawAxes(ctx, vp, pal, { px, layer: 'over', xTitle: 't (s)', yTitle: 'y (m)' });
  };
  draw();
  new ResizeObserver(draw).observe(host);
}

// ---- Rules ----
root.append(
  section(
    'Rules',
    el(
      'ul',
      { class: 'sg-rules' },
      [
        'Tokens only: no hard-coded colours outside tokens.css (canvas reads them through readPalette).',
        'No box-shadow, gradients, glow or blur. Sharp frames; inputs may use a 2 px radius.',
        'Hover changes border or text colour only. Focus ring: 2 px orange with a 2 px offset.',
        'Touch targets at least 44 px. Every control works from the keyboard.',
        'Stage text at least 18 px at 1920×1080. Units on every axis and readout. 3 significant figures by default.',
        'Never colour alone: tension and compression, + and −, and series also differ by label, dash or glyph.',
        'Projector stage by default; the dark stage is a toggle. No cyan or blue glowing HUD look.',
        'Motion on the stage means physics. No decorative animation.',
      ].map((t) => el('li', { text: t })),
    ),
  ),
);
