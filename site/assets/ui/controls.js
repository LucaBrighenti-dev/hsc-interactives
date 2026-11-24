// Input controls: button, slider (with number entry and unit), toggle, segmented control, select,
// text field and chip. Each factory returns an HTMLElement; value controls also get
// setValue(v) (no callback fired), getValue() and setDisabled(bool).
// Keyboard and touch accessible; touch targets are at least 44 px.
import { el, nextId } from './dom.js';
import { icon } from './icons.js';
import { formatStepValue } from '../format.js';

/**
 * @param {{ label: string, variant?: 'primary'|'secondary'|'ghost', icon?: string, iconOnly?: boolean,
 *   size?: 'sm', block?: boolean, onClick?: Function, title?: string, shortcut?: string,
 *   pressed?: boolean, type?: string, disabled?: boolean, href?: string }} opts
 */
export function button(opts) {
  const { label, variant = 'secondary', iconOnly = false, size, block, onClick, title, shortcut, pressed, type = 'button', disabled, href } = opts;
  const classes = ['btn', variant !== 'secondary' && `btn--${variant}`, iconOnly && 'btn--icon', size && `btn--${size}`, block && 'btn--block'];
  const tip = title || (iconOnly ? label : null);
  const node = el(href ? 'a' : 'button', {
    class: classes,
    type: href ? null : type,
    href: href || null,
    title: tip ? `${tip}${shortcut ? ` (${shortcut})` : ''}` : null,
    aria: { label: iconOnly ? label : null, pressed: pressed === undefined ? null : String(pressed), keyshortcuts: shortcut || null },
    disabled: disabled || null,
    on: onClick ? { click: onClick } : {},
  });
  if (opts.icon) node.append(icon(opts.icon));
  if (!iconOnly) node.append(el('span', { text: label }));
  node.setPressed = (v) => node.setAttribute('aria-pressed', String(Boolean(v)));
  node.setBusy = (busy) => {
    node.classList.toggle('is-busy', busy);
    node.setAttribute('aria-busy', String(busy));
    if (!href) node.disabled = busy;
  };
  node.setLabel = (text) => {
    if (iconOnly) {
      node.setAttribute('aria-label', text);
      node.title = `${text}${shortcut ? ` (${shortcut})` : ''}`;
    } else node.querySelector('span').textContent = text;
  };
  node.setIcon = (name) => {
    const old = node.querySelector('svg');
    const next = icon(name);
    if (old) old.replaceWith(next);
    else node.prepend(next);
  };
  return node;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/**
 * Slider with a number entry box and unit.
 * onInput fires continuously while dragging; onChange fires when the value is committed.
 * @param {{ label: string, unit?: string, min: number, max: number, step?: number, value: number,
 *   integer?: boolean, showScale?: boolean, onInput?: (v:number)=>void, onChange?: (v:number)=>void, help?: string }} opts
 */
export function slider(opts) {
  const { label, unit = '', min, max, step = 0.01, integer = false, showScale = false, onInput, onChange, help } = opts;
  let value = opts.value;
  const id = nextId('slider');
  const number = el('input', {
    id,
    class: 'slider__number',
    type: 'number',
    inputmode: 'decimal',
    step: 'any',
    min,
    max,
    aria: { describedby: help ? `${id}-help` : null },
  });
  const range = el('input', {
    class: 'slider__range',
    type: 'range',
    min,
    max,
    step,
    aria: { label: `${label}${unit ? ` (${unit})` : ''}` },
  });
  const fill = el('div', { class: 'slider__fill' });
  const root = el(
    'div',
    { class: 'slider' },
    el(
      'div',
      { class: 'slider__head' },
      el('label', { class: 'slider__label', for: id, text: label }),
      el('div', { class: 'slider__entry' }, number, unit ? el('span', { class: 'slider__unit', text: unit, 'aria-hidden': 'true' }) : null),
    ),
    el('div', { class: 'slider__rail' }, el('div', { class: 'slider__track' }), fill, range),
    showScale ? el('div', { class: 'slider__scale', 'aria-hidden': 'true' }, el('span', { text: formatStepValue(min, step) }), el('span', { text: formatStepValue(max, step) })) : null,
    help ? el('p', { id: `${id}-help`, class: 'sr-only', text: help }) : null,
  );

  const render = () => {
    number.value = formatStepValue(value, step);
    range.value = String(value);
    range.setAttribute('aria-valuetext', `${formatStepValue(value, step)}${unit ? ` ${unit}` : ''}`);
    fill.style.setProperty('--fill', `${((clamp(value, min, max) - min) / (max - min || 1)) * 100}%`);
  };
  const normalise = (v) => {
    let n = clamp(v, min, max);
    if (integer) n = Math.round(n);
    return n;
  };

  range.addEventListener('input', () => {
    value = normalise(Number(range.value));
    render();
    onInput?.(value);
  });
  range.addEventListener('change', () => onChange?.(value));
  range.addEventListener('keydown', (e) => {
    // PageUp/PageDown move ten steps.
    if (e.key !== 'PageUp' && e.key !== 'PageDown') return;
    e.preventDefault();
    value = normalise(value + (e.key === 'PageUp' ? 10 : -10) * (Number(step) || (max - min) / 100));
    render();
    onInput?.(value);
    onChange?.(value);
  });
  const commitNumber = () => {
    const raw = number.value.trim();
    const n = Number(raw);
    if (raw === '' || !Number.isFinite(n)) {
      render();
      return;
    }
    const next = normalise(n);
    if (next !== n) {
      number.setAttribute('aria-invalid', 'true');
      setTimeout(() => number.removeAttribute('aria-invalid'), 900);
    }
    value = next;
    render();
    onInput?.(value);
    onChange?.(value);
  };
  number.addEventListener('change', commitNumber);
  number.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitNumber();
    }
    if (e.key === 'Escape') {
      render();
      number.blur();
    }
  });

  root.setValue = (v) => {
    value = normalise(Number(v));
    if (document.activeElement !== number) render();
  };
  root.getValue = () => value;
  root.setDisabled = (d) => {
    number.disabled = d;
    range.disabled = d;
  };
  render();
  return root;
}

