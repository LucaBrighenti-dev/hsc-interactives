// W1-AUTH: every local-mode sign-in path (guide §6.4, §9.2), plus the sign-in page's layout,
// background animation and accessibility basics at desktop, tablet and phone sizes.
// Supabase mode needs a real project; its checks are the test plan in supabase/README.md.
import { test, expect } from '@playwright/test';
import { watchConsole, overflowsX } from './helpers.mjs';

const TEMPLATE = '/interactives/_template.html';
const NEXT = `${TEMPLATE}?amplitude=2`;
const NEXT_URL = /\/interactives\/_template\.html\?amplitude=2$/;
const signinWith = (next = NEXT) => `/signin.html?next=${encodeURIComponent(next)}`;
const desktopOnly = (testInfo) => test.skip(testInfo.project.name !== 'desktop', 'interaction detail runs on desktop');
const stored = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);

test.describe('access code', () => {
  test('any case and spacing opens a class session on `next`, with the badge and no onboarding', async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto(signinWith());
    await page.getByLabel('Access code').fill('  ttt2026 ');
    await page.getByRole('button', { name: 'Enter', exact: true }).click();
    await expect(page).toHaveURL(NEXT_URL);
    expect((await stored(page, 'hsc:session')).user.kind).toBe('code');
    await expect(page.locator('.hsc-user__name')).toHaveText('Class session');
    await expect(page.locator('.badge-founding')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a wrong or empty code shows an inline error under the field, then the right code works', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    const problems = watchConsole(page);
    await page.goto(signinWith());
    const code = page.getByLabel('Access code');
    const message = page.locator('[data-message]');

    await page.getByRole('button', { name: 'Enter', exact: true }).click();
    await expect(message).toContainText('Enter the access code');
    await expect(code).toBeFocused();

    await code.fill('NOPE');
    await code.press('Enter');
    await expect(message).toContainText('did not work');
    await expect(code).toHaveAttribute('aria-invalid', 'true');
    await expect(code).toHaveAttribute('aria-describedby', await message.getAttribute('id'));
    await expect(code).toBeFocused();
    const form = await page.locator('[data-form="code"]').boundingBox();
    const box = await message.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(form.y + form.height - 1); // right under the code field
    expect(await stored(page, 'hsc:session')).toBeNull();
    await expect(page).toHaveURL(/signin\.html/);

    await code.fill('TTT2026');
    await code.press('Enter');
    await expect(page).toHaveURL(NEXT_URL);
    expect(problems).toEqual([]);
  });
});

