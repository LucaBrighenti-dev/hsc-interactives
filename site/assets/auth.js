// Auth and saved data (guide §5.6). The exported API is a locked contract; W1-AUTH owns the internals.
//
// Sign-in is for a premium feel, not security: sharing a login or an access code is fine. Nothing is
// private except each user's own saved scenarios and playlists. Never store student personal details:
// classes use access codes, which create anonymous sessions.
//
// Two backends behind one API:
//   local    (AUTH_MODE = 'local')     localStorage under hsc:* keys. Every feature works with no credentials.
//   supabase (AUTH_MODE = 'supabase')  Supabase Auth + Postgres (supabase/migrations/0001_init.sql).
//
// Errors: functions throw Error with a message that is safe to show to a teacher.
// Additions beyond §5.6 (recorded in docs/gates/gate-a.md): redeemAccessCode, deleteAccount, safeNext, onAuthChange.
import { AUTH_MODE, SUPABASE_URL, SUPABASE_ANON_KEY, LOCAL_ACCESS_CODES } from './config.js';

const SUBJECT_IDS = ['me1', 'me2', 'phy', 'eng'];
const PROVIDERS = ['azure', 'google'];
const AUTH_EVENT = 'hsc:auth';

// ---------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------

function isEmbed() {
  return new URLSearchParams(location.search).get('embed') === '1';
}

/**
 * Only same-site paths are allowed as a post-sign-in destination; anything else becomes '/'.
 * Refuses external URLs, protocol-relative URLs, backslash tricks and the sign-in page itself.
 */
export function safeNext(next) {
  if (typeof next !== 'string' || next.length > 2000) return '/';
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\') || /[\u0000-\u001F\\]/.test(next)) return '/';
  try {
    const url = new URL(next, 'https://hub.invalid');
    if (url.origin !== 'https://hub.invalid') return '/';
    if (url.pathname === '/signin.html') return '/';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/';
  }
}

function normaliseCode(code) {
  return String(code ?? '').trim().toUpperCase();
}

function cleanSubjects(subjects) {
  return [...new Set((subjects || []).filter((s) => SUBJECT_IDS.includes(s)))];
}

function cleanText(value, max) {
  const s = String(value ?? '').trim();
  return s.length > max ? s.slice(0, max) : s;
}

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function announce() {
  sessionCache = null;
  window.dispatchEvent(new CustomEvent(AUTH_EVENT));
}

/** Subscribe to sign-in / sign-out / profile changes. Returns an unsubscribe function. */
export function onAuthChange(fn) {
  window.addEventListener(AUTH_EVENT, fn);
  return () => window.removeEventListener(AUTH_EVENT, fn);
}

let sessionCache = null;

// ---------------------------------------------------------------------------------------------
// Local backend (localStorage)
// ---------------------------------------------------------------------------------------------

