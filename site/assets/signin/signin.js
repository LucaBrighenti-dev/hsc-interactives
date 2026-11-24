// Sign-in page behaviour (W0-08, functional). W1-AUTH owns this folder and builds the premium version.
import { getSession, signInWithProvider, signInWithEmail, signInWithCode, getProfile, safeNext, authMode } from '../auth.js';
import { SITE_NAME, SITE_TAGLINE, SITE_CREDIT, LOCAL_ACCESS_CODES } from '../config.js';
import { openOnboarding } from './onboarding.js';

const params = new URLSearchParams(location.search);
const next = safeNext(params.get('next') || '/');
const message = document.querySelector('[data-message]');

document.querySelector('[data-site-name]').textContent = SITE_NAME;
document.querySelector('[data-site-tagline]').textContent = SITE_TAGLINE;
document.querySelector('[data-site-credit]').textContent = SITE_CREDIT;
document.title = `Sign in · ${SITE_NAME}`;

if (authMode === 'local') {
  const hint = document.querySelector('[data-local-hint]');
  hint.textContent = `Local mode: no real accounts. Any option signs you in on this device. Codes: ${LOCAL_ACCESS_CODES.map((c) => c.code).join(', ')}.`;
  hint.hidden = false;
}

function say(text, kind = 'error') {
  message.textContent = text;
  message.className = `msg msg--${kind}`;
}

function busy(btn, on) {
  btn.classList.toggle('is-busy', on);
  btn.disabled = on;
  btn.setAttribute('aria-busy', String(on));
}

async function proceed() {
  const session = await getSession();
  if (!session) return;
  if (session.user.kind !== 'code') {
    const profile = await getProfile().catch(() => null);
    if (profile && !profile.subjects?.length) {
      await openOnboarding(profile);
    }
  }
  location.replace(next);
}

// A provider can send people back with an error description.
const returnedError = params.get('error_description') || new URLSearchParams(location.hash.slice(1)).get('error_description');
if (returnedError) say(`Sign-in did not finish: ${returnedError}`);

// Already signed in (or returning from a provider or magic link): carry on.
getSession()
  .then((session) => (session ? proceed() : null))
  .catch((err) => say(err.message));

for (const btn of document.querySelectorAll('[data-provider]')) {
  btn.addEventListener('click', async () => {
    say('', 'ok');
    busy(btn, true);
    try {
      const result = await signInWithProvider(btn.dataset.provider, { next });
      if (result.signedIn) await proceed();
    } catch (err) {
      say(err.message);
      busy(btn, false);
    }
  });
}

document.querySelector('[data-form="email"]').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const btn = form.querySelector('button');
  const input = form.querySelector('input');
  input.removeAttribute('aria-invalid');
  busy(btn, true);
  try {
    const result = await signInWithEmail(input.value, { next });
    if (result.signedIn) await proceed();
    else {
      say(`Check your inbox. We sent a sign-in link to ${input.value.trim()}.`, 'ok');
      busy(btn, false);
    }
  } catch (err) {
    input.setAttribute('aria-invalid', 'true');
    say(err.message);
    busy(btn, false);
  }
});

document.querySelector('[data-form="code"]').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const btn = form.querySelector('button');
  const input = form.querySelector('input');
  input.removeAttribute('aria-invalid');
  if (!input.value.trim()) {
    input.setAttribute('aria-invalid', 'true');
    say('Enter the access code from your teacher or the event card.');
    return;
  }
  busy(btn, true);
  try {
    const ok = await signInWithCode(input.value);
    if (ok) await proceed();
    else {
      input.setAttribute('aria-invalid', 'true');
      say('That code did not work. Check it with your teacher or on the event card.');
      busy(btn, false);
    }
  } catch (err) {
    say(err.message);
    busy(btn, false);
  }
});
