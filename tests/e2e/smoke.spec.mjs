// Smoke tests (guide W0-12): sign in with a local access code → dashboard → template page runs,
// with zero console errors. Interaction-heavy tests run on desktop; layout checks run at every size.
import { test, expect } from '@playwright/test';
import { watchConsole, signInLocal, hscReady, overflowsX } from './helpers.mjs';

const desktopOnly = (testInfo) => test.skip(testInfo.project.name !== 'desktop', 'interaction flow runs on desktop');

test('sign in with an access code lands on the dashboard with every entry coming soon', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/signin\.html\?next=%2F$/);
  await page.getByLabel('Access code').fill('ttt2026');
  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page).toHaveURL(/\/(\?.*)?$/);
  await expect(page.locator('[data-greeting]')).toHaveText(/^Good (morning|afternoon|evening)$/);
  await expect(page.locator('.badge-founding')).toBeVisible();
  const total = await page.evaluate(() => fetch('/catalog.json').then((r) => r.json()).then((c) => c.count));
  expect(total).toBe(76);
  await expect(page.locator('.hub-card.is-soon')).toHaveCount(76);
  await expect(page.locator('.hub-section')).toHaveCount(4);

  await page.getByLabel('Search interactives').fill('projectile');
  await expect(page.locator('.hub-card')).toHaveCount(3);
  await page.getByLabel('Search interactives').fill('');
  await page.getByRole('group', { name: 'Subjects' }).getByRole('button', { name: 'Physics' }).click();
  await expect(page.locator('.hub-section')).toHaveCount(1);
  expect(problems).toEqual([]);
});

test('a wrong access code shows a calm inline error', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await page.goto('/signin.html');
  await page.getByLabel('Access code').fill('NOPE');
  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page.locator('[data-message]')).toContainText('did not work');
  await expect(page).toHaveURL(/signin\.html/);
  expect(problems).toEqual([]);
});

test('a provider sign-in shows onboarding, then returns to the requested page', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await page.goto('/signin.html?next=%2Finteractives%2F_template.html%3Famplitude%3D3');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  const dialog = page.getByRole('dialog', { name: 'Welcome' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Physics' }).click();
  await dialog.getByLabel('Display name').fill('Ms Rivera');
  await dialog.getByLabel('Access code (optional)').fill('TTT2026');
  await dialog.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/interactives\/_template\.html\?amplitude=3/);
  await expect(page.locator('.hsc-user__name')).toHaveText('Ms Rivera');
  await expect(page.locator('.badge-founding')).toBeVisible();
  expect(problems).toEqual([]);
});

test('next must stay on this site', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await page.goto('/signin.html?next=https%3A%2F%2Fexample.com%2F');
  await page.getByLabel('Access code').fill('TTT2026');
  await page.getByRole('button', { name: 'Enter' }).click();
  await expect(page).toHaveURL(/localhost:\d+\/(\?.*)?$/);
});