const K = {
  session: 'hsc:session',
  profile: (uid) => `hsc:profile:${uid}`,
  scenarios: (uid) => `hsc:scenarios:${uid}`,
  playlists: (uid) => `hsc:playlists:${uid}`,
  requests: 'hsc:requests',
  votes: 'hsc:votes',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const local = {
  currentUser() {
    return read(K.session, null)?.user ?? null;
  },
  requireUser() {
    const user = local.currentUser();
    if (!user) throw new Error('Please sign in first.');
    return user;
  },
  async getSession() {
    const user = local.currentUser();
    if (!user) return null;
    const profile = read(K.profile(user.id), null);
    return { user: { ...user, name: profile?.displayName || user.name || null }, founding: Boolean(profile?.founding) };
  },
  startSession(user) {
    write(K.session, { user, startedAt: new Date().toISOString() });
    announce();
  },
  async signInWithProvider(provider) {
    local.startSession({ id: `local-${provider}`, kind: 'oauth', provider, email: null, name: provider === 'azure' ? 'Microsoft teacher' : 'Google teacher' });
    return { signedIn: true };
  },
  async signInWithEmail(email) {
    local.startSession({ id: `local-email-${email.toLowerCase()}`, kind: 'email', email, name: null });
    return { signedIn: true, sent: false };
  },
  async signInWithCode(code) {
    const match = LOCAL_ACCESS_CODES.find((c) => c.code === code);
    if (!match) return false;
    const id = `local-code-${uuid()}`;
    if (match.kind === 'event') write(K.profile(id), { ...emptyProfile(), founding: true });
    local.startSession({ id, kind: 'code', email: null, name: null });
    return true;
  },
  async redeemAccessCode(code) {
    const user = local.requireUser();
    const match = LOCAL_ACCESS_CODES.find((c) => c.code === code);
    if (!match) return false;
    if (match.kind === 'event') {
      write(K.profile(user.id), { ...(read(K.profile(user.id), null) ?? emptyProfile()), founding: true });
      announce();
    }
    return true;
  },
  async signOut() {
    localStorage.removeItem(K.session);
    announce();
  },
  async getProfile() {
    const user = local.requireUser();
    return { ...emptyProfile(user.name), ...read(K.profile(user.id), {}) };
  },
  async saveProfile(p) {
    const user = local.requireUser();
    const current = read(K.profile(user.id), null) ?? emptyProfile();
    const next = { ...current, displayName: cleanText(p.displayName, 80), school: cleanText(p.school, 120), subjects: cleanSubjects(p.subjects) };
    write(K.profile(user.id), next);
    announce();
    return next;
  },
  async listScenarios(interactiveId) {
    const user = local.requireUser();
    const all = read(K.scenarios(user.id), []);
    return (interactiveId ? all.filter((s) => s.interactiveId === interactiveId) : all).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async saveScenario({ interactiveId, title, params }) {
    const user = local.requireUser();
    const all = read(K.scenarios(user.id), []);
    const row = { id: uuid(), interactiveId, title: cleanText(title, 120) || 'Untitled scenario', params, createdAt: new Date().toISOString() };
    write(K.scenarios(user.id), [row, ...all]);
    return row;
  },
  async deleteScenario(id) {
    const user = local.requireUser();
    write(K.scenarios(user.id), read(K.scenarios(user.id), []).filter((s) => s.id !== id));
  },
  async listPlaylists() {
    const user = local.requireUser();
    return read(K.playlists(user.id), []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async savePlaylist(p) {
    const user = local.requireUser();
    const all = read(K.playlists(user.id), []);
    const row = { id: p.id || uuid(), title: cleanText(p.title, 120) || 'Untitled playlist', items: cleanItems(p.items), createdAt: p.createdAt || new Date().toISOString() };
    write(K.playlists(user.id), [row, ...all.filter((x) => x.id !== row.id)]);
    return row;
  },
  async deletePlaylist(id) {
    const user = local.requireUser();
    write(K.playlists(user.id), read(K.playlists(user.id), []).filter((p) => p.id !== id));
  },
  async listRequests() {
    const user = local.requireUser();
    const votes = read(K.votes, []);
    return read(K.requests, [])
      .map((r) => ({
        id: r.id,
        subject: r.subject,
        topic: r.topic,
        details: r.details,
        createdAt: r.createdAt,
        votes: votes.filter((v) => v.requestId === r.id).length,
        voted: votes.some((v) => v.requestId === r.id && v.userId === user.id),
        mine: r.userId === user.id,
      }))
      .sort(byVotes);
  },
  async createRequest({ subject, topic, details }) {
    const user = local.requireUser();
    const row = { id: uuid(), userId: user.id, subject, topic: cleanText(topic, 140), details: cleanText(details, 1000) || null, createdAt: new Date().toISOString() };
    write(K.requests, [...read(K.requests, []), row]);
    write(K.votes, [...read(K.votes, []), { requestId: row.id, userId: user.id }]);
    return row;
  },
  async toggleVote(requestId) {
    const user = local.requireUser();
    const votes = read(K.votes, []);
    const has = votes.some((v) => v.requestId === requestId && v.userId === user.id);
    write(K.votes, has ? votes.filter((v) => !(v.requestId === requestId && v.userId === user.id)) : [...votes, { requestId, userId: user.id }]);
    return !has;
  },
  async deleteAccount() {
    const user = local.requireUser();
    for (const key of [K.profile(user.id), K.scenarios(user.id), K.playlists(user.id)]) localStorage.removeItem(key);
    write(K.requests, read(K.requests, []).filter((r) => r.userId !== user.id));
    write(K.votes, read(K.votes, []).filter((v) => v.userId !== user.id));
    await local.signOut();
  },
};

function emptyProfile(name = '') {
  return { displayName: name || '', school: '', subjects: [], founding: false };
}

function cleanItems(items) {
  return (items || [])
    .filter((it) => it && typeof it.interactiveId === 'string')
    .slice(0, 50)
    .map((it) => ({ interactiveId: it.interactiveId, ...(it.params ? { params: it.params } : {}), ...(it.note ? { note: cleanText(it.note, 280) } : {}) }));
}

function byVotes(a, b) {
  return b.votes - a.votes || b.createdAt.localeCompare(a.createdAt);
}

// ---------------------------------------------------------------------------------------------
// Supabase backend. Written to §5.6/§5.7; verified by Luca after human tasks H3–H5.
// ---------------------------------------------------------------------------------------------

let clientPromise = null;
function sb() {
  clientPromise ??= (async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Sign-in is not set up yet: SUPABASE_URL and SUPABASE_ANON_KEY are empty in config.js.');
    const { createClient } = await import('/vendor/supabase.mjs');
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce', storageKey: 'hsc:sb' },
    });
  })();
  return clientPromise;
}

function friendly(error, fallback) {
  if (!error) return new Error(fallback);
  const msg = String(error.message || error);
  if (/fetch|network|Failed to fetch/i.test(msg)) return new Error('Could not reach the sign-in service. Check your connection and try again.');
  if (/rate limit|too many/i.test(msg)) return new Error('Too many attempts. Wait a minute and try again.');
  return new Error(`${fallback} (${msg})`);
}

function redirectTo(next) {
  return `${location.origin}/signin.html?next=${encodeURIComponent(safeNext(next))}`;
}

async function supaUser() {
  const client = await sb();
  const { data, error } = await client.auth.getSession();
  if (error) throw friendly(error, 'Could not check your sign-in');
  return { client, user: data.session?.user ?? null };
}

async function supaRequireUser() {
  const { client, user } = await supaUser();
  if (!user) throw new Error('Please sign in first.');
  return { client, user };
}

const supa = {
  async getSession() {
    const { client, user } = await supaUser();
    if (!user) return null;
    const { data: profile } = await client.from('profiles').select('display_name, founding').eq('id', user.id).maybeSingle();
    const provider = user.app_metadata?.provider;
    const kind = user.is_anonymous ? 'code' : provider === 'email' ? 'email' : 'oauth';
    const name = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || null;
    return { user: { id: user.id, kind, provider: kind === 'oauth' ? provider : undefined, email: user.email || null, name }, founding: Boolean(profile?.founding) };
  },
  async signInWithProvider(provider, { next = '/' } = {}) {
    const client = await sb();
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo(next), ...(provider === 'azure' ? { scopes: 'email' } : {}) },
    });
    if (error) throw friendly(error, 'Could not start sign-in');
    return { redirecting: true };
  },
  async signInWithEmail(email, { next = '/' } = {}) {
    const client = await sb();
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo(next) } });
    if (error) throw friendly(error, 'Could not send the sign-in link');
    return { sent: true, signedIn: false };
  },
  async signInWithCode(code) {
    const client = await sb();
    const { error } = await client.auth.signInAnonymously();
    if (error) throw friendly(error, 'Could not start a session');
    const { data: ok, error: rpcError } = await client.rpc('redeem_access_code', { p_code: code });
    if (rpcError) throw friendly(rpcError, 'Could not check the access code');
    if (!ok) {
      await client.auth.signOut();
      return false;
    }
    announce();
    return true;
  },
  async redeemAccessCode(code) {
    const { client } = await supaRequireUser();
    const { data, error } = await client.rpc('redeem_access_code', { p_code: code });
    if (error) throw friendly(error, 'Could not check the access code');
    if (data) announce();
    return Boolean(data);
  },
  async signOut() {
    const client = await sb();
    await client.auth.signOut();
    announce();
  },
  async getProfile() {
    const { client, user } = await supaRequireUser();
    const { data, error } = await client.from('profiles').select('display_name, school, subjects, founding').eq('id', user.id).maybeSingle();
    if (error) throw friendly(error, 'Could not load your profile');
    const fallbackName = user.user_metadata?.full_name || user.user_metadata?.name || '';
    return { displayName: data?.display_name || fallbackName, school: data?.school || '', subjects: data?.subjects || [], founding: Boolean(data?.founding) };
  },
  async saveProfile(p) {
    const { client, user } = await supaRequireUser();
    const row = { id: user.id, display_name: cleanText(p.displayName, 80) || null, school: cleanText(p.school, 120) || null, subjects: cleanSubjects(p.subjects) };
    const { error } = await client.from('profiles').upsert(row, { onConflict: 'id' });
    if (error) throw friendly(error, 'Could not save your profile');
    announce();
    return { displayName: row.display_name || '', school: row.school || '', subjects: row.subjects };
  },
  async listScenarios(interactiveId) {
    const { client } = await supaRequireUser();
    let q = client.from('saved_scenarios').select('id, interactive_id, title, params, created_at').order('created_at', { ascending: false });
    if (interactiveId) q = q.eq('interactive_id', interactiveId);
    const { data, error } = await q;
    if (error) throw friendly(error, 'Could not load saved scenarios');
    return data.map((r) => ({ id: r.id, interactiveId: r.interactive_id, title: r.title, params: r.params, createdAt: r.created_at }));
  },
  async saveScenario({ interactiveId, title, params }) {
    const { client } = await supaRequireUser();
    const { data, error } = await client
      .from('saved_scenarios')
      .insert({ interactive_id: interactiveId, title: cleanText(title, 120) || 'Untitled scenario', params })
      .select('id, interactive_id, title, params, created_at')
      .single();
    if (error) throw friendly(error, 'Could not save the scenario');
    return { id: data.id, interactiveId: data.interactive_id, title: data.title, params: data.params, createdAt: data.created_at };
  },
  async deleteScenario(id) {
    const { client } = await supaRequireUser();
    const { error } = await client.from('saved_scenarios').delete().eq('id', id);
    if (error) throw friendly(error, 'Could not delete the scenario');
  },
  async listPlaylists() {
    const { client } = await supaRequireUser();
    const { data, error } = await client.from('playlists').select('id, title, items, created_at').order('created_at', { ascending: false });
    if (error) throw friendly(error, 'Could not load playlists');
    return data.map((r) => ({ id: r.id, title: r.title, items: r.items || [], createdAt: r.created_at }));
  },
  async savePlaylist(p) {
    const { client } = await supaRequireUser();
    const row = { title: cleanText(p.title, 120) || 'Untitled playlist', items: cleanItems(p.items) };
    const q = p.id ? client.from('playlists').update(row).eq('id', p.id) : client.from('playlists').insert(row);
    const { data, error } = await q.select('id, title, items, created_at').single();
    if (error) throw friendly(error, 'Could not save the playlist');
    return { id: data.id, title: data.title, items: data.items, createdAt: data.created_at };
  },
  async deletePlaylist(id) {
    const { client } = await supaRequireUser();
    const { error } = await client.from('playlists').delete().eq('id', id);
    if (error) throw friendly(error, 'Could not delete the playlist');
  },
  async listRequests() {
    const { client, user } = await supaRequireUser();
    const [{ data: requests, error }, { data: mine, error: votesError }] = await Promise.all([
      client.from('requests').select('id, user_id, subject, topic, details, created_at, votes(count)'),
      client.from('votes').select('request_id').eq('user_id', user.id),
    ]);
    if (error || votesError) throw friendly(error || votesError, 'Could not load requests');
    const voted = new Set(mine.map((v) => v.request_id));
    return requests
      .map((r) => ({ id: r.id, subject: r.subject, topic: r.topic, details: r.details, createdAt: r.created_at, votes: r.votes?.[0]?.count ?? 0, voted: voted.has(r.id), mine: r.user_id === user.id }))
      .sort(byVotes);
  },
  async createRequest({ subject, topic, details }) {
    const { client } = await supaRequireUser();
    const { data, error } = await client
      .from('requests')
      .insert({ subject, topic: cleanText(topic, 140), details: cleanText(details, 1000) || null })
      .select('id, subject, topic, details, created_at')
      .single();
    if (error) throw friendly(error, 'Could not send the request');
    await client.from('votes').insert({ request_id: data.id });
    return { id: data.id, subject: data.subject, topic: data.topic, details: data.details, createdAt: data.created_at };
  },
  async toggleVote(requestId) {
    const { client, user } = await supaRequireUser();
    const { data: existing } = await client.from('votes').select('request_id').eq('request_id', requestId).eq('user_id', user.id).maybeSingle();
    const { error } = existing
      ? await client.from('votes').delete().eq('request_id', requestId).eq('user_id', user.id)
      : await client.from('votes').insert({ request_id: requestId });
    if (error) throw friendly(error, 'Could not record the vote');
    return !existing;
  },
  async deleteAccount() {
    const { client } = await supaRequireUser();
    const { error } = await client.rpc('delete_my_account');
    if (error) throw friendly(error, 'Could not delete the account');
    await client.auth.signOut();
    announce();
  },
};

