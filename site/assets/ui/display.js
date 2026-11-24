// Display components: readout and panel.
import { el, nextId } from './dom.js';
import { icon } from './icons.js';
import { formatNumber } from '../format.js';

/**
 * Large mono readout with label and unit. update(value) formats to significant figures.
 * @param {{ label: string, unit?: string, sigfigs?: number, format?: (v:any)=>(string | { number: string, unit: string }) }} opts
 * A format may return { number, unit } to change the unit with the value (SI prefixes).
 */
export function readout({ label, unit = '', sigfigs = 3, format }) {
  const number = el('span', { class: 'readout__number', text: '—' });
  const unitEl = el('span', { class: 'readout__unit', text: unit, hidden: !unit });
  const root = el(
    'div',
    { class: 'readout' },
    el('span', { class: 'readout__label', text: label, title: label }),
    el('span', { class: 'readout__value' }, number, unitEl),
  );
  root.update = (value) => {
    let text = value === null || value === undefined ? '—' : format ? format(value) : typeof value === 'number' ? formatNumber(value, { sigfigs }) : String(value);
    if (text && typeof text === 'object') {
      if (unitEl.textContent !== text.unit) unitEl.textContent = text.unit;
      unitEl.hidden = !text.unit;
      text = text.number;
    }
    if (number.textContent !== text) number.textContent = text;
    // Long values (scientific notation) shrink so they never spill into the next readout.
    root.classList.toggle('is-long', text.length > 9 && text.length <= 13);
    root.classList.toggle('is-xlong', text.length > 13);
    root.dataset.value = typeof value === 'number' ? String(value) : '';
    return text;
  };
  root.text = () => `${label} ${number.textContent}${unitEl.textContent ? ` ${unitEl.textContent}` : ''}`;
  return root;
}

/**
 * Framed panel with a mono title. Collapsible panels use a disclosure button.
 * @param {{ title: string, collapsible?: boolean, collapsed?: boolean, actions?: Node[], className?: string }} opts
 * @returns {HTMLElement & { body: HTMLElement, setCollapsed(v:boolean):void }}
 */
export function panel({ title, collapsible = false, collapsed = false, actions = [], className }) {
  const bodyId = nextId('panel');
  const body = el('div', { id: bodyId, class: 'panel__body' });
  let head;
  let toggleBtn = null;
  if (collapsible) {
    toggleBtn = el(
      'button',
      { class: 'panel__toggle', type: 'button', aria: { expanded: String(!collapsed), controls: bodyId } },
      el('span', { class: 'panel__title', text: title }),
      icon('chevron'),
    );
    head = el('div', { class: 'panel__head', style: { padding: '0' } }, toggleBtn);
  } else {
    head = el('div', { class: 'panel__head' }, el('h2', { class: 'panel__title', text: title }), actions.length ? el('div', { class: 'cluster' }, actions) : null);
  }
  const root = el('section', { class: ['panel', className], aria: { label: title } }, head, body);
  root.body = body;
  root.setCollapsed = (v) => {
    body.hidden = v;
    root.classList.toggle('is-collapsed', v);
    toggleBtn?.setAttribute('aria-expanded', String(!v));
  };
  toggleBtn?.addEventListener('click', () => root.setCollapsed(!body.hidden));
  root.setCollapsed(collapsible && collapsed);
  return root;
}
