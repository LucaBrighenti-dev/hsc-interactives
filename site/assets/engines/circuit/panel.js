// Circuit editor controls inside the stage (DOM, not physics): a tool palette down the left and a bar
// along the bottom for the selected part (value, open/close, turn, delete) plus undo and clear.
// They give a keyboard path for everything the canvas does with a pointer. Colours come from the stage
// tokens (--k-*), so both themes work; sharp frames, no shadows (guide §6).
import { el, svg } from '../../ui/dom.js';
import { PART_INFO, LIMITS } from './model.js';
import { formatNumber, formatPlain } from '../../format.js';

const CSS = `
.cx-ui { position: absolute; inset: 0; pointer-events: none; font-family: var(--f-body); color: var(--k-ink); --cx-font: 18px; --cx-bar-h: 56px; }
[data-theme="projector"] .cx-ui { color-scheme: light; }
[data-theme="dark"] .cx-ui { color-scheme: dark; }
.cx-ui > * { pointer-events: auto; }
.cx-tools { position: absolute; left: 0; top: 0; bottom: var(--cx-bar-h); display: flex; flex-direction: column; gap: 4px; padding: 8px; overflow-y: auto; border-right: 1px solid var(--k-grid); background: var(--k-bg); }
.cx-tools__sep { flex: none; height: 1px; margin: 4px 0; background: var(--k-grid); }
.cx-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 8px; flex: none; min-height: 44px; min-width: 44px; padding: 0 10px; border: 1px solid var(--k-grid); border-radius: 0; background: var(--k-bg); color: var(--k-ink); font: 500 var(--cx-font)/1.2 var(--f-body); cursor: pointer; white-space: nowrap; }
.cx-btn:hover { border-color: var(--k-ink); }
.cx-btn[aria-pressed="true"] { border-color: var(--k-accent); color: var(--k-accent-text); }
.cx-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.cx-btn:disabled:hover { border-color: var(--k-grid); }
.cx-btn svg { width: 32px; height: 20px; flex: none; }
.cx-tools .cx-btn { justify-content: flex-start; }
.cx-btn:focus-visible, .cx-input:focus-visible, .cx-select:focus-visible { outline: 2px solid var(--k-accent); outline-offset: 2px; }
.cx-canvas:focus-visible { outline: 2px solid var(--k-accent); outline-offset: -2px; }
.cx-ui[data-layout="compact"] .cx-tools .cx-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.cx-ui[data-layout="compact"] .cx-tools .cx-btn { justify-content: center; padding: 0 4px; }
.cx-ui[data-layout="narrow"] .cx-tools { display: none; }
.cx-ui:not([data-layout="narrow"]) .cx-narrow-only { display: none; }
.cx-bar { position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-top: 1px solid var(--k-grid); background: var(--k-bg); overflow-x: auto; overflow-y: hidden; white-space: nowrap; scrollbar-width: thin; }
.cx-field { display: inline-flex; flex: none; align-items: center; gap: 6px; font: 500 var(--cx-font)/1.2 var(--f-body); color: var(--k-muted); }
.cx-input { width: 6.5em; min-height: 40px; padding: 0 8px; border: 1px solid var(--k-axis); border-radius: 2px; background: var(--k-panel); color: var(--k-ink); font: 500 var(--cx-font) var(--f-mono); }
.cx-select { flex: none; max-width: 16em; min-height: 40px; padding: 0 8px; border: 1px solid var(--k-axis); border-radius: 2px; background: var(--k-panel); color: var(--k-ink); font: 500 var(--cx-font) var(--f-body); }
.cx-readings { flex: none; font: 500 var(--cx-font) var(--f-mono); color: var(--k-ink); }
.cx-hint { flex: none; font: 400 var(--cx-font)/1.2 var(--f-body); color: var(--k-muted); }
.cx-sep { flex: none; width: 1px; align-self: stretch; background: var(--k-grid); }
.cx-ui[data-layout="narrow"] .cx-hint { display: none; }
`;

const TOOLS = [
  { id: 'select', label: 'Select', title: 'Select, move and turn parts. Drag from a grid dot to draw a wire.' },
  { id: 'W', label: 'Wire', title: 'Wire: drag from one grid dot to another' },
  { id: 'B', label: 'Cell', title: 'Cell: click a grid dot, or drag to set its direction' },
  { id: 'R', label: 'Resistor', title: 'Resistor' },
  { id: 'L', label: 'Lamp', title: 'Lamp (a resistor that lights up)' },
  { id: 'S', label: 'Switch', title: 'Switch: click it to open or close it' },
  { id: 'A', label: 'Ammeter', title: 'Ammeter (ideal: no resistance). Connect in series.' },
  { id: 'V', label: 'Voltmeter', title: 'Voltmeter (ideal: no current). Connect in parallel.' },
];

const meterIcon = (letter) =>
  `<path d="M2 10h8M22 10h8"/><circle cx="16" cy="10" r="6.5"/><text x="16" y="13.7" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor" stroke="none" font-family="Inter, system-ui, sans-serif">${letter}</text>`;