/** On/off switch. @param {{ label: string, checked: boolean, onChange?: (v:boolean)=>void }} opts */
export function toggle({ label, checked = false, onChange }) {
  let value = Boolean(checked);
  const state = el('span', { class: 'toggle__state', 'aria-hidden': 'true' });
  const root = el(
    'button',
    { class: 'toggle', type: 'button', role: 'switch', aria: { checked: String(value) } },
    el('span', { text: label }),
    el('span', { class: 'cluster', style: { '--cluster-gap': '10px' } }, state, el('span', { class: 'toggle__track' }, el('span', { class: 'toggle__knob' }))),
  );
  const render = () => {
    root.setAttribute('aria-checked', String(value));
    state.textContent = value ? 'On' : 'Off';
  };
  root.addEventListener('click', () => {
    value = !value;
    render();
    onChange?.(value);
  });
  root.setValue = (v) => {
    value = Boolean(v);
    render();
  };
  root.getValue = () => value;
  root.setDisabled = (d) => {
    root.disabled = d;
  };
  render();
  return root;
}

/**
 * Segmented control (radio group) for 2–4 options.
 * @param {{ label: string, options: [string, string][], value: string, onChange?: (v:string)=>void }} opts
 */
export function segmented({ label, options, value, onChange }) {
  let current = value;
  const labelId = nextId('seg');
  const group = el('div', { class: 'segmented', role: 'radiogroup', aria: { labelledby: labelId } });
  const buttons = options.map(([v, text]) =>
    el('button', {
      class: 'segmented__option',
      type: 'button',
      role: 'radio',
      data: { value: v },
      text,
      on: { click: () => select(v, true) },
    }),
  );
  group.append(...buttons);
  group.addEventListener('keydown', (e) => {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const i = options.findIndex(([v]) => v === current);
    const next = options[(i + keys[e.key] + options.length) % options.length][0];
    select(next, true);
    buttons.find((b) => b.dataset.value === next)?.focus();
  });
  function render() {
    for (const b of buttons) {
      const on = b.dataset.value === current;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    }
  }
  function select(v, fire) {
    if (v === current && fire) return;
    current = v;
    render();
    if (fire) onChange?.(v);
  }
  const root = el('div', { class: 'segmented-wrap' }, el('span', { id: labelId, class: 'segmented-wrap__label', text: label }), group);
  root.setValue = (v) => select(v, false);
  root.getValue = () => current;
  root.setDisabled = (d) => buttons.forEach((b) => (b.disabled = d));
  render();
  return root;
}

