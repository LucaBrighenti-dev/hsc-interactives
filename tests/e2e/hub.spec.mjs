// Dashboard (W1-HUB, guide §6.5 and §9.3), end to end in local auth mode: filters and search with the URL
// round trip, subject chips saved to the profile, live cards, saved scenarios, playlists in sequence,
// requests and votes, the account area, account deletion, and layout at every size.
// No page is live yet, so tests that need live cards inject them into /catalog.json, pointing at the
// reference template (a page and a listing with a preset).
import { test, expect } from '@playwright/test';
import { watchConsole, signInLocal, hscReady, overflowsX } from './helpers.mjs';

const desktopOnly = (testInfo) => test.skip(testInfo.project.name !== 'desktop', 'interaction flow runs on desktop');

const LIVE = {
  'phy-projectile-lab': { path: '/interactives/_template.html' },
  'me1-projectile-vectors': { path: '/interactives/_template.html?preset=phase-shift' },
};

async function withLiveEntries(page) {
  await page.route('**/catalog.json', async (route) => {
    let response;
    let catalog;
    try {
      response = await route.fetch();
      catalog = await response.json();
    } catch {
      return; // the test finished while this request was in flight
    }
    for (const entry of catalog.entries) if (LIVE[entry.id]) Object.assign(entry, { status: 'live' }, LIVE[entry.id]);
    await route.fulfill({ response, json: catalog }).catch(() => {});
  });
}

/** The dashboard sets body[data-ready] once the catalogue and every panel have loaded. */
const hubReady = (page) => page.waitForSelector('body[data-ready="true"]');

/**
 * Filter labels that don't fit: each visible select's chosen option and the search placeholder, measured
 * in the control's own font against its content box. [] when every label is whole.
 */
const cutLabels = (page) =>
  page.evaluate(async () => {
    await document.fonts.ready;
    const ctx = document.createElement('canvas').getContext('2d');
    const out = [];
    const check = (node, text) => {
      const cs = getComputedStyle(node);
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const need = ctx.measureText(text).width;
      const room = node.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (need > room) out.push(`${node.id} "${text}" needs ${Math.ceil(need)} px, has ${Math.floor(room)} px`);
    };
    for (const sel of document.querySelectorAll('.hub-filters select')) if (sel.offsetParent) check(sel, sel.selectedOptions[0]?.textContent ?? '');
    const search = document.getElementById('hub-search');
    if (!search.value) check(search, search.placeholder);
    return out;
  });
const stored = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
const PROFILE = 'hsc:profile:local-google';

/** Saved scenarios, playlists and requests for the local-google teacher (runs before every page load). */
function seedWorkspace() {
  if (localStorage.getItem('hsc:scenarios:local-google')) return;
  const day = (d) => new Date(Date.UTC(2026, 10, d, 9)).toISOString();
  localStorage.setItem(
    'hsc:scenarios:local-google',
    JSON.stringify([
      { id: 's1', interactiveId: 'phy-projectile-lab', title: '45° launch for Year 11 Physics, with a long name to wrap', params: { amplitude: 3 }, createdAt: day(24) },
      { id: 's2', interactiveId: '_template', title: 'Phase shift demo', params: { amplitude: 2, phase: 90 }, createdAt: day(22) },
    ]),
  );
  localStorage.setItem(
    'hsc:playlists:local-google',
    JSON.stringify([
      { id: 'p1', title: 'Year 12 projectiles, lesson 3', items: [{ interactiveId: 'phy-projectile-lab' }, { interactiveId: 'me1-projectile-vectors', note: 'Ask for the components first' }, { interactiveId: 'phy-projectile-lab', params: { amplitude: 3 } }], createdAt: day(23) },
    ]),
  );
  localStorage.setItem(
    'hsc:requests',
    JSON.stringify([
      { id: 'r1', userId: 'someone', subject: 'phy', topic: 'Lenz’s law with a magnet falling through a coil', details: 'Induced current direction and the braking force as the magnet speeds up.', createdAt: day(20) },
      { id: 'r2', userId: 'local-google', subject: 'eng', topic: 'Bending stress in an I-beam', details: null, createdAt: day(21) },
    ]),
  );
  localStorage.setItem('hsc:votes', JSON.stringify([{ requestId: 'r1', userId: 'someone' }, { requestId: 'r1', userId: 'local-google' }, { requestId: 'r2', userId: 'local-google' }]));
}