const backend = () => (AUTH_MODE === 'supabase' ? supa : local);

// ---------------------------------------------------------------------------------------------
// Public API (guide §5.6)
// ---------------------------------------------------------------------------------------------

/** → { user: { id, kind: 'oauth'|'email'|'code'|'local', provider?, email, name }, founding } | null */
export async function getSession() {
  sessionCache ??= backend().getSession().catch((err) => {
    sessionCache = null;
    throw err;
  });
  return sessionCache;
}

/**
 * Redirects to the sign-in page when there is no session. No-op (resolves null) with ?embed=1.
 * When it redirects, the returned promise never resolves, so the page stops initialising.
 */
export async function requireSession() {
  if (isEmbed()) return null;
  const session = await getSession().catch(() => null);
  if (session) return session;
  location.replace(`/signin.html?next=${encodeURIComponent(location.pathname + location.search)}`);
  return new Promise(() => {});
}

/**
 * Microsoft ('azure') or Google ('google'). Supabase mode redirects to the provider and back to
 * /signin.html?next=…; local mode signs in immediately.
 * @returns {Promise<{ signedIn?: boolean, redirecting?: boolean }>}
 */
export async function signInWithProvider(p, { next = '/' } = {}) {
  if (!PROVIDERS.includes(p)) throw new Error(`Unknown sign-in provider: ${p}`);
  return backend().signInWithProvider(p, { next });
}

