// Unit tests for the shared utilities: format.js, state.js, csv.js (W0-05).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatNumber, formatQuantity, siPrefix, formatAngle, roundSig, decimalsForStep, formatStepValue, MINUS, NNBSP } from '../../site/assets/format.js';
import { coerceParam, clampParams, parseQuery, resolveParams, toQuery, isVisible, defaultsFor, RESERVED_KEYS } from '../../site/assets/state.js';
import { toCSV, csvFilename } from '../../site/assets/csv.js';

test('formatNumber: 3 significant figures by default', () => {
  assert.equal(formatNumber(40.816), '40.8');
  assert.equal(formatNumber(10.204), '10.2');
  assert.equal(formatNumber(2.886), '2.89');
  assert.equal(formatNumber(0.5), '0.500');
  assert.equal(formatNumber(123.4), '123');
  assert.equal(formatNumber(1), '1.00');
  assert.equal(formatNumber(0), '0.00');
  assert.equal(formatNumber(0.00123456), '0.00123');
});

test('formatNumber: rounding carries into the next power of ten', () => {
  assert.equal(formatNumber(9.996), '10.0');
  assert.equal(formatNumber(999.6), '1000');
  assert.equal(formatNumber(0.0009999), '0.00100');
});

test('formatNumber: minus sign, grouping and scientific notation', () => {
  assert.equal(formatNumber(-9.8), `${MINUS}9.80`);
  assert.equal(formatNumber(-9.8, { minus: false }), '-9.80');
  assert.equal(formatNumber(-0.0001, { sigfigs: 2 }), `${MINUS}1.0 × 10⁻⁴`);
  assert.equal(formatNumber(-0), '0.00');
  assert.equal(formatNumber(22632), `22${NNBSP}600`);
  assert.equal(formatNumber(1500), '1500');
  assert.equal(formatNumber(2.998e8), '3.00 × 10⁸');
  assert.equal(formatNumber(6.626e-34, { sigfigs: 4 }), '6.626 × 10⁻³⁴');
  assert.equal(formatNumber(NaN), '—');
  assert.equal(formatNumber(-Infinity), `${MINUS}∞`);
  assert.equal(formatNumber(40.816, { sigfigs: 5 }), '40.816');
});

test('formatNumber and roundSig survive the whole double range (no throw, no NaN)', () => {
  assert.equal(formatNumber(1e-310), '1.00 × 10⁻³¹⁰');
  assert.equal(formatNumber(-5e-324), `${MINUS}4.94 × 10⁻³²⁴`);
  assert.equal(formatNumber(1.7e308), '1.70 × 10³⁰⁸');
  assert.equal(roundSig(1e-310, 3), 1e-310);
  assert.equal(roundSig(1.2345e300, 2), 1.2e300);
  for (let k = -323; k <= 308; k += 7) {
    const s = formatNumber(3.14159 * 10 ** k);
    assert.ok(!/NaN|undefined/.test(s), `bad output at 1e${k}: ${s}`);
  }
});

test('roundSig', () => {
  assert.equal(roundSig(40.816, 3), 40.8);
  assert.equal(roundSig(22632, 3), 22600);
  assert.equal(roundSig(0.000123456, 2), 0.00012);
});

test('formatInteger for counts', async () => {
  const { formatInteger } = await import('../../site/assets/format.js');
  assert.equal(formatInteger(369), '369');
  assert.equal(formatInteger(369.4), '369');
  assert.equal(formatInteger(12345), `12${NNBSP}345`);
  assert.equal(formatInteger(-7), `${MINUS}7`);
  assert.equal(formatInteger(NaN), '—');
});

test('formatQuantity and siPrefix', () => {
  assert.equal(formatQuantity(40.816, 'm'), `40.8${NNBSP}m`);
  assert.equal(formatQuantity(45, '°'), '45.0°');
  assert.equal(siPrefix(0.0048, 'm'), `4.80${NNBSP}mm`);
  assert.equal(siPrefix(6e-7, 'm'), `600${NNBSP}nm`);
  assert.equal(siPrefix(22632, 'Pa'), `22.6${NNBSP}kPa`);
  assert.equal(siPrefix(5, 'N'), `5.00${NNBSP}N`);
});

test('formatAngle', () => {
  assert.equal(formatAngle(Math.PI / 4), '45.0°');
  assert.equal(formatAngle(30, { from: 'deg', to: 'rad' }), `0.524${NNBSP}rad`);
  assert.equal(formatAngle(Math.PI / 4, { to: 'pi' }), 'π/4');
  assert.equal(formatAngle((3 * Math.PI) / 4, { to: 'pi' }), '3π/4');
  assert.equal(formatAngle(-Math.PI / 2, { to: 'pi' }), `${MINUS}π/2`);
  assert.equal(formatAngle(Math.PI, { to: 'pi' }), 'π');
  assert.equal(formatAngle(0, { to: 'pi' }), '0');
  assert.equal(formatAngle(1, { to: 'pi' }), '0.318π');
});