test('the template page runs: controls, readouts, URL state, toolbar, notes and try-this', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await signInLocal(page, { subjects: ['phy'] });
  await page.goto('/interactives/_template.html?test=1');
  await hscReady(page);

  // Readouts start at t = 0.
  await expect(page.locator('.readout').filter({ hasText: 'Period T' }).locator('.readout__number')).toHaveText('2.00');
  // Play for a moment, then pause: time advances.
  await page.keyboard.press('Space');
  await page.waitForTimeout(600);
  await page.keyboard.press('Space');
  const t = await page.evaluate(() => window.__hsc.getOutputs().t);
  expect(t).toBeGreaterThan(0.2);
  // Step forward 0.1 s with the "." key.
  await page.keyboard.press('.');
  expect(await page.evaluate(() => window.__hsc.getOutputs().t)).toBeCloseTo(t + 0.1, 9);
  // Reset.
  await page.keyboard.press('r');
  expect(await page.evaluate(() => window.__hsc.getOutputs().t)).toBe(0);

  // A number entry updates the engine and, after the debounce, the URL.
  const amp = page.getByLabel('Amplitude A', { exact: true });
  await amp.fill('3.5');
  await amp.press('Enter');
  expect(await page.evaluate(() => window.__hsc.getParams().amplitude)).toBe(3.5);
  await expect(page).toHaveURL(/amplitude=3\.5/);
  // Out-of-range entries are clamped.
  await amp.fill('99');
  await amp.press('Enter');
  expect(await page.evaluate(() => window.__hsc.getParams().amplitude)).toBe(5);

  // visibleWhen: turning the phasor off hides "Label the phasor".
  await expect(page.getByRole('switch', { name: /Label the phasor/ })).toBeVisible();
  await page.getByRole('switch', { name: /Rotating phasor/ }).click();
  await expect(page.getByRole('switch', { name: /Label the phasor/ })).toBeHidden();

  // Scenario presets.
  await page.getByLabel('Scenario', { exact: true }).selectOption('phase-shift');
  expect(await page.evaluate(() => window.__hsc.getParams().phase)).toBe(90);
  await expect(page).toHaveURL(/preset=phase-shift/);

  // Theme and presenter mode (focus the stage first: shortcuts are ignored while a field has focus).
  await page.locator('#hsc-stage').click();
  await page.keyboard.press('t');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.keyboard.press('p');
  await expect(page.locator('body')).toHaveClass(/is-presenter/);
  await expect(page.locator('.hsc-header')).toBeHidden();
  await page.keyboard.press('p');
  await page.keyboard.press('t');

  // Try this: three prompts.
  await expect(page.locator('.hsc-trythis li')).toHaveCount(3);

  // Teacher notes drawer renders markdown and maths.
  await page.getByRole('button', { name: 'Teacher notes' }).click();
  const notes = page.getByRole('dialog', { name: 'Teacher notes' });
  await expect(notes.getByRole('heading', { name: 'Misconceptions' })).toBeVisible();
  await expect(notes.locator('.katex').first()).toBeVisible();
  await page.keyboard.press('Escape');

  // Share: link and QR code.
  await page.getByRole('button', { name: 'Share link and QR code' }).click();
  const share = page.getByRole('dialog', { name: 'Share this scenario' });
  await expect(share.locator('.qr__code svg')).toBeVisible();
  await expect(share.getByLabel('Link', { exact: true })).toHaveValue(/_template\.html\?preset=phase-shift/);
  await page.keyboard.press('Escape');

  // CSV export.
  await page.keyboard.press('.');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download data (CSV)' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^_template-\d{8}-\d{4}\.csv$/);

  // Save scenario (local mode) and find it in storage.
  await page.getByRole('button', { name: 'Save scenario' }).click();
  await page.getByRole('dialog', { name: 'Save scenario' }).getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.toast').filter({ hasText: 'Saved' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('hsc:scenarios:local-google')));
  expect(saved).toHaveLength(1);
  expect(saved[0].params.phase).toBe(90);

  expect(await page.evaluate(() => window.__hsc.errors)).toEqual([]);
  expect(problems).toEqual([]);
});

test('URL params set the scenario and bad values are clamped quietly', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await signInLocal(page);
  await page.goto('/interactives/_template.html?test=1&amplitude=4&phase=-90&frequency=999&bogus=1&theme=dark');
  await hscReady(page);
  const p = await page.evaluate(() => window.__hsc.getParams());
  expect(p).toMatchObject({ amplitude: 4, phase: -90, frequency: 3 });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.toast')).toContainText('adjusted');
  expect(problems).toEqual([]);
});

test('embed mode skips sign-in and shows the slim bar', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await page.goto('/interactives/_template.html?embed=1&test=1');
  await hscReady(page);
  await expect(page).toHaveURL(/_template\.html/);
  await expect(page.locator('.hsc-embedbar')).toBeVisible();
  await expect(page.locator('.hsc-header')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Save scenario' })).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('an engine error shows a calm in-stage message with a reset button', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  await signInLocal(page);
  await page.goto('/interactives/_template.html?test=1');
  await hscReady(page);
  // Simulate an engine failure: make a draw throw during the next step.
  await page.evaluate(() => {
    const ctx = document.querySelector('#hsc-stage canvas').getContext('2d');
    ctx.arc = () => {
      throw new Error('test failure');
    };
  });
  await page.getByRole('button', { name: 'Step' }).click();
  await expect(page.locator('.hsc-stage-msg')).toBeVisible();
  await expect(page.locator('.hsc-stage-msg')).toContainText('The simulation stopped');
  await page.getByRole('button', { name: 'Reset the simulation' }).click();
  await expect(page.locator('.hsc-stage-msg')).toBeHidden();
  expect(await page.evaluate(() => window.__hsc.getOutputs().t)).toBe(0);
});

// Layout at every size: pages load cleanly and never scroll sideways.
for (const [name, path, signedIn] of [
  ['sign-in', '/signin.html', false],
  ['privacy', '/privacy.html', false],
  ['dashboard', '/', true],
  ['template', '/interactives/_template.html?test=1', true],
  ['styleguide', '/dev/styleguide.html', false],
]) {
  test(`${name} renders without console errors or sideways scroll`, async ({ page }) => {
    const problems = watchConsole(page);
    if (signedIn) await signInLocal(page);
    await page.goto(path);
    if (path.includes('test=1')) await hscReady(page);
    await page.waitForLoadState('networkidle');
    expect(await overflowsX(page)).toBe(false);
    expect(problems).toEqual([]);
  });
}