/**
 * Email magic link. Local mode signs in immediately ({ signedIn: true }); Supabase mode sends a link ({ sent: true }).
 */
export async function signInWithEmail(email, { next = '/' } = {}) {
  const clean = String(email ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) || clean.length > 254) throw new Error('Enter a valid email address.');
  return backend().signInWithEmail(clean, { next });
}

/** Access code → anonymous session. Resolves false if the code is not valid. */
export async function signInWithCode(code) {
  const clean = normaliseCode(code);
  if (!clean) return false;
  return backend().signInWithCode(clean);
}

/** Redeem the access code on the current account (a teacher signed in with Microsoft or Google gets the Founding Educator badge). */
export async function redeemAccessCode(code) {
  const clean = normaliseCode(code);
  if (!clean) return false;
  return backend().redeemAccessCode(clean);
}

export async function signOut() {
  return backend().signOut();
}

/** → { displayName, school, subjects: ['me1', 'phy'], founding } */
export async function getProfile() {
  return backend().getProfile();
}

/** Saves displayName, school and subjects. `founding` is never writable by the client. */
export async function saveProfile(p) {
  return backend().saveProfile(p);
}

/** → [{ id, interactiveId, title, params, createdAt }], newest first */
export async function listScenarios(interactiveId) {
  return backend().listScenarios(interactiveId);
}