test('slider value display', () => {
  assert.equal(decimalsForStep(0.5), 1);
  assert.equal(decimalsForStep(1), 0);
  assert.equal(decimalsForStep(0.01), 2);
  assert.equal(decimalsForStep(2.5e-7), 8);
  assert.equal(formatStepValue(20, 0.5), '20.0');
  assert.equal(formatStepValue(19.6000000001, 0.1), '19.6');
  assert.equal(formatStepValue(19.65, 0.1), '19.65');
  assert.equal(formatStepValue(-3, 1), '-3');
});

const META = {
  speed: { type: 'number', label: 'Speed', unit: 'm/s', min: 0, max: 60, step: 0.5, default: 20 },
  n: { type: 'number', label: 'Count', min: 1, max: 100, step: 1, default: 10, integer: true },
  drag: { type: 'enum', label: 'Drag', options: [['none', 'None'], ['linear', 'kv'], ['quadratic', 'kv²']], default: 'none' },
  k: { type: 'number', label: 'k', min: 0, max: 1, step: 0.01, default: 0.1, visibleWhen: { drag: ['linear', 'quadratic'] } },
  trail: { type: 'boolean', label: 'Trail', default: true },
  f: { type: 'string', label: 'f(x)', default: 'x^2', maxLength: 20 },
  roots: { type: 'list', label: 'Roots', default: [-1, 2], min: -10, max: 10, maxItems: 4 },
  only: { type: 'number', label: 'Only shm', min: 0, max: 1, step: 0.1, default: 0.5, setups: ['shm'] },
};

test('coerceParam: numbers are clamped, rounded when integer, and invalid values fall back', () => {
  assert.deepEqual(coerceParam(META.speed, '25.5'), { value: 25.5, ok: true });
  assert.deepEqual(coerceParam(META.speed, 99), { value: 60, ok: false });
  assert.deepEqual(coerceParam(META.speed, '-4'), { value: 0, ok: false });
  assert.deepEqual(coerceParam(META.speed, 'abc'), { value: 20, ok: false });
  assert.deepEqual(coerceParam(META.speed, '1e1'), { value: 10, ok: true });
  assert.deepEqual(coerceParam(META.speed, ''), { value: 20, ok: false });
  assert.deepEqual(coerceParam(META.n, '10.6'), { value: 11, ok: false });
});

test('coerceParam: booleans, enums, strings and lists', () => {
  assert.deepEqual(coerceParam(META.trail, '0'), { value: false, ok: true });
  assert.deepEqual(coerceParam(META.trail, 'yes'), { value: true, ok: false });
  assert.deepEqual(coerceParam(META.drag, 'quadratic'), { value: 'quadratic', ok: true });
  assert.deepEqual(coerceParam(META.drag, 'cubic'), { value: 'none', ok: false });
  assert.deepEqual(coerceParam(META.f, 'sin(x)'), { value: 'sin(x)', ok: true });
  assert.deepEqual(coerceParam(META.f, 'x'.repeat(21)), { value: 'x^2', ok: false });
  assert.deepEqual(coerceParam(META.roots, '1,-2,3.5'), { value: [1, -2, 3.5], ok: true });
  assert.deepEqual(coerceParam(META.roots, '1,20'), { value: [1, 10], ok: false });
  assert.deepEqual(coerceParam(META.roots, '1,x'), { value: [-1, 2], ok: false });
  assert.deepEqual(coerceParam(META.roots, '1,2,3,4,5'), { value: [1, 2, 3, 4], ok: false });
});

test('clampParams drops unknown keys and params for other setups', () => {
  const { params, invalid } = clampParams(META, 'projectile', { speed: 70, bogus: 1, only: 0.2, drag: 'linear' });
  assert.deepEqual(params, { speed: 60, drag: 'linear' });
  assert.deepEqual(invalid, ['speed']);
  assert.equal('only' in defaultsFor(META, 'projectile'), false);
  assert.equal(defaultsFor(META, 'shm').only, 0.5);
});

