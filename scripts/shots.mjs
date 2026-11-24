// npm run shots [-- <id | page path> ...] [-- --thumbs]
// Screenshots at desktop 1920×1080, tablet 1180×820 and phone 390×844 into test-results/shots/<id>/.
// With no ids: every catalog page that isn't `planned`, the reference template, and the platform pages
// (signin, dashboard, privacy, styleguide). An argument containing ".html" is a page path, e.g.
// dev/engines/particle2d.html#projectile (leading slash optional; Git Bash's path rewriting is undone).
// With --thumbs: also write site/assets/thumbs/<id>.png
// (the stage only, 640×360) for catalog pages. Runs against a built dist/ (`npm run build` first).
// Exits 1 if any page logs a console error or warning.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { DIST, ROOT, SITE, isMain } from './lib/paths.mjs';
import { ensureDir } from './lib/fsutil.mjs';
import { createServer } from './dev.mjs';

const require = createRequire(import.meta.url);

export const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080, scale: 1 },
  { name: 'tablet', width: 1180, height: 820, scale: 1 },
  { name: 'phone', width: 390, height: 844, scale: 2 },
];

const PLATFORM = {
  signin: { path: '/signin.html', signedIn: false },
  dashboard: { path: '/', signedIn: true },
  privacy: { path: '/privacy.html', signedIn: false },
  styleguide: { path: '/dev/styleguide.html', signedIn: false, fullPage: true },
  _template: { path: '/interactives/_template.html', signedIn: true, interactive: true },
};

function targetsFor(ids, catalog) {
  const pages = catalog.entries.filter((e) => e.kind === 'page');
  const fromCatalog = (e) => ({ id: e.id, path: e.path, signedIn: true, interactive: true, catalog: true });
  if (ids.length) {
    return ids.map((id) => {
      if (id.includes('.html')) {
        // Git Bash turns "/dev/x.html" into "C:/Program Files/Git/dev/x.html"; keep only the site path.
        const sitePath = `/${id.replace(/\\/g, '/').replace(/^.*?\/Git\//, '').replace(/^[A-Za-z]:\//, '').replace(/^\/+/, '')}`;
        const folder = sitePath.replace(/\.html/, '').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
        return { id: folder, path: sitePath, signedIn: true, interactive: /^\/(interactives|dev\/engines)\//.test(sitePath) };
      }
      if (PLATFORM[id]) return { id, ...PLATFORM[id] };
      const entry = catalog.entries.find((e) => e.id === id);
      if (!entry) throw new Error(`shots: unknown id "${id}"`);
      if (entry.kind === 'listing') return { ...fromCatalog(entry), path: entry.path };
      return fromCatalog(entry);
    });
  }
  return [...Object.entries(PLATFORM).map(([id, t]) => ({ id, ...t })), ...pages.filter((e) => e.status !== 'planned').map(fromCatalog)];
}

/** Add query flags to a path, keeping any #hash (e.g. an engine demo page's setup) at the end. */
function withFlags(p, flags) {
  const [pathAndQuery, hash] = p.split('#');
  return `${pathAndQuery}${pathAndQuery.includes('?') ? '&' : '?'}${flags}${hash ? `#${hash}` : ''}`;
}

async function signIn(context) {
  await context.addInitScript(() => {
    if (localStorage.getItem('hsc:session')) return;
    localStorage.setItem('hsc:session', JSON.stringify({ user: { id: 'local-google', kind: 'oauth', provider: 'google', email: null, name: 'Ms Rivera' } }));
    localStorage.setItem('hsc:profile:local-google', JSON.stringify({ displayName: 'Ms Rivera', school: '', subjects: [], founding: true }));
  });
}

export async function shots({ ids = [], thumbs = false, outDir = path.join(ROOT, 'test-results', 'shots') } = {}) {
  if (!fs.existsSync(path.join(DIST, 'catalog.json'))) throw new Error('dist/ is missing. Run `npm run build` first.');
  const catalog = JSON.parse(fs.readFileSync(path.join(DIST, 'catalog.json'), 'utf8'));
  const targets = targetsFor(ids, catalog);
  const { chromium } = require('@playwright/test');

  const server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch();
  const problems = [];
  const written = [];

  try {
    for (const target of targets) {
      for (const vp of VIEWPORTS) {
        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.scale, hasTouch: vp.name !== 'desktop' });
        if (target.signedIn) await signIn(context);
        const page = await context.newPage();
        page.on('console', (m) => {
          if (m.type() === 'error' || m.type() === 'warning') problems.push(`${target.id} [${vp.name}] ${m.type()}: ${m.text()}`);
        });
        page.on('pageerror', (e) => problems.push(`${target.id} [${vp.name}] pageerror: ${e.message}`));
        const url = target.interactive ? withFlags(target.path, 'test=1') : target.path;
        await page.goto(base + url, { waitUntil: 'networkidle' });
        if (target.interactive) {
          await page.waitForFunction(() => window.__hsc);
          await page.evaluate(() => window.__hsc.ready);
        }
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(250);
        const file = path.join(outDir, target.id, `${vp.name}.png`);
        ensureDir(path.dirname(file));
        await page.screenshot({ path: file, fullPage: Boolean(target.fullPage) });
        written.push(path.relative(ROOT, file));
        await context.close();
      }
      if (thumbs && target.catalog) {
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 0.5 });
        await signIn(context);
        const page = await context.newPage();
        await page.goto(`${base}${withFlags(target.path, 'test=1&present=1')}`, { waitUntil: 'networkidle' });
        await page.waitForFunction(() => window.__hsc);
        await page.evaluate(() => window.__hsc.ready);
        await page.waitForTimeout(250);
        const thumb = path.join(SITE, 'assets', 'thumbs', `${target.id}.png`);
        ensureDir(path.dirname(thumb));
        await page.locator('#hsc-stage').screenshot({ path: thumb });
        written.push(path.relative(ROOT, thumb));
        await context.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  return { written, problems };
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const ids = args.filter((a) => !a.startsWith('--'));
  shots({ ids, thumbs: args.includes('--thumbs') })
    .then(({ written, problems }) => {
      console.log(`shots: ${written.length} images`);
      for (const w of written) console.log(`  ${w.split(path.sep).join('/')}`);
      if (problems.length) {
        console.error(`shots: ${problems.length} console problem(s):\n  ${problems.join('\n  ')}`);
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error(`shots failed: ${err.message}`);
      process.exit(1);
    });
}
