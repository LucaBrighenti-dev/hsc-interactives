// Overlays: modal, drawer (both native <dialog>, so focus is trapped and Esc closes),
// toast (polite live region) and the QR share modal. Never use alert/confirm/prompt.
import { el, nextId } from './dom.js';
import { icon } from './icons.js';
import { button } from './controls.js';

function dialogShell({ kind, title, content, actions = [], onClose, transient }) {
  const titleId = nextId(kind);
  const body = el('div', { class: `${kind}__body` });
  if (content) body.append(content);
  const closeBtn = button({ label: 'Close', icon: 'close', iconOnly: true, variant: 'ghost', shortcut: 'Esc' });
  const dialog = el(
    'dialog',
    { class: kind, aria: { labelledby: titleId } },
    el('div', { class: `${kind}__head` }, el('h2', { id: titleId, class: `${kind}__title`, text: title }), closeBtn),
    body,
    actions.length ? el('div', { class: 'modal__foot' }, actions) : null,
  );
  closeBtn.addEventListener('click', () => dialog.close());
  // A click on the dialog element itself is a click on the backdrop.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    onClose?.();
    if (transient) dialog.remove();
  });
  const api = {
    el: dialog,
    body,
    titleEl: dialog.querySelector(`#${titleId}`),
    open() {
      if (!dialog.isConnected) document.body.append(dialog);
      if (!dialog.open) dialog.showModal();
      return api;
    },
    close() {
      if (dialog.open) dialog.close();
    },
    isOpen: () => dialog.open,
    setTitle(text) {
      api.titleEl.textContent = text;
    },
  };
  return api;
}

/**
 * Centred modal. Transient modals remove themselves from the DOM when closed.
 * @param {{ title: string, content?: Node, actions?: Node[], onClose?: Function, transient?: boolean }} opts
 */
export function modal({ title, content, actions, onClose, transient = true }) {
  return dialogShell({ kind: 'modal', title, content, actions, onClose, transient });
}

/** Right slide-over drawer (teacher notes). Reusable: not removed on close. */
export function drawer({ title, content, onClose }) {
  return dialogShell({ kind: 'drawer', title, content, onClose, transient: false });
}

let region = null;
/**
 * Quiet notification at the bottom of the screen.
 * @param {string} message
 * @param {{ kind?: 'info'|'ok'|'error', timeout?: number }} [opts]
 */
export function toast(message, { kind = 'info', timeout = 4000 } = {}) {
  if (!region || !region.isConnected) {
    region = el('div', { class: 'toast-region', role: 'status', aria: { live: 'polite' } });
    document.body.append(region);
  }
  const node = el('div', { class: ['toast', kind !== 'info' && `toast--${kind}`] }, el('span', { text: message }));
  region.append(node);
  setTimeout(() => {
    node.classList.add('is-leaving');
    setTimeout(() => node.remove(), 250);
  }, timeout);
  return node;
}

/** Copy text to the clipboard; returns true on success. */
export async function copyText(text, fallbackInput) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    if (fallbackInput) {
      fallbackInput.focus();
      fallbackInput.select();
    }
    return false;
  }
}

let qrLib = null;
async function qrSvg(text) {
  qrLib ??= (await import('/vendor/qrcode.mjs')).default;
  const qr = qrLib(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true, title: { text: 'QR code for this link', id: nextId('qr-title') } });
}

function copyRow(label, value) {
  const id = nextId('copy');
  const input = el('input', { id, class: 'input', readonly: true, value });
  const btn = button({
    label: 'Copy',
    icon: 'copy',
    onClick: async () => {
      const ok = await copyText(value, input);
      toast(ok ? `${label} copied` : 'Press Ctrl+C to copy', { kind: ok ? 'ok' : 'info' });
    },
  });
  return el('div', { class: 'field' }, el('label', { class: 'field__label', for: id, text: label }), el('div', { class: 'qr__row' }, input, btn));
}

/**
 * Share modal: QR code (dark on white for scanning), copy link, and an optional embed snippet.
 * @param {{ title?: string, url: string, embedUrl?: string, note?: string }} opts
 */
export async function qrModal({ title = 'Share this scenario', url, embedUrl, note }) {
  const code = el('div', { class: 'qr__code' });
  code.innerHTML = await qrSvg(url); // generated SVG markup from the vendored library
  code.dataset.url = url;
  const enlarge = button({
    label: 'Enlarge for the room',
    icon: 'fullscreen',
    size: 'sm',
    onClick: async () => {
      const big = el('div', { class: 'qr__code', style: { width: 'min(80dvh, 86vw)' } });
      big.innerHTML = await qrSvg(url);
      modal({ title: 'Scan to open', content: el('div', { class: 'qr' }, big) }).open().el.style.width = 'auto';
    },
  });
  const content = el(
    'div',
    { class: 'qr' },
    code,
    enlarge,
    el('div', { class: 'stack', style: { width: '100%' } }, copyRow('Link', url), embedUrl ? copyRow('Embed code', `<iframe src="${embedUrl}" width="100%" height="720" style="border:0" allow="fullscreen" title="${title.replace(/"/g, '&quot;')}"></iframe>`) : null),
    note ? el('p', { class: 'muted', style: { fontSize: '14px' }, text: note }) : null,
  );
  return modal({ title, content }).open();
}
