// Sign-in page behaviour (guide §6.4, §9.2). W1-AUTH.
//
// Four ways in: Microsoft, Google, an email magic link, or an access code (anonymous class session).
// Local mode signs in at once; Supabase mode redirects to the provider or sends a link, and the return
// lands back here as /signin.html?next=…&code=… (PKCE), …&token_hash=… (email template), or …&error=…
// After sign-in: onboarding for teachers with no subjects yet, then the `next` page (same site only).
//
// Messages are inline (never alerts). One status region ([data-message]) moves next to the part of the
// card it is about, so an error sits under the field that caused it.
import { getSession, signInWithProvider, signInWithEmail, signInWithCode, getProfile, safeNext, authMode } from '../auth.js';
import { SITE_NAME, SITE_TAGLINE, SITE_CREDIT, LOCAL_ACCESS_CODES } from '../config.js';
import { openOnboarding } from './onboarding.js';
import { mountBackground } from './background.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const query = new URLSearchParams(location.search);
const hash = new URLSearchParams(location.hash.slice(1));
const next = safeNext(query.get('next') || '/');

// What came back in the URL from a provider or a magic link.
const returned = {
  code: query.get('code'),
  tokenHash: query.get('token_hash'),
  accessToken: hash.get('access_token'),
  error: query.get('error') || hash.get('error'),
  errorCode: query.get('error_code') || hash.get('error_code'),
  errorDescription: query.get('error_description') || hash.get('error_description'),
};
const isReturn = Boolean(returned.code || returned.tokenHash || returned.accessToken);
const hasReturnError = Boolean(returned.error || returned.errorCode || returned.errorDescription);

const card = $('[data-card]');
const message = $('[data-message]');
const emailForm = $('[data-form="email"]');
const codeForm = $('[data-form="code"]');
const emailInput = $('#email');
const codeInput = $('#code');

// ---------------------------------------------------------------------------------------------
// Branding, background and wordmark fit
// ---------------------------------------------------------------------------------------------

document.title = `Sign in · ${SITE_NAME}`;
$('[data-site-tagline]').textContent = SITE_TAGLINE;
$('[data-site-credit]').textContent = SITE_CREDIT;
fitWordmark($('[data-site-name]'), SITE_NAME);
mountBackground($('[data-signin-bg]'));

if (authMode === 'local') {
  const hint = $('[data-local-hint]');
  const codes = LOCAL_ACCESS_CODES.map((c) => c.code).join(', ');
  hint.replaceChildren(
    Object.assign(document.createElement('span'), { className: 'signin__local-tag', textContent: 'Local preview' }),
    document.createTextNode(` No real accounts: every option signs you in on this device. Access code ${codes}.`),
  );
  hint.hidden = false;
}

/**
 * Size the wordmark so its longest word fits the column: 72 px at most, smaller only when a word
 * would not fit (a phone, or a long site name). The 24 px floor keeps a 320 px screen from scrolling sideways.
 */
function fitWordmark(node, text, { min = 24, max = 72 } = {}) {
  node.replaceChildren();
  const words = String(text).trim().split(/\s+/);
  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'signin__word';
    span.textContent = word;
    node.append(span);
    if (i < words.length - 1) node.append(' ');
  });
  let lastWidth = 0;
  const fit = () => {
    const avail = node.parentElement.clientWidth;
    if (!avail || avail === lastWidth) return;
    lastWidth = avail;
    node.style.fontSize = `${max}px`;
    const widest = Math.max(...$$('.signin__word', node).map((s) => s.getBoundingClientRect().width));
    const size = widest > avail ? Math.max(min, Math.floor(((max * avail) / widest) * 10) / 10) : max;
    node.style.fontSize = `${size}px`;
  };
  const refit = () => {
    lastWidth = 0;
    fit();
  };
  fit();
  // Measure again once the display face has loaded (fonts.ready alone can resolve before it starts).
  if (document.fonts) {
    document.fonts.load(`800 ${max}px Archivo`, text).then(refit, () => {});
    document.fonts.addEventListener('loadingdone', refit);
  }
  window.addEventListener('resize', fit);
}