test('filters and search narrow the grid, live in the URL and survive a reload', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await signInLocal(page, { subjects: ['phy'] });
  await page.goto('/');
  await hubReady(page);

  // The profile's subjects are the starting filter.
  const subjects = page.getByRole('group', { name: 'My subjects' });
  await expect(subjects.getByRole('button', { name: 'Physics' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.hub-section__title')).toHaveText(['Physics']);

  await page.getByLabel('Syllabus', { exact: true }).selectOption('2025');
  await page.getByLabel('Focus area', { exact: true }).selectOption('Advanced mechanics');
  await expect(page.locator('.hub-card')).toHaveCount(3);
  await page.getByLabel('Search interactives').fill('orbit');
  await expect(page.locator('.hub-card__title')).toHaveText(['Orbit lab']);
  await page.getByLabel('Status', { exact: true }).selectOption('soon');
  await expect(page).toHaveURL(/\/\?q=orbit&subject=phy&syllabus=2025&focus=Advanced\+mechanics&status=soon$/);
  await expect(page.locator('.hub-count')).toHaveText('1 of 76 interactives');

  // Round trip: a different profile, the same link, the same view (the URL wins over the profile).
  const shared = page.url();
  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ ...JSON.parse(localStorage.getItem(key)), subjects: ['eng'] })), PROFILE);
  await page.goto(shared);
  await hubReady(page);
  await expect(page.getByLabel('Search interactives')).toHaveValue('orbit');
  await expect(page.getByLabel('Syllabus', { exact: true })).toHaveValue('2025');
  await expect(page.getByLabel('Focus area', { exact: true })).toHaveValue('Advanced mechanics');
  await expect(page.getByLabel('Status', { exact: true })).toHaveValue('soon');
  await expect(subjects.getByRole('button', { name: 'Physics' })).toHaveAttribute('aria-pressed', 'true');
  await expect(subjects.getByRole('button', { name: 'Engineering' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.hub-card__title')).toHaveText(['Orbit lab']);

  // Clear filters keeps the subjects.
  await page.locator('.hub-results').getByRole('button', { name: 'Clear filters' }).click();
  await expect(page).toHaveURL(/\/\?subject=phy$/);
  await expect(page.locator('.hub-card')).toHaveCount(26);
  await expect(page.getByLabel('Search interactives')).toBeFocused();

  // A–Z: one section per status, each sorted by title.
  await page.getByRole('radio', { name: 'A–Z' }).click();
  await expect(page).toHaveURL(/view=az/);
  await expect(page.locator('.hub-section__title')).toHaveText(['Coming soon']);
  const titles = await page.locator('.hub-card__title').allTextContents();
  expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, 'en-AU')));

  // No match: a friendly empty state that offers to request it.
  await page.getByLabel('Search interactives').fill('wormholes');
  await expect(page.locator('.hub-card')).toHaveCount(0);
  await expect(page.getByText('Nothing matches that yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Request “wormholes”' }).click();
  const form = page.getByRole('dialog', { name: 'Request an interactive' });
  await expect(form.getByLabel('Topic')).toHaveValue('wormholes');
  await expect(form.getByLabel('Subject')).toHaveValue('phy');
  await form.getByRole('button', { name: 'Cancel' }).click();

  // The shell's breadcrumb link (?subject=<id>) still works, and does not change the profile.
  await page.goto('/?subject=me2');
  await hubReady(page);
  await expect(subjects.getByRole('button', { name: 'Maths Ext 2' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.hub-section__title')).toHaveText(['Maths Extension 2']);
  expect((await stored(page, PROFILE)).subjects).toEqual(['eng']);

  // The skip link jumps past the workspace to the catalogue.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to the interactives' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#hub-catalog')).toBeFocused();
  expect(problems).toEqual([]);
});

test('the subject chips are saved to the profile', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await signInLocal(page);
  await page.goto('/');
  await hubReady(page);
  const subjects = page.getByRole('group', { name: 'My subjects' });
  await expect(subjects.getByRole('button', { name: 'All subjects' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.hub-section')).toHaveCount(4);

  await subjects.getByRole('button', { name: 'Maths Ext 2' }).click();
  await subjects.getByRole('button', { name: 'Maths Ext 1' }).click();
  await expect(page.locator('.hub-saved')).toHaveText('Saved to your profile');
  await expect(page.locator('.hub-section__title')).toHaveText(['Maths Extension 1', 'Maths Extension 2']);
  await expect.poll(async () => (await stored(page, PROFILE)).subjects).toEqual(['me1', 'me2']);

  // A fresh visit opens on the saved subjects.
  await page.goto('/');
  await hubReady(page);
  await expect(subjects.getByRole('button', { name: 'Maths Ext 1' })).toHaveAttribute('aria-pressed', 'true');
  await expect(subjects.getByRole('button', { name: 'Physics' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.hub-section__title')).toHaveText(['Maths Extension 1', 'Maths Extension 2']);

  // Widening the view from a search that found nothing is temporary: the profile keeps its subjects,
  // and the link says "all" so it shows the same view to whoever opens it.
  await page.getByLabel('Search interactives').fill('wormholes');
  await page.getByRole('button', { name: 'Show all subjects' }).click();
  await expect(subjects.getByRole('button', { name: 'All subjects' })).toBeFocused();
  await expect(subjects.getByRole('button', { name: 'All subjects' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/\/\?q=wormholes&subject=all$/);
  await expect(page.locator('.hub-saved')).toHaveText('');
  await page.getByLabel('Search interactives').fill('');
  await expect(page.locator('.hub-section')).toHaveCount(4);
  expect((await stored(page, PROFILE)).subjects).toEqual(['me1', 'me2']);
  await page.reload();
  await hubReady(page);
  await expect(page.locator('.hub-section')).toHaveCount(4);

  // Pressing the "All subjects" chip is a choice, so it is saved.
  await page.goto('/');
  await hubReady(page);
  await expect(page.locator('.hub-section')).toHaveCount(2);
  await subjects.getByRole('button', { name: 'All subjects' }).click();
  await expect(page.locator('.hub-section')).toHaveCount(4);
  await expect.poll(async () => (await stored(page, PROFILE)).subjects).toEqual([]);
  await expect(page).toHaveURL(/\/$/);
  expect(problems).toEqual([]);
});

test('a malformed stored profile does not stop the dashboard', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await page.addInitScript(() => {
    localStorage.setItem('hsc:session', JSON.stringify({ user: { id: 'local-google', kind: 'oauth', provider: 'google', email: null, name: 'Test Teacher' } }));
    localStorage.setItem('hsc:profile:local-google', JSON.stringify({ displayName: ['not', 'text'], school: null, subjects: 'phy', founding: false }));
  });
  await page.goto('/');
  await hubReady(page);
  await expect(page.locator('.hub-section')).toHaveCount(4);
  await expect(page.locator('[data-greeting]')).toHaveText(/^Good (morning|afternoon|evening)/);
  await page.getByRole('button', { name: 'Request an interactive' }).click();
  await expect(page.getByRole('dialog', { name: 'Request an interactive' }).getByLabel('Subject')).toHaveValue('phy');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Account' }).click();
  const account = page.getByRole('dialog', { name: 'Your account' });
  await expect(account.getByRole('group', { name: 'Subjects you teach' }).getByRole('button', { pressed: true })).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('the dashboard has no embed mode: /?embed=1 still needs a session', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await page.goto('/?embed=1');
  await expect(page).toHaveURL(/\/signin\.html\?next=%2F$/);
  await signInLocal(page);
  await page.goto('/?embed=1');
  await hubReady(page);
  await expect(page.getByRole('button', { name: 'Account' })).toBeVisible();
  await expect(page.locator('.hub-side .msg--error')).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('live cards open their page, listings carry their preset, and live cards come first', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await withLiveEntries(page);
  await signInLocal(page);
  await page.goto('/');
  await hubReady(page);
  await expect(page.locator('.hub-card.is-live')).toHaveCount(2);
  await expect(page.locator('[data-summary]')).toContainText('2 ready to use, 74 more on the way.');

  // Live first within its subject (Projectile lab would otherwise sort after Double slit).
  const physics = page.getByRole('region', { name: 'Physics', exact: true });
  const first = physics.locator('.hub-card').first();
  await expect(first).toHaveClass(/is-live/);
  await expect(first.locator('.hub-card__badge')).toHaveText('Live');
  await expect(first.getByRole('link', { name: 'Projectile lab' })).toHaveAttribute('href', '/interactives/_template.html');
  await expect(page.getByRole('link', { name: 'Projectile motion with vectors' })).toHaveAttribute('href', '/interactives/_template.html?preset=phase-shift');
  await expect(page.locator('.hub-card.is-soon').first().locator('.hub-card__badge')).toHaveText('Coming soon');
  await expect(page.locator('.hub-card.is-soon a, .hub-card.is-soon button')).toHaveCount(0);
  // Priority is never shown.
  await expect(page.locator('main')).not.toContainText(/\bP[012]\b/);

  await page.getByLabel('Status', { exact: true }).selectOption('live');
  await expect(page.locator('.hub-card')).toHaveCount(2);
  await page.getByRole('link', { name: 'Projectile motion with vectors' }).click();
  await expect(page).toHaveURL(/\/interactives\/_template\.html\?preset=phase-shift/);
  await page.waitForLoadState('networkidle');
  expect(problems).toEqual([]);
});

test('a scenario saved on a page appears on the dashboard, opens with the same values, shares and deletes', async ({ page, context }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await signInLocal(page);
  await page.goto('/interactives/_template.html?test=1');
  await hscReady(page);
  await page.getByLabel('Scenario', { exact: true }).selectOption('phase-shift');
  const amp = page.getByLabel('Amplitude A', { exact: true });
  await amp.fill('3.5');
  await amp.press('Enter');
  await page.getByRole('button', { name: 'Save scenario' }).click();
  const saveDialog = page.getByRole('dialog', { name: 'Save scenario' });
  await saveDialog.getByLabel('Name this scenario').fill('Phase demo for Year 11');
  await saveDialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.toast').filter({ hasText: 'Saved' })).toBeVisible();
  const params = await page.evaluate(() => window.__hsc.getParams());
  expect(params).toMatchObject({ amplitude: 3.5, phase: 90 });

  await page.goto('/');
  await hubReady(page);
  const panel = page.getByRole('region', { name: 'My saved scenarios' });
  await expect(panel.locator('.hub-item__title')).toHaveText(['Phase demo for Year 11']);
  await expect(panel.locator('.hub-item__meta')).toContainText('Reference template');
  const open = panel.getByRole('link', { name: 'Open Phase demo for Year 11' });
  const href = await open.getAttribute('href');
  expect(href).toMatch(/^\/interactives\/_template\.html\?.*amplitude=3\.5/);
  const absolute = new URL(href, page.url()).toString();

  // Copy link.
  await panel.getByRole('button', { name: 'Copy link to Phase demo for Year 11' }).click();
  await expect(page.locator('.toast').filter({ hasText: 'Link copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(absolute);

  // QR code, with the same link.
  await panel.getByRole('button', { name: 'QR code for Phase demo for Year 11' }).click();
  const share = page.getByRole('dialog', { name: 'Share this scenario' });
  await expect(share.locator('.qr__code svg')).toBeVisible();
  await expect(share.getByLabel('Link', { exact: true })).toHaveValue(absolute);
  await page.keyboard.press('Escape');
  await expect(share).toBeHidden();

  // Open: the page starts with exactly the saved values.
  await open.click();
  await expect(page).toHaveURL(/\/interactives\/_template\.html\?.*amplitude=3\.5/);
  await page.goto(`${href}&test=1`);
  await hscReady(page);
  expect(await page.evaluate(() => window.__hsc.getParams())).toEqual(params);

  // Delete, confirmed in a modal.
  await page.goto('/');
  await hubReady(page);
  await panel.getByRole('button', { name: 'Delete Phase demo for Year 11' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete this scenario?' });
  await confirm.getByRole('button', { name: 'Delete scenario' }).click();
  await expect(confirm).toBeHidden();
  await expect(panel.getByText('Nothing saved yet.')).toBeVisible();
  expect(await stored(page, 'hsc:scenarios:local-google')).toEqual([]);
  expect(problems).toEqual([]);
});

test('playlists: create, add from the picker and a card, reorder, add a note, open in sequence, delete', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await withLiveEntries(page);
  await signInLocal(page);
  await page.goto('/');
  await hubReady(page);
  const panel = page.getByRole('region', { name: 'My playlists' });
  await expect(panel.getByText('No playlists yet.')).toBeVisible();

  // Create, then add the first step with the picker.
  await panel.getByRole('button', { name: 'New playlist' }).click();
  const naming = page.getByRole('dialog', { name: 'New playlist' });
  await naming.getByRole('button', { name: 'Create playlist' }).click();
  await expect(naming.getByRole('alert')).toHaveText('Give the playlist a name.');
  await naming.getByLabel('Playlist name').fill('Projectiles, lesson 3');
  await naming.getByRole('button', { name: 'Create playlist' }).click();
  const editor = page.getByRole('dialog', { name: 'Edit playlist' });
  await expect(editor).toBeVisible();
  await editor.getByLabel('Add a step').selectOption('entry:phy-projectile-lab');
  await editor.getByRole('button', { name: 'Add step' }).click();
  await expect(editor.locator('.hub-step__title')).toHaveText(['Projectile lab']);
  await editor.getByRole('button', { name: 'Done' }).click();
  await expect(editor).toBeHidden();

  // Add the second step from a card's action.
  await page.getByRole('button', { name: 'Add Projectile motion with vectors to a playlist' }).click();
  const chooser = page.getByRole('dialog', { name: 'Add to a playlist' });
  await chooser.getByRole('button', { name: /Projectiles, lesson 3/ }).click();
  await expect(page.locator('.toast').filter({ hasText: 'Added to “Projectiles, lesson 3” as step 2.' })).toBeVisible();
  await expect(panel.locator('.hub-preview__title')).toHaveText(['Projectile lab', 'Projectile motion with vectors']);

  // Reorder with the keyboard, and add a note.
  await panel.getByRole('button', { name: 'Edit playlist: Projectiles, lesson 3' }).click();
  await editor.getByRole('button', { name: 'Move step 2 up: Projectile motion with vectors' }).focus();
  await page.keyboard.press('Enter');
  await expect(editor.locator('.hub-step__title')).toHaveText(['Projectile motion with vectors', 'Projectile lab']);
  // Focus stays with the moved step: its up button is now disabled, so focus moves to its down button.
  await expect(editor.getByRole('button', { name: 'Move step 1 down: Projectile motion with vectors' })).toBeFocused();
  const note = editor.getByLabel('Note for step 1: Projectile motion with vectors');
  await note.fill('Ask for the components first');
  await note.press('Enter');
  await editor.getByRole('button', { name: 'Done' }).click();
  // The panel re-renders after the editor closes; focus goes back to this playlist's Edit button.
  await expect(panel.getByRole('button', { name: 'Edit playlist: Projectiles, lesson 3' })).toBeFocused();
  await expect(panel.locator('.hub-preview__title')).toHaveText(['Projectile motion with vectors', 'Projectile lab']);
  await expect(panel.locator('.hub-preview__note')).toHaveText(['Ask for the components first']);
  const [saved] = await stored(page, 'hsc:playlists:local-google');
  expect(saved.title).toBe('Projectiles, lesson 3');
  expect(saved.items).toEqual([{ interactiveId: 'me1-projectile-vectors', note: 'Ask for the components first' }, { interactiveId: 'phy-projectile-lab' }]);

  // Open in sequence: the first step's page with ?playlist=<id>&i=0, where the shell shows the playlist bar.
  const play = panel.getByRole('link', { name: 'Open in sequence: Projectiles, lesson 3' });
  await expect(play).toHaveAttribute('href', `/interactives/_template.html?preset=phase-shift&playlist=${saved.id}&i=0`);
  await play.click();
  await expect(page).toHaveURL(new RegExp(`/interactives/_template\\.html\\?preset=phase-shift&(.*&)?playlist=${saved.id}&i=0$`));
  const bar = page.locator('.hsc-playlist');
  await expect(bar).toBeVisible();
  await expect(bar).toContainText('Projectiles, lesson 3 · 1 of 2');
  await bar.getByRole('link', { name: 'Next in playlist' }).click();
  await expect(page).toHaveURL(new RegExp(`/interactives/_template\\.html\\?(.*&)?playlist=${saved.id}&i=1$`));
  await expect(page.locator('.hsc-playlist')).toContainText('2 of 2');

  // Delete, confirmed in a modal.
  await page.goto('/');
  await hubReady(page);
  await panel.getByRole('button', { name: 'Delete playlist: Projectiles, lesson 3' }).click();
  await page.getByRole('dialog', { name: 'Delete this playlist?' }).getByRole('button', { name: 'Delete playlist' }).click();
  await expect(panel.getByText('No playlists yet.')).toBeVisible();
  expect(await stored(page, 'hsc:playlists:local-google')).toEqual([]);
  expect(problems).toEqual([]);
});

test('requests: ask for an interactive, then vote and unvote; the list is sorted by votes', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await signInLocal(page);
  await page.addInitScript(() => {
    if (localStorage.getItem('hsc:requests')) return;
    localStorage.setItem(
      'hsc:requests',
      JSON.stringify([
        { id: 'r-old', userId: 'teacher-a', subject: 'phy', topic: 'Lenz’s law with a falling magnet', details: null, createdAt: '2026-11-20T09:00:00.000Z' },
        { id: 'r-new', userId: 'teacher-b', subject: 'me1', topic: 'Related rates with a filling cone', details: 'Water depth and volume side by side', createdAt: '2026-11-21T09:00:00.000Z' },
      ]),
    );
    localStorage.setItem('hsc:votes', JSON.stringify([{ requestId: 'r-old', userId: 'teacher-a' }, { requestId: 'r-old', userId: 'teacher-c' }, { requestId: 'r-new', userId: 'teacher-b' }]));
  });
  await page.goto('/');
  await hubReady(page);
  const panel = page.getByRole('region', { name: 'Requests' });
  const topics = panel.locator('.hub-request__topic');
  await expect(topics).toHaveText(['Lenz’s law with a falling magnet', 'Related rates with a filling cone']);

  await panel.getByRole('button', { name: 'Request an interactive' }).click();
  const form = page.getByRole('dialog', { name: 'Request an interactive' });
  await form.getByRole('button', { name: 'Send request' }).click();
  await expect(form.getByRole('alert')).toHaveText('Describe the topic in a few words.');
  await form.getByLabel('Subject').selectOption('eng');
  await form.getByLabel('Topic').fill('Bending stress in an I-beam');
  await form.getByLabel('Details (optional)').fill('Neutral axis and the stress distribution');
  await form.getByRole('button', { name: 'Send request' }).click();
  await expect(form).toBeHidden();

  // A new request carries its author's vote, and ties go to the newest.
  await expect(topics).toHaveText(['Lenz’s law with a falling magnet', 'Bending stress in an I-beam', 'Related rates with a filling cone']);
  const mine = panel.getByRole('button', { name: /^Vote for Bending stress/ });
  await expect(mine).toHaveAttribute('aria-pressed', 'true');
  await expect(mine).toHaveAccessibleName('Vote for Bending stress in an I-beam (1 vote)');
  await expect(panel.locator('.hub-request').filter({ hasText: 'Bending stress' })).toContainText('Your request');
  const row = (await stored(page, 'hsc:requests')).find((r) => r.topic === 'Bending stress in an I-beam');
  expect(row).toMatchObject({ subject: 'eng', details: 'Neutral axis and the stress distribution', userId: 'local-google' });

  // Unvote, then vote again; focus stays on the button.
  await mine.click();
  await expect(mine).toHaveAttribute('aria-pressed', 'false');
  await expect(mine.locator('.hub-vote__n')).toHaveText('0');
  await expect(mine).toBeFocused();
  await expect(topics).toHaveText(['Lenz’s law with a falling magnet', 'Related rates with a filling cone', 'Bending stress in an I-beam']);
  await mine.click();
  await expect(mine).toHaveAttribute('aria-pressed', 'true');
  await expect(mine.locator('.hub-vote__n')).toHaveText('1');

  // A vote moves a request up.
  const cone = panel.getByRole('button', { name: /^Vote for Related rates/ });
  await cone.click();
  await expect(cone.locator('.hub-vote__n')).toHaveText('2');
  await expect(topics).toHaveText(['Related rates with a filling cone', 'Lenz’s law with a falling magnet', 'Bending stress in an I-beam']);
  expect(problems).toEqual([]);
});

test('requests: the top five come first, and "Show all" keeps keyboard focus', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await signInLocal(page);
  await page.addInitScript(() => {
    if (localStorage.getItem('hsc:requests')) return;
    const rows = Array.from({ length: 7 }, (_, i) => ({ id: `r${i}`, userId: `t${i}`, subject: 'phy', topic: `Topic ${i}`, details: null, createdAt: `2026-11-1${i}T09:00:00.000Z` }));
    localStorage.setItem('hsc:requests', JSON.stringify(rows));
    // Request i has i votes.
    localStorage.setItem('hsc:votes', JSON.stringify(rows.flatMap((r, i) => Array.from({ length: i }, (_, k) => ({ requestId: r.id, userId: `v${k}` })))));
  });
  await page.goto('/');
  await hubReady(page);
  const panel = page.getByRole('region', { name: 'Requests' });
  await expect(panel.locator('.hub-request__topic')).toHaveText(['Topic 6', 'Topic 5', 'Topic 4', 'Topic 3', 'Topic 2']);
  await panel.getByRole('button', { name: 'Show all 7 requests' }).focus();
  await page.keyboard.press('Enter');
  await expect(panel.locator('.hub-request')).toHaveCount(7);
  await expect(panel.getByRole('button', { name: 'Show the top 5' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(panel.locator('.hub-request')).toHaveCount(5);
  await expect(panel.getByRole('button', { name: 'Show all 7 requests' })).toBeFocused();
  expect(problems).toEqual([]);
});

test('the account area edits the profile and adds the Founding Educator badge', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await signInLocal(page, { name: 'Test Teacher' });
  await page.goto('/');
  await hubReady(page);
  await expect(page.locator('[data-greeting]')).toHaveText(/^Good (morning|afternoon|evening), Test$/);
  await expect(page.locator('.badge-founding')).toHaveCount(0);

  await page.getByRole('button', { name: 'Account' }).click();
  const dlg = page.getByRole('dialog', { name: 'Your account' });
  await dlg.getByLabel('Display name').fill('Dr Okafor');
  await dlg.getByLabel('School (optional)').fill('Riverside High School');
  const subjects = dlg.getByRole('group', { name: 'Subjects you teach' });
  await subjects.getByRole('button', { name: 'Physics' }).click();
  await subjects.getByRole('button', { name: 'Engineering Studies' }).click();
  await dlg.getByRole('button', { name: 'Save changes' }).click();
  await expect(dlg).toBeHidden();
  await expect(page.locator('.toast').filter({ hasText: 'Profile saved.' })).toBeVisible();
  await expect(page.locator('[data-greeting]')).toHaveText(/, Dr Okafor$/);
  await expect(page.locator('.hsc-user__name')).toHaveText('Dr Okafor');
  await expect(page.getByRole('group', { name: 'My subjects' }).getByRole('button', { name: 'Physics' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.hub-section__title')).toHaveText(['Physics', 'Engineering Studies']);
  expect(await stored(page, PROFILE)).toMatchObject({ displayName: 'Dr Okafor', school: 'Riverside High School', subjects: ['phy', 'eng'] });

  // The event code adds the Founding Educator badge; a wrong one says so without losing the profile.
  await page.getByRole('button', { name: 'Account' }).click();
  await dlg.getByLabel('Event access code (optional)').fill('NOPE');
  await dlg.getByRole('button', { name: 'Save changes' }).click();
  await expect(dlg.getByRole('alert')).toContainText('did not work');
  await dlg.getByLabel('Event access code (optional)').fill('ttt2026');
  await dlg.getByRole('button', { name: 'Save changes' }).click();
  await expect(dlg).toBeHidden();
  await expect(page.locator('.badge-founding')).toBeVisible();
  expect(problems).toEqual([]);
});

test('delete account: confirmed in a modal, removes everything, then goes to sign-in', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  // Seed once, without an init script, so nothing signs the user back in after the deletion.
  await page.goto('/privacy.html');
  await page.evaluate(() => {
    localStorage.setItem('hsc:session', JSON.stringify({ user: { id: 'local-google', kind: 'oauth', provider: 'google', email: null, name: 'Test Teacher' } }));
    localStorage.setItem('hsc:profile:local-google', JSON.stringify({ displayName: 'Test Teacher', school: 'Riverside High School', subjects: ['phy'], founding: true }));
    localStorage.setItem('hsc:scenarios:local-google', JSON.stringify([{ id: 's1', interactiveId: '_template', title: 'Kept for later', params: { amplitude: 2 }, createdAt: '2026-11-24T09:00:00.000Z' }]));
    localStorage.setItem('hsc:playlists:local-google', JSON.stringify([{ id: 'p1', title: 'Lesson 1', items: [], createdAt: '2026-11-24T09:00:00.000Z' }]));
    localStorage.setItem('hsc:requests', JSON.stringify([
      { id: 'r1', userId: 'local-google', subject: 'phy', topic: 'Mine', details: null, createdAt: '2026-11-24T09:00:00.000Z' },
      { id: 'r2', userId: 'someone', subject: 'phy', topic: 'Theirs', details: null, createdAt: '2026-11-23T09:00:00.000Z' },
    ]));
    localStorage.setItem('hsc:votes', JSON.stringify([{ requestId: 'r1', userId: 'local-google' }, { requestId: 'r2', userId: 'local-google' }, { requestId: 'r2', userId: 'someone' }]));
  });
  await page.goto('/');
  await hubReady(page);
  await page.getByRole('button', { name: 'Account' }).click();
  const account = page.getByRole('dialog', { name: 'Your account' });
  await account.getByRole('button', { name: 'Delete account' }).click();
  const confirm = page.getByRole('dialog', { name: 'Delete your account?' });
  // Changing your mind is safe.
  await confirm.getByRole('button', { name: 'Keep my account' }).click();
  await expect(confirm).toBeHidden();
  expect(await stored(page, 'hsc:session')).not.toBeNull();

  await account.getByRole('button', { name: 'Delete account' }).click();
  await confirm.getByRole('button', { name: 'Delete my account' }).click();
  await expect(page).toHaveURL(/\/signin\.html$/);
  const left = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, JSON.parse(localStorage.getItem(k))])));
  expect(left['hsc:session']).toBeUndefined();
  expect(left['hsc:profile:local-google']).toBeUndefined();
  expect(left['hsc:scenarios:local-google']).toBeUndefined();
  expect(left['hsc:playlists:local-google']).toBeUndefined();
  expect(left['hsc:requests'].map((r) => r.id)).toEqual(['r2']);
  expect(left['hsc:votes']).toEqual([{ requestId: 'r2', userId: 'someone' }]);
  expect(problems).toEqual([]);
});

// Laptops and projectors between the tablet and full-HD layouts, where the catalogue shares the row with
// the 400 px workspace column: 1280×720 (a projector mode, or a 1080p laptop at 150 % scaling), 1366×768,
// 1440×900 (MacBook Air), 1536×864 (1080p at 125 %), plus 1024×768 and 1200 px (where the layout switches).
test('the filter bar keeps whole labels at laptop and projector sizes', async ({ page }, testInfo) => {
  desktopOnly(testInfo);
  const problems = watchConsole(page);
  await withLiveEntries(page);
  await signInLocal(page, { founding: true, name: 'Ms Rivera' });
  await page.addInitScript(seedWorkspace);
  await page.goto('/');
  await hubReady(page);
  for (const [width, height] of [
    [1280, 720],
    [1366, 768],
    [1440, 900],
    [1536, 864],
    [1200, 800],
    [1024, 768],
  ]) {
    await page.setViewportSize({ width, height });
    await expect.poll(() => cutLabels(page), { message: `filter labels at ${width}×${height}` }).toEqual([]);
    expect(await overflowsX(page), `sideways scroll at ${width}×${height}`).toBe(false);
    // Every filter is on screen without unfolding anything.
    for (const id of ['#hub-search', '#hub-syllabus', '#hub-focus', '#hub-status']) await expect(page.locator(id)).toBeVisible();
  }
  expect(problems).toEqual([]);
});

// Every size: the dashboard with saved data, every panel and the filters open, then the playlist editor.
test('the full dashboard fits every screen: no sideways scroll, 44 px targets, no console errors', async ({ page }) => {
  const problems = watchConsole(page);
  await withLiveEntries(page);
  await signInLocal(page, { founding: true, name: 'Ms Rivera' });
  await page.addInitScript(seedWorkspace);
  await page.goto('/');
  await hubReady(page);
  await expect(page.locator('[data-greeting]')).toHaveText(/, Ms Rivera$/);
  for (const toggle of await page.locator('.hub-panel__toggle').all()) {
    if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click();
  }
  const more = page.locator('.hub-more');
  if (await more.isVisible()) await more.click();
  await expect(page.locator('#hub-syllabus')).toBeVisible();
  await expect(page.locator('.hub-request')).toHaveCount(2);

  const tooSmall = (root) =>
    page.evaluate((selector) => {
      const out = [];
      for (const node of document.querySelectorAll(`${selector} :is(button, a.btn, select, input)`)) {
        const r = node.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (r.height < 43.5 || r.width < 43.5) out.push(`${node.getAttribute('aria-label') || node.textContent.trim() || node.tagName} ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
      return out;
    }, root);
  expect(await overflowsX(page)).toBe(false);
  expect(await tooSmall('.hub-header, .hub-main')).toEqual([]);
  expect(await cutLabels(page)).toEqual([]);

  // The playlist editor at this size.
  await page.getByRole('button', { name: 'Edit playlist: Year 12 projectiles, lesson 3' }).click();
  const editor = page.getByRole('dialog', { name: 'Edit playlist' });
  await expect(editor.locator('.hub-step')).toHaveCount(3);
  expect(await overflowsX(page)).toBe(false);
  const box = await editor.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
  expect(await tooSmall('dialog[open]')).toEqual([]);
  await page.keyboard.press('Escape');

  // The account dialog at this size.
  await page.getByRole('button', { name: 'Account' }).click();
  await expect(page.getByRole('dialog', { name: 'Your account' })).toBeVisible();
  expect(await overflowsX(page)).toBe(false);
  expect(await tooSmall('dialog[open]')).toEqual([]);
  expect(problems).toEqual([]);
});