const ICONS = {
  select: '<path d="M11 2.5v14l3.6-3.4 2.6 5.6 2.4-1.1-2.6-5.5h5z" fill="currentColor" stroke="none"/>',
  W: '<path d="M5 10h22"/><rect x="2" y="8" width="4" height="4" fill="currentColor" stroke="none"/><rect x="26" y="8" width="4" height="4" fill="currentColor" stroke="none"/>',
  B: '<path d="M2 10h12M14 3v14M20 10h10"/><path d="M19 6.5v7" stroke-width="3.5"/>',
  R_physics: '<path d="M2 10h6l1.5-4 3 8 3-8 3 8 3-8 1.5 4h7"/>',
  R_as1102: '<path d="M2 10h7M23 10h7"/><rect x="9" y="6.5" width="14" height="7"/>',
  L: '<path d="M2 10h8M22 10h8"/><circle cx="16" cy="10" r="6"/><path d="M11.8 5.8l8.4 8.4M11.8 14.2l8.4-8.4"/>',
  S_physics: '<path d="M2 10h7M23 10h7M10.6 9.2l9.6-5.6"/><circle cx="10.5" cy="10" r="1.6"/><circle cx="21.5" cy="10" r="1.6"/>',
  S_as1102: '<path d="M2 10h9l10-6M21 10h9"/>',
  A: meterIcon('A'),
  V: meterIcon('V'),
};
function icon(id, symbols) {
  const body = ICONS[`${id}_${symbols}`] ?? ICONS[id];
  return svg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 20" width="32" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">${body}</svg>`,
  );
}

const ohms = (v) => `${formatPlain(v)} Ω`;
function describePart(p) {
  switch (p.type) {
    case 'R':
    case 'L':
      return `${PART_INFO[p.type].name.toLowerCase()}, ${ohms(p.value)}`;
    case 'B':
      return `cell, ${formatPlain(p.value)} V${p.r > 0 ? `, r ${ohms(p.r)}` : ''}`;
    case 'S':
      return `switch, ${p.closed ? 'closed' : 'open'}`;
    default:
      return PART_INFO[p.type].name.toLowerCase();
  }
}

/**
 * @param {HTMLElement} stage
 * @param {{ tool:(id:string)=>void, select:(i:number)=>void, value:(key:string, v:string)=>void, toggle:()=>void,
 *   rotate:()=>void, remove:()=>void, undo:()=>void, clear:()=>void }} on
 */
export function createPanel(stage, on) {
  const style = el('style', { text: CSS });
  const root = el('div', { class: 'cx-ui', data: { layout: 'wide' } });

  const toolButtons = new Map();
  const tools = el('div', { class: 'cx-tools', role: 'group', aria: { label: 'Circuit parts and tools' } });
  for (const t of TOOLS) {
    const b = el('button', { type: 'button', class: 'cx-btn', title: t.title, aria: { pressed: 'false' }, on: { click: () => on.tool(t.id) } }, el('span', { class: 'cx-icon' }), el('span', { class: 'cx-label', text: t.label }));
    toolButtons.set(t.id, b);
    tools.append(b);
  }
  const undoBtn = el('button', { type: 'button', class: 'cx-btn', title: 'Undo the last change (Ctrl+Z)', on: { click: () => on.undo() } }, el('span', { class: 'cx-label', text: 'Undo' }));
  const clearBtn = el('button', { type: 'button', class: 'cx-btn', title: 'Remove every part (Undo brings them back)', on: { click: () => on.clear() } }, el('span', { class: 'cx-label', text: 'Clear' }));
  const toolsSep = el('div', { class: 'cx-tools__sep', 'aria-hidden': 'true' });
  tools.append(toolsSep, undoBtn, clearBtn);

  // Bottom bar.
  const toolSelect = el(
    'select',
    { class: 'cx-select cx-narrow-only', aria: { label: 'Tool' }, on: { change: () => on.tool(toolSelect.value) } },
    TOOLS.map((t) => el('option', { value: t.id, text: t.label })),
  );
  const partSelect = el('select', { class: 'cx-select', aria: { label: 'Selected part' }, on: { change: () => on.select(Number(partSelect.value)) } });
  const valueInput = el('input', { class: 'cx-input', type: 'number', inputmode: 'decimal', step: 'any', on: { change: () => on.value('value', valueInput.value) } });
  const valueUnit = el('span', { text: 'Ω' });
  const valueLabel = el('span', { text: 'Resistance' });
  const valueField = el('label', { class: 'cx-field' }, valueLabel, valueInput, valueUnit);
  const rInput = el('input', { class: 'cx-input', type: 'number', inputmode: 'decimal', step: 'any', min: LIMITS.internal[0], max: LIMITS.internal[1], on: { change: () => on.value('r', rInput.value) } });
  const rField = el('label', { class: 'cx-field' }, el('span', { text: 'Internal r' }), rInput, el('span', { text: 'Ω' }));
  const switchBtn = el('button', { type: 'button', class: 'cx-btn', aria: { pressed: 'false' }, on: { click: () => on.toggle() } }, 'Close switch');
  const turnBtn = el('button', { type: 'button', class: 'cx-btn', title: 'A quarter turn. Two turns swap + and −.', on: { click: () => on.rotate() } }, 'Turn');
  const deleteBtn = el('button', { type: 'button', class: 'cx-btn', title: 'Delete the selected part (Delete key)', on: { click: () => on.remove() } }, 'Delete');
  const readings = el('span', { class: 'cx-readings' });
  const hint = el('span', { class: 'cx-hint', text: 'Click a part to select it. Drag from a grid dot to draw a wire.' });
  const barSep = el('span', { class: 'cx-sep', 'aria-hidden': 'true' });
  const bar = el('div', { class: 'cx-bar', role: 'group', aria: { label: 'Selected part' } }, toolSelect, partSelect, valueField, rField, switchBtn, turnBtn, deleteBtn, readings, hint, barSep);

  root.append(tools, bar);
  stage.append(style, root);

  let mode = 'wide';
  let symbolsShown = null;
  let partsKey = null;

  function setIcons(symbols) {
    if (symbols === symbolsShown) return;
    symbolsShown = symbols;
    for (const [id, b] of toolButtons) b.querySelector('.cx-icon').replaceChildren(icon(id, symbols));
  }

  /** Choose the layout for the stage width and return the space the controls take (CSS px). */
  function layout(width) {
    mode = width >= 1000 ? 'wide' : width >= 600 ? 'compact' : 'narrow';
    root.dataset.layout = mode;
    root.style.setProperty('--cx-font', mode === 'wide' ? '18px' : mode === 'compact' ? '16px' : '14px');
    // Undo and Clear live at the foot of the tools column, or at the end of the bar when there is no column.
    if (mode === 'narrow') bar.append(undoBtn, clearBtn);
    else tools.append(undoBtn, clearBtn);
    barSep.hidden = mode !== 'narrow';
    const barH = Math.ceil(bar.getBoundingClientRect().height) || 56;
    root.style.setProperty('--cx-bar-h', `${barH}px`);
    const left = mode === 'narrow' ? 0 : Math.ceil(tools.getBoundingClientRect().width);
    return { left, bottom: barH };
  }

  /** @param {{ tool: string, parts: object[], sol: object, selected: number, symbols: string, canUndo: boolean }} s */
  function update(s) {
    setIcons(s.symbols);
    for (const [id, b] of toolButtons) b.setAttribute('aria-pressed', String(id === s.tool));
    if (toolSelect.value !== s.tool) toolSelect.value = s.tool;

    const key = s.parts.map((p, i) => `${s.sol.names[i]}:${describePart(p)}`).join('|');
    if (key !== partsKey) {
      partsKey = key;
      partSelect.replaceChildren(
        el('option', { value: '-1', text: s.parts.length ? 'No part selected' : 'No parts yet' }),
        ...s.parts.map((p, i) => el('option', { value: String(i), text: `${s.sol.names[i]} · ${describePart(p)}` })),
      );
    }
    partSelect.value = String(s.selected);

    const p = s.parts[s.selected];
    const r = p ? s.sol.parts[s.selected] : null;
    const hasValue = Boolean(p) && (p.type === 'R' || p.type === 'L' || p.type === 'B');
    valueField.hidden = !hasValue;
    rField.hidden = !(p && p.type === 'B');
    if (hasValue) {
      const [lo, hi] = p.type === 'B' ? LIMITS.emf : LIMITS.resistance;
      valueLabel.textContent = p.type === 'B' ? 'EMF' : 'Resistance';
      valueUnit.textContent = p.type === 'B' ? 'V' : 'Ω';
      valueInput.min = String(lo);
      valueInput.max = String(hi);
      if (document.activeElement !== valueInput) valueInput.value = String(p.value);
      if (p.type === 'B' && document.activeElement !== rInput) rInput.value = String(p.r ?? 0);
    }
    switchBtn.hidden = !(p && p.type === 'S');
    if (p && p.type === 'S') {
      switchBtn.textContent = p.closed ? 'Open switch' : 'Close switch';
      switchBtn.setAttribute('aria-pressed', String(Boolean(p.closed)));
    }
    turnBtn.hidden = !p;
    deleteBtn.hidden = !p;
    hint.hidden = Boolean(p);
    undoBtn.disabled = !s.canUndo;
    clearBtn.disabled = !s.parts.length;

    if (p && r && r.current !== null) {
      const fmt = (v, u) => (v === null || v === undefined ? '—' : `${formatNumber(v)} ${u}`);
      const bits = p.type === 'V' ? [`V ${fmt(r.reading, 'V')}`] : p.type === 'A' ? [`I ${fmt(r.reading, 'A')}`] : [`I ${fmt(r.current, 'A')}`, `V ${fmt(r.voltage, 'V')}`, `P ${fmt(r.power, 'W')}`];
      readings.textContent = bits.join('   ');
    } else readings.textContent = '';
  }

  return {
    layout,
    update,
    destroy() {
      root.remove();
      style.remove();
    },
  };
}
