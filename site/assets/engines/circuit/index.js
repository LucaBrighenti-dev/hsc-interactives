// Circuit engine (guide §9.1): build resistive DC circuits on a grid, solve them by modified nodal
// analysis (model.js) and show conventional current as moving dots whose speed is proportional to current.
// Setup `builder` serves the Physics circuit builder and the Engineering AS 1102 listing (symbols: 'as1102').
//
// ------------------------------------------------------------------------------------------------------
// NETLIST ENCODING: the `netlist` param holds the whole circuit, so a link carries it.
//
//   netlist = part ( "_" part )*          (empty = an empty grid; at most 1500 characters, 120 parts)
//   part    = code "-" x1 "-" y1 "-" x2 "-" y2
//
// x and y are grid points: x = 0…14 left to right, y = 0…8 top to bottom. A part runs straight between
// its two points (same row or same column). Codes:
//   W            wire
//   B<emf>       cell, EMF in volts (0.1–250)          B12        a 12 V ideal cell
//   B<emf>r<r>   cell with internal resistance in Ω    B12r0.5    12 V with r = 0.5 Ω (0–100)
//   R<ohms>      resistor (0.1–100 000 Ω)              R10
//   L<ohms>      lamp, modelled as a resistor          L6.8
//   S1 / S0      switch, closed / open
//   A            ideal ammeter (no resistance)
//   V            ideal voltmeter (no current)
// For B, A and V the FIRST point is the + terminal. Numbers are plain decimals (up to 6 digits before the
// point and 4 after). Every character is URL-safe, so the text needs no escaping.
// Parts join where their end points meet, and where an end point lands on a wire (a T-junction). Wires
// that cross without an end point at the crossing don't join.
//
// Example, 12 V across 10 Ω + 10 Ω (0.6 A):
//   B12-0-1-0-2_W-0-1-0-0_R10-0-0-2-0_R10-2-0-4-0_W-4-0-4-2_W-4-2-0-2
//
// `circuit` picks a preset (single, series, parallel, mixed, wheatstone, internal) and fills in `netlist`.
// Editing on the stage sets `circuit` to 'custom'. When both arrive together a non-empty `netlist` wins.
// ------------------------------------------------------------------------------------------------------
//
// Editing on the stage (pointer): pick a tool on the left. Select: click a part to select it (a switch
// also opens or closes), drag a part to move it, drag a selected part's end to stretch it, drag from a grid
// dot to draw a wire, click a grid dot (or hover) to see its potential. Part tools: click a grid dot to
// place the part there (drag to choose its direction). Keyboard (with the grid focused): arrows move the
// cursor and show the potential there; Enter selects the part at the cursor, places the current tool's
// part, or starts and ends a wire; Shift+arrows move the selected part; Delete removes it; Escape cancels;
// Ctrl+Z undoes. The bottom bar edits the selected part (value, open or close, turn, delete).
//
// Edits change `netlist` inside the engine. The engine reports them with onEvent('params', { netlist,
// circuit }) so the shell can update the URL (see the change request in the PR).
import {
  DT,
  GRID,
  NETLIST_MAX,
  NETLIST_PATTERN,
  PRESETS,
  PART_INFO,
  LIMITS,
  NEW_PART,
  parseNetlist,
  formatNetlist,
  matchPreset,
  solve,
  outputs,
  dataTable,
  describe,
  placementProblem,
  addPart,
  movePart,
  rotatePart,
  removePart,
  updatePart,
  placeNew,
  partAt,
  nodeAt,
  onPart,
  snapAxis,
  inGrid,
  createState,
  advance,
} from './model.js';
import { createView } from './view.js';
import { createPanel } from './panel.js';
import { createLoop, createEmitter, pointerDrag } from '../../engine-kit.js';
import { defaultsFor, clampParams } from '../../state.js';
import { formatPlain } from '../../format.js';