test.describe('Microsoft and Google', () => {
  for (const [provider, label] of [
    ['azure', 'Microsoft'],
    ['google', 'Google'],
  ]) {
    test(`Continue with ${label} → onboarding validates, saves the profile and redeems the code for the badge`, async ({ page }) => {
      const problems = watchConsole(page);
      await page.goto(signinWith());
      await page.getByRole('button', { name: `Continue with ${label}` }).click();
      const dialog = page.getByRole('dialog', { name: 'Welcome' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Maths Extension 1' })).toBeFocused();

      // A subject first, then a display name.
      await dialog.getByRole('button', { name: 'Continue' }).click();
      await expect(dialog).toContainText('Choose at least one subject');
      await dialog.getByRole('button', { name: 'Physics' }).click();
      await expect(dialog.getByRole('button', { name: 'Physics' })).toHaveAttribute('aria-pressed', 'true');
      await dialog.getByRole('button', { name: 'Engineering Studies' }).click();
      await dialog.getByRole('button', { name: 'Continue' }).click();
      const name = dialog.getByLabel('Display name');
      await expect(name).toBeFocused();
      await expect(name).toHaveAttribute('aria-invalid', 'true');

      await name.fill('Ms Rivera');
      await dialog.getByLabel('School (optional)').fill('Example High School');
      await dialog.getByLabel('Access code (optional)').fill('ttt2026');
      await dialog.getByRole('button', { name: 'Continue' }).click();
      await expect(page).toHaveURL(NEXT_URL);

      const profile = await stored(page, `hsc:profile:local-${provider}`);
      expect(profile).toMatchObject({ displayName: 'Ms Rivera', school: 'Example High School', subjects: ['phy', 'eng'], founding: true });
      expect((await stored(page, 'hsc:session')).user).toMatchObject({ kind: 'oauth', provider });
      await expect(page.locator('.hsc-user__name')).toHaveText('Ms Rivera');
      await expect(page.locator('.badge-founding')).toBeVisible();
      expect(problems).toEqual([]);
    });
  }

  test('onboarding keeps a wrong access code inline, and can carry on without it', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    const problems = watchConsole(page);
    await page.goto(signinWith());
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    const dialog = page.getByRole('dialog', { name: 'Welcome' });
    await dialog.getByRole('button', { name: 'Maths Extension 2' }).click();
    await dialog.getByLabel('Display name').fill('Mr Chen');
    const code = dialog.getByLabel('Access code (optional)');
    await code.fill('NOPE');
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await expect(dialog).toContainText('That code did not work');
    await expect(code).toBeFocused();
    await expect(code).toHaveAttribute('aria-invalid', 'true');
    await expect(dialog).toBeVisible();

    await code.fill('');
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(NEXT_URL);
    expect(await stored(page, 'hsc:profile:local-google')).toMatchObject({ displayName: 'Mr Chen', subjects: ['me2'], founding: false });
    await expect(page.locator('.badge-founding')).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('Esc (or Skip for now) goes straight on to `next`', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto(signinWith());
    await page.getByRole('button', { name: 'Continue with Microsoft' }).click();
    await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(NEXT_URL);
  });

  test('onboarding works from the keyboard alone', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto(signinWith());
    await page.keyboard.press('Tab'); // skip link
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Continue with Microsoft' })).toBeFocused();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Welcome' });
    await expect(dialog.getByRole('button', { name: 'Maths Extension 1' })).toBeFocused();
    await page.keyboard.press('Space');
    await expect(dialog.getByRole('button', { name: 'Maths Extension 1' })).toHaveAttribute('aria-pressed', 'true');
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
    await expect(dialog.getByLabel('Display name')).toBeFocused();
    await page.keyboard.type('Dr Nguyen');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(NEXT_URL);
    expect(await stored(page, 'hsc:profile:local-azure')).toMatchObject({ displayName: 'Dr Nguyen', subjects: ['me1'] });
  });
});

test.describe('email link', () => {
  test('a bad address is caught inline; a good one goes to onboarding (local mode signs in at once)', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    const problems = watchConsole(page);
    await page.goto(signinWith());
    const email = page.getByLabel('Email', { exact: true });
    await email.fill('teacher@');
    await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
    await expect(page.locator('[data-message]')).toContainText('does not look right');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toBeFocused();

    await email.fill('r.rivera@example.edu.au');
    await email.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Welcome' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Physics' }).click();
    await dialog.getByLabel('Display name').fill('Ms Rivera');
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(NEXT_URL);
    expect((await stored(page, 'hsc:session')).user).toMatchObject({ kind: 'email', email: 'r.rivera@example.edu.au' });
    expect(problems).toEqual([]);
  });
});

