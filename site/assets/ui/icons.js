// Inline SVG icons: 24×24, 1.75 px strokes in currentColor, square caps and mitred joins
// to match the sharp-frame design language. Static strings only.
import { svg } from './dom.js';

const PATHS = {
  play: '<path d="M7 4.5v15L19.5 12z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" stroke="none"/>',
  step: '<path d="M5 5v14l10-7z" fill="currentColor" stroke="none"/><path d="M18 5v14"/>',
  reset: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 3.5v4.2h4.2"/>',
  share: '<path d="M12 3.5v11"/><path d="M7.5 8 12 3.5 16.5 8"/><path d="M5 12.5v8h14v-8"/>',
  save: '<path d="M6 3.5h12v17l-6-4.5-6 4.5z"/>',
  download: '<path d="M12 3.5v11"/><path d="M7.5 10 12 14.5 16.5 10"/><path d="M4.5 19.5h15"/>',
  theme: '<rect x="4" y="4" width="16" height="16"/><path d="M12 4v16M12 4h8v16h-8z" fill="currentColor"/>',
  fullscreen: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
  presenter: '<rect x="3.5" y="4.5" width="17" height="11"/><path d="M12 15.5v4M8 19.5h8"/>',
  notes: '<path d="M6 3.5h9l3 3v14H6z"/><path d="M9 10h6M9 13.5h6M9 17h4"/>',
  close: '<path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  keyboard: '<rect x="3" y="6" width="18" height="12"/><path d="M6.5 9.5h1M10 9.5h1M13.5 9.5h1M17 9.5h.5M6.5 13h1M17 13h.5M9.5 15h5"/>',
  copy: '<rect x="8" y="8" width="12" height="12"/><path d="M16 8V4H4v12h4"/>',
  qr: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
  external: '<path d="M13.5 4.5h6v6"/><path d="M19.5 4.5 11 13"/><path d="M17 14v5.5H4.5V7H10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4.5 6.5h15M9.5 6.5v-3h5v3M6.5 6.5l1 13h9l1-13"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  search: '<path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.5 15.5 20 20"/>',
  user: '<path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4.5 20c1-3.5 4-5.5 7.5-5.5s6.5 2 7.5 5.5"/>',
  logout: '<path d="M10 4.5H4.5v15H10"/><path d="M15.5 8 19.5 12l-4 4M19.5 12H9"/>',
  arrowLeft: '<path d="M19 12H5.5M11 6.5 5.5 12l5.5 5.5"/>',
  arrowRight: '<path d="M5 12h13.5M13 6.5l5.5 5.5-5.5 5.5"/>',
  csv: '<path d="M6 3.5h9l3 3v14H6z"/><path d="M9 11h6M9 14.5h6M12 11v7"/>',
  vote: '<path d="M12 5l7 8h-4.5v6h-5v-6H5z"/>',
  info: '<path d="M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 11v5.5M12 7.5v1.2"/>',
};

export function icon(name, { size = 24, label } = {}) {
  const body = PATHS[name];
  if (!body) throw new Error(`Unknown icon: ${name}`);
  const node = svg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter">${body}</svg>`,
  );
  if (label) {
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', label);
  } else {
    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('focusable', 'false');
  }
  return node;
}

export const ICON_NAMES = Object.keys(PATHS);
