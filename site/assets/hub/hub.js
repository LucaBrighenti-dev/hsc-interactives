// The dashboard (guide §6.5, §9.3): greeting, filters and the card grid, plus the teacher's workspace
// (saved scenarios, playlists, requests) and the account area. Works end to end in local auth mode.
//
//   hub.js        this file: session, profile, header, greeting, wiring
//   filters.js    filter logic and URL state (pure)
//   grid.js       filter bar, result bar and cards
//   scenarios.js  playlists.js  requests.js  account.js   the workspace panels and dialogs
//   common.js     links, collapsible panels, confirm dialogs
//   placeholder.js  generated card pictures
import { requireSession, getSession, getProfile, saveProfile, signOut } from '../auth.js';
import { SITE_NAME, SITE_CREDIT } from '../config.js';
import { el, clear, button, toast } from '../ui/index.js';
import { readFilters } from './filters.js';
import { mountCatalog } from './grid.js';
import { makeIndex } from './common.js';
import { scenariosPanel } from './scenarios.js';
import { playlistsPanel } from './playlists.js';
import { requestsPanel } from './requests.js';
import { openAccount } from './account.js';

// The dashboard has no embed mode: requireSession() returns null for ?embed=1 without checking, so look
// for a session directly and send anyone without one to the sign-in page.
const session = (await requireSession()) ?? (await getSession().catch(() => null));
if (!session) {
  location.replace(`/signin.html?next=${encodeURIComponent('/')}`);
  await new Promise(() => {});
}
const [profileRaw, catalog] = await Promise.all([
  getProfile().catch(() => null),
  fetch('/catalog.json')
    .then((r) => (r.ok ? r.json() : { entries: [] }))
    .catch(() => ({ entries: [] })),
]);
const entries = Array.isArray(catalog?.entries) ? catalog.entries : [];

/** A stored profile may have been hand-edited or come from an older version: keep only well-formed fields. */
function cleanProfile(p) {
  const text = (v) => (typeof v === 'string' ? v : '');
  return {
    displayName: text(p?.displayName),
    school: text(p?.school),
    subjects: Array.isArray(p?.subjects) ? p.subjects.filter((s) => typeof s === 'string') : [],
  };
}
const profile = cleanProfile(profileRaw);
let founding = Boolean(session?.founding || profileRaw?.founding);
const sessionName = typeof session?.user?.name === 'string' ? session.user.name : '';

document.title = SITE_NAME;
document.querySelector('[data-site-name]').textContent = SITE_NAME;
document.querySelector('[data-site-credit]').textContent = SITE_CREDIT;

const ctx = {
  session,
  profile,
  get founding() {
    return founding;
  },
  index: makeIndex(entries),
  // Tablet and phone: the workspace panels start folded so the catalogue is in view.
  compact: matchMedia('(max-width: 1199px)').matches,
  liveEntries: () => entries.filter((e) => e.status === 'live'),
  scenarios: () => scenarios.list,
  defaultSubject: () => catalogView?.filters.subjects[0] ?? profile.subjects[0],
  addToPlaylist: (item, label) => playlists.addToPlaylist(item, label),
  onProfileSaved(saved, nowFounding) {
    Object.assign(profile, cleanProfile(saved));
    founding = nowFounding;
    renderHeader();
    renderHero();
    catalogView.setSubjects(profile.subjects);
  },
};

// ---- Header: name, account, sign out ----
const userArea = document.querySelector('[data-user]');
function renderHeader() {
  const name = profile.displayName || sessionName || (session?.user?.kind === 'code' ? 'Class session' : 'Signed in');
  clear(userArea).append(
    el('span', { class: 'hsc-user__name', text: name }),
    button({ label: 'Account', icon: 'user', onClick: () => openAccount(ctx) }),
    button({
      label: 'Sign out',
      icon: 'logout',
      variant: 'ghost',
      onClick: async () => {
        await signOut();
        location.href = '/signin.html';
      },
    }),
  );
}

// ---- Greeting ----
/** "Ms Rivera" stays whole; "Luca Brighenti" becomes "Luca". */
function greetName(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  return /^(mr|mrs|ms|miss|mx|dr|prof)\.?$/i.test(words[0]) ? words.slice(0, 2).join(' ') : words[0];
}

function renderHero() {
  const now = new Date();
  const hour = now.getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const who = greetName(profile.displayName || sessionName);
  document.querySelector('[data-greeting]').textContent = who ? `${part}, ${who}` : part;
  clear(document.querySelector('[data-hero-eyebrow]')).append(
    el('span', { text: now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) }),
    founding ? el('span', { class: 'badge-founding', text: 'Founding Educator' }) : null,
  );
  const live = entries.filter((e) => e.status === 'live').length;
  const soon = entries.length - live;
  // The second sentence is hidden on phones to keep the catalogue near the top.
  const [first, second] = live
    ? [`${live} ready to use, ${soon} more on the way.`, 'New ones appear here the moment they’re ready.']
    : [`${entries.length} interactives on the map for Extension Maths, Physics and Engineering Studies.`, 'The first ones open soon, and each appears here the moment it’s ready.'];
  clear(document.querySelector('[data-summary]')).append(first, ' ', el('span', { class: 'hub-sub__more', text: second }));
}

renderHeader();
renderHero();

// ---- Catalogue ----
let saveChain = Promise.resolve();
const catalogView = mountCatalog({
  filtersEl: document.querySelector('[data-filters]'),
  resultsEl: document.querySelector('[data-results]'),
  gridEl: document.querySelector('[data-grid]'),
  entries,
  filters: readFilters(location.search, profile.subjects),
  profileSubjects: () => profile.subjects,
  onSubjectsChange: (ids) => {
    profile.subjects = ids;
    const next = { displayName: profile.displayName, school: profile.school, subjects: ids };
    saveChain = saveChain.then(() => saveProfile(next)).catch((err) => toast(err.message, { kind: 'error' }));
  },
  onAddToPlaylist: (entry) => playlists.addToPlaylist({ interactiveId: entry.id }, entry.title),
  onRequest: (draft) => requests.openForm(draft),
});

// ---- Workspace ----
const scenarios = scenariosPanel(ctx);
const playlists = playlistsPanel(ctx);
const requests = requestsPanel(ctx);
document.querySelector('[data-side]').append(scenarios.el, playlists.el, requests.el);
await Promise.all([scenarios.reload(), playlists.reload(), requests.reload()]);
document.body.dataset.ready = 'true';
