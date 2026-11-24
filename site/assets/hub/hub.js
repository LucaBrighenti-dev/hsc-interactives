// Dashboard v0 (W0-11): cards grouped by subject, coming-soon badges, search and subject filter.
// W1-HUB owns this folder and adds saved scenarios, playlists, requests and the full filters (guide §6.5).
import { requireSession, getProfile, signOut } from '../auth.js';
import { SITE_NAME, SITE_CREDIT, SUBJECTS } from '../config.js';
import { el, clear, chip, button } from '../ui/index.js';
import { placeholderSvg } from './placeholder.js';

const session = await requireSession();
const profile = await getProfile().catch(() => null);
const catalog = await fetch('/catalog.json').then((r) => (r.ok ? r.json() : { entries: [] })).catch(() => ({ entries: [] }));

document.title = SITE_NAME;
document.querySelector('[data-site-name]').textContent = SITE_NAME;
document.querySelector('[data-site-credit]').textContent = SITE_CREDIT;

// Header: user menu.
const userArea = document.querySelector('[data-user]');
const name = profile?.displayName || session?.user.name || '';
userArea.append(
  session?.founding ? el('span', { class: 'badge-founding', text: 'Founding Educator' }) : null,
  name ? el('span', { class: 'hsc-user__name', text: name }) : null,
  button({
    label: 'Sign out',
    variant: 'ghost',
    size: 'sm',
    icon: 'logout',
    onClick: async () => {
      await signOut();
      location.href = '/signin.html';
    },
  }),
);

// Greeting.
const hour = new Date().getHours();
const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
// "Ms Rivera" stays whole; "Luca Brighenti" becomes "Luca".
const words = name.trim().split(/\s+/).filter(Boolean);
const greetName = /^(mr|mrs|ms|miss|mx|dr|prof)\.?$/i.test(words[0] ?? '') ? words.slice(0, 2).join(' ') : words[0];
document.querySelector('[data-greeting]').textContent = greetName ? `${part}, ${greetName}` : part;
const live = catalog.entries.filter((e) => e.status === 'live').length;
document.querySelector('[data-summary]').textContent =
  `${catalog.entries.length} interactives on the map. ${live ? `${live} ready to use` : 'The first ones arrive soon'}; the rest show here as they are built.`;

// Filters: ?subject= wins, otherwise the subjects from the profile, otherwise all.
const url = new URL(location.href);
const fromUrl = url.searchParams.get('subject');
const selected = new Set(fromUrl && SUBJECTS.some((s) => s.id === fromUrl) ? [fromUrl] : profile?.subjects ?? []);
const search = document.getElementById('hub-search');
search.value = url.searchParams.get('q') ?? '';

const subjectBar = document.querySelector('[data-subjects]');
for (const s of SUBJECTS) {
  subjectBar.append(
    chip({
      label: s.short,
      pressed: selected.has(s.id),
      onToggle: (on) => {
        if (on) selected.add(s.id);
        else selected.delete(s.id);
        render();
      },
    }),
  );
}
search.addEventListener('input', () => render());

function tagLine(entry) {
  return entry.syllabus
    .map((t) => {
      const name = t.version === '2017' ? t.area.replace(/^Module (\d+):.*$/, 'M$1') : t.focusArea || t.area;
      return `${t.version} ${name}`;
    })
    .join(' · ');
}

function haystack(entry) {
  const subject = SUBJECTS.find((s) => s.id === entry.subject);
  return [entry.title, entry.summary, subject?.label, ...entry.syllabus.flatMap((t) => [t.area, t.focusArea, t.subtopic])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function card(entry) {
  const isLive = entry.status === 'live';
  const subject = SUBJECTS.find((s) => s.id === entry.subject);
  const thumb = el('div', { class: 'hub-card__thumb', 'aria-hidden': 'true' });
  if (isLive && entry.thumbnail) {
    const img = el('img', { src: entry.thumbnail, alt: '', loading: 'lazy' });
    img.addEventListener('error', () => img.replaceWith(placeholderSvg(entry.id)));
    thumb.append(img);
  } else thumb.append(placeholderSvg(entry.id));
  const body = el(
    'div',
    { class: 'hub-card__body' },
    el('p', { class: 'eyebrow', text: subject?.label ?? entry.subject }),
    el('h3', { class: 'hub-card__title', text: entry.title }),
    el('p', { class: 'hub-card__summary', text: entry.summary }),
    el('p', { class: 'hub-card__tags', text: tagLine(entry) }),
  );
  const badge = chip({ label: isLive ? 'Live' : 'Coming soon', variant: isLive ? 'live' : undefined });
  badge.classList.add('hub-card__badge');
  return isLive
    ? el('a', { class: 'hub-card', href: entry.path }, thumb, badge, body)
    : el('article', { class: 'hub-card is-soon', aria: { label: `${entry.title}, coming soon` } }, thumb, badge, body);
}

function render() {
  const grid = document.querySelector('[data-grid]');
  clear(grid);
  const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = catalog.entries.filter((e) => (selected.size === 0 || selected.has(e.subject)) && words.every((w) => haystack(e).includes(w)));
  for (const subject of SUBJECTS) {
    const items = shown.filter((e) => e.subject === subject.id).sort((a, b) => (b.status === 'live') - (a.status === 'live'));
    if (!items.length) continue;
    grid.append(
      el(
        'section',
        { class: 'hub-section', aria: { label: subject.label } },
        el('div', { class: 'hub-section__head' }, el('h2', { class: 'hub-section__title', text: subject.label }), el('span', { class: 'eyebrow', text: `${items.length}` })),
        el('div', { class: 'hub-grid' }, items.map(card)),
      ),
    );
  }
  if (!shown.length) grid.append(el('p', { class: 'hub-empty', text: 'Nothing matches that yet. Try a different word, or clear the subject filters.' }));
  const q = new URL(location.href);
  if (search.value.trim()) q.searchParams.set('q', search.value.trim());
  else q.searchParams.delete('q');
  q.searchParams.delete('subject');
  history.replaceState(null, '', q.pathname + q.search);
}

render();
