// The catalogue: filter bar (subjects, search, syllabus, focus area, status), result bar and the card grid.
// Filter state lives in the URL (filters.js), so a filtered view can be shared.
import { SUBJECTS } from '../config.js';
import { el, clear, icon, button, chip, segmented } from '../ui/index.js';
import { placeholderSvg } from './placeholder.js';
import { emptyState, plural } from './common.js';
import {
  STATUSES,
  arrange,
  filtersToQuery,
  focusOptions,
  hasNarrowing,
  matches,
  searchWords,
  subjectOf,
  tagLine,
  versionOptions,
} from './filters.js';

/**
 * @param {{ filtersEl: HTMLElement, resultsEl: HTMLElement, gridEl: HTMLElement, entries: object[],
 *   filters: object, profileSubjects: () => string[], onSubjectsChange: (ids: string[]) => void, onAddToPlaylist: (entry) => void,
 *   onRequest: (draft: { topic?: string, subject?: string }) => void }} opts
 */
export function mountCatalog({ filtersEl, resultsEl, gridEl, entries, filters, profileSubjects = () => [], onSubjectsChange, onAddToPlaylist, onRequest }) {
  const f = { ...filters };
  const total = entries.length;

  // ---- Subject chips ("My subjects": from the profile; a change saves the profile) ----
  const subjectsLabelId = 'hub-subjects-label';
  const allChip = chip({ label: 'All subjects', pressed: !f.subjects.length, onToggle: () => setSubjects([], true) });
  const subjectChips = new Map(
    SUBJECTS.map((s) => [
      s.id,
      chip({
        label: s.short,
        title: s.label,
        pressed: f.subjects.includes(s.id),
        onToggle: (on) => setSubjects(on ? [...f.subjects, s.id] : f.subjects.filter((x) => x !== s.id), true),
      }),
    ]),
  );
  const savedNote = el('span', { class: 'hub-saved', role: 'status' });
  const subjectsRow = el(
    'div',
    { class: 'hub-filters__subjects' },
    el('span', { class: 'hub-field__label', id: subjectsLabelId, text: 'My subjects' }),
    el('div', { class: 'hub-subjects', role: 'group', aria: { labelledby: subjectsLabelId } }, allChip, [...subjectChips.values()]),
    savedNote,
  );

  // ---- Search and selects ----
  const search = el('input', {
    id: 'hub-search',
    class: 'input hub-search__input',
    type: 'search',
    placeholder: 'Try orbit, complex, truss',
    autocomplete: 'off',
    spellcheck: 'false',
    maxlength: '100',
    aria: { label: 'Search interactives' },
  });
  search.value = f.q;
  search.addEventListener('input', () => {
    f.q = search.value;
    render();
  });
  const searchField = el(
    'div',
    { class: 'hub-field hub-field--search' },
    el('label', { class: 'hub-field__label', for: 'hub-search', text: 'Search' }),
    el('div', { class: 'hub-search' }, icon('search'), search),
  );

  const selectField = (id, label, onChange) => {
    const sel = el('select', { id, class: 'select', on: { change: () => onChange(sel.value) } });
    return { sel, wrap: el('div', { class: 'hub-field' }, el('label', { class: 'hub-field__label', for: id, text: label }), sel) };
  };
  const syllabus = selectField('hub-syllabus', 'Syllabus', (v) => {
    f.syllabus = v;
    render();
  });
  const focus = selectField('hub-focus', 'Focus area', (v) => {
    f.focus = v;
    render();
  });
  const status = selectField('hub-status', 'Status', (v) => {
    f.status = v;
    render();
  });
  for (const [v, label] of STATUSES) status.sel.append(el('option', { value: v, text: label }));

  const moreCount = el('span', { class: 'hub-more__count' });
  const moreBtn = el(
    'button',
    { class: 'btn hub-more', type: 'button', aria: { expanded: 'false', controls: 'hub-advanced' } },
    el('span', { text: 'More filters' }),
    moreCount,
    icon('chevron'),
  );
  const advanced = el('div', { class: 'hub-filters__advanced', id: 'hub-advanced' }, syllabus.wrap, focus.wrap, status.wrap);
  const setMoreOpen = (open) => {
    advanced.classList.toggle('is-open', open);
    moreBtn.setAttribute('aria-expanded', String(open));
  };
  moreBtn.addEventListener('click', () => setMoreOpen(!advanced.classList.contains('is-open')));
  setMoreOpen(Boolean(f.syllabus || f.focus || f.status));

  // DOM order is the phone order (search, subjects, more filters); desktop places them with grid areas.
  clear(filtersEl).append(searchField, subjectsRow, moreBtn, advanced);

  // ---- Result bar: count, clear, arrangement ----
  const count = el('p', { class: 'hub-count', aria: { live: 'polite' } });
  const clearBtn = button({ label: 'Clear filters', icon: 'close', variant: 'ghost', onClick: () => clearFilters() });
  const arrangeCtl = segmented({
    label: 'Arrange',
    options: [
      ['subject', 'By subject'],
      ['az', 'A–Z'],
    ],
    value: f.view,
    onChange: (v) => {
      f.view = v;
      render();
    },
  });
  arrangeCtl.classList.add('hub-arrange');
  clear(resultsEl).append(el('div', { class: 'hub-results__left' }, count, clearBtn), arrangeCtl);

  // ---- Cards (built once per entry and reused) ----
  const cards = new Map();
  const cardFor = (entry) => {
    if (!cards.has(entry.id)) cards.set(entry.id, buildCard(entry, onAddToPlaylist));
    return cards.get(entry.id);
  };

  function fillSelect(sel, first, groups, value) {
    clear(sel);
    sel.append(el('option', { value: '', text: first }));
    for (const g of groups) {
      if (g.group) sel.append(el('optgroup', { label: g.group }, g.names.map((n) => el('option', { value: n, text: n }))));
      else for (const [v, text] of g.options) sel.append(el('option', { value: v, text }));
    }
    sel.value = value;
  }

  function syncControls() {
    if (search.value !== f.q) search.value = f.q;
    allChip.setValue(!f.subjects.length);
    for (const [id, c] of subjectChips) c.setValue(f.subjects.includes(id));
    fillSelect(syllabus.sel, 'All syllabuses', [{ options: versionOptions(entries, f) }], f.syllabus);
    fillSelect(focus.sel, 'All focus areas', focusOptions(entries, f), f.focus);
    status.sel.value = f.status;
    arrangeCtl.setValue(f.view);
    const n = [f.syllabus, f.focus, f.status].filter(Boolean).length;
    moreCount.textContent = n ? `· ${n}` : '';
  }

  function syncUrl() {
    const query = filtersToQuery(f, profileSubjects());
    const url = `${location.pathname}${query ? `?${query}` : ''}${location.hash}`;
    if (url !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(history.state, '', url);
  }

  function render() {
    syncControls();
    const words = searchWords(f.q);
    const shown = entries.filter((e) => matches(e, f, words));
    clear(gridEl);
    for (const section of arrange(shown, f.view)) {
      const live = section.entries.filter((e) => e.status === 'live').length;
      const headId = `hub-section-${section.key}`;
      gridEl.append(
        el(
          'section',
          { class: 'hub-section', aria: { labelledby: headId } },
          el(
            'div',
            { class: 'hub-section__head' },
            el('h2', { class: 'hub-section__title', id: headId, text: section.title }),
            el('span', { class: 'hub-section__count', text: live && section.key !== 'live' ? `${section.entries.length} · ${live} live` : String(section.entries.length) }),
          ),
          el('div', { class: 'hub-grid' }, section.entries.map((e) => cardFor(e))),
        ),
      );
    }
    if (!shown.length) gridEl.append(emptyGrid());
    const narrowed = hasNarrowing(f) || f.subjects.length;
    count.textContent = narrowed ? `${shown.length} of ${plural(total, 'interactive')}` : plural(total, 'interactive');
    clearBtn.hidden = !hasNarrowing(f);
    syncUrl();
  }

  function emptyGrid() {
    const q = f.q.trim();
    const actions = [];
    if (hasNarrowing(f)) actions.push(button({ label: 'Clear filters', icon: 'close', onClick: () => clearFilters() }));
    // Widening the view after a search that found nothing is temporary: the profile's subjects stay as they are.
    if (f.subjects.length) {
      actions.push(
        button({
          label: 'Show all subjects',
          variant: 'ghost',
          onClick: () => {
            setSubjects([], false);
            allChip.focus();
          },
        }),
      );
    }
    actions.push(button({ label: q ? `Request “${q.length > 40 ? `${q.slice(0, 40)}…` : q}”` : 'Request an interactive', icon: 'plus', variant: 'ghost', onClick: () => onRequest({ topic: q, subject: f.subjects[0] }) }));
    return emptyState('Nothing matches that yet.', 'Try a different word or widen the filters. If it isn’t on the map, ask for it: the most-voted requests shape what gets built next.', actions);
  }

  function clearFilters() {
    Object.assign(f, { q: '', syllabus: '', focus: '', status: '' });
    render();
    search.focus();
  }

  let savedTimer = 0;
  /** `fromUser`: a chip was pressed, so the choice is saved to the profile (before the URL is written). */
  function setSubjects(ids, fromUser) {
    f.subjects = SUBJECTS.map((s) => s.id).filter((id) => ids.includes(id));
    if (fromUser) onSubjectsChange(f.subjects);
    render();
    if (fromUser) {
      savedNote.textContent = 'Saved to your profile';
      clearTimeout(savedTimer);
      savedTimer = setTimeout(() => {
        savedNote.textContent = '';
      }, 2500);
    }
  }

  render();
  return {
    setSubjects: (ids) => setSubjects(ids, false),
    get filters() {
      return { ...f };
    },
  };
}

function buildCard(entry, onAddToPlaylist) {
  const isLive = entry.status === 'live';
  const subject = subjectOf(entry);
  const thumb = el('div', { class: 'hub-card__thumb', 'aria-hidden': 'true' });
  if (isLive && entry.thumbnail) {
    const img = el('img', { src: entry.thumbnail, alt: '', loading: 'lazy', decoding: 'async', width: '640', height: '360' });
    img.addEventListener('error', () => img.replaceWith(placeholderSvg(entry.id, entry.engine)), { once: true });
    thumb.append(img);
  } else thumb.append(placeholderSvg(entry.id, entry.engine));
  const badge = el('span', { class: ['chip', 'hub-card__badge', isLive && 'chip--live'], text: isLive ? 'Live' : 'Coming soon' });
  const body = el(
    'div',
    { class: 'hub-card__body' },
    el('p', { class: 'hub-card__subject', text: subject?.label ?? '' }),
    el('h3', { class: 'hub-card__title' }, isLive ? el('a', { class: 'hub-card__link', href: entry.path, text: entry.title }) : entry.title),
    el('p', { class: 'hub-card__summary', text: entry.summary }),
    el('p', { class: 'hub-card__tags', text: tagLine(entry) }),
    isLive ? el('p', { class: 'hub-card__open', 'aria-hidden': 'true' }, el('span', { text: 'Open' }), icon('arrowRight')) : null,
  );
  let add = null;
  if (isLive) {
    add = button({ label: `Add ${entry.title} to a playlist`, icon: 'plus', iconOnly: true, onClick: () => onAddToPlaylist(entry) });
    add.classList.add('hub-card__add');
  }
  return el(
    'article',
    { class: ['hub-card', isLive ? 'is-live' : 'is-soon'], data: { id: entry.id }, aria: isLive ? null : { label: `${entry.title}, coming soon` } },
    thumb,
    badge,
    body,
    add,
  );
}
