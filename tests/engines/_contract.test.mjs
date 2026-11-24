// Contract checks for every engine (guide §5.1), run on each PR:
//  - model.js, view.js and index.js exist; index.js exports meta and create
//  - meta is well formed; every param default is valid for its own spec
//  - time-based engines have a timeScale param from 0.25 to 2
//  - model.js is pure: no DOM, timers, clocks or unseeded randomness
//  - no eval / new Function and no remote imports anywhere in site/assets
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { coerceParam, RESERVED_KEYS } from '../../site/assets/state.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const ENGINES = path.join(ROOT, 'site', 'assets', 'engines');
const PARAM_TYPES = ['number', 'boolean', 'enum', 'string', 'list'];
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// A folder is an engine once it has any of model.js, view.js or index.js (then it must have all three).
// A folder with only shared helpers (e.g. fnplot/parser.js before the engine lands) is not checked here.
const ENGINE_FILES = ['model.js', 'view.js', 'index.js'];
function engineDirs() {
  const dirs = [];
  const add = (name, dir) => {
    if (ENGINE_FILES.some((f) => fs.existsSync(path.join(dir, f)))) dirs.push({ name, dir });
  };
  for (const name of fs.readdirSync(ENGINES)) {
    const full = path.join(ENGINES, name);
    if (!fs.statSync(full).isDirectory()) continue;
    if (name === 'custom') {
      for (const id of fs.readdirSync(full)) if (fs.statSync(path.join(full, id)).isDirectory()) add(id, path.join(full, id));
    } else add(name, full);
  }
  return dirs;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

function walkJs(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'vendor') out.push(...walkJs(full));
    } else if (/\.(m?js)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const engines = engineDirs();

test('at least the reference engine exists', () => {
  assert.ok(engines.some((e) => e.name === 'demo'));
});

for (const { name, dir } of engines) {
  test(`engine ${name}: files and exports`, async () => {
    for (const f of ['model.js', 'view.js', 'index.js']) assert.ok(fs.existsSync(path.join(dir, f)), `${name}/${f} is missing`);
    const mod = await import(pathToFileURL(path.join(dir, 'index.js')).href);
    assert.equal(typeof mod.create, 'function', 'index.js must export create(stage, opts)');
    assert.ok(mod.meta && typeof mod.meta === 'object', 'index.js must export meta');
  });

  test(`engine ${name}: meta is well formed`, async () => {
    const { meta } = await import(pathToFileURL(path.join(dir, 'index.js')).href);
    assert.equal(meta.name, name, 'meta.name must equal the folder name');
    assert.match(meta.version, /^\d+\.\d+\.\d+$/, 'meta.version must be semver');
    assert.ok(Array.isArray(meta.setups) && meta.setups.length > 0, 'meta.setups must list at least one setup');
    for (const s of meta.setups) assert.match(s, KEBAB, `setup "${s}" must be kebab-case`);
    const staticSetups = meta.staticSetups ?? [];
    for (const s of staticSetups) assert.ok(meta.setups.includes(s), `staticSetups: unknown setup "${s}"`);
    if (meta.stepSize !== undefined) assert.ok(Number.isInteger(meta.stepSize) && meta.stepSize >= 1, 'stepSize must be a positive integer');

    for (const [key, spec] of Object.entries(meta.params ?? {})) {
      const where = `param "${key}"`;
      assert.match(key, /^[a-zA-Z][a-zA-Z0-9]*$/, `${where}: keys are camelCase (they appear in URLs)`);
      assert.ok(!RESERVED_KEYS.includes(key), `${where}: "${key}" is reserved for URL flags`);
      assert.ok(PARAM_TYPES.includes(spec.type), `${where}: type must be one of ${PARAM_TYPES.join(', ')}`);
      assert.ok(typeof spec.label === 'string' && spec.label.length > 0, `${where}: needs a label`);
      if (spec.type === 'number' || spec.type === 'list') {
        if (spec.type === 'number') {
          assert.ok(Number.isFinite(spec.min) && Number.isFinite(spec.max) && spec.min < spec.max, `${where}: needs min < max`);
          assert.ok(spec.step === undefined || spec.step > 0, `${where}: step must be positive`);
        }
        assert.ok(spec.unit === undefined || typeof spec.unit === 'string', `${where}: unit must be a string`);
      }
      if (spec.type === 'enum') {
        assert.ok(Array.isArray(spec.options) && spec.options.length >= 2, `${where}: enum needs at least two options`);
        for (const opt of spec.options) assert.ok(Array.isArray(opt) && typeof opt[0] === 'string' && typeof opt[1] === 'string', `${where}: options are [value, label] string pairs`);
      }
      const { ok } = coerceParam(spec, spec.default);
      assert.ok(ok, `${where}: default ${JSON.stringify(spec.default)} is not valid for its own spec`);
      for (const s of spec.setups ?? []) assert.ok(meta.setups.includes(s), `${where}: unknown setup "${s}"`);
      for (const k of Object.keys(spec.visibleWhen ?? {})) assert.ok(k in meta.params, `${where}: visibleWhen refers to unknown param "${k}"`);
    }

    const timeSetups = meta.setups.filter((s) => !staticSetups.includes(s));
    if (timeSetups.length) {
      const ts = meta.params?.timeScale;
      assert.ok(ts, 'time-based engines need a timeScale param');
      assert.equal(ts.type, 'number');
      assert.equal(ts.min, 0.25, 'timeScale min is 0.25');
      assert.equal(ts.max, 2, 'timeScale max is 2');
      for (const s of timeSetups) assert.ok(!ts.setups || ts.setups.includes(s), `timeScale must apply to time-based setup "${s}"`);
    }

    for (const [key, out] of Object.entries(meta.outputs ?? {})) {
      assert.ok(typeof out.label === 'string' && out.label.length > 0, `output "${key}": needs a label`);
      assert.ok(typeof out.unit === 'string', `output "${key}": unit must be a string ('' if dimensionless)`);
      if (out.sigfigs !== undefined) assert.ok(Number.isInteger(out.sigfigs) && out.sigfigs >= 1 && out.sigfigs <= 8, `output "${key}": sigfigs 1–8`);
      for (const s of out.setups ?? []) assert.ok(meta.setups.includes(s), `output "${key}": unknown setup "${s}"`);
    }
  });

  test(`engine ${name}: model.js is pure`, () => {
    const src = stripComments(fs.readFileSync(path.join(dir, 'model.js'), 'utf8'));
    const banned = [
      [/\bdocument\b/, 'document'],
      [/\bwindow\b/, 'window'],
      [/\brequestAnimationFrame\b/, 'requestAnimationFrame'],
      [/\bsetTimeout\b|\bsetInterval\b/, 'timers'],
      [/\bMath\.random\b/, 'Math.random (pass a seeded PRNG in)'],
      [/\bDate\.now\b|\bnew Date\b|\bperformance\.now\b/, 'clocks'],
      [/^\s*import\s[^;]*from\s+['"](?!\.)/m, 'non-relative imports'],
    ];
    for (const [re, what] of banned) assert.ok(!re.test(src), `${name}/model.js must not use ${what}`);
  });
}

test('no eval, new Function or remote imports in site/assets', () => {
  const files = walkJs(path.join(ROOT, 'site', 'assets'));
  assert.ok(files.length > 0);
  for (const file of files) {
    const src = stripComments(fs.readFileSync(file, 'utf8'));
    const rel = path.relative(ROOT, file);
    assert.ok(!/\beval\s*\(/.test(src), `${rel} uses eval`);
    assert.ok(!/\bnew\s+Function\b|\bFunction\s*\(/.test(src), `${rel} uses Function()`);
    assert.ok(!/(import|from)\s*\(?\s*['"]https?:/.test(src), `${rel} imports from a remote URL`);
  }
});