export async function saveScenario({ interactiveId, title, params }) {
  if (!interactiveId || typeof params !== 'object') throw new Error('Nothing to save.');
  return backend().saveScenario({ interactiveId, title, params });
}

export async function deleteScenario(id) {
  return backend().deleteScenario(id);
}

/** → [{ id, title, items: [{ interactiveId, params?, note? }], createdAt }] */
export async function listPlaylists() {
  return backend().listPlaylists();
}

/** Insert, or update when p.id is set. */
export async function savePlaylist(p) {
  return backend().savePlaylist(p);
}

export async function deletePlaylist(id) {
  return backend().deletePlaylist(id);
}

/** → [{ id, subject, topic, details, createdAt, votes, voted, mine }], most votes first */
export async function listRequests() {
  return backend().listRequests();
}

/** Creates a request and votes for it. */
export async function createRequest({ subject, topic, details }) {
  if (!SUBJECT_IDS.includes(subject)) throw new Error('Choose a subject.');
  if (!String(topic ?? '').trim()) throw new Error('Describe the topic you would like.');
  return backend().createRequest({ subject, topic, details });
}

/** → true if the user now votes for the request. */
export async function toggleVote(requestId) {
  return backend().toggleVote(requestId);
}

/** Deletes the account and everything it saved, then signs out. */
export async function deleteAccount() {
  return backend().deleteAccount();
}

export const authMode = AUTH_MODE;
