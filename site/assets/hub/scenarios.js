// "My saved scenarios": open, copy link, QR code, add to a playlist, delete.
// A saved scenario is { id, interactiveId, title, params, createdAt }; its link is the page path plus genericQuery(params).
import { listScenarios, deleteScenario } from '../auth.js';
import { withQuery } from '../state.js';
import { el, clear, button, qrModal, copyText, toast } from '../ui/index.js';
import { workPanel, emptyState, confirmDialog, interactiveLink, absoluteUrl, shortDate } from './common.js';

const SHARE_NOTE = 'The link opens this exact scenario. The embed code works in Google Classroom, Canvas and OneNote without signing in.';

/** @param {{ index: { get(id): object|null }, compact: boolean, addToPlaylist: (item, label) => void }} ctx */
export function scenariosPanel(ctx) {
  const panel = workPanel({ title: 'My saved scenarios', collapsed: ctx.compact, className: 'hub-panel--scenarios' });
  let list = [];

  async function reload() {
    try {
      list = await listScenarios();
      render();
    } catch (err) {
      clear(panel.body).append(el('p', { class: 'msg msg--error', text: err.message }));
    }
    return list;
  }

  function render() {
    clear(panel.body);
    panel.setCount(list.length);
    if (!list.length) {
      panel.body.append(
        emptyState(
          'Nothing saved yet.',
          'Set up an interactive for your lesson and press Save scenario in its toolbar. It waits here with a link and a QR code for your class.',
        ),
      );
      return;
    }
    panel.body.append(el('ul', { class: 'hub-list', role: 'list' }, list.map(row)));
  }

  function row(s) {
    const entry = ctx.index.get(s.interactiveId);
    const href = entry ? interactiveLink(entry, s.params) : null;
    const actions = [];
    if (href) {
      const open = button({ label: 'Open', icon: 'arrowRight', href });
      open.setAttribute('aria-label', `Open ${s.title}`);
      actions.push(
        open,
        button({ label: `Copy link to ${s.title}`, icon: 'copy', iconOnly: true, onClick: () => copy(href) }),
        button({ label: `QR code for ${s.title}`, icon: 'qr', iconOnly: true, onClick: () => share(href) }),
        button({ label: `Add ${s.title} to a playlist`, icon: 'plus', iconOnly: true, onClick: () => ctx.addToPlaylist({ interactiveId: s.interactiveId, params: s.params }, s.title) }),
      );
    }
    actions.push(button({ label: `Delete ${s.title}`, icon: 'trash', iconOnly: true, onClick: () => remove(s) }));
    return el(
      'li',
      { class: 'hub-item', data: { id: s.id } },
      el('p', { class: 'hub-item__title', text: s.title }),
      el('p', { class: 'hub-item__meta', text: [entry ? entry.title : 'No longer on the hub', shortDate(s.createdAt)].filter(Boolean).join(' · ') }),
      el('div', { class: 'hub-item__actions' }, actions),
    );
  }

  async function copy(href) {
    const ok = await copyText(absoluteUrl(href));
    toast(ok ? 'Link copied. It opens this exact scenario.' : 'Copying is blocked here. Open the QR code to copy the link.', { kind: ok ? 'ok' : 'info' });
  }

  function share(href) {
    const url = absoluteUrl(href);
    qrModal({ title: 'Share this scenario', url, embedUrl: withQuery(url, 'embed=1'), note: SHARE_NOTE });
  }

  function remove(s) {
    confirmDialog({
      title: 'Delete this scenario?',
      message: `“${s.title}” will be removed from your dashboard. Links you have already shared keep working, because each link carries its own settings.`,
      confirmLabel: 'Delete scenario',
      onConfirm: async () => {
        await deleteScenario(s.id);
        await reload();
        toast('Scenario deleted.', { kind: 'ok' });
      },
      onDone: () => (panel.body.querySelector('.hub-item .btn') ?? panel.toggle).focus(),
    });
  }

  return {
    el: panel,
    reload,
    get list() {
      return list;
    },
  };
}
