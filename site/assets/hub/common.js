// Small dashboard helpers: links to interactives, collapsible work panels, confirm dialogs and dates.
import { genericQuery, withQuery } from '../state.js';
import { el, icon, nextId, button, modal, toast } from '../ui/index.js';

// Pages that work but have no catalog entry (the reference template). Saved scenarios on them still open.
const EXTRA = {
  _template: { id: '_template', title: 'Reference template', path: '/interactives/_template.html', status: 'live', subject: null, kind: 'page' },
};

/** Look up an interactive by id: the catalog first, then the pages above. */
export function makeIndex(entries) {
  const byId = new Map(entries.map((e) => [e.id, e]));
  return { entries, get: (id) => byId.get(id) ?? EXTRA[id] ?? null };
}

/** Link to an interactive with saved params (a saved scenario or a playlist step). */
export function interactiveLink(entry, params, extra) {
  return withQuery(entry.path, genericQuery(params ?? {}, extra ? { extra } : undefined));
}

/** Link to step i of a playlist: the shell shows Previous and Next from ?playlist=<id>&i=<n>. */
export function playlistStepLink(entry, item, playlistId, i) {
  return interactiveLink(entry, item.params, { playlist: playlistId, i });
}

export function absoluteUrl(path) {
  return new URL(path, location.origin).toString();
}

const thisYear = new Date().getFullYear();
export function shortDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', ...(d.getFullYear() !== thisYear ? { year: 'numeric' } : {}) });
}

export function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Two-digit step number: 01, 02, ... */
export function stepNumber(i) {
  return String(i + 1).padStart(2, '0');
}

/**
 * A framed work panel whose heading is a disclosure button (collapsible on every screen size),
 * with optional actions on the right of the head.
 * @param {{ title: string, actions?: Node[], collapsed?: boolean, className?: string }} opts
 */
export function workPanel({ title, actions = [], collapsed = false, className }) {
  const bodyId = nextId('hub-panel');
  const count = el('span', { class: 'hub-panel__count' });
  const toggleBtn = el(
    'button',
    { class: 'hub-panel__toggle', type: 'button', aria: { expanded: String(!collapsed), controls: bodyId } },
    icon('chevron'),
    el('span', { class: 'panel__title', text: title }),
    count,
  );
  const head = el('div', { class: 'panel__head hub-panel__head' }, el('h2', { class: 'hub-panel__heading' }, toggleBtn), actions.length ? el('div', { class: 'hub-panel__actions' }, actions) : null);
  const body = el('div', { id: bodyId, class: 'panel__body hub-panel__body' });
  const root = el('section', { class: ['panel', 'hub-panel', className], aria: { label: title } }, head, body);
  root.body = body;
  root.toggle = toggleBtn;
  root.setCount = (n) => {
    count.textContent = n ? String(n) : '';
  };
  root.setCollapsed = (v) => {
    body.hidden = v;
    root.classList.toggle('is-collapsed', v);
    toggleBtn.setAttribute('aria-expanded', String(!v));
  };
  root.expand = () => root.setCollapsed(false);
  toggleBtn.addEventListener('click', () => root.setCollapsed(!body.hidden));
  root.setCollapsed(collapsed);
  return root;
}

/** A friendly empty state: a short line, an optional detail and optional actions. */
export function emptyState(title, detail, actions = []) {
  return el(
    'div',
    { class: 'hub-empty-state' },
    el('p', { class: 'hub-empty-state__title', text: title }),
    detail ? el('p', { class: 'hub-empty-state__detail', text: detail }) : null,
    actions.length ? el('div', { class: 'cluster' }, actions) : null,
  );
}

/**
 * Confirm a destructive action in a modal (never window.confirm). `onConfirm` may be async; the
 * dialog stays open with a busy button until it settles, and shows its error message if it throws.
 * `onDone` runs after the dialog has closed (a good place to move focus).
 * @param {{ title: string, message: string | Node, confirmLabel: string, cancelLabel?: string,
 *   onConfirm: () => any, onDone?: () => void }} opts
 */
export function confirmDialog({ title, message, confirmLabel, cancelLabel = 'Cancel', onConfirm, onDone }) {
  const error = el('p', { class: 'msg msg--error', role: 'alert' });
  const yes = button({
    label: confirmLabel,
    icon: 'trash',
    onClick: async () => {
      yes.setBusy(true);
      error.textContent = '';
      try {
        await onConfirm();
        dlg.close();
        onDone?.();
      } catch (err) {
        yes.setBusy(false);
        error.textContent = err?.message || 'That did not work. Please try again.';
      }
    },
  });
  yes.classList.add('hub-btn--danger');
  const no = button({ label: cancelLabel, variant: 'ghost', onClick: () => dlg.close() });
  const content = el('div', { class: 'stack' }, typeof message === 'string' ? el('p', { class: 'hub-dialog__text', text: message }) : message, error);
  const dlg = modal({ title, content, actions: [no, yes] }).open();
  no.focus();
  return dlg;
}

/** Run an action, toasting its error message instead of throwing. Returns the result or undefined. */
export async function attempt(fn) {
  try {
    return await fn();
  } catch (err) {
    toast(err?.message || 'That did not work. Please try again.', { kind: 'error' });
    return undefined;
  }
}