test.describe('redirects and returns', () => {
  test('an external or tricky `next` is refused, signed out or already signed in', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    const home = /^http:\/\/localhost:\d+\/(\?.*)?$/;
    await page.goto(`/signin.html?next=${encodeURIComponent('https://example.com/')}`);
    await page.getByLabel('Access code').fill('TTT2026');
    await page.getByRole('button', { name: 'Enter', exact: true }).click();
    await expect(page).toHaveURL(home);
    // Already signed in: the sign-in page sends you straight on (no click), still only within this site.
    // Dot segments must not normalise into a protocol-relative //host (review of PR #37, fixed in #47).
    for (const bad of [
      '//example.com/',
      '/\\example.com',
      'javascript:alert(1)',
      'https:example.com',
      '/signin.html?next=/',
      '/.//evil.example/phish',
      '/%2e//evil.example/phish',
      '/../' + '/evil.example/phish',
      '/a/..//evil.example/phish',
    ]) {
      await page.goto(`/signin.html?next=${encodeURIComponent(bad)}`);
      await expect(page).toHaveURL(home);
    }
    await page.goto(signinWith());
    await expect(page).toHaveURL(NEXT_URL);
  });

  test('a dot-segment `next` (/.//evil.example) lands on / after the access code', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto('/signin.html?next=%2F.%2F%2Fevil.example%2Fphish');
    await page.getByLabel('Access code').fill('TTT2026');
    await page.getByRole('button', { name: 'Enter', exact: true }).click();
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/(\?.*)?$/);
    // And again while already signed in: no click needed, still home.
    await page.goto('/signin.html?next=%2F.%2F%2Fevil.example%2Fphish');
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/(\?.*)?$/);
  });

  test('sign out, then the gate sends you back to sign-in with `next`', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    const problems = watchConsole(page);
    await page.goto(signinWith());
    await page.getByLabel('Access code').fill('TTT2026');
    await page.getByRole('button', { name: 'Enter', exact: true }).click();
    await expect(page).toHaveURL(NEXT_URL);
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/signin\.html$/);
    expect(await stored(page, 'hsc:session')).toBeNull();
    await page.goto(TEMPLATE);
    await expect(page).toHaveURL(/\/signin\.html\?next=%2Finteractives%2F_template\.html$/);
    await expect(page.getByRole('button', { name: 'Continue with Microsoft' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('an error returned in the URL is shown calmly and removed from the address bar', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    const problems = watchConsole(page);
    await page.goto(`${signinWith()}&error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`);
    const message = page.locator('[data-message]');
    await expect(message).toContainText('expired or has already been used');
    await expect(page).toHaveURL(/\/signin\.html\?next=[^&]+$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    // Unknown codes get our generic text; a crafted description is never shown.
    await page.goto(`${signinWith()}&error=server_trouble&error_description=Call+0400+000+000+to+unlock+your+account`);
    await expect(message).toContainText('Sign-in did not finish');
    await expect(message).not.toContainText('0400');
    // The page still works.
    await page.getByLabel('Access code').fill('TTT2026');
    await page.getByRole('button', { name: 'Enter', exact: true }).click();
    await expect(page).toHaveURL(NEXT_URL);
    expect(problems).toEqual([]);
  });

  test('a sign-in link that cannot be finished here says what to do', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    const problems = watchConsole(page);
    await page.goto(`${signinWith()}&code=not-a-real-code`);
    await expect(page.locator('[data-message]')).toContainText('same browser');
    await expect(page).toHaveURL(/\/signin\.html\?next=[^&]+$/);
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
    expect(problems).toEqual([]);
  });
});

test.describe('background', () => {
  test('the slope field drifts, and pauses while the tab is hidden', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.goto('/signin.html');
    const canvas = page.locator('[data-signin-bg]');
    await expect(canvas).toHaveAttribute('data-motion', 'running');
    const before = await canvas.evaluate((c) => c.hscFrames);
    await page.waitForTimeout(400);
    expect(await canvas.evaluate((c) => c.hscFrames)).toBeGreaterThan(before);

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(canvas).toHaveAttribute('data-motion', 'paused');
    const paused = await canvas.evaluate((c) => c.hscFrames);
    await page.waitForTimeout(300);
    expect(await canvas.evaluate((c) => c.hscFrames)).toBe(paused);
  });

  test('with prefers-reduced-motion it is one still frame', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/signin.html');
    const canvas = page.locator('[data-signin-bg]');
    await expect(canvas).toHaveAttribute('data-motion', 'static');
    const frames = await canvas.evaluate((c) => c.hscFrames);
    expect(frames).toBeGreaterThanOrEqual(1);
    await page.waitForTimeout(500);
    expect(await canvas.evaluate((c) => c.hscFrames)).toBe(frames);
    // Something is actually drawn, and the device pixel ratio is capped at 2.
    const { drawn, ratio } = await canvas.evaluate((c) => {
      const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < data.length; i += 4 * 97) if (data[i]) n++;
      return { drawn: n, ratio: c.width / c.clientWidth };
    });
    expect(drawn).toBeGreaterThan(0);
    expect(ratio).toBeLessThanOrEqual(2);
  });
});

