// Requests: what should be built next. A list sorted by votes, a vote toggle, and a "Request an interactive"
// form (subject, topic, details). Everyone signed in sees requests and vote counts, never who asked.
import { listRequests, createRequest, toggleVote } from '../auth.js';
import { SUBJECTS } from '../config.js';
import { el, clear, icon, nextId, button, textField, modal, toast } from '../ui/index.js';
import { workPanel, emptyState, plural, attempt } from './common.js';

const TOP = 5;

/** @param {{ compact: boolean, defaultSubject: () => string|undefined }} ctx */
export function requestsPanel(ctx) {
  const panel = workPanel({ title: 'Requests', collapsed: ctx.compact, className: 'hub-panel--requests' });
  let list = [];
  let showAll = false;
  const busy = new Set();

  async function reload(focusId) {
    try {
      list = await listRequests();
      render(focusId);
    } catch (err) {
      clear(panel.body).append(el('p', { class: 'msg msg--error', text: err.message }));
    }
    return list;
  }

  function render(focusId) {
    clear(panel.body);
    panel.setCount(list.length);
    panel.body.append(
      el('p', { class: 'hub-panel__intro', text: 'Which topic do your students find hardest to picture? Ask for it, and vote for the ideas you want next.' }),
      button({ label: 'Request an interactive', icon: 'plus', block: true, onClick: () => openForm() }),
    );
    if (!list.length) {
      panel.body.append(emptyState('No requests yet.', 'Be the first. The most-voted ideas shape what gets built next.'));
      return;
    }
    const shown = showAll ? list : list.slice(0, TOP);
    panel.body.append(el('ol', { class: 'hub-requests', role: 'list' }, shown.map(row)));
    if (list.length > TOP) {
      const toggleAll = button({
        label: showAll ? `Show the top ${TOP}` : `Show all ${list.length} requests`,
        variant: 'ghost',
        block: true,
        onClick: () => {
          showAll = !showAll;
          render();
          // The button is rebuilt: keep keyboard focus on it.
          panel.body.querySelector('[data-act="toggle-all"]')?.focus();
        },
      });
      toggleAll.dataset.act = 'toggle-all';
      panel.body.append(toggleAll);
    }
    if (focusId) panel.body.querySelector(`.hub-vote[data-id="${CSS.escape(focusId)}"]`)?.focus();
  }

  function row(r) {
    const subject = SUBJECTS.find((s) => s.id === r.subject);
    const vote = el(
      'button',
      {
        class: 'hub-vote',
        type: 'button',
        title: r.voted ? 'Remove your vote' : 'Vote for this',
        data: { id: r.id },
        aria: { pressed: String(Boolean(r.voted)), label: `Vote for ${r.topic} (${plural(r.votes, 'vote')})` },
      },
      icon('vote'),
      el('span', { class: 'hub-vote__n', text: String(r.votes) }),
    );
    vote.addEventListener('click', async () => {
      if (busy.has(r.id)) return;
      busy.add(r.id);
      vote.setAttribute('aria-busy', 'true');
      await attempt(() => toggleVote(r.id));
      busy.delete(r.id);
      await reload(r.id);
    });
    return el(
      'li',
      { class: 'hub-request', data: { id: r.id } },
      vote,
      el(
        'div',
        { class: 'hub-request__text' },
        el('p', { class: 'hub-request__topic', text: r.topic }),
        el('p', { class: 'hub-request__meta', text: [subject?.short ?? r.subject, r.mine ? 'Your request' : null].filter(Boolean).join(' · ') }),
        r.details ? el('p', { class: 'hub-request__details', text: r.details }) : null,
      ),
    );
  }

  /** The request form. `draft` can prefill the topic (e.g. from a search with no results) and subject. */
  function openForm(draft = {}) {
    const selId = nextId('hub-req-subject');
    const subject = el('select', { id: selId, class: 'select' }, SUBJECTS.map((s) => el('option', { value: s.id, text: s.label })));
    subject.value = draft.subject || ctx.defaultSubject() || 'phy';
    const topic = textField({ label: 'Topic', value: draft.topic ?? '', placeholder: 'e.g. Lenz’s law with a falling magnet', maxLength: 140 });
    const detailsId = nextId('hub-req-details');
    const details = el('textarea', { id: detailsId, class: 'input', rows: '4', maxlength: '1000', placeholder: 'What should students be able to change, and what should they see?' });
    const error = el('p', { class: 'msg msg--error', role: 'alert' });
    const send = button({
      label: 'Send request',
      icon: 'check',
      variant: 'primary',
      onClick: async () => {
        if (!topic.getValue().trim()) {
          error.textContent = 'Describe the topic in a few words.';
          topic.input.setAttribute('aria-invalid', 'true');
          topic.input.focus();
          return;
        }
        topic.input.removeAttribute('aria-invalid');
        send.setBusy(true);
        try {
          const row = await createRequest({ subject: subject.value, topic: topic.getValue(), details: details.value });
          dlg.close();
          showAll = true;
          panel.expand();
          await reload(row.id);
          toast('Request sent, with your vote on it.', { kind: 'ok' });
        } catch (err) {
          send.setBusy(false);
          error.textContent = err.message;
        }
      },
    });
    topic.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        send.click();
      }
    });
    const dlg = modal({
      title: 'Request an interactive',
      content: el(
        'div',
        { class: 'stack' },
        el('p', { class: 'hub-dialog__text', text: 'Which topic do your students find hardest to picture? Describe it in a line; add detail if it helps.' }),
        el('div', { class: 'field' }, el('label', { class: 'field__label', for: selId, text: 'Subject' }), subject),
        topic,
        el('div', { class: 'field' }, el('label', { class: 'field__label', for: detailsId, text: 'Details (optional)' }), details),
        el('p', { class: 'hub-dialog__note', text: 'Everyone signed in can see requests and vote. Your name is never shown.' }),
        error,
      ),
      actions: [button({ label: 'Cancel', variant: 'ghost', onClick: () => dlg.close() }), send],
    }).open();
    topic.input.focus();
  }

  return {
    el: panel,
    reload,
    openForm,
    get list() {
      return list;
    },
  };
}