export const meta = {
  name: 'circuit',
  version: '1.0.0',
  setups: ['builder'],
  staticSetups: [], // the circuit is solved statically, but the current dots move, so play/step apply
  stepSize: 6, // 6 × 1/60 s = 0.1 s per Step press
  params: {
    circuit: {
      type: 'enum',
      label: 'Circuit',
      options: [...Object.entries(PRESETS).map(([value, p]) => [value, p.label]), ['custom', 'Your circuit']],
      default: 'series',
      widget: 'select',
    },
    netlist: {
      type: 'string',
      label: 'Circuit code',
      maxLength: NETLIST_MAX,
      pattern: NETLIST_PATTERN,
      default: '',
      help: 'The whole circuit as text. Editing on the stage changes it, and a shared link carries it.',
    },
    symbols: { type: 'enum', label: 'Symbols', options: [['physics', 'Physics'], ['as1102', 'AS 1102']], default: 'physics' },
    showDots: { type: 'boolean', label: 'Moving current dots', default: true },
    dotSpeed: { type: 'number', label: 'Dot speed per ampere', unit: 'cells/s per A', min: 0.1, max: 20, step: 0.1, default: 2, visibleWhen: { showDots: true } },
    showReadings: { type: 'boolean', label: 'Current and voltage on parts', default: false },
    showVoltages: { type: 'boolean', label: 'Potential at each node', default: false },
    lampRating: { type: 'number', label: 'Lamp fully lit at', unit: 'W', min: 0.1, max: 1000, step: 0.1, default: 10, help: 'Lamps are shaded in proportion to their power, up to this value.' },
    timeScale: { type: 'number', label: 'Playback speed', unit: '×', min: 0.25, max: 2, step: 0.25, default: 1 },
  },
  outputs: {
    current: { label: 'Cell current I', unit: 'A', sigfigs: 3 },
    terminalVoltage: { label: 'Terminal voltage V', unit: 'V', sigfigs: 3 },
    resistance: { label: 'Equivalent resistance', unit: 'Ω', sigfigs: 3 },
    power: { label: 'Power supplied P', unit: 'W', sigfigs: 3 },
    a1: { label: 'Ammeter A1', unit: 'A', sigfigs: 3 },
    a2: { label: 'Ammeter A2', unit: 'A', sigfigs: 3 },
    a3: { label: 'Ammeter A3', unit: 'A', sigfigs: 3 },
    v1: { label: 'Voltmeter V1', unit: 'V', sigfigs: 3 },
    v2: { label: 'Voltmeter V2', unit: 'V', sigfigs: 3 },
    v3: { label: 'Voltmeter V3', unit: 'V', sigfigs: 3 },
    partCurrent: { label: 'Selected part: current', unit: 'A', sigfigs: 3 },
    partVoltage: { label: 'Selected part: voltage', unit: 'V', sigfigs: 3 },
    partPower: { label: 'Selected part: power', unit: 'W', sigfigs: 3 },
  },
};

