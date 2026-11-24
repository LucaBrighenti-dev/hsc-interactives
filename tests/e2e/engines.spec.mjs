// Smoke test for every engine demo page (site/dev/engines/<name>.html), one test per setup:
// the page mounts, the engine reports no errors, the console stays clean, and no numeric output is
// NaN or ±Infinity, before and after stepping. Desktop only (see playwright.config.mjs testIgnore).
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { watchConsole, signInLocal, hscReady } from './helpers.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const DEV = path.join(ROOT, 'site', 'dev', 'engines');
const pages = fs.existsSync(DEV) ? fs.readdirSync(DEV).filter((f) => f.endsWith('.html')) : [];

function badOutputs(outputs) {
  return Object.entries(outputs ?? {})
    .filter(([, v]) => typeof v === 'number' && !Number.isFinite(v))
    .map(([k, v]) => `${k}=${v}`);
}

for (const file of pages) {
  const name = file.replace(/\.html$/, '');
  const indexFile = path.join(ROOT, 'site', 'assets', 'engines', name, 'index.js');
  if (!fs.existsSync(indexFile)) continue;
  const { meta } = await import(pathToFileURL(indexFile).href);
  const staticSetups = new Set(meta.staticSetups ?? []);

  test.describe(`engine demo ${name}`, () => {
    for (const setup of meta.setups) {
      test(`${name}#${setup} mounts and runs cleanly`, async ({ page }) => {
        const problems = watchConsole(page);
        await signInLocal(page);
        await page.goto(`/dev/engines/${file}?test=1#${setup}`);
        await hscReady(page);
        const before = await page.evaluate(() => window.__hsc.getOutputs());
        expect(badOutputs(before), 'non-finite outputs at t = 0').toEqual([]);
        if (!staticSetups.has(setup)) {
          await page.evaluate((n) => window.__hsc.step(n), Math.max(1, meta.stepSize ?? 1) * 20);
          const after = await page.evaluate(() => window.__hsc.getOutputs());
          expect(badOutputs(after), 'non-finite outputs after stepping').toEqual([]);
          const data = await page.evaluate(() => window.__hsc.getData());
          expect(Array.isArray(data?.columns) && Array.isArray(data?.rows), 'getData returns { columns, rows }').toBe(true);
        }
        expect(await page.evaluate(() => window.__hsc.errors)).toEqual([]);
        expect(problems).toEqual([]);
      });
    }
  });
}