test.describe('layout at every size', () => {
  test('sign-in: no console errors, no sideways scroll, the wordmark fits and the card is above the fold', async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto('/signin.html');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
    expect(await overflowsX(page)).toBe(false);

    const fit = await page.evaluate(() => {
      const intro = document.querySelector('.signin__intro').getBoundingClientRect();
      const words = [...document.querySelectorAll('.signin__word')].map((w) => w.getBoundingClientRect().right);
      return { right: Math.max(...words), limit: intro.right, size: parseFloat(getComputedStyle(document.querySelector('.signin__wordmark')).fontSize) };
    });
    expect(fit.right).toBeLessThanOrEqual(fit.limit + 8); // the plate padding may sit just past the column
    expect(fit.size).toBeLessThanOrEqual(72);
    expect(fit.size).toBeGreaterThanOrEqual(30);

    const viewport = page.viewportSize();
    const enter = await page.getByRole('button', { name: 'Enter', exact: true }).boundingBox();
    expect(enter.y + enter.height).toBeLessThanOrEqual(viewport.height); // every way in is on the first screen

    // Touch targets: every control in the card is at least 44 px tall.
    const small = await page.$$eval('[data-card] button:not([hidden]), [data-card] input', (els) =>
      els.filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44).map((e) => e.textContent || e.id),
    );
    expect(small).toEqual([]);
    expect(problems).toEqual([]);
  });

  test('reflow at 320 px: no sideways scroll on sign-in, onboarding or privacy', async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    const problems = watchConsole(page);
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/privacy.html');
    await page.evaluate(() => document.fonts.ready);
    expect(await overflowsX(page)).toBe(false);
    await page.goto('/signin.html');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.signin__wordmark')).toHaveCSS('font-size', /^(2[4-9]|3\d)(\.\d+)?px$/);
    expect(await overflowsX(page)).toBe(false);
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    await expect(page.getByRole('dialog', { name: 'Welcome' })).toBeVisible();
    expect(await overflowsX(page)).toBe(false);
    expect(problems).toEqual([]);
  });

  test('onboarding fits the screen with its buttons in reach', async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto('/signin.html');
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    const dialog = page.getByRole('dialog', { name: 'Welcome' });
    await expect(dialog).toBeVisible();
    const viewport = page.viewportSize();
    const box = await dialog.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    await expect(dialog.getByRole('button', { name: 'Continue' })).toBeInViewport();
    await expect(dialog.getByRole('button', { name: 'Skip for now' })).toBeInViewport();
    const small = await dialog.locator('button, input').evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 44).map((e) => e.textContent || e.id));
    expect(small).toEqual([]);
    expect(await overflowsX(page)).toBe(false);
    expect(problems).toEqual([]);
  });

  test('privacy: no console errors or sideways scroll, and the contact is there', async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto('/privacy.html');
    await page.waitForLoadState('networkidle');
    expect(await overflowsX(page)).toBe(false);
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Luca.Brighenti1@outlook.com' })).toHaveAttribute('href', 'mailto:Luca.Brighenti1@outlook.com');
    await expect(page.locator('[data-signin-bg]')).toHaveAttribute('data-motion', 'static');
    expect((await page.getByRole('link', { name: 'Back to the hub' }).boundingBox()).height).toBeGreaterThanOrEqual(44);
    expect(problems).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------
// Supabase mode with the network mocked. The browser gets a config.js with AUTH_MODE = 'supabase'
// and every request to the (fake) project is answered here, in the shapes Supabase Auth and
// PostgREST use. This checks our handling of each answer; Luca's H3–H6 checks the real service.
// ---------------------------------------------------------------------------------------------

const SB = 'https://hsc-test.supabase.co';
const SETTINGS = { external: { azure: true, google: true, email: true, anonymous_users: true }, disable_signup: false };

function sessionFor(user) {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, role: 'authenticated', aal: 'aal1', iat: now, exp: now + 3600, is_anonymous: Boolean(user.is_anonymous) })}.c2lnbmF0dXJl`;
  return { access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'refresh-1', user };
}
const anonUser = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: { provider: 'anonymous', providers: [] }, user_metadata: {} };
const teacher = { id: '00000000-0000-4000-8000-000000000002', aud: 'authenticated', role: 'authenticated', email: 'rivera@school.edu.au', is_anonymous: false, app_metadata: { provider: 'azure', providers: ['azure'] }, user_metadata: { full_name: 'Ms Rivera' } };

/**
 * Switch the page to Supabase mode against a fake project. `handle(req, url, body)` returns
 * { status, json } | { status, body, contentType } | 'abort' | undefined (then the defaults below).
 * Returns the list of calls made to the project.
 */
async function supabaseMode(page, handle = () => undefined, settings = SETTINGS) {
  await page.route('**/assets/config.js', async (route) => {
    const res = await route.fetch();
    const body = (await res.text())
      .replace("AUTH_MODE = 'local'", "AUTH_MODE = 'supabase'")
      .replace("SUPABASE_URL = ''", `SUPABASE_URL = '${SB}'`)
      .replace("SUPABASE_ANON_KEY = ''", "SUPABASE_ANON_KEY = 'anon-test-key'");
    await route.fulfill({ response: res, body });
  });
  const calls = [];
  await page.route(`${SB}/**`, async (route) => {
    const req = route.request();
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'access-control-allow-headers': req.headers()['access-control-request-headers'] || 'authorization, apikey, content-type',
      'access-control-expose-headers': 'content-range',
    };
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const url = new URL(req.url());
    let body = null;
    try {
      body = req.postDataJSON();
    } catch {
      body = req.postData();
    }
    calls.push({ method: req.method(), path: url.pathname, query: url.searchParams, body });
    let out = await handle(req, url, body);
    if (out === undefined) {
      if (url.pathname === '/auth/v1/settings') out = { status: 200, json: settings };
      else if (url.pathname === '/auth/v1/logout') out = { status: 204, body: '' };
      else out = { status: 404, json: { code: 404, error_code: 'not_mocked', msg: `not mocked: ${req.method()} ${url.pathname}` } };
    }
    if (out === 'abort') return route.abort('internetdisconnected');
    if (out.json !== undefined) return route.fulfill({ status: out.status, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(out.json) });
    return route.fulfill({ status: out.status, headers: { ...cors, 'content-type': out.contentType || 'application/json' }, body: out.body ?? '' });
  });
  return calls;
}

test.describe('Supabase mode (mocked network)', () => {
  test.beforeEach(({ page: _page }, testInfo) => desktopOnly(testInfo));

  test('a provider that is switched off is caught before leaving the page', async ({ page }) => {
    const problems = watchConsole(page);
    const calls = await supabaseMode(page, undefined, { external: { azure: false, google: true } });
    await page.goto(signinWith());
    await page.getByRole('button', { name: 'Continue with Microsoft' }).click();
    await expect(page.locator('[data-message]')).toContainText('Microsoft sign-in is not switched on yet');
    await expect(page.getByRole('button', { name: 'Continue with Microsoft' })).toBeEnabled();
    expect(calls.map((c) => c.path)).not.toContain('/auth/v1/authorize');
    expect(problems).toEqual([]);
  });

  test('Microsoft redirects to Supabase with PKCE, the email scope and a return to this page', async ({ page }) => {
    await supabaseMode(page, (req, url) => (url.pathname === '/auth/v1/authorize' ? { status: 200, contentType: 'text/html', body: '<title>Provider</title>' } : undefined));
    await page.goto(signinWith());
    const [request] = await Promise.all([page.waitForRequest(`${SB}/auth/v1/authorize**`), page.getByRole('button', { name: 'Continue with Microsoft' }).click()]);
    const url = new URL(request.url());
    expect(url.searchParams.get('provider')).toBe('azure');
    expect(url.searchParams.get('scopes')).toBe('email');
    expect(url.searchParams.get('code_challenge_method')).toBe('s256');
    const back = new URL(url.searchParams.get('redirect_to'));
    expect(back.pathname).toBe('/signin.html');
    expect(back.searchParams.get('next')).toBe(NEXT);
  });

  test('email: a sent link shows "Check your inbox"; each failure has its own message', async ({ page }) => {
    let mode = 'ok';
    const calls = await supabaseMode(page, (req, url) => {
      if (url.pathname !== '/auth/v1/otp') return undefined;
      if (mode === 'ok') return { status: 200, json: {} };
      if (mode === 'rate') return { status: 429, json: { code: 429, error_code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' } };
      if (mode === 'smtp') return { status: 400, json: { code: 400, error_code: 'email_address_not_authorized', msg: 'Email address "x" not authorized' } };
      return 'abort';
    });
    await page.goto(signinWith());
    const email = page.getByLabel('Email', { exact: true });
    await email.fill('rivera@school.edu.au');
    await email.press('Enter');
    await expect(page.getByRole('heading', { name: 'Check your inbox' })).toBeFocused();
    await expect(page.locator('[data-sent-address]')).toHaveText('rivera@school.edu.au');
    const otp = calls.find((c) => c.path === '/auth/v1/otp');
    expect(otp.body.email).toBe('rivera@school.edu.au');
    expect(new URL(otp.query.get('redirect_to')).searchParams.get('next')).toBe(NEXT);
    await page.getByRole('button', { name: 'Use a different email' }).click();
    await expect(email).toBeFocused();

    for (const [m, text] of [
      ['rate', 'Too many sign-in emails'],
      ['smtp', 'cannot send email to that address'],
      ['offline', 'Could not reach the sign-in service'],
    ]) {
      mode = m;
      await email.press('Enter');
      await expect(page.locator('[data-message]')).toContainText(text);
      await expect(email).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByRole('button', { name: 'Email me a sign-in link' })).toBeEnabled();
    }
  });

  test('a wrong access code removes the anonymous user it made; the right one opens a class session', async ({ page }) => {
    const problems = watchConsole(page);
    let valid = false;
    const calls = await supabaseMode(page, (req, url) => {
      if (url.pathname === '/auth/v1/signup') return { status: 200, json: sessionFor(anonUser) };
      if (url.pathname === '/rest/v1/rpc/redeem_access_code') return { status: 200, json: valid };
      if (url.pathname === '/rest/v1/rpc/delete_my_account') return { status: 204, body: '' };
      if (url.pathname === '/rest/v1/profiles') return { status: 200, json: [{ display_name: null, founding: true }] };
      return undefined;
    });
    await page.goto(signinWith());
    const code = page.getByLabel('Access code');
    await code.fill('wrong');
    await code.press('Enter');
    await expect(page.locator('[data-message]')).toContainText('did not work');
    expect(calls.find((c) => c.path === '/rest/v1/rpc/redeem_access_code').body).toEqual({ p_code: 'WRONG' });
    expect(calls.map((c) => c.path)).toContain('/rest/v1/rpc/delete_my_account');
    expect(await page.evaluate(() => localStorage.getItem('hsc:sb'))).toBeNull();

    valid = true;
    await code.fill('ttt2026');
    await code.press('Enter');
    await expect(page).toHaveURL(NEXT_URL);
    await expect(page.locator('.hsc-user__name')).toHaveText('Class session');
    await expect(page.locator('.badge-founding')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a provider or magic-link return (?code=) signs in, then onboarding saves the profile and badge', async ({ page }) => {
    const problems = watchConsole(page);
    await page.addInitScript(() => localStorage.setItem('hsc:sb-code-verifier', JSON.stringify('verifier-123')));
    let profile = null;
    const calls = await supabaseMode(page, (req, url, body) => {
      if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'pkce') return { status: 200, json: sessionFor(teacher) };
      if (url.pathname === '/rest/v1/profiles' && req.method() === 'GET') return { status: 200, json: profile ? [profile] : [] };
      if (url.pathname === '/rest/v1/profiles' && req.method() === 'POST') {
        profile = { founding: false, ...profile, ...body };
        return { status: 201, body: '' };
      }
      if (url.pathname === '/rest/v1/rpc/redeem_access_code') {
        profile.founding = true;
        return { status: 200, json: true };
      }
      return undefined;
    });
    await page.goto(`${signinWith()}&code=auth-code-1`);
    const dialog = page.getByRole('dialog', { name: 'Welcome' });
    await expect(dialog).toBeVisible();
    expect(calls.find((c) => c.path === '/auth/v1/token').body).toMatchObject({ auth_code: 'auth-code-1', code_verifier: 'verifier-123' });
    await expect(page).not.toHaveURL(/code=/);
    await expect(dialog.getByLabel('Display name')).toHaveValue('Ms Rivera'); // from the Microsoft account
    await dialog.getByRole('button', { name: 'Physics' }).click();
    await dialog.getByLabel('Access code (optional)').fill('TTT2026');
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(NEXT_URL);
    const upsert = calls.find((c) => c.path === '/rest/v1/profiles' && c.method === 'POST');
    expect(upsert.query.get('on_conflict')).toBe('id');
    expect(upsert.body).toEqual({ id: teacher.id, display_name: 'Ms Rivera', school: null, subjects: ['phy'] }); // never `founding`
    await expect(page.locator('.hsc-user__name')).toHaveText('Ms Rivera');
    await expect(page.locator('.badge-founding')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('a ?code= that Supabase rejects, or an error in the URL, gets a calm message', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('hsc:sb-code-verifier', JSON.stringify('verifier-123')));
    await supabaseMode(page, (req, url) =>
      url.pathname === '/auth/v1/token' ? { status: 404, json: { code: 404, error_code: 'flow_state_not_found', msg: 'invalid flow state, no valid flow state found' } } : undefined,
    );
    await page.goto(`${signinWith()}&code=used-code`);
    await expect(page.locator('[data-message]')).toContainText('already been used, or was opened in a different browser');
    await expect(page).toHaveURL(/\/signin\.html\?next=[^&]+$/);

    await page.goto(`${signinWith()}&error=access_denied&error_code=access_denied&error_description=The+user+cancelled`);
    await expect(page.locator('[data-message]')).toContainText('Sign-in was cancelled');
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled();
  });

  test('a token_hash email link works without the original browser', async ({ page }) => {
    const problems = watchConsole(page);
    const user = { ...teacher, email: 'chen@school.edu.au', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {} };
    const calls = await supabaseMode(page, (req, url) => {
      if (url.pathname === '/auth/v1/verify') return { status: 200, json: sessionFor(user) };
      if (url.pathname === '/rest/v1/profiles') return { status: 200, json: [{ display_name: 'Mr Chen', school: '', subjects: ['me2'], founding: false }] };
      return undefined;
    });
    await page.goto(`${signinWith()}&token_hash=hash-1&type=email`);
    await expect(page).toHaveURL(NEXT_URL); // a returning teacher with subjects skips onboarding
    expect(calls.find((c) => c.path === '/auth/v1/verify').body).toMatchObject({ token_hash: 'hash-1', type: 'email' });
    await expect(page.locator('.hsc-user__name')).toHaveText('Mr Chen');
    expect(problems).toEqual([]);
  });
});