test('parseQuery reads params and flags, ignoring unknown keys', () => {
  const r = parseQuery('?preset=me2-drag&speed=30&drag=quadratic&zzz=1&embed=1&theme=dark&test=1&present=1&playlist=abc&i=2', META, 'projectile');
  assert.equal(r.preset, 'me2-drag');
  assert.deepEqual(r.params, { speed: 30, drag: 'quadratic' });
  assert.deepEqual(r.invalid, []);
  assert.deepEqual(r.flags, { embed: true, test: true, present: true, theme: 'dark', playlist: 'abc', i: 2 });
  const bad = parseQuery('?speed=900&theme=neon', META, 'projectile');
  assert.deepEqual(bad.params, { speed: 60 });
  assert.deepEqual(bad.invalid, ['speed']);
  assert.equal(bad.flags.theme, null);
});

test('resolveParams: defaults ← presets.default ← named preset ← URL', () => {
  const presets = { default: { speed: 25 }, fast: { speed: 50, drag: 'linear' } };
  const p = resolveParams({ metaParams: META, setup: 'projectile', presets, presetName: 'fast', urlParams: { drag: 'quadratic' } });
  assert.equal(p.speed, 50);
  assert.equal(p.drag, 'quadratic');
  assert.equal(p.n, 10);
  assert.deepEqual(p.roots, [-1, 2]);
  const q = resolveParams({ metaParams: META, setup: 'projectile', presets, presetName: 'missing' });
  assert.equal(q.speed, 25);
});

test('toQuery round-trips through parseQuery', () => {
  const params = resolveParams({ metaParams: META, setup: 'projectile', urlParams: { speed: 0.1 + 0.2, trail: false, roots: [1.5, -2] } });
  const query = toQuery(params, META, 'projectile', { preset: 'fast', flags: { theme: 'dark', embed: true } });
  assert.match(query, /speed=0\.3(&|$)/);
  assert.match(query, /trail=0/);
  assert.match(query, /roots=1\.5%2C-2/);
  const back = parseQuery(`?${query}`, META, 'projectile');
  assert.equal(back.preset, 'fast');
  assert.deepEqual(back.params, { ...params, speed: 0.3 });
  assert.equal(back.flags.embed, true);
  assert.equal(back.flags.theme, 'dark');
});

test('isVisible and reserved keys', () => {
  assert.equal(isVisible(META.k, { drag: 'none' }), false);
  assert.equal(isVisible(META.k, { drag: 'linear' }), true);
  assert.equal(isVisible(META.speed, {}), true);
  assert.ok(RESERVED_KEYS.includes('preset') && RESERVED_KEYS.includes('embed'));
});

test('toCSV: RFC 4180 quoting, CRLF, BOM and clean numbers', () => {
  const csv = toCSV({
    columns: ['t (s)', 'x (m)', 'note'],
    rows: [
      [0, 0.1 + 0.2, 'start, launch'],
      [0.5, -1.25, 'said "go"'],
      [1, NaN, '=SUM(A1)'],
    ],
  });
  assert.ok(csv.startsWith('﻿'));
  assert.equal(
    csv.slice(1),
    't (s),x (m),note\r\n0,0.3,"start, launch"\r\n0.5,-1.25,"said ""go"""\r\n1,,\'=SUM(A1)\r\n',
  );
  assert.equal(toCSV({ columns: ['a'], rows: [] }, { bom: false }), 'a\r\n');
});

test('csvFilename', () => {
  assert.equal(csvFilename('phy-projectile-lab', new Date(2026, 10, 25, 9, 5)), 'phy-projectile-lab-20261125-0905.csv');
});

test('safeNext keeps sign-in redirects on this site', async () => {
  const { safeNext } = await import('../../site/assets/auth.js');
  assert.equal(safeNext('/interactives/physics/projectile-lab.html?speed=20'), '/interactives/physics/projectile-lab.html?speed=20');
  assert.equal(safeNext('/'), '/');
  assert.equal(safeNext('https://example.com/'), '/');
  assert.equal(safeNext('//example.com/'), '/');
  assert.equal(safeNext(String.raw`/\example.com`), '/');
  assert.equal(safeNext('/a/b?c=1#d'), '/a/b?c=1#d');
  assert.equal(safeNext('javascript:alert(1)'), '/');
  assert.equal(safeNext('/signin.html?next=/'), '/');
  assert.equal(safeNext(null), '/');
  assert.equal(safeNext('/a\nb'), '/');
  // Dot segments that normalise to a protocol-relative URL (open redirect found in review of #37).
  for (const evil of ['/.//evil.example/x', '/..//evil.example/x', '/%2e//evil.example/x', '/%2E%2E//evil.example/x', '/a/../..//evil.example', '/./%2e//evil.example']) {
    assert.equal(safeNext(evil), '/', evil);
  }
  // Ordinary paths with dots still work.
  assert.equal(safeNext('/interactives/./physics/projectile-lab.html'), '/interactives/physics/projectile-lab.html');
});
