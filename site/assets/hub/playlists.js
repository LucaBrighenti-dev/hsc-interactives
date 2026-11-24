// "My playlists": a run of interactives for one lesson. Create, add steps (from a card, a saved scenario or
// the picker), reorder with up and down buttons, add notes, open in sequence (?playlist=<id>&i=<n>; the
// shell shows Previous and Next), delete. A playlist is { id, title, items: [{ interactiveId, params?, note? }], createdAt }.
import { listPlaylists, savePlaylist, deletePlaylist } from '../auth.js';
import { SUBJECTS } from '../config.js';
import { el, clear, icon, nextId, button, textField, modal, toast } from '../ui/index.js';
import { workPanel, emptyState, confirmDialog, playlistStepLink, plural, stepNumber, shortDate } from './common.js';

const MAX_STEPS = 50; // auth.js keeps the first 50

/**
 * @param {{ index: { get(id): object|null }, compact: boolean, liveEntries: () => object[],
 *   scenarios: () => object[] }} ctx
 */
export function playlistsPanel(ctx) {
  const newBtn = button({ label: 'New playlist', icon: 'plus', variant: 'ghost', onClick: () => createPlaylist() });
  newBtn.classList.add('hub-panel__action');
  const panel = workPanel({ title: 'My playlists', actions: [newBtn], collapsed: ctx.compact, className: 'hub-panel--playlists' });
  let list = [];

  const titleOf = (item) => ctx.index.get(item.interactiveId)?.title ?? 'No longer on the hub';
  const firstLink = (p) => {
    const entry = p.items[0] && ctx.index.get(p.items[0].interactiveId);
    return entry ? playlistStepLink(entry, p.items[0], p.id, 0) : null;
  };

  async function reload() {
    try {
      list = await listPlaylists();
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
          'No playlists yet.',
          'A playlist strings interactives together for one lesson. Open it in sequence and step through with Next and Previous at the top of each page.',
          [button({ label: 'Make your first playlist', icon: 'plus', onClick: () => createPlaylist() })],
        ),
      );
      return;
    }
    panel.body.append(el('ul', { class: 'hub-list', role: 'list' }, list.map(row)));
  }

  function row(p) {
    const first = firstLink(p);
    const steps = p.items;
    const preview = steps.length
      ? el(
          'ol',
          { class: 'hub-preview', role: 'list' },
          steps.slice(0, 4).map((it, i) =>
            el('li', {}, el('span', { class: 'hub-preview__n', text: stepNumber(i) }), el('span', { class: 'hub-preview__title', text: titleOf(it) }), it.note ? el('span', { class: 'hub-preview__note', text: it.note }) : null),
          ),
          steps.length > 4 ? el('li', { class: 'hub-preview__more', text: `and ${plural(steps.length - 4, 'more step')}` }) : null,
        )
      : el('p', { class: 'hub-item__hint', text: 'No steps yet. Use Edit, or the + on any live card.' });
    const play = first ? button({ label: 'Open in sequence', icon: 'play', variant: 'primary', href: first }) : null;
    play?.setAttribute('aria-label', `Open in sequence: ${p.title}`);
    const edit = button({ label: 'Edit', icon: 'notes', onClick: () => openEditor(p) });
    edit.setAttribute('aria-label', `Edit playlist: ${p.title}`);
    edit.dataset.act = 'edit';
    return el(
      'li',
      { class: 'hub-item', data: { id: p.id } },
      el('p', { class: 'hub-item__title', text: p.title }),
      el('p', { class: 'hub-item__meta', text: [plural(steps.length, 'step'), shortDate(p.createdAt)].filter(Boolean).join(' · ') }),
      preview,
      el('div', { class: 'hub-item__actions' }, play, edit, button({ label: `Delete playlist: ${p.title}`, icon: 'trash', iconOnly: true, onClick: () => remove(p) })),
    );
  }

  // ---- New playlist ----
  /** Name a new playlist, optionally with a first step, then open the editor. */
  function createPlaylist(firstItem = null) {
    const name = textField({ label: 'Playlist name', placeholder: 'e.g. Year 12 projectiles, lesson 3', maxLength: 120 });
    const error = el('p', { class: 'msg msg--error', role: 'alert' });
    const create = button({
      label: 'Create playlist',
      icon: 'plus',
      variant: 'primary',
      onClick: async () => {
        const title = name.getValue().trim();
        if (!title) {
          error.textContent = 'Give the playlist a name.';
          name.input.setAttribute('aria-invalid', 'true');
          name.input.focus();
          return;
        }
        create.setBusy(true);
        try {
          const saved = await savePlaylist({ title, items: firstItem ? [firstItem] : [] });
          panel.expand();
          dlg.close();
          await reload();
          openEditor(saved);
        } catch (err) {
          create.setBusy(false);
          error.textContent = err.message;
        }
      },
    });
    name.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        create.click();
      }
    });
    const dlg = modal({
      title: 'New playlist',
      content: el(
        'div',
        { class: 'stack' },
        el('p', { class: 'hub-dialog__text', text: 'A playlist is a run of interactives for one lesson. Next and Previous appear at the top of each page when you open it in sequence.' }),
        name,
        error,
      ),
      actions: [button({ label: 'Cancel', variant: 'ghost', onClick: () => dlg.close() }), create],
    }).open();
    name.input.focus();
  }

  // ---- Editor ----
  function openEditor(playlist) {
    const current = { ...playlist, items: playlist.items.map((it) => ({ ...it })) };
    let chain = Promise.resolve();
    const persist = () => {
      const snapshot = { id: current.id, title: current.title, createdAt: current.createdAt, items: current.items.map((it) => ({ ...it })) };
      chain = chain.then(() => savePlaylist(snapshot)).catch((err) => toast(err.message, { kind: 'error' }));
      return chain;
    };

    const titleField = textField({
      label: 'Playlist name',
      value: current.title,
      maxLength: 120,
      onChange: (v) => {
        const t = v.trim();
        if (!t || t === current.title) return;
        current.title = t;
        persist();
      },
    });
    const steps = el('ol', { class: 'hub-steps', role: 'list', aria: { label: 'Steps' } });

    // Picker: live interactives by subject, then saved scenarios (which keep their settings).
    const pickId = nextId('hub-pick');
    const picker = el('select', { id: pickId, class: 'select' });
    const scenarioById = new Map();
    const liveEntries = ctx.liveEntries();
    picker.append(el('option', { value: '', text: 'Choose an interactive…' }));
    for (const s of SUBJECTS) {
      const items = liveEntries.filter((e) => e.subject === s.id).sort((a, b) => a.title.localeCompare(b.title, 'en-AU'));
      if (items.length) picker.append(el('optgroup', { label: s.label }, items.map((e) => el('option', { value: `entry:${e.id}`, text: e.title }))));
    }
    const saved = ctx.scenarios().filter((s) => ctx.index.get(s.interactiveId));
    for (const s of saved) scenarioById.set(s.id, s);
    if (saved.length) picker.append(el('optgroup', { label: 'My saved scenarios' }, saved.map((s) => el('option', { value: `scenario:${s.id}`, text: s.title }))));
    const canPick = liveEntries.length + saved.length > 0;
    const addBtn = button({ label: 'Add step', icon: 'plus', onClick: () => addPicked() });
    const pickerBlock = canPick
      ? el(
          'div',
          { class: 'hub-picker' },
          el('label', { class: 'field__label', for: pickId, text: 'Add a step' }),
          el('div', { class: 'hub-picker__row' }, picker, addBtn),
        )
      : el('p', { class: 'hub-item__hint', text: 'Nothing is open yet. As interactives go live you can add them here, or with the + on each card.' });

    const openLink = button({ label: 'Open in sequence', icon: 'play', variant: 'primary', href: '#' });
    // Let any save in flight land first, so it cannot write the playlist back after the delete.
    const deleteBtn = button({ label: 'Delete playlist', icon: 'trash', variant: 'ghost', onClick: () => chain.then(() => remove(current, () => dlg.close())) });
    deleteBtn.classList.add('hub-btn--danger-quiet', 'hub-foot-start');
    const done = button({ label: 'Done', variant: 'secondary', onClick: () => dlg.close() });

    function syncOpen() {
      const link = firstLink(current);
      openLink.hidden = !link;
      if (link) openLink.href = link;
    }

    function renderSteps(focus) {
      clear(steps);
      if (!current.items.length) steps.append(el('li', { class: 'hub-steps__empty', text: 'No steps yet. Pick an interactive below to add the first one.' }));
      current.items.forEach((it, i) => steps.append(stepRow(it, i)));
      syncOpen();
      if (focus) {
        const rowEl = steps.children[focus.index];
        const want = rowEl?.querySelector(`[data-act="${focus.act}"]`);
        const target = want && !want.disabled ? want : rowEl?.querySelector('[data-act]:not(:disabled)');
        (target ?? picker).focus();
      }
    }

    function stepRow(it, i) {
      const entry = ctx.index.get(it.interactiveId);
      const title = entry?.title ?? 'No longer on the hub';
      const n = i + 1;
      const subject = SUBJECTS.find((s) => s.id === entry?.subject);
      const meta = [subject?.short, it.params ? 'Saved settings' : null].filter(Boolean).join(' · ');
      const up = button({ label: `Move step ${n} up: ${title}`, icon: 'chevron', iconOnly: true, disabled: i === 0, onClick: () => move(i, -1) });
      const down = button({ label: `Move step ${n} down: ${title}`, icon: 'chevron', iconOnly: true, disabled: i === current.items.length - 1, onClick: () => move(i, 1) });
      const drop = button({ label: `Remove step ${n}: ${title}`, icon: 'close', iconOnly: true, onClick: () => removeAt(i) });
      up.dataset.act = 'up';
      up.classList.add('hub-move-up');
      down.dataset.act = 'down';
      drop.dataset.act = 'remove';
      const note = el('input', { class: 'input hub-step__note', type: 'text', maxlength: '280', placeholder: 'Add a note for this step', autocomplete: 'off', aria: { label: `Note for step ${n}: ${title}` } });
      note.value = it.note ?? '';
      note.addEventListener('change', () => {
        const v = note.value.trim();
        if ((it.note ?? '') === v) return;
        if (v) it.note = v;
        else delete it.note;
        persist();
      });
      note.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          note.dispatchEvent(new Event('change'));
        }
      });
      return el(
        'li',
        { class: 'hub-step' },
        el('span', { class: 'hub-step__n', 'aria-hidden': 'true', text: stepNumber(i) }),
        el(
          'div',
          { class: 'hub-step__main' },
          el(
            'div',
            { class: 'hub-step__head' },
            el('div', { class: 'hub-step__text' }, el('p', { class: 'hub-step__title', text: title }), meta ? el('p', { class: 'hub-step__meta', text: meta }) : null),
            el('div', { class: 'hub-step__moves' }, up, down, drop),
          ),
          note,
        ),
      );
    }

    function move(i, d) {
      const j = i + d;
      if (j < 0 || j >= current.items.length) return;
      [current.items[i], current.items[j]] = [current.items[j], current.items[i]];
      persist();
      renderSteps({ index: j, act: d < 0 ? 'up' : 'down' });
    }

    function removeAt(i) {
      current.items.splice(i, 1);
      persist();
      renderSteps(current.items.length ? { index: Math.min(i, current.items.length - 1), act: 'remove' } : { index: -1 });
    }

    function addPicked() {
      const value = picker.value;
      if (!value) {
        picker.focus();
        toast('Choose an interactive to add.');
        return;
      }
      if (current.items.length >= MAX_STEPS) {
        toast(`A playlist holds up to ${MAX_STEPS} steps.`, { kind: 'error' });
        return;
      }
      const [kind, id] = [value.slice(0, value.indexOf(':')), value.slice(value.indexOf(':') + 1)];
      const s = kind === 'scenario' ? scenarioById.get(id) : null;
      current.items.push(s ? { interactiveId: s.interactiveId, params: s.params } : { interactiveId: id });
      persist();
      renderSteps();
      picker.value = '';
      picker.focus();
    }

    const dlg = modal({
      title: 'Edit playlist',
      content: el(
        'div',
        { class: 'stack hub-editor' },
        titleField,
        el('div', { class: 'hub-editor__steps' }, el('p', { class: 'hub-field__label', text: 'Steps, in order' }), steps),
        pickerBlock,
      ),
      actions: [deleteBtn, done, openLink],
      onClose: () => {
        chain
          .then(() => reload())
          .then(() => {
            // The dialog hands focus back to the Edit button, which the reload has just replaced:
            // put it on this playlist's new Edit button (or the panel heading if it's gone).
            const active = document.activeElement;
            if (active && active !== document.body && active.isConnected) return;
            (panel.body.querySelector(`.hub-item[data-id="${CSS.escape(current.id)}"] [data-act="edit"]`) ?? panel.toggle).focus();
          });
      },
    }).open();
    dlg.el.classList.add('hub-editor-dialog');
    renderSteps();
    // Leaving through "Open in sequence": save first so the shell sees the final order.
    openLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const href = openLink.href;
      await chain;
      location.href = href;
    });
    return dlg;
  }

  // ---- Add to a playlist (from a card or a saved scenario) ----
  /** @param {{ interactiveId: string, params?: object }} item  @param {string} label */
  function addToPlaylist(item, label) {
    const error = el('p', { class: 'msg msg--error', role: 'alert' });
    const addTo = async (p, btn) => {
      if (p.items.length >= MAX_STEPS) {
        error.textContent = `“${p.title}” is full: a playlist holds up to ${MAX_STEPS} steps.`;
        return;
      }
      btn.classList.add('is-busy');
      try {
        await savePlaylist({ ...p, items: [...p.items, item] });
        panel.expand();
        dlg.close();
        await reload();
        toast(`Added to “${p.title}” as step ${p.items.length + 1}.`, { kind: 'ok' });
      } catch (err) {
        btn.classList.remove('is-busy');
        error.textContent = err.message;
      }
    };
    const choices = list.length
      ? el(
          'ul',
          { class: 'hub-choices', role: 'list', aria: { label: 'Your playlists' } },
          list.map((p) => {
            const btn = el('button', { class: 'hub-choice', type: 'button' }, el('span', { class: 'hub-choice__title', text: p.title }), el('span', { class: 'hub-choice__meta', text: plural(p.items.length, 'step') }), icon('plus'));
            btn.addEventListener('click', () => addTo(p, btn));
            return el('li', {}, btn);
          }),
        )
      : null;
    const name = textField({ label: list.length ? 'Or start a new playlist' : 'New playlist name', placeholder: 'e.g. Year 12 projectiles, lesson 3', maxLength: 120 });
    const createBtn = button({
      label: 'Create and add',
      icon: 'plus',
      onClick: async () => {
        const title = name.getValue().trim();
        if (!title) {
          error.textContent = 'Give the new playlist a name.';
          name.input.focus();
          return;
        }
        createBtn.setBusy(true);
        try {
          await savePlaylist({ title, items: [item] });
          panel.expand();
          dlg.close();
          await reload();
          toast(`Started “${title}” with ${label}.`, { kind: 'ok' });
        } catch (err) {
          createBtn.setBusy(false);
          error.textContent = err.message;
        }
      },
    });
    name.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        createBtn.click();
      }
    });
    const dlg = modal({
      title: 'Add to a playlist',
      content: el(
        'div',
        { class: 'stack' },
        el('p', { class: 'hub-dialog__text', text: `“${label}” goes in as the last step.` }),
        choices,
        el('div', { class: 'hub-new-row' }, name, createBtn),
        error,
      ),
    }).open();
    (choices?.querySelector('button') ?? name.input).focus();
  }

  function remove(p, after) {
    confirmDialog({
      title: 'Delete this playlist?',
      message: `“${p.title}” and its notes will be removed. The interactives themselves stay on the hub.`,
      confirmLabel: 'Delete playlist',
      onConfirm: async () => {
        await deletePlaylist(p.id);
        after?.();
        await reload();
        toast('Playlist deleted.', { kind: 'ok' });
      },
      onDone: () => (panel.body.querySelector('.hub-item .btn') ?? newBtn).focus(),
    });
  }

  return {
    el: panel,
    reload,
    addToPlaylist,
    createPlaylist,
    get list() {
      return list;
    },
  };
}
