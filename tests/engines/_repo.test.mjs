// Repository consistency checks that run with `npm test` (fast, no browser):
//  - catalog fragments are valid and match docs/backlog.json; generated stubs are in sync
//  - specs with status draft/approved have a valid acceptance block whose params and outputs exist
//    in the engine's meta (once that engine exists)
//  - teacher notes that are not stubs use the fixed headings in order (guide §5.9)
//  - pages in review or live have their HTML, notes, approved spec and listing presets
//  - render.yaml sends the same Content-Security-Policy as the dev server
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadCatalog } from '../../scripts/lib/catalog.mjs';
import { generate, NOTES_STUB_MARKER } from '../../scripts/generate-from-backlog.mjs';
import { CSP } from '../../scripts/lib/headers.mjs';
import { paramsFor } from '../../site/assets/state.js';
import { ROOT, frontmatter, parseAcceptance } from '../lib/acceptance.mjs';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const backlog = JSON.parse(read('docs/backlog.json'));
const { entries, errors } = loadCatalog();

test('catalog fragments are valid', () => {
  assert.deepEqual(errors, []);
});

test('catalog and backlog list the same ids', () => {
  const fromBacklog = [...backlog.pages, ...backlog.listings].map((e) => e.id).sort();
  const fromCatalog = entries.map((e) => e.id).sort();
  assert.deepEqual(fromCatalog, fromBacklog);
});

test('generated stubs are in sync with the backlog (run `npm run generate`)', () => {
  assert.deepEqual(generate({ check: true, quiet: true }), []);
});

async function engineMeta(engine, id) {
  const dir = engine === 'custom' ? path.join(ROOT, 'site/assets/engines/custom', id) : path.join(ROOT, 'site/assets/engines', engine);
  const file = path.join(dir, 'index.js');
  if (!fs.existsSync(file)) return null;
  return (await import(pathToFileURL(file).href)).meta;
}

const specFiles = fs.readdirSync(path.join(ROOT, 'specs')).filter((f) => f.endsWith('.md') && f !== '_TEMPLATE.md');
for (const file of specFiles) {
  const md = read(`specs/${file}`);
  const fm = frontmatter(md);
  if (fm.status !== 'draft' && fm.status !== 'approved') continue;
  test(`spec ${file}: acceptance block matches the engine`, async () => {
    const { checks, error } = parseAcceptance(md);
    assert.equal(error, null, error ?? '');
    const meta = await engineMeta(fm.engine, fm.id);
    if (!meta) return; // engine not merged yet: Gate B reviews the numbers; this check runs once it lands
    const setup = fm.setup && fm.setup !== 'none' ? fm.setup : meta.setups[0];
    assert.ok(meta.setups.includes(setup), `engine ${meta.name} has no setup "${setup}"`);
    const params = new Map(paramsFor(meta.params, setup));
    for (const c of checks) {
      for (const key of Object.keys(c.params ?? {})) assert.ok(params.has(key), `"${c.name}": ${key} is not a param of ${meta.name}/${setup}`);
      for (const key of Object.keys(c.expect)) {
        const out = meta.outputs?.[key];
        assert.ok(out && (!out.setups || out.setups.includes(setup)), `"${c.name}": ${key} is not an output of ${meta.name}/${setup}`);
      }
    }
  });
}

const NOTES_H2 = ['Misconceptions', '10-minute lesson flow', 'Try this: answers', 'Original HSC-style question', 'Assumptions and limits', 'Syllabus links'];
const notesDir = path.join(ROOT, 'site/content/notes');
for (const file of fs.readdirSync(notesDir).filter((f) => f.endsWith('.md'))) {
  const md = fs.readFileSync(path.join(notesDir, file), 'utf8');
  if (md.startsWith(NOTES_STUB_MARKER)) continue;
  test(`notes ${file}: fixed headings in order`, () => {
    const h2 = [...md.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1]);
    assert.deepEqual(h2, NOTES_H2, 'notes must use exactly these ## headings, in this order (guide §5.9)');
    const question = md.indexOf('## Original HSC-style question');
    const worked = md.indexOf('### Worked solution');
    const after = md.indexOf('## Assumptions and limits');
    assert.ok(worked > question && worked < after, '### Worked solution must sit under the HSC-style question');
    for (const heading of NOTES_H2) {
      const start = md.indexOf(`## ${heading}`) + heading.length + 3;
      const next = md.indexOf('\n## ', start);
      assert.ok(md.slice(start, next < 0 ? undefined : next).trim().length > 0, `section "${heading}" is empty`);
    }
  });
}

for (const entry of entries.filter((e) => e.kind === 'page' && (e.status === 'review' || e.status === 'live'))) {
  test(`page ${entry.id} (${entry.status}) is complete`, () => {
    const html = path.join(ROOT, 'site', entry.path);
    assert.ok(fs.existsSync(html), `${entry.path} is missing`);
    const src = fs.readFileSync(html, 'utf8');
    assert.match(src, new RegExp(`id:\\s*['"]${entry.id}['"]`), 'the page config id must equal the catalog id');
    const notes = read(`site/content/notes/${entry.id}.md`);
    assert.ok(!notes.startsWith(NOTES_STUB_MARKER), 'teacher notes are still a stub');
    const fm = frontmatter(read(`specs/${entry.id}.md`));
    assert.ok(['approved'].includes(fm.status) || entry.status === 'review', 'live pages need an approved spec');
    for (const listing of entries.filter((l) => l.kind === 'listing' && l.listingOf === entry.id)) {
      assert.match(src, new RegExp(`['"]?${listing.preset}['"]?\\s*:`), `preset "${listing.preset}" for listing ${listing.id} is not defined`);
    }
  });
}

test('render.yaml sends the same Content-Security-Policy as the dev server', () => {
  const yaml = read('render.yaml');
  assert.ok(yaml.includes(CSP), 'update the Content-Security-Policy value in render.yaml to match scripts/lib/headers.mjs');
});
