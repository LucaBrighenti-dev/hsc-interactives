// Acceptance runner (guide W0-13). For every catalog page with status review or live, plus the
// reference template, run each check in its spec's ```acceptance block through window.__hsc (§5.8).
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, acceptanceTargets, parseAcceptance, compare, readSpec } from '../lib/acceptance.mjs';

const catalogFile = path.join(ROOT, 'dist', 'catalog.json');
const entries = fs.existsSync(catalogFile) ? JSON.parse(fs.readFileSync(catalogFile, 'utf8')).entries : [];

test.describe('acceptance', () => {
  for (const target of acceptanceTargets(entries)) {
    const specFile = path.join(ROOT, target.spec);
    if (!fs.existsSync(specFile)) {
      test(`${target.id}: spec exists`, () => {
        throw new Error(`${target.spec} is missing`);
      });
      continue;
    }
    const { checks, error } = parseAcceptance(readSpec(target.spec));
    if (error) {
      test(`${target.id}: acceptance block is valid`, () => {
        throw new Error(`${target.spec}: ${error}`);
      });
      continue;
    }
    for (const check of checks) {
      test(`${target.id}: ${check.name}`, async ({ page }) => {
        const query = new URLSearchParams({ embed: '1', test: '1', ...(check.preset ? { preset: check.preset } : {}) });
        await page.goto(`${target.path}?${query}`);
        await page.waitForFunction(() => window.__hsc);
        await page.evaluate(() => window.__hsc.ready);
        const result = await page.evaluate(
          ({ params, run }) => {
            const h = window.__hsc;
            if (params && Object.keys(params).length) h.setParams(params);
            const applied = h.getParams();
            let info = null;
            if (run === 'complete') info = h.runUntilComplete(200000);
            else if (run && typeof run === 'object') h.step(run.steps);
            return { outputs: h.getOutputs(), applied, info, errors: h.errors };
          },
          { params: check.params ?? {}, run: check.run },
        );

        // Every param in the check must be accepted as written (an engine clamp means the spec is wrong).
        for (const [key, value] of Object.entries(check.params ?? {})) {
          expect(result.applied[key], `param ${key} was changed by the engine (out of range or unknown?)`).toEqual(value);
        }
        if (check.run === 'complete') expect(result.info?.complete, 'the run did not complete within 200 000 steps').toBe(true);
        expect(result.errors).toEqual([]);
        const failures = Object.entries(check.expect)
          .map(([key, exp]) => compare(key, result.outputs[key], exp))
          .filter(Boolean);
        expect(failures, failures.join('\n')).toEqual([]);
      });
    }
  }
});