/**
 * Native select, styled.
 * @param {{ label: string, options: [string, string][], value: string, onChange?: (v:string)=>void, hideLabel?: boolean }} opts
 */
export function select({ label, options, value, onChange, hideLabel = false }) {
  const id = nextId('select');
  const sel = el(
    'select',
    { id, class: 'select', on: { change: () => onChange?.(sel.value) } },
    options.map(([v, text]) => el('option', { value: v, text })),
  );
  sel.value = value;
  const root = el('div', { class: 'field' }, el('label', { class: hideLabel ? 'sr-only' : 'field__label', for: id, text: label }), sel);
  root.setValue = (v) => {
    sel.value = v;
  };
  root.getValue = () => sel.value;
  root.setDisabled = (d) => {
    sel.disabled = d;
  };
  return root;
}

/**
 * Text field that commits on change/Enter (used for expression params).
 * @param {{ label: string, value?: string, placeholder?: string, mono?: boolean, type?: string,
 *   onChange?: (v:string)=>void, autocomplete?: string, maxLength?: number }} opts
 */
export function textField({ label, value = '', placeholder, mono = false, type = 'text', onChange, autocomplete = 'off', maxLength }) {
  const id = nextId('field');
  const input = el('input', {
    id,
    class: ['input', mono && 'input--mono'],
    type,
    placeholder: placeholder || null,
    autocomplete,
    spellcheck: 'false',
    maxlength: maxLength || null,
    on: {
      change: () => onChange?.(input.value),
      keydown: (e) => {
        if (e.key === 'Enter' && type !== 'textarea') onChange?.(input.value);
      },
    },
  });
  input.value = value;
  const root = el('div', { class: 'field' }, el('label', { class: 'field__label', for: id, text: label }), input);
  root.input = input;
  root.setValue = (v) => {
    if (document.activeElement !== input) input.value = v;
  };
  root.getValue = () => input.value;
  root.setDisabled = (d) => {
    input.disabled = d;
  };
  return root;
}

/**
 * Chip: a static tag (no onToggle/href), a link (href) or a toggle filter (onToggle).
 * @param {{ label: string, pressed?: boolean, onToggle?: (pressed:boolean)=>void, href?: string,
 *   variant?: 'accent'|'solid'|'live', title?: string, external?: boolean }} opts
 */
export function chip({ label, pressed, onToggle, href, variant, title, external = false }) {
  const classes = ['chip', variant && `chip--${variant}`];
  if (href) {
    return el('a', { class: classes, href, title: title || null, target: external ? '_blank' : null, rel: external ? 'noopener noreferrer' : null, text: label });
  }
  if (!onToggle) return el('span', { class: classes, title: title || null, text: label });
  const node = el('button', { class: classes, type: 'button', title: title || null, aria: { pressed: String(Boolean(pressed)) }, text: label });
  node.addEventListener('click', () => {
    const next = node.getAttribute('aria-pressed') !== 'true';
    node.setAttribute('aria-pressed', String(next));
    onToggle(next);
  });
  node.setValue = (v) => node.setAttribute('aria-pressed', String(Boolean(v)));
  node.getValue = () => node.getAttribute('aria-pressed') === 'true';
  return node;
}