// ---------------------------------------------------------------------------------------------
// Views, messages and busy states
// ---------------------------------------------------------------------------------------------

function showView(name, { focus = false } = {}) {
  for (const view of $$('[data-view]', card)) view.hidden = view.dataset.view !== name;
  card.dataset.state = name;
  if (focus) $(`[data-view="${name}"] [tabindex="-1"]`, card)?.focus();
}

/** Show a message next to one part of the card: 'top' | 'providers' | 'email' | 'code'. */
function say(text, { kind = 'error', at = 'top' } = {}) {
  if (!text) {
    message.textContent = '';
    message.hidden = true;
    return;
  }
  if (message.dataset.anchor !== at) {
    const anchor = at === 'top' ? $('[data-local-hint]') : $(`[data-section="${at}"]`);
    anchor.after(message);
    message.dataset.anchor = at;
  }
  message.className = `msg signin__msg msg--${kind}`;
  message.hidden = false;
  message.textContent = text;
  // On a phone the message can land just below the fold: bring it into view.
  requestAnimationFrame(() => message.scrollIntoView({ block: 'nearest' }));
}

function clearInvalid() {
  for (const input of [emailInput, codeInput]) {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  }
}

function invalid(input, text, at) {
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', message.id);
  input.focus();
  say(text, { at });
}

/** Busy: the pressed button shows progress and a label; every other action waits. */
function busy(btn, on) {
  const label = $('span', btn);
  if (on) {
    btn.dataset.label ??= label.textContent;
    if (btn.dataset.busyLabel) label.textContent = btn.dataset.busyLabel;
  } else if (btn.dataset.label) {
    label.textContent = btn.dataset.label;
  }
  btn.classList.toggle('is-busy', on);
  btn.setAttribute('aria-busy', String(on));
  for (const b of $$('[data-view="choose"] button', card)) b.disabled = on;
  card.classList.toggle('is-busy', on);
}

function resetBusy() {
  for (const b of $$('[data-view="choose"] button', card)) busy(b, false);
}

// Back from a provider's page (bfcache): the buttons must not stay busy.
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    resetBusy();
    if (card.dataset.state === 'busy') showView('choose');
  }
});

// ---------------------------------------------------------------------------------------------
// Returning from a provider or a magic link
// ---------------------------------------------------------------------------------------------

/**
 * Plain-language messages for errors a provider or Supabase puts in the URL. Only known codes are
 * recognised and the text is always ours: anyone can craft a link, so the URL's own description is
 * never shown.
 */
function returnErrorMessage({ error, errorCode }) {
  const known = {
    otp_expired: 'That sign-in link has expired or has already been used. Ask for a new one below.',
    access_denied: 'Sign-in was cancelled or not allowed. Try again, or choose another way in.',
    flow_state_expired: 'That sign-in took too long to finish. Please start again.',
    flow_state_not_found: 'That sign-in link has already been used. Ask for a new one below.',
    bad_oauth_state: 'That sign-in did not finish. Please start again from this page.',
    bad_oauth_callback: 'That sign-in did not finish. Please start again from this page.',
    provider_disabled: 'That sign-in option is not switched on yet. Choose another way in.',
    signup_disabled: 'New accounts are switched off at the moment. Use the access code instead.',
    server_error: 'The sign-in service had a problem. Wait a moment and try again.',
    temporarily_unavailable: 'The sign-in service is busy. Wait a moment and try again.',
  };
  if (Object.hasOwn(known, errorCode || '')) return known[errorCode];
  if (Object.hasOwn(known, error || '')) return known[error];
  return 'Sign-in did not finish. Please try again, or choose another way in.';
}

