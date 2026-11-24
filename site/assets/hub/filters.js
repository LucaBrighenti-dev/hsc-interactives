// Dashboard filters and their URL state. Pure functions (no DOM), so a filtered view is just a URL.
//
// URL keys (all optional):
//   q=<words>            search
//   subject=me1,phy      subject ids; the shell's breadcrumb links use ?subject=<one id>
//   subject=all          every subject, whatever the profile says (a view widened without saving it)
//   syllabus=2025        syllabus version
//   focus=<name>         focus area (old-syllabus module or new focus area), by name
//   status=live|soon     Live or Coming soon
//   view=az              A–Z instead of grouped by subject
import { SUBJECTS } from '../config.js';

export const SUBJECT_IDS = SUBJECTS.map((s) => s.id);

/** Syllabus versions with the course each one belongs to (titles only; never syllabus text). */
export const VERSIONS = [
  ['2011', '2011 · Engineering Studies Stage 6'],
  ['2017', '2017 · Physics Stage 6'],
  ['2024', '2024 · Maths Extension 1 and 2'],
  ['2025', '2025 · Physics 11–12'],
  ['2026', '2026 · Engineering Studies 11–12'],
];
export const STATUSES = [
  ['', 'Live and coming soon'],
  ['live', 'Live'],
  ['soon', 'Coming soon'],
];

const MAX_Q = 100;
const MAX_FOCUS = 120;

export function emptyFilters() {
  return { q: '', subjects: [], syllabus: '', focus: '', status: '', view: 'subject' };
}

function cleanSubjects(list) {
  const set = new Set((Array.isArray(list) ? list : []).filter((s) => SUBJECT_IDS.includes(s)));
  return SUBJECT_IDS.filter((s) => set.has(s)); // always in the canonical order
}

/**
 * Read filters from a query string. Subjects come from the URL when it names at least one valid
 * subject (or says `all`), otherwise from `fallbackSubjects` (the profile).
 * @returns {ReturnType<typeof emptyFilters> & { subjectsFromUrl: boolean }}
 */
export function readFilters(search, fallbackSubjects = []) {
  const p = new URLSearchParams(search);
  const all = p.get('subject') === 'all';
  const fromUrl = cleanSubjects((p.get('subject') ?? '').split(','));
  const syllabus = p.get('syllabus') ?? '';
  const status = p.get('status') ?? '';
  return {
    q: (p.get('q') ?? '').slice(0, MAX_Q),
    subjects: all ? [] : fromUrl.length ? fromUrl : cleanSubjects(fallbackSubjects),
    subjectsFromUrl: all || fromUrl.length > 0,
    syllabus: VERSIONS.some(([v]) => v === syllabus) ? syllabus : '',
    focus: (p.get('focus') ?? '').trim().slice(0, MAX_FOCUS),
    status: status === 'live' || status === 'soon' ? status : '',
    view: p.get('view') === 'az' ? 'az' : 'subject',
  };
}

/**
 * Query string for the filters (no leading "?"). Commas in the subject list stay readable.
 * `profileSubjects`: when the view shows every subject but the profile names some, the link says
 * `subject=all`, so it shows the same thing to whoever opens it.
 */
export function filtersToQuery(f, profileSubjects = []) {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set('q', f.q.trim());
  if (f.subjects.length) p.set('subject', f.subjects.join(','));
  else if (cleanSubjects(profileSubjects).length) p.set('subject', 'all');
  if (f.syllabus) p.set('syllabus', f.syllabus);
  if (f.focus) p.set('focus', f.focus);
  if (f.status) p.set('status', f.status);
  if (f.view === 'az') p.set('view', 'az');
  return p.toString().replace(/%2C/g, ',');
}

/** True when anything narrows the grid apart from the subject chips and the view. */
export function hasNarrowing(f) {
  return Boolean(f.q.trim() || f.syllabus || f.focus || f.status);
}

/** The name a tag is filtered by: the new syllabus's focus area, or the old syllabus's module. */
export function focusName(tag) {
  return tag.focusArea || tag.area || '';
}

export function subjectOf(entry) {
  return SUBJECTS.find((s) => s.id === entry.subject) ?? null;
}