/** Apply a validated partial update to the circuit params (see "circuit" in the encoding notes). */
function resolveCircuit(current, next) {
  const out = { ...current, ...next };
  const hasNet = 'netlist' in next;
  if (hasNet && next.netlist !== '') {
    out.circuit = next.circuit === 'custom' ? 'custom' : (matchPreset(next.netlist) ?? 'custom');
  } else if ('circuit' in next && next.circuit !== 'custom' && PRESETS[next.circuit]) {
    out.netlist = PRESETS[next.circuit].netlist;
  } else if (hasNet) {
    out.netlist = '';
    out.circuit = 'custom';
  }
  return out;
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * @param {HTMLElement} stage
 * @param {{ setup?: string, params?: object, theme?: 'projector'|'dark', onEvent?: (type:string, payload?:any)=>void }} opts
 */
export function create(stage, opts = {}) {
  const setup = opts.setup ?? meta.setups[0];
  if (!meta.setups.includes(setup)) throw new Error(`circuit: unknown setup "${setup}"`);
  const emit = createEmitter(opts.onEvent);

  const defaults = defaultsFor(meta.params, setup);
  let params = resolveCircuit(defaults, { ...defaults, ...clampParams(meta.params, setup, opts.params).params });
  let parts = [];
  let problems = [];
  let sol = null;
  let state = createState();
  const undoStack = [];
  const ui = {
    tool: 'select',
    selected: -1,
    hoverPoint: null,
    hoverNode: -1,
    cursor: { x: Math.round(GRID.cols / 2), y: Math.round(GRID.rows / 2) },
    showCursor: false,
    wireStart: null,
    preview: null,
    flash: '',
  };

  function loadNetlist() {
    const r = parseNetlist(params.netlist);
    parts = r.parts;
    problems = r.problems;
    sol = solve(parts);
    if (ui.selected >= parts.length) ui.selected = -1;
  }
  loadNetlist();

  const view = createView(stage);
  const canvas = view.canvas;
  canvas.removeAttribute('aria-hidden');
  canvas.tabIndex = 0;
  canvas.setAttribute(
    'aria-label',
    'Circuit grid. Arrow keys move the cursor and show the potential there. Enter selects the part at the cursor, or places a part or wire with the chosen tool. Shift with arrows moves the selected part. Delete removes it. Escape cancels. Ctrl+Z undoes.',
  );

  const render = () => view.draw({ parts, sol, params, t: state.t, ui: { ...ui, problems } });
  const currentOutputs = () => outputs(sol, ui.selected);
  const notifyParams = () => opts.onEvent?.('params', { netlist: params.netlist, circuit: params.circuit });

  function sync() {
    if (ui.selected >= parts.length) ui.selected = -1;
    ui.hoverNode = ui.hoverPoint ? nodeAt(parts, sol, ...ui.hoverPoint) : -1;
    panel.update({ tool: ui.tool, parts, sol, selected: ui.selected, symbols: params.symbols, canUndo: undoStack.length > 0 });
    render();
    emit.outputsNow(currentOutputs());
  }

  /** Replace the circuit with `next` (an edit on the stage). Undoable; reported to the shell. */
  function commit(next, { select = ui.selected, flash = '' } = {}) {
    const text = formatNetlist(next);
    if (text.length > NETLIST_MAX) {
      ui.flash = 'That would make the circuit too long to share in a link. Remove some parts first.';
      sync();
      return false;
    }
    undoStack.push(params.netlist);
    if (undoStack.length > 50) undoStack.shift();
    parts = next;
    problems = [];
    params = { ...params, netlist: text, circuit: matchPreset(text) ?? 'custom' };
    sol = solve(parts);
    ui.selected = select;
    ui.flash = flash;
    sync();
    notifyParams();
    return true;
  }

  function say(message) {
    ui.flash = message;
    sync();
  }

  const actions = {
    tool(id) {
      ui.tool = id;
      ui.wireStart = null;
      ui.flash = id === 'select' || id === 'W' ? '' : `${PART_INFO[id].name}: click a grid dot to place it, or drag from the dot to choose its direction.`;
      sync();
    },
    select(i) {
      ui.selected = Number.isInteger(i) && parts[i] ? i : -1;
      ui.flash = '';
      sync();
    },
    value(key, raw) {
      const i = ui.selected;
      const p = parts[i];
      if (!p) return;
      const v = Number(raw);
      if (raw === '' || !Number.isFinite(v)) {
        say('Enter a number.');
        return;
      }
      const next = updatePart(parts, i, { [key]: v });
      const [lo, hi] = key === 'r' ? LIMITS.internal : p.type === 'B' ? LIMITS.emf : LIMITS.resistance;
      const unit = p.type === 'B' && key === 'value' ? 'V' : 'Ω';
      const flash = next[i][key] !== v ? `Values run from ${formatPlain(lo)} to ${formatPlain(hi)} ${unit}, so it was set to ${formatPlain(next[i][key])} ${unit}.` : '';
      if (next[i][key] === p[key]) say(flash);
      else commit(next, { flash });
    },
    toggle() {
      const i = ui.selected;
      if (parts[i]?.type === 'S') commit(updatePart(parts, i, { closed: !parts[i].closed }));
    },
    rotate() {
      if (ui.selected < 0) return;
      const r = rotatePart(parts, ui.selected);
      if (r.problem) say(r.problem);
      else commit(r.parts);
    },
    remove() {
      if (ui.selected < 0) return;
      commit(removePart(parts, ui.selected), { select: -1 });
    },
    undo() {
      if (!undoStack.length) return;
      params = { ...params, netlist: undoStack.pop() };
      params.circuit = matchPreset(params.netlist) ?? 'custom';
      ui.selected = -1;
      ui.flash = '';
      loadNetlist();
      sync();
      notifyParams();
    },
    clear() {
      if (!parts.length) return;
      commit([], { select: -1, flash: 'Cleared. Undo brings the circuit back.' });
    },
  };

  const panel = createPanel(stage, actions);

  // ---------------------------------------------------------------------------------------- pointer

  const nearest = (gx, gy) => {
    const rx = Math.round(gx);
    const ry = Math.round(gy);
    return { rx, ry, d: Math.hypot(gx - rx, gy - ry) };
  };
  const inArea = (gx, gy) => gx >= -0.6 && gy >= -0.6 && gx <= GRID.cols + 0.6 && gy <= GRID.rows + 0.6;
  let dragging = false;

  function hit(x, y) {
    const [gx, gy] = view.toGrid(x, y);
    if (!inArea(gx, gy)) return null;
    const { rx, ry, d } = nearest(gx, gy);
    const onPoint = d < 0.28 && inGrid(rx, ry);
    const sel = parts[ui.selected];
    if (sel && ui.tool === 'select') {
      if (Math.hypot(gx - sel.x1, gy - sel.y1) < 0.25) return { kind: 'end', index: ui.selected, which: 1 };
      if (Math.hypot(gx - sel.x2, gy - sel.y2) < 0.25) return { kind: 'end', index: ui.selected, which: 2 };
    }
    // A part's body wins over a grid point: the middle of a two-cell part is a grid point, but nothing can
    // connect there, so a press on it means the part. A press on a part's end means its terminal.
    const tool = ui.tool;
    const i = partAt(parts, gx, gy, 0.3);
    const p = parts[i];
    const atEnd = p && onPoint && ((p.x1 === rx && p.y1 === ry) || (p.x2 === rx && p.y2 === ry));
    if (p && p.type !== 'W' && !atEnd) return { kind: 'part', index: i, gx, gy };
    if (tool === 'select') {
      if (onPoint) return { kind: 'wire', from: [rx, ry] };
      return p ? { kind: 'part', index: i, gx, gy } : null;
    }
    if (tool === 'W') {
      if (d < 0.45 && inGrid(rx, ry)) return { kind: 'wire', from: [rx, ry] };
      return p ? { kind: 'part', index: i, gx, gy } : null;
    }
    if (onPoint) return { kind: 'place', type: tool, from: [rx, ry] };
    if (p) return { kind: 'part', index: i, gx, gy };
    return inGrid(rx, ry) ? { kind: 'place', type: tool, from: [rx, ry] } : null;
  }

  function dragStart(t) {
    dragging = true;
    ui.flash = '';
    ui.showCursor = false;
    ui.wireStart = null;
    if (t.kind === 'part') {
      ui.selected = t.index;
      t.moved = false;
      sync();
    } else render();
  }

  function dragMove(t, x, y) {
    const [gx, gy] = view.toGrid(x, y);
    if (t.kind === 'part') {
      const dx = Math.round(gx - t.gx);
      const dy = Math.round(gy - t.gy);
      if (!dx && !dy && !t.moved) return;
      t.moved = true;
      const p = parts[t.index];
      const part = { ...p, x1: p.x1 + dx, y1: p.y1 + dy, x2: p.x2 + dx, y2: p.y2 + dy };
      t.dx = dx;
      t.dy = dy;
      ui.preview = dx || dy ? { part, problem: placementProblem(parts, part, t.index) } : null;
    } else if (t.kind === 'end') {
      const p = parts[t.index];
      const [ox, oy] = t.which === 1 ? [p.x2, p.y2] : [p.x1, p.y1];
      const [nx, ny] = snapAxis(ox, oy, gx, gy);
      const part = t.which === 1 ? { ...p, x1: nx, y1: ny } : { ...p, x2: nx, y2: ny };
      const same = part.x1 === p.x1 && part.y1 === p.y1 && part.x2 === p.x2 && part.y2 === p.y2;
      t.part = same ? null : part;
      ui.preview = same ? null : { part, problem: placementProblem(parts, part, t.index) };
    } else if (t.kind === 'wire') {
      const [ex, ey] = snapAxis(t.from[0], t.from[1], gx, gy);
      t.to = [ex, ey];
      const part = { type: 'W', x1: t.from[0], y1: t.from[1], x2: ex, y2: ey };
      ui.preview = ex === t.from[0] && ey === t.from[1] ? null : { part, problem: placementProblem(parts, part) };
    } else if (t.kind === 'place') {
      const dx = gx - t.from[0];
      const dy = gy - t.from[1];
      if (Math.hypot(dx, dy) > 0.45) t.dir = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
      if (t.dir) {
        const part = { type: t.type, x1: t.from[0], y1: t.from[1], x2: t.from[0] + 2 * t.dir[0], y2: t.from[1] + 2 * t.dir[1], ...NEW_PART[t.type] };
        ui.preview = { part, problem: placementProblem(parts, part) };
      }
    }
    render();
  }

  function dragEnd(t) {
    dragging = false;
    const preview = ui.preview;
    ui.preview = null;
    if (t.kind === 'part') {
      if (!t.moved || !preview) {
        if (!t.moved && parts[t.index]?.type === 'S') commit(updatePart(parts, t.index, { closed: !parts[t.index].closed }));
        else sync();
        return;
      }
      const r = movePart(parts, t.index, t.dx, t.dy);
      if (r.problem) say(r.problem);
      else commit(r.parts);
    } else if (t.kind === 'end') {
      if (!t.part) return render();
      if (preview?.problem) say(preview.problem);
      else {
        const next = parts.slice();
        next[t.index] = t.part;
        commit(next);
      }
    } else if (t.kind === 'wire') {
      if (!t.to || (t.to[0] === t.from[0] && t.to[1] === t.from[1])) {
        // A tap on a grid dot: show the potential there (touch has no hover).
        ui.hoverPoint = t.from;
        sync();
        return;
      }
      const r = addPart(parts, { type: 'W', x1: t.from[0], y1: t.from[1], x2: t.to[0], y2: t.to[1] });
      if (r.problem) say(r.problem);
      else commit(r.parts, { select: -1 });
    } else if (t.kind === 'place') {
      // A click places the part to the right (or the first way it fits); a drag sets its direction.
      let r;
      if (t.dir) {
        const [ux, uy] = t.dir;
        const a = addPart(parts, { type: t.type, x1: t.from[0], y1: t.from[1], x2: t.from[0] + 2 * ux, y2: t.from[1] + 2 * uy, ...NEW_PART[t.type] });
        r = { ...a, index: a.parts.length - 1 };
      } else r = placeNew(parts, t.type, t.from[0], t.from[1]);
      if (r.problem) say(r.problem);
      else commit(r.parts, { select: r.index });
    } else render();
  }

  const detachDrag = pointerDrag(canvas, { hit, move: dragMove, start: dragStart, end: dragEnd });

  const onHover = (e) => {
    if (dragging || e.pointerType !== 'mouse') return;
    const rect = canvas.getBoundingClientRect();
    const [gx, gy] = view.toGrid(e.clientX - rect.left, e.clientY - rect.top);
    const { rx, ry, d } = nearest(gx, gy);
    const point = d < 0.35 && inGrid(rx, ry) ? [rx, ry] : null;
    const node = point ? nodeAt(parts, sol, rx, ry) : -1;
    const next = node >= 0 ? point : null;
    if (String(next) === String(ui.hoverPoint)) return;
    ui.hoverPoint = next;
    ui.hoverNode = node;
    render();
  };
  const onLeave = (e) => {
    if (e.pointerType !== 'mouse' || dragging || !ui.hoverPoint) return;
    ui.hoverPoint = null;
    ui.hoverNode = -1;
    render();
  };
  // Runs after pointerDrag's own pointerdown handler: if that found nothing to grab, the press was on
  // empty space, which clears the selection and any tapped potential.
  const onPointerDown = () => {
    ui.showCursor = false;
    if (dragging) return;
    ui.selected = -1;
    ui.hoverPoint = null;
    ui.flash = '';
    sync();
  };

  // ---------------------------------------------------------------------------------------- keyboard

  function cursorMoved() {
    const { x, y } = ui.cursor;
    ui.hoverPoint = [x, y];
    ui.hoverNode = nodeAt(parts, sol, x, y);
    render();
  }

  function enter() {
    const { x, y } = ui.cursor;
    if (ui.tool === 'select') {
      const touching = parts.map((_, i) => i).filter((i) => onPart(parts[i], x, y));
      if (!touching.length) {
        ui.selected = -1;
        sync();
        return;
      }
      const at = touching.indexOf(ui.selected);
      if (at >= 0 && touching.length === 1 && parts[ui.selected].type === 'S') {
        actions.toggle();
        return;
      }
      ui.selected = touching[(at + 1) % touching.length];
      ui.flash = '';
      sync();
      return;
    }
    if (ui.tool === 'W') {
      if (!ui.wireStart) {
        ui.wireStart = { x, y };
        say('Move to the other end of the wire, then press Enter. Escape cancels.');
        return;
      }
      const s = ui.wireStart;
      ui.wireStart = null;
      if (s.x === x && s.y === y) {
        say('');
        return;
      }
      const legs = s.x === x || s.y === y ? [[s.x, s.y, x, y]] : [[s.x, s.y, x, s.y], [x, s.y, x, y]];
      let next = parts;
      for (const [x1, y1, x2, y2] of legs) {
        const r = addPart(next, { type: 'W', x1, y1, x2, y2 });
        if (r.problem) {
          say(r.problem);
          return;
        }
        next = r.parts;
      }
      commit(next, { select: -1 });
      return;
    }
    const r = placeNew(parts, ui.tool, x, y);
    if (r.problem) say(r.problem);
    else commit(r.parts, { select: r.index });
  }

  const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const onKey = (e) => {
    if (e.altKey) return;
    const k = e.key;
    if (e.ctrlKey || e.metaKey) {
      if (k === 'z' || k === 'Z') {
        actions.undo();
        e.preventDefault();
      }
      return;
    }
    ui.showCursor = true;
    if (ARROWS[k]) {
      const [dx, dy] = ARROWS[k];
      if (e.shiftKey && ui.selected >= 0) {
        const r = movePart(parts, ui.selected, dx, dy);
        if (r.problem) say(r.problem);
        else commit(r.parts);
      } else {
        ui.cursor = { x: clamp(ui.cursor.x + dx, 0, GRID.cols), y: clamp(ui.cursor.y + dy, 0, GRID.rows) };
        cursorMoved();
      }
      e.preventDefault();
    } else if (k === 'Enter') {
      enter();
      e.preventDefault();
    } else if (k === 'Delete' || k === 'Backspace') {
      actions.remove();
      e.preventDefault();
    } else if (k === 'Escape') {
      if (ui.wireStart) ui.wireStart = null;
      else if (ui.tool !== 'select') ui.tool = 'select';
      else ui.selected = -1;
      ui.flash = '';
      sync();
      e.preventDefault();
    }
  };
  const onFocus = () => {
    if (ui.showCursor) cursorMoved();
  };
  const onBlur = () => {
    ui.showCursor = false;
    ui.wireStart = null;
    render();
  };
  canvas.addEventListener('pointermove', onHover);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('keydown', onKey);
  canvas.addEventListener('focus', onFocus);
  canvas.addEventListener('blur', onBlur);

  // ---------------------------------------------------------------------------------------- loop

  const loop = createLoop({
    dt: DT,
    step: () => {
      state = advance(state, 1);
    },
    render,
    getTimeScale: () => params.timeScale,
    onFrame: () => emit.tick(state.t),
    onError: (err) => emit.error(err),
  });

  function relayout() {
    const ins = panel.layout(stage.getBoundingClientRect().width);
    view.setInsets(ins);
  }

  view.resize();
  relayout();
  sync();

  return {
    setParams(partial) {
      const { params: next, invalid } = clampParams(meta.params, setup, partial);
      let flash = '';
      if (invalid.includes('netlist')) {
        delete next.netlist;
        flash = "That circuit code isn't in the right format, so the circuit hasn't changed.";
      }
      const before = params.netlist;
      params = resolveCircuit(params, next);
      if (params.netlist !== before) {
        undoStack.push(before);
        if (undoStack.length > 50) undoStack.shift();
        ui.selected = -1;
        loadNetlist();
      }
      ui.flash = flash;
      sync();
    },
    getParams: () => ({ ...params }),
    play: () => loop.play(),
    pause: () => loop.pause(),
    isPlaying: () => loop.isPlaying(),
    step(n = 1) {
      state = advance(state, n);
      render();
      emit.tick(state.t);
      emit.outputsNow(currentOutputs());
    },
    reset() {
      loop.pause();
      state = createState();
      render();
      emit.outputsNow(currentOutputs());
    },
    isComplete: () => false, // the dots run until paused
    getOutputs: currentOutputs,
    getData: () => dataTable(parts, sol),
    describe: () => describe(parts, sol),
    setTheme() {
      view.setTheme();
      render();
    },
    resize() {
      view.resize();
      relayout();
      render();
    },
    destroy() {
      loop.destroy();
      emit.destroy();
      detachDrag();
      canvas.removeEventListener('pointermove', onHover);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('keydown', onKey);
      canvas.removeEventListener('focus', onFocus);
      canvas.removeEventListener('blur', onBlur);
      panel.destroy();
      view.destroy();
    },
  };
}