/** Remove the one-time return parameters so a refresh doesn't replay them. `next` stays. */
function cleanUrl() {
  const url = new URL(location.href);
  let changed = false;
  for (const key of ['code', 'sb_flow_id', 'token_hash', 'type', 'error', 'error_code', 'error_description', 'state']) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (url.hash && /(^|[#&])(access_token|error|error_description)=/.test(url.hash)) {
    url.hash = '';
    changed = true;
  }
  if (changed) history.replaceState(history.state, '', url.pathname + url.search + url.hash);
}

/** Signed in: onboarding for a teacher with no subjects yet (never for a class code), then `next`. */
async function proceed(session) {
  showView('busy');
  $('[data-busy-detail]').textContent = 'Opening your dashboard.';
  if (session.user.kind !== 'code') {
    const profile = await getProfile().catch(() => null);
    if (profile && !profile.subjects?.length) {
      $('[data-busy-detail]').textContent = 'Setting up your dashboard.';
      await openOnboarding(profile);
    }
  }
  location.replace(next);
}

async function start() {
  if (isReturn && !hasReturnError) {
    showView('busy');
    $('[data-busy-detail]').textContent = returned.code || returned.tokenHash ? 'Checking your sign-in link.' : 'Finishing your sign-in.';
  }
  let session = null;
  let failure = null;
  try {
    session = await getSession();
  } catch (err) {
    failure = err.message;
  }
  cleanUrl();
  if (session) {
    await proceed(session);
    return;
  }
  showView('choose');
  if (failure) say(failure);
  else if (hasReturnError) say(returnErrorMessage(returned));
  else if (isReturn) {
    say('That sign-in link could not be finished here. Open it in the same browser you asked for it from, or ask for a new one below.');
  }
}

// ---------------------------------------------------------------------------------------------
// The four ways in
// ---------------------------------------------------------------------------------------------

async function afterSignIn() {
  const session = await getSession();
  if (session) await proceed(session);
  else throw new Error('Signed in, but the session did not start. Please try again.');
}

for (const btn of $$('[data-provider]')) {
  btn.addEventListener('click', async () => {
    say('');
    clearInvalid();
    busy(btn, true);
    try {
      const result = await signInWithProvider(btn.dataset.provider, { next });
      if (result.signedIn) await afterSignIn();
      // { redirecting }: the browser is leaving for the provider; stay busy.
    } catch (err) {
      busy(btn, false);
      say(err.message, { at: 'providers' });
      btn.focus();
    }
  });
}

emailForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('button[type="submit"]', emailForm);
  say('');
  clearInvalid();
  const email = emailInput.value.trim();
  if (!email) return invalid(emailInput, 'Enter your email address and we will send you a sign-in link.', 'email');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return invalid(emailInput, 'That email address does not look right. Check it and try again.', 'email');
  busy(btn, true);
  try {
    const result = await signInWithEmail(email, { next });
    if (result.signedIn) {
      await afterSignIn();
      return;
    }
    busy(btn, false);
    $('[data-sent-address]').textContent = email;
    showView('sent', { focus: true });
  } catch (err) {
    busy(btn, false);
    invalid(emailInput, err.message, 'email');
  }
});

$('[data-action="back"]').addEventListener('click', () => {
  showView('choose');
  say('');
  emailInput.select();
  emailInput.focus();
});

codeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('button[type="submit"]', codeForm);
  say('');
  clearInvalid();
  if (!codeInput.value.trim()) return invalid(codeInput, 'Enter the access code from your teacher or the event card.', 'code');
  busy(btn, true);
  try {
    const ok = await signInWithCode(codeInput.value);
    if (ok) {
      await afterSignIn();
      return;
    }
    busy(btn, false);
    invalid(codeInput, 'That code did not work. Check it with your teacher or on the event card.', 'code');
    codeInput.select();
  } catch (err) {
    busy(btn, false);
    invalid(codeInput, err.message, 'code');
  }
});

start();