const haystacks = new WeakMap();
/** Lower-case text a search matches against: title, summary, subject and syllabus names and codes. */
export function haystack(entry) {
  let text = haystacks.get(entry);
  if (text === undefined) {
    const subject = subjectOf(entry);
    text = [
      entry.title,
      entry.summary,
      subject?.label,
      subject?.short,
      ...(entry.syllabus ?? []).flatMap((t) => [t.area, t.focusArea, t.subtopic, ...(t.outcomes ?? [])]),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    haystacks.set(entry, text);
  }
  return text;
}

export function searchWords(q) {
  return q.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function tagMatches(tag, f) {
  return (!f.syllabus || tag.version === f.syllabus) && (!f.focus || focusName(tag) === f.focus);
}

/** Does an entry pass every filter? `words` is searchWords(f.q), passed in so it's computed once. */
export function matches(entry, f, words = searchWords(f.q)) {
  if (f.subjects.length && !f.subjects.includes(entry.subject)) return false;
  if (f.status === 'live' && entry.status !== 'live') return false;
  if (f.status === 'soon' && entry.status === 'live') return false;
  if ((f.syllabus || f.focus) && !(entry.syllabus ?? []).some((t) => tagMatches(t, f))) return false;
  if (words.length) {
    const text = haystack(entry);
    if (!words.every((w) => text.includes(w))) return false;
  }
  return true;
}

/** Syllabus versions present among the entries of the chosen subjects (the current choice always stays). */
export function versionOptions(entries, f) {
  const present = new Set();
  for (const e of entries) {
    if (f.subjects.length && !f.subjects.includes(e.subject)) continue;
    for (const t of e.syllabus ?? []) present.add(t.version);
  }
  if (f.syllabus) present.add(f.syllabus);
  return VERSIONS.filter(([v]) => present.has(v));
}

/**
 * Focus areas for the chosen subjects and syllabus version, grouped by course and version:
 * [{ group: 'Physics 2025', names: ['Advanced mechanics', ...] }]. The current choice always stays.
 */
export function focusOptions(entries, f) {
  const groups = new Map();
  for (const e of entries) {
    if (f.subjects.length && !f.subjects.includes(e.subject)) continue;
    for (const t of e.syllabus ?? []) {
      if (f.syllabus && t.version !== f.syllabus) continue;
      const name = focusName(t);
      if (!name) continue;
      const key = `${t.course} ${t.version}`;
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key).add(name);
    }
  }
  const out = [...groups]
    .sort(([a], [b]) => a.localeCompare(b, 'en-AU'))
    .map(([group, names]) => ({ group, names: [...names].sort((a, b) => a.localeCompare(b, 'en-AU', { numeric: true })) }));
  if (f.focus && !out.some((g) => g.names.includes(f.focus))) out.push({ group: 'Current choice', names: [f.focus] });
  return out;
}

const PRIORITY = { P0: 0, P1: 1, P2: 2 };
const byTitle = (a, b) => a.title.localeCompare(b.title, 'en-AU');
const liveFirst = (a, b) => (b.status === 'live') - (a.status === 'live');

/**
 * Arrange the shown entries into sections.
 * view 'subject': one section per subject, live first, then flagships first (priority is used for order only), then title.
 * view 'az': "Ready to use" then "Coming soon", each A–Z.
 * @returns {{ key: string, title: string, entries: object[] }[]}
 */
export function arrange(shown, view) {
  if (view === 'az') {
    const live = shown.filter((e) => e.status === 'live').sort(byTitle);
    const soon = shown.filter((e) => e.status !== 'live').sort(byTitle);
    return [
      { key: 'live', title: 'Ready to use', entries: live },
      { key: 'soon', title: 'Coming soon', entries: soon },
    ].filter((s) => s.entries.length);
  }
  return SUBJECTS.map((s) => ({
    key: s.id,
    title: s.label,
    entries: shown.filter((e) => e.subject === s.id).sort((a, b) => liveFirst(a, b) || (PRIORITY[a.priority] ?? 3) - (PRIORITY[b.priority] ?? 3) || byTitle(a, b)),
  })).filter((s) => s.entries.length);
}

/** Mono tag line for a card, e.g. "2017 M5 · 2025 Advanced mechanics". */
export function tagLine(entry) {
  return (entry.syllabus ?? [])
    .map((t) => {
      const name = t.version === '2017' && t.area ? t.area.replace(/^Module (\d+):.*$/, 'M$1') : focusName(t);
      return `${t.version} ${name}`.trim();
    })
    .join(' · ');
}
