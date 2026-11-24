// fnplot engine tests (guide §9.1). Every expected number comes from a formula or a hand calculation.
// Part 1: the shared expression parser (site/assets/engines/fnplot/parser.js), also used by field2d.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import { parse, compile, tryCompile, evaluate, freeVariables, toTex, ExpressionError, EXPRESSION_PATTERN } from '../../site/assets/engines/fnplot/parser.js';
import * as M from '../../site/assets/engines/fnplot/model.js';
import { buildScene } from '../../site/assets/engines/fnplot/scenes.js';
import { meta } from '../../site/assets/engines/fnplot/index.js';
import { defaultsFor, clampParams } from '../../site/assets/state.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const close = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} expected ${expected}, got ${actual}`);
const val = (src, scope = {}, opts = {}) => compile(src, opts)(scope);

// Error helper: returns the ExpressionError thrown by parse().
function parseError(src, opts) {
  try {
    parse(src, opts);
  } catch (err) {
    assert.ok(err instanceof ExpressionError, `expected an ExpressionError for "${src}", got ${err}`);
    return err;
  }
  assert.fail(`"${src}" should not parse`);
}

// ---------------------------------------------------------------------------------------------
// §9.1 parser tests
// ---------------------------------------------------------------------------------------------

test('§9.1: "2x^2-3x+1" at x = 2 is 3', () => {
  // 2·4 − 6 + 1 = 3
  assert.equal(val('2x^2-3x+1', { x: 2 }, { variables: ['x'] }), 3);
});

test('§9.1: "sin(pi/6)" is 0.5', () => {
  close(val('sin(pi/6)'), 0.5, 1e-15);
});

test('§9.1: "-2^2" is −4 (power binds tighter than unary minus)', () => {
  assert.equal(val('-2^2'), -4);
});

test('§9.1: "2^3^2" is 512 (power is right-associative: 2^9)', () => {
  assert.equal(val('2^3^2'), 512);
});

test('§9.1: "e^(ln 5)" is 5', () => {
  close(val('e^(ln 5)'), 5, 1e-12);
});

test('§9.1: "abs(-3)+sqrt(16)" is 7', () => {
  assert.equal(val('abs(-3)+sqrt(16)'), 7);
});

test('§9.1: parser source contains no eval( or Function(', () => {
  const src = fs.readFileSync(path.join(ROOT, 'site', 'assets', 'engines', 'fnplot', 'parser.js'), 'utf8');
  assert.ok(!/\beval\s*\(/.test(src), 'parser.js mentions eval(');
  assert.ok(!/Function\s*\(/.test(src), 'parser.js mentions Function(');
});

// ---------------------------------------------------------------------------------------------
// Precedence and associativity
// ---------------------------------------------------------------------------------------------

test('precedence: * and / before + and −, left to right', () => {
  assert.equal(val('1+2*3'), 7);
  assert.equal(val('8/4/2'), 1); // (8/4)/2
  assert.equal(val('10-4-3'), 3); // (10−4)−3
  assert.equal(val('2*3^2'), 18);
  assert.equal(val('(1+2)*3'), 9);
});

test('unary minus: -x^2, 2^-2, x - -1, 2*-3, +4', () => {
  assert.equal(val('-x^2', { x: 3 }), -9);
  assert.equal(val('2^-2'), 0.25);
  assert.equal(val('x - -1', { x: 2 }), 3);
  assert.equal(val('2*-3'), -6);
  assert.equal(val('+4'), 4);
  assert.equal(val('(-2)^2'), 4);
});

test('decimals: 2.5, .5, 3.', () => {
  assert.equal(val('2.5*2'), 5);
  assert.equal(val('.5+.25'), 0.75);
  assert.equal(val('3.'), 3);
});

// ---------------------------------------------------------------------------------------------
// Implicit multiplication
// ---------------------------------------------------------------------------------------------

test('implicit multiplication: 2x, 2(x+1), (x+1)(x-1), x(x+1)', () => {
  const v = { variables: ['x'] };
  assert.equal(val('2x', { x: 3 }, v), 6);
  assert.equal(val('2(x+1)', { x: 3 }, v), 8);
  assert.equal(val('(x+1)(x-1)', { x: 3 }, v), 8); // 4·2
  assert.equal(val('x(x+1)', { x: 3 }, v), 12);
  assert.equal(val('2x^2', { x: 3 }, v), 18); // 2·(x²), not (2x)²
});

test('implicit multiplication with functions: 3sin x, x sin x, 2 sin x cos x', () => {
  const v = { variables: ['x'] };
  close(val('3sin x', { x: Math.PI / 2 }, v), 3, 1e-15);
  close(val('x sin x', { x: Math.PI / 2 }, v), Math.PI / 2, 1e-15);
  // 2 sin x cos x = sin 2x
  for (const x of [0.3, 1.1, 2.7]) close(val('2 sin x cos x', { x }, v), Math.sin(2 * x), 1e-14, `x = ${x}`);
});

test('implicit multiplication between variables: x y, 2xy, a x^2 + b x + c', () => {
  assert.equal(val('x y', { x: 2, y: 5 }, { variables: ['x', 'y'] }), 10);
  assert.equal(val('2xy', { x: 2, y: 5 }, { variables: ['x', 'y'] }), 20);
  // 1·4 + (−3)·2 + 2 = 0
  assert.equal(val('a x^2 + b x + c', { x: 2, a: 1, b: -3, c: 2 }, { variables: ['x', 'a', 'b', 'c'] }), 0);
  assert.equal(val('ax^2+bx+c', { x: 2, a: 1, b: -3, c: 2 }, { variables: ['x', 'a', 'b', 'c'] }), 0);
});

test('function arguments without brackets: sin 2x is sin(2x); sin x + 1 is sin(x) + 1; sin x^2 is sin(x²)', () => {
  const v = { variables: ['x'] };
  close(val('sin 2x', { x: 0.4 }, v), Math.sin(0.8), 1e-15);
  close(val('sin x + 1', { x: 0.4 }, v), Math.sin(0.4) + 1, 1e-15);
  close(val('sin x^2', { x: 0.4 }, v), Math.sin(0.16), 1e-15);
  close(val('sinx', { x: 0.4 }, v), Math.sin(0.4), 1e-15);
  close(val('sin x/2', { x: 0.4 }, v), Math.sin(0.4) / 2, 1e-15); // an explicit operator ends a bare argument
  close(val('sin(x)^2', { x: 0.4 }, v), Math.sin(0.4) ** 2, 1e-15);
});

test('constants: pi, π, e, 2pi, pi x', () => {
  close(val('pi'), Math.PI, 0);
  close(val('π'), Math.PI, 0);
  close(val('e'), Math.E, 0);
  close(val('2pi'), 2 * Math.PI, 1e-15);
  close(val('pi x', { x: 2 }, { variables: ['x'] }), 2 * Math.PI, 1e-15);
});

// ---------------------------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------------------------

test('every function evaluates to its definition', () => {
  const x = 0.6;
  const s = { x };
  const v = { variables: ['x'] };
  const cases = {
    'sin x': Math.sin(x),
    'cos x': Math.cos(x),
    'tan x': Math.tan(x),
    'asin x': Math.asin(x),
    'acos x': Math.acos(x),
    'atan x': Math.atan(x),
    'sec x': 1 / Math.cos(x),
    'csc x': 1 / Math.sin(x),
    'cot x': Math.cos(x) / Math.sin(x),
    'exp x': Math.exp(x),
    'ln x': Math.log(x),
    'log x': Math.log10(x),
    'sqrt x': Math.sqrt(x),
    'abs(-x)': x,
    'sign(-x)': -1,
    'floor(5x)': 3,
  };
  for (const [src, want] of Object.entries(cases)) close(val(src, s, v), want, 1e-14, src);
  assert.equal(val('log(1000)'), 3, 'log is base 10');
});

test('aliases: cosec, arcsin, arccos, arctan, sgn, and sin^-1 for the inverse', () => {
  const v = { variables: ['x'] };
  close(val('cosec x', { x: 0.5 }, v), 1 / Math.sin(0.5), 1e-15);
  close(val('arcsin(1)'), Math.PI / 2, 1e-15);
  close(val('arccos(0)'), Math.PI / 2, 1e-15);
  close(val('arctan(1)'), Math.PI / 4, 1e-15);
  assert.equal(val('sgn(-2)'), -1);
  close(val('sin^-1(1)'), Math.PI / 2, 1e-15);
  close(val('cos^(-1)(0)'), Math.PI / 2, 1e-15);
  close(val('tan^-1 x', { x: 1 }, v), Math.PI / 4, 1e-15);
});

test('function powers: sin^2 x + cos^2 x = 1', () => {
  for (const x of [0.2, 1.3, -2.4]) close(val('sin^2 x + cos^2 x', { x }, { variables: ['x'] }), 1, 1e-14, `x = ${x}`);
  close(val('sin^2(x)', { x: 0.7 }, { variables: ['x'] }), Math.sin(0.7) ** 2, 1e-15);
});

test('absolute value bars: |x - 3|, 2|x|, |x||x|', () => {
  const v = { variables: ['x'] };
  assert.equal(val('|x - 3|', { x: 1 }, v), 2);
  assert.equal(val('2|x|', { x: -4 }, v), 8);
  assert.equal(val('|x||x|', { x: -3 }, v), 9);
  assert.equal(val('|x|+1', { x: -3 }, v), 4);
});

test('unicode input: 2π, 3×x, x−1, x², √x, 6÷3', () => {
  const v = { variables: ['x'] };
  close(val('2π'), 2 * Math.PI, 1e-15);
  assert.equal(val('3×x', { x: 2 }, v), 6);
  assert.equal(val('x−1', { x: 2 }, v), 1);
  assert.equal(val('x²+x³', { x: 2 }, v), 12);
  assert.equal(val('√x', { x: 9 }, v), 3);
  assert.equal(val('√(x+7)', { x: 9 }, v), 4);
  assert.equal(val('6÷3'), 2);
  assert.equal(val('2**3'), 8);
});

test('function names are case-insensitive (phones capitalise the first letter)', () => {
  close(val('Sin(pi/2)'), 1, 1e-15);
  close(val('LN(e)'), 1, 1e-15);
});

test('real odd roots of negative numbers: (-8)^(1/3) = −2', () => {
  close(val('(-8)^(1/3)'), -2, 1e-12);
  close(val('x^(2/3)', { x: -8 }, { variables: ['x'] }), 4, 1e-12);
  assert.ok(Number.isNaN(val('(-8)^(1/2)')), 'even roots of negatives are not real');
});

test('domain errors give NaN or ±Infinity, never throw', () => {
  assert.ok(Number.isNaN(val('sqrt(-1)')));
  assert.equal(val('ln 0'), -Infinity);
  assert.equal(val('1/x', { x: 0 }, { variables: ['x'] }), Infinity);
  assert.ok(Number.isNaN(val('asin 2')));
});

// ---------------------------------------------------------------------------------------------
// Two-variable expressions (field2d: dy/dx = f(x, y))
// ---------------------------------------------------------------------------------------------

test('two variables: x^2 + y^2 at (3, 4) = 25; x - y; y(1 - y/10)', () => {
  const f = compile('x^2 + y^2', { variables: ['x', 'y'] });
  assert.equal(f({ x: 3, y: 4 }), 25);
  assert.equal(val('x - y', { x: 1, y: 5 }, { variables: ['x', 'y'] }), -4);
  // logistic with r = 1, K = 10, y = 4: 4(1 − 0.4) = 2.4
  close(val('y(1 - y/10)', { x: 0, y: 4 }, { variables: ['x', 'y'] }), 2.4, 1e-15);
  close(val('y', { x: 0.3, y: 1.7 }, { variables: ['x', 'y'] }), 1.7, 0);
});

test('compile reports the variables the expression uses', () => {
  const f = compile('a x^2 + b', { variables: ['x', 'a', 'b', 'c'] });
  assert.deepEqual(f.variables, ['a', 'b', 'x']);
  assert.deepEqual(freeVariables(parse('y sin x', { variables: ['x', 'y'] })), ['x', 'y']);
  assert.deepEqual(freeVariables(parse('2 + pi')), []);
});

test('a missing variable at evaluation gives NaN, not a crash', () => {
  assert.ok(Number.isNaN(val('x + 1', {}, { variables: ['x'] })));
});

test('evaluate (tree walk) agrees with compile', () => {
  const opts = { variables: ['x', 'y'] };
  for (const src of ['2x^2-3x+1', 'sin x cos y', '|x - y| / (1 + x^2)', 'e^(-x) ln(y)', '-2^2 + x y']) {
    const ast = parse(src, opts);
    const fn = compile(ast, opts);
    for (const [x, y] of [[0.5, 2], [-1.25, 3.5], [2, 0.1]]) close(evaluate(ast, { x, y }), fn({ x, y }), 1e-15, src);
  }
});

test('the same source compiles to the same result (deterministic)', () => {
  const a = compile('x^3 - 2x + sin(3x)', { variables: ['x'] });
  const b = compile('x^3 - 2x + sin(3x)', { variables: ['x'] });
  for (const x of [-2, -0.5, 0, 0.7, 3]) assert.equal(a({ x }), b({ x }));
});

// ---------------------------------------------------------------------------------------------
// Errors: clear messages with a position
// ---------------------------------------------------------------------------------------------

test('errors: empty input', () => {
  const err = parseError('   ');
  assert.match(err.message, /enter/i);
});

test('errors: missing operand at the end', () => {
  const err = parseError('2+');
  assert.equal(err.pos, 2);
  assert.match(err.message, /missing/i);
});

test('errors: unclosed and unmatched brackets', () => {
  const open = parseError('(x+1', { variables: ['x'] });
  assert.equal(open.pos, 0, 'points at the unclosed "("');
  assert.match(open.message, /\)/);
  const extra = parseError('x+1)', { variables: ['x'] });
  assert.equal(extra.pos, 3);
  assert.match(extra.message, /\)/);
  const bar = parseError('|x', { variables: ['x'] });
  assert.equal(bar.pos, 0);
});

test('errors: unknown names list the allowed variables', () => {
  const err = parseError('x + q', { variables: ['x'] });
  assert.equal(err.pos, 4);
  assert.match(err.message, /"q"/);
  assert.match(err.message, /x/);
  const word = parseError('foo(x)', { variables: ['x'] });
  assert.equal(word.pos, 0);
  assert.match(word.message, /"foo"/);
});

test('errors: unexpected characters and doubled operators', () => {
  const ch = parseError('2 $ 3');
  assert.equal(ch.pos, 2);
  assert.match(ch.message, /\$/);
  const op = parseError('2 * / 3');
  assert.equal(op.pos, 4);
  const lead = parseError('*3');
  assert.equal(lead.pos, 0);
});

test('errors: a number straight after a value needs an operator', () => {
  const err = parseError('x2', { variables: ['x'] });
  assert.equal(err.pos, 1);
  assert.match(err.message, /operator/i);
});

test('errors: a function with no argument', () => {
  const err = parseError('sin');
  assert.equal(err.pos, 0);
  assert.match(err.message, /sin/);
  const plus = parseError('2 + cos + 1');
  assert.equal(plus.pos, 4);
});

test('errors: a number with two decimal points', () => {
  const err = parseError('1.2.3');
  assert.equal(err.pos, 0);
});

test('errors: unsupported inverse notation', () => {
  const err = parseError('ln^-1(x)', { variables: ['x'] });
  assert.match(err.message, /inverse/i);
});

test('tryCompile returns a calm error object instead of throwing', () => {
  const bad = tryCompile('2x +', { variables: ['x'] });
  assert.equal(bad.ok, false);
  assert.equal(typeof bad.error.message, 'string');
  assert.equal(bad.error.pos, 4);
  const good = tryCompile('2x + 1', { variables: ['x'] });
  assert.equal(good.ok, true);
  assert.equal(good.fn({ x: 1 }), 3);
});

test('compile rejects variable names that clash with functions or constants', () => {
  assert.throws(() => compile('x', { variables: ['x', 'e'] }), /e/);
  assert.throws(() => compile('x', { variables: ['sin'] }), /sin/);
});

// ---------------------------------------------------------------------------------------------
// LaTeX for KaTeX labels
// ---------------------------------------------------------------------------------------------

test('toTex: readable LaTeX for common forms', () => {
  const t = (src, vars = ['x']) => toTex(parse(src, { variables: vars }));
  assert.equal(t('2x^2-3x+1'), '2x^{2}-3x+1');
  assert.equal(t('sqrt(x)/2'), '\\frac{\\sqrt{x}}{2}');
  assert.equal(t('sin x'), '\\sin x');
  assert.equal(t('sin(2x)'), '\\sin\\left(2x\\right)');
  assert.equal(t('sin^2 x'), '\\sin^{2} x');
  assert.equal(t('|x-1|'), '\\left|x-1\\right|');
  assert.equal(t('-2^2', []), '-2^{2}');
  assert.equal(t('(-2)^2', []), '\\left(-2\\right)^{2}');
  assert.equal(t('2pi', []), '2\\pi');
  assert.equal(t('e^(-x)'), 'e^{-x}');
  assert.equal(t('x-(x-1)'), 'x-\\left(x-1\\right)');
  assert.equal(t('2*3', []), '2\\times 3');
  assert.equal(t('sin^-1 x'), '\\sin^{-1} x');
  assert.equal(t('ln(x)'), '\\ln x');
  assert.equal(t('cosec x'), '\\operatorname{cosec} x');
  assert.equal(t('ln|x|'), '\\ln \\left|x\\right|');
  assert.equal(t('(x+1)/(x-1)'), '\\frac{x+1}{x-1}');
  assert.equal(t('2 sin(3x - pi/4)'), '2\\sin\\left(3x-\\frac{\\pi}{4}\\right)');
});

test('toTex keeps a function call unambiguous when something follows it', () => {
  const t = (src) => toTex(parse(src, { variables: ['x', 'y'] }));
  assert.equal(t('sin(x) y'), '\\sin\\left(x\\right)y');
  assert.equal(t('(sin x)^2'), '\\left(\\sin x\\right)^{2}');
  assert.equal(t('sqrt^2 x'), '\\left(\\sqrt{x}\\right)^{2}');
  assert.equal(t('abs^2(x)'), '\\left|x\\right|^{2}');
});

// ---------------------------------------------------------------------------------------------
// URL pattern for expression params (they live in the URL, guide §5.5)
// ---------------------------------------------------------------------------------------------

test('EXPRESSION_PATTERN accepts expressions and rejects markup', () => {
  const re = new RegExp(EXPRESSION_PATTERN, 'u');
  for (const ok of ['2x^2-3x+1', 'sin(pi/6)', '|x−1| + 2π', 'x² + √x', 'a sin x + b cos x', '3×x ÷ 2', 'x + 1', 'x – 1', 'x²³', '']) assert.ok(re.test(ok), ok);
  for (const bad of ['<script>', 'x"y', "x'", 'x;y', 'x{1}', '`x`', 'x&y']) assert.ok(!re.test(bad), bad);
});

// ---------------------------------------------------------------------------------------------
// Review fixes (PR #5): valid LaTeX, brackets kept, bars inside brackets, no prototype lookups
// ---------------------------------------------------------------------------------------------

const TEX_VARS = ['x', 'y', 't', 'A', 'omega', 'theta', 'k'];
const texOf = (src) => toTex(parse(src, { variables: TEX_VARS }));
const renders = (t) => katex.renderToString(t, { throwOnError: true, strict: 'ignore' });

test('toTex: a command followed by a letter gets a separator, so KaTeX can read it', () => {
  const cases = {
    '2pi x': '2\\pi x',
    'cos(2pi x)': '\\cos\\left(2\\pi x\\right)',
    '-pi x': '-\\pi x',
    'A cos(omega t)': 'A\\cos\\left(\\omega t\\right)',
    'θx': '\\theta x',
    'floor(x)y': '\\left\\lfloor x\\right\\rfloor y',
  };
  for (const [src, want] of Object.entries(cases)) {
    assert.equal(texOf(src), want, src);
    assert.doesNotThrow(() => renders(texOf(src)), src);
  }
});

test('toTex: a factor or term that starts with a minus keeps its brackets', () => {
  assert.equal(texOf('2(-3x)'), '2\\left(-3x\\right)');
  assert.equal(texOf('y(-2 sin x)'), 'y\\left(-2\\sin x\\right)');
  assert.equal(texOf('x(-x y)'), 'x\\left(-xy\\right)');
  assert.equal(texOf('x - (-2x)'), 'x-\\left(-2x\\right)');
  assert.equal(texOf('x + (-2x)'), 'x+\\left(-2x\\right)');
  assert.equal(texOf('-(-2x)'), '-\\left(-2x\\right)');
  assert.equal(texOf('-2x'), '-2x', 'a leading minus needs no brackets');
});

test('toTex: every label from the toTex tests and a seeded random sample renders in KaTeX', () => {
  const fixed = ['2x^2-3x+1', 'sqrt(x)/2', 'sin^2 x', 'sin^-1 x', '|x-1|', '(-2)^2', '2pi', 'e^(-x)', 'cosec x', 'ln|x|', 'sqrt^2 x', 'abs^2(x)', 'floor(x)^2', '2*3', 'x^(1/3)', 'sin(x)cos(x)', 'theta^2 omega', 'log(x) ln(x) exp(x)', 'sign(x) sec x cot x', '(x+1)/(x-1)(x+2)'];
  for (const src of fixed) assert.doesNotThrow(() => renders(texOf(src)), src);
  // Random expressions from a small grammar (mulberry32, fixed seed: the same cases every run).
  let seed = 20261125;
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const atoms = ['x', 'y', 't', 'A', 'omega', 'theta', 'k', 'pi', 'e', '2', '3.5', '0.25', 'π', 'θ'];
  const fns = ['sin', 'cos', 'tan', 'asin', 'atan', 'sec', 'cosec', 'cot', 'exp', 'ln', 'log', 'sqrt', 'abs', 'sign', 'floor', 'sin^2', 'cos^-1', 'asin^2', 'arctan^3', 'atan^(2)', 'acos^2'];
  const gen = (d) => {
    if (d <= 0) return pick(atoms);
    switch (Math.floor(rand() * 9)) {
      case 0: return `${gen(d - 1)} + ${gen(d - 1)}`;
      case 1: return `${gen(d - 1)} - ${gen(d - 1)}`;
      case 2: return `${gen(d - 1)}*${gen(d - 1)}`;
      case 3: return `(${gen(d - 1)})/(${gen(d - 1)})`;
      case 4: return `(${gen(d - 1)})^(${gen(d - 1)})`;
      case 5: return `-(${gen(d - 1)})`;
      case 6: return `${pick(fns)}(${gen(d - 1)})`;
      case 7: return `${pick(['2', '3', 'pi', 'x', 'A', 'omega'])} ${pick(['x', 'y', 'theta', 't', 'pi'])} (${gen(d - 1)})`;
      default: return `|${gen(d - 1)}|`;
    }
  };
  let tried = 0;
  for (let i = 0; i < 3000; i++) {
    const src = gen(1 + Math.floor(rand() * 3));
    const r = tryCompile(src, { variables: TEX_VARS });
    if (!r.ok) continue;
    tried += 1;
    const t = toTex(r.ast);
    assert.doesNotThrow(() => renders(t), `${src} → ${t}`);
    assert.ok(!/[0-9.]\\frac/.test(t), `no mixed-number reading: ${src} → ${t}`);
  }
  assert.ok(tried > 2000, `most random cases should parse (${tried})`);
});

test('bars inside brackets inside bars: |sqrt(2|x|) − 3|, |ln(x|x|)|, |(2|x|) − 1|, |x^(2|x|)|', () => {
  const v = { variables: ['x'] };
  assert.equal(val('|sqrt(2|x|) - 3|', { x: -2 }, v), 1); // |√4 − 3|
  close(val('|ln(x|x|)|', { x: 2 }, v), Math.log(4), 1e-15);
  assert.equal(val('|(2|x|) - 1|', { x: -3 }, v), 5);
  assert.equal(val('|x^(2|x|)|', { x: -1 }, v), 1); // |(−1)²|
  close(val('sin^(|x|)(x)', { x: -1 }, v), Math.sin(-1), 1e-15, 'bars inside a bracketed function power: (sin(−1))^|−1|');
});

test('name lookups never reach Object.prototype', () => {
  const long = { variables: ['x', 'abcdefghijk'] };
  const r = tryCompile('constructor(x)', long);
  assert.equal(r.ok, false);
  assert.match(r.error.message, /"constructor"/);
  assert.equal(tryCompile('toString + valueOf', long).ok, false);
  assert.equal(toTex(parse('valueOf + 1', { variables: ['valueOf'] })), '\\mathit{valueOf}+1');
  assert.equal(typeof toTex(parse('toString', { variables: ['toString'] })), 'string');
  const f = compile('constructor + 1', { variables: ['constructor'] });
  assert.equal(f({ constructor: 2 }), 3);
  assert.ok(Number.isNaN(f({})), 'a missing variable is NaN, even when its name is on Object.prototype');
});

test('log10(x) and ln2(x) are explained, not read as log(10x)', () => {
  for (const src of ['log10(x)', 'log10 x', 'ln2x']) {
    const r = tryCompile(src, { variables: ['x'] });
    assert.equal(r.ok, false, src);
    assert.match(r.error.message, /log\(x\)/, src);
    assert.equal(r.error.pos, 0);
  }
  assert.equal(val('log 100'), 2, 'with a space it is log(100)');
  assert.equal(val('log(100)'), 2);
});

test('Unicode spaces, the en dash and runs of superscript digits', () => {
  const v = { variables: ['x'] };
  assert.equal(val('x + 1', { x: 2 }, v), 3, 'no-break space');
  assert.equal(val('2 x', { x: 2 }, v), 4, 'thin space');
  assert.equal(val('x – 1', { x: 2 }, v), 1, 'en dash');
  assert.equal(val('x²³', { x: 2 }, v), 2 ** 23);
  assert.equal(val('x¹⁰', { x: 2 }, v), 1024);
});

test('exploring without a variables list: X and x are the same variable', () => {
  assert.deepEqual(freeVariables(parse('X + x')), ['x']);
  assert.equal(val('X + x', { x: 2 }), 4);
});

test('very deep nesting is a calm error, not a stack overflow', () => {
  const src = `${'('.repeat(300)}x${')'.repeat(300)}`;
  const r = tryCompile(src, { variables: ['x'] });
  assert.equal(r.ok, false);
  assert.match(r.error.message, /nested too deeply/);
  const fine = `${'('.repeat(40)}x${')'.repeat(40)}`;
  assert.equal(val(fine, { x: 3 }, { variables: ['x'] }), 3);
});

// ---------------------------------------------------------------------------------------------
// Second review of PR #5: inverse-trig powers, mixed numbers, the v-flag pattern
// ---------------------------------------------------------------------------------------------

test('toTex: powers of inverse trig functions are bracketed, never a double superscript', () => {
  const cases = {
    'asin^2 x': '\\left(\\sin^{-1} x\\right)^{2}',
    'arcsin^2 x': '\\left(\\sin^{-1} x\\right)^{2}',
    'arctan^2 x': '\\left(\\tan^{-1} x\\right)^{2}',
    'atan^(2) x': '\\left(\\tan^{-1} x\\right)^{2}',
    'acos^3(x)': '\\left(\\cos^{-1} x\\right)^{3}',
    'sin^2 x': '\\sin^{2} x',
  };
  for (const [src, want] of Object.entries(cases)) {
    assert.equal(texOf(src), want, src);
    assert.doesNotThrow(() => renders(texOf(src)), src);
  }
  // The value is unchanged: (sin⁻¹ 0.5)² = (π/6)²
  close(val('asin^2 x', { x: 0.5 }, { variables: ['x'] }), (Math.PI / 6) ** 2, 1e-15);
});

test('toTex: every function and alias with a power renders in KaTeX', () => {
  const names = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sec', 'csc', 'cot', 'exp', 'ln', 'log', 'sqrt', 'abs', 'sign', 'floor', 'cosec', 'arcsin', 'arccos', 'arctan', 'sgn'];
  for (const name of names) {
    for (const power of ['2', '3', '(2)', '(1/2)', '-1']) {
      for (const arg of [' x', '(x)', '(x+1)', ' 2x', '(-x)']) {
        for (const around of [(s) => s, (s) => `2${s}`, (s) => `${s} y`, (s) => `(${s})^2`, (s) => `-${s}`]) {
          const src = around(`${name}^${power}${arg}`);
          const r = tryCompile(src, { variables: TEX_VARS });
          if (!r.ok) continue; // e.g. ln^-1 is an error by design
          const t = toTex(r.ast);
          assert.doesNotThrow(() => renders(t), `${src} → ${t}`);
        }
      }
    }
  }
});

test('toTex: a number before a bracketed fraction is never read as a mixed number', () => {
  assert.equal(texOf('2(1/3)'), '2\\times \\frac{1}{3}'); // 2 × ⅓, not 2⅓
  assert.equal(texOf('4*(1/2)'), '4\\times \\frac{1}{2}');
  assert.equal(texOf('2(1/2)x^2'), '2\\times \\frac{1}{2}x^{2}');
  assert.equal(texOf('x(1/2)'), 'x\\frac{1}{2}', 'a letter before a fraction is fine');
  close(val('2(1/3)'), 2 / 3, 1e-15);
});

test('toTex: a leading minus sits in front of the fraction; .5 prints as 0.5', () => {
  assert.equal(texOf('(-x)/2'), '-\\frac{x}{2}');
  assert.equal(texOf('2((-x)/3)'), '2\\left(-\\frac{x}{3}\\right)');
  assert.equal(texOf('x + (-x)/3'), 'x+\\left(-\\frac{x}{3}\\right)');
  assert.equal(texOf('.5x'), '0.5x');
  assert.equal(texOf('3. + x'), '3+x');
  for (const src of ['(-x)/2', '2((-x)/3)', '((-x)/2)^2', '-((-x)/2)']) assert.doesNotThrow(() => renders(texOf(src)), src);
});

test('toTex keeps the case the teacher typed; evaluation uses the declared name', () => {
  const opts = { variables: ['a', 'omega', 't'] };
  assert.equal(toTex(parse('A cos(omega t)', opts)), 'A\\cos\\left(\\omega t\\right)');
  assert.equal(toTex(parse('a cos(Omega t)', opts)), 'a\\cos\\left(\\omega t\\right)', 'Greek names keep their command');
  assert.equal(val('A cos(omega t)', { a: 2, omega: Math.PI, t: 1 }, opts), -2);
  assert.equal(toTex(parse('X^2 + x')), 'X^{2}+x', 'explore mode: one variable x, shown as typed');
  assert.deepEqual(freeVariables(parse('X^2 + x')), ['x']);
});

test('EXPRESSION_PATTERN is valid with both the u and v regex flags and means the same', () => {
  const u = new RegExp(EXPRESSION_PATTERN, 'u');
  const v = new RegExp(EXPRESSION_PATTERN, 'v'); // what browsers use for <input pattern>
  for (const s of ['2x^2-3x+1', '|x−1| + 2π', 'sin(pi/6)', 'x + 1', 'x – 1', 'x²³', '3×x ÷ 2', '<b>', 'x;y', 'x{1}', 'x&y', 'a[1]']) {
    assert.equal(v.test(s), u.test(s), s);
  }
  assert.ok(v.test('(x+1)/(x-1)|x|^2*3.5'));
  assert.ok(!v.test('x[1]'));
});

// =============================================================================================
// Part 2: the fnplot model (site/assets/engines/fnplot/model.js)
// =============================================================================================

const rel = (actual, expected, tol, msg) => assert.ok(Math.abs(actual - expected) <= tol * Math.abs(expected), `${msg ?? ''} expected ${expected} (±${tol * 100}%), got ${actual}`);
const fx = (src) => {
  const f = compile(src, { variables: ['x'] });
  return (x) => f({ x });
};
// No segment of a sampled curve may contain points on both sides of x = c (it may end exactly at c).
const noSegmentCrosses = (segments, c) => segments.every((s) => s.every(([x]) => x <= c) || s.every(([x]) => x >= c));

// ---------------------------------------------------------------------------------------------
// Sampling: breaks at discontinuities and asymptotes (§9.1 "1/x breaks at 0")
// ---------------------------------------------------------------------------------------------

test('§9.1: 1/x breaks at 0 (grid through 0 and a panned window that misses it)', () => {
  for (const [x0, x1] of [[-5, 5], [-4.3, 5.1]]) {
    const s = M.sampleFunction((x) => 1 / x, x0, x1, { yMin: -5, yMax: 5 });
    assert.equal(s.asymptotes.length, 1, `[${x0}, ${x1}] one asymptote`);
    close(s.asymptotes[0], 0, 1e-6, 'asymptote at x = 0');
    assert.ok(noSegmentCrosses(s.segments, 0), 'no segment joins the two branches');
    assert.equal(s.segments.length, 2);
    // The branches run off the window next to the asymptote.
    const left = s.segments[0];
    assert.ok(left[left.length - 1][1] < -5, 'left branch heads to −∞');
    assert.ok(s.segments[1][0][1] > 5, 'right branch comes from +∞');
  }
});

test('sampling: tan x has asymptotes at ±π/2 on [−3, 3]', () => {
  const s = M.sampleFunction(Math.tan, -3, 3, { yMin: -6, yMax: 6 });
  assert.equal(s.asymptotes.length, 2);
  close(s.asymptotes[0], -Math.PI / 2, 1e-6);
  close(s.asymptotes[1], Math.PI / 2, 1e-6);
  assert.ok(noSegmentCrosses(s.segments, Math.PI / 2) && noSegmentCrosses(s.segments, -Math.PI / 2));
});

test('sampling: 1/x² (no sign change) still breaks with an asymptote at 0', () => {
  const s = M.sampleFunction((x) => 1 / (x * x), -4.3, 5.1, { yMin: -2, yMax: 10 });
  assert.equal(s.asymptotes.length, 1);
  close(s.asymptotes[0], 0, 1e-6);
  assert.ok(noSegmentCrosses(s.segments, 0));
});

test('sampling: floor x jumps at the integers without asymptotes', () => {
  const s = M.sampleFunction(Math.floor, -2.5, 2.5, { yMin: -4, yMax: 4 });
  assert.equal(s.asymptotes.length, 0);
  assert.deepEqual(s.breaks.map((b) => Math.round(b) || 0), [-2, -1, 0, 1, 2]);
  for (const b of s.breaks) close(b, Math.round(b), 1e-9);
  for (const k of [-2, -1, 0, 1, 2]) assert.ok(noSegmentCrosses(s.segments, k), `no segment crosses ${k}`);
});

test('sampling: √(1 − x²) reaches the ends of its domain, x = ±1', () => {
  const s = M.sampleFunction(fx('sqrt(1 - x^2)'), -2, 2, { yMin: -1.5, yMax: 1.5 });
  assert.equal(s.segments.length, 1);
  assert.equal(s.asymptotes.length, 0);
  const seg = s.segments[0];
  close(seg[0][0], -1, 1e-9, 'left end');
  close(seg[seg.length - 1][0], 1, 1e-9, 'right end');
});

test('sampling: ln x has an asymptote at the edge of its domain', () => {
  const s = M.sampleFunction(Math.log, -2, 5, { yMin: -5, yMax: 5 });
  assert.equal(s.segments.length, 1);
  assert.equal(s.asymptotes.length, 1);
  close(s.asymptotes[0], 0, 1e-6);
});

test('sampling: a continuous curve is one unbroken segment, even when steep', () => {
  for (const src of ['x^2', 'x^3 - 40x', '20 sin(3x)', 'e^x']) {
    const s = M.sampleFunction(fx(src), -3, 3, { yMin: -5, yMax: 5 });
    assert.equal(s.segments.length, 1, src);
    assert.equal(s.breaks.length, 0, src);
  }
});

test('sampleParametric: a circle of radius 2 stays on x² + y² = 4', () => {
  const segs = M.sampleParametric((t) => 2 * Math.cos(t), (t) => 2 * Math.sin(t), 0, 2 * Math.PI, 400);
  assert.equal(segs.length, 1);
  for (const [x, y] of segs[0]) close(x * x + y * y, 4, 1e-12);
});

// ---------------------------------------------------------------------------------------------
// Numerics
// ---------------------------------------------------------------------------------------------

test('findRoots: simple, touching and none-at-a-pole', () => {
  const r = M.findRoots(fx('x^2 - 4'), -10, 10);
  assert.equal(r.length, 2);
  close(r[0], -2, 1e-9);
  close(r[1], 2, 1e-9);
  const t = M.findRoots(fx('(x - 1)^2'), -10, 10);
  assert.equal(t.length, 1);
  close(t[0], 1, 1e-6);
  assert.deepEqual(M.findRoots((x) => 1 / x, -10, 10), [], '1/x has no zero');
});

test('simpson: ∫₀^π sin x dx = 2 and ∫₀¹ x³ dx = 1/4', () => {
  close(M.simpson(Math.sin, 0, Math.PI), 2, 1e-12);
  close(M.simpson((x) => x ** 3, 0, 1), 0.25, 1e-15);
  close(M.simpson((x) => x, 1, 0), -0.5, 1e-15, 'oriented');
});

test('differentiate: symbolic derivatives agree with a numerical derivative', () => {
  const exprs = ['x^3 - 2x', 'sin(3x)', 'x sin x', 'e^(2x)', 'ln(x^2 + 1)', 'sqrt(x + 4)', '1/(1 + x^2)', 'tan x', 'asin(x/2)', 'acos(x/3)', 'atan(2x)', 'x^x', '2^x', 'sec x', 'cosec x', 'cot x', 'log x', '(x^2 + 1)^3', 'cos^2 x', 'exp(-x^2)', '|x - 5|'];
  for (const src of exprs) {
    const ast = parse(src, { variables: ['x'] });
    const d = compile(M.differentiate(ast, 'x'));
    const f = fx(src);
    for (const x of [0.3, 0.9, 1.4]) {
      const want = M.derivative(f, x, 1e-4);
      assert.ok(Math.abs(d({ x }) - want) <= 1e-7 * Math.max(1, Math.abs(want)), `${src} at ${x}: ${d({ x })} vs ${want}`);
    }
  }
});

test('differentiate: tidy LaTeX for simple cases', () => {
  const t = (src) => toTex(M.differentiate(parse(src, { variables: ['x'] }), 'x'));
  assert.equal(t('x^3'), '3x^{2}');
  assert.equal(t('x^2 + 1'), '2x');
  assert.equal(t('sin x'), '\\cos x');
  assert.equal(t('5x'), '5');
});

// ---------------------------------------------------------------------------------------------
// transform
// ---------------------------------------------------------------------------------------------

test('transform: 1/f for f = (x+1)(x−2) has asymptotes at −1 and 2 and four invariant points', () => {
  const s = M.solveTransform({ fx: '(x+1)(x-2)', transform: 'reciprocal', probeX: 3 });
  assert.equal(s.asymptotes.length, 2);
  close(s.asymptotes[0], -1, 1e-9);
  close(s.asymptotes[1], 2, 1e-9);
  // f = 1 ⇒ x² − x − 3 = 0 ⇒ x = (1 ± √13)/2; f = −1 ⇒ x² − x − 1 = 0 ⇒ x = (1 ± √5)/2
  const want = [(1 - Math.sqrt(13)) / 2, (1 - Math.sqrt(5)) / 2, (1 + Math.sqrt(5)) / 2, (1 + Math.sqrt(13)) / 2];
  assert.equal(s.invariant.length, 4);
  s.invariant.forEach(([x, y], i) => {
    close(x, want[i], 1e-9);
    close(Math.abs(y), 1, 1e-9);
  });
  // f(3) = 4, so 1/f(3) = 0.25
  close(s.fValue, 4, 1e-12);
  close(s.gValue, 0.25, 1e-12);
});

test('transform: |f(x)| and f(|x|)', () => {
  const a = M.solveTransform({ fx: 'x - 2', transform: 'abs', probeX: -1 });
  assert.equal(a.gValue, 3);
  const b = M.solveTransform({ fx: 'x^3 - x', transform: 'absx', probeX: -2 });
  assert.equal(b.gValue, 6); // f(2) = 8 − 2
  assert.equal(b.g(-0.5), b.g(0.5), 'f(|x|) is even');
});

test('transform: a parse error is returned, not thrown', () => {
  const s = M.solveTransform({ fx: '2x +', transform: 'abs', probeX: 0 });
  assert.ok(s.error);
  assert.equal(s.error.pos, 4);
});

// ---------------------------------------------------------------------------------------------
// inverse
// ---------------------------------------------------------------------------------------------

test('inverse: x² − 2x − 1 is one-to-one on [1, 4] (range [−2, 7]) but not on [−3, 4]', () => {
  const bad = M.solveInverse({ inverseFx: 'x^2 - 2x - 1', domainMin: -3, domainMax: 4, probeX: 0 });
  assert.equal(bad.oneToOne, false);
  close(bad.turning, 1, 0.02, 'turning point at the vertex x = 1');
  // f(0) = −1 ⇒ x² − 2x = 0 ⇒ x = 0 or 2: the horizontal line hits twice
  assert.equal(bad.hits.length, 2);
  close(bad.hits[0], 0, 1e-9);
  close(bad.hits[1], 2, 1e-9);
  const good = M.solveInverse({ inverseFx: 'x^2 - 2x - 1', domainMin: 1, domainMax: 4, probeX: 3 });
  assert.equal(good.oneToOne, true);
  close(good.rangeMin, -2, 1e-9);
  close(good.rangeMax, 7, 1e-9);
  assert.equal(good.hits.length, 1);
});

test('inverse: one-to-one checks for x³, 1/x and a constant', () => {
  assert.equal(M.oneToOneOn((x) => x ** 3, -2, 2).oneToOne, true);
  assert.equal(M.oneToOneOn((x) => 1 / x, -2, 2).oneToOne, true, '1/x is one-to-one across its break');
  assert.equal(M.oneToOneOn((x) => 1 / (x * x), -2, 2).oneToOne, false, '1/x² is not');
  assert.equal(M.oneToOneOn(() => 3, -2, 2).oneToOne, false);
});

// ---------------------------------------------------------------------------------------------
// parametric
// ---------------------------------------------------------------------------------------------

const PARAM_BASE = { h: 0, k: 0, pa: 1, pb: 2, tMin: -3, tMax: 3, t: 2, xt: 't', yt: 't^2' };

test('parametric: points satisfy the Cartesian equations', () => {
  // parabola x = h + 2at, y = k + at² ⇒ (x − h)² = 4a(y − k) (a = 1.5, h = 1, k = −2)
  const par = M.solveParametric({ ...PARAM_BASE, curve: 'parabola', pa: 1.5, h: 1, k: -2 });
  for (const t of [-2, 0.5, 2.5]) close((par.x(t) - 1) ** 2, 4 * 1.5 * (par.y(t) + 2), 1e-12, `parabola t = ${t}`);
  // circle x = h + r cos t, y = k + r sin t ⇒ (x − h)² + (y − k)² = r²
  const cir = M.solveParametric({ ...PARAM_BASE, curve: 'circle', pa: 2, h: 1, k: -1 });
  for (const t of [0, 1, 4]) close((cir.x(t) - 1) ** 2 + (cir.y(t) + 1) ** 2, 4, 1e-12);
  // line x = h + at, y = k + bt ⇒ y − k = (b/a)(x − h)
  const lin = M.solveParametric({ ...PARAM_BASE, curve: 'line', pa: 2, pb: -3, h: 1, k: 4 });
  for (const t of [-1, 2]) close(lin.y(t) - 4, (-3 / 2) * (lin.x(t) - 1), 1e-12);
  // parabola at t = 2 with a = 1: (4, 4)
  assert.deepEqual(M.solveParametric({ ...PARAM_BASE, curve: 'parabola' }).point, [4, 4]);
});

test('parametric: custom x(t), y(t) with parameters, and calm errors', () => {
  const s = M.solveParametric({ ...PARAM_BASE, curve: 'custom', xt: 'a cos t', yt: 'b sin t', pa: 3, pb: 2, t: Math.PI / 2 });
  close(s.point[0], 0, 1e-12);
  close(s.point[1], 2, 1e-12);
  assert.ok(M.solveParametric({ ...PARAM_BASE, curve: 'custom', xt: 'cos(t', yt: 't' }).error);
});

test('parametric: the trace reaches tMax after exactly RUN_STEPS steps', () => {
  const p = { ...PARAM_BASE, tMin: -3, tMax: 3, t: -3 };
  let t = p.t;
  for (let i = 0; i < M.RUN_STEPS - 1; i++) t = M.advanceParametric({ ...p, t }, 1);
  assert.ok(t < 3);
  t = M.advanceParametric({ ...p, t }, 1);
  assert.equal(t, 3);
  assert.equal(M.advanceParametric({ ...p, t: 3 }, 50), 3, 'stops at the end');
});

// ---------------------------------------------------------------------------------------------
// polynomial: roots and coefficients
// ---------------------------------------------------------------------------------------------

test('polynomial: (x−1)(x−2)(x−3) = x³ − 6x² + 11x − 6; Σα = 6, Σαβ = 11, αβγ = 6', () => {
  assert.deepEqual(M.expandRoots([1, 2, 3]), [1, -6, 11, -6]);
  const s = M.solvePolynomial({ roots: [1, 2, 3], leading: 1 });
  assert.equal(s.sum, 6);
  assert.equal(s.pairSum, 11);
  assert.equal(s.product, 6);
  assert.equal(s.degree, 3);
  assert.equal(s.tex, 'P(x)=x^{3}-6x^{2}+11x-6');
});

test('polynomial: the leading coefficient scales the coefficients, not the sums of roots', () => {
  // 2(x + 1)(x − 0.5) = 2x² + x − 1: Σα = −b/a = −1/2, αβ = c/a = −1/2
  const s = M.solvePolynomial({ roots: [-1, 0.5], leading: 2 });
  assert.deepEqual(s.coeffs, [2, 1, -1]);
  close(s.sum, -0.5, 1e-15);
  close(s.product, -0.5, 1e-15);
  // quartic with roots 1, −1, 2, 3: Σα = 5, Σαβ = −1 + 2 + 3 − 2 − 3 + 6 = 5, Σαβγ = −2 − 3 + 6 − 6 = −5, product −6
  const q = M.solvePolynomial({ roots: [1, -1, 2, 3], leading: -1 });
  close(q.sum, 5, 1e-12);
  close(q.pairSum, 5, 1e-12);
  close(q.tripleSum, -5, 1e-12);
  close(q.product, -6, 1e-12);
});

test('polynomial: repeated roots are grouped with their multiplicity', () => {
  assert.deepEqual(M.multiplicities([1, -2, 1]), [{ root: -2, multiplicity: 1 }, { root: 1, multiplicity: 2 }]);
  const s = M.solvePolynomial({ roots: [1, 1, -2], leading: 1 });
  assert.equal(s.factoredTex, 'P(x)=\\left(x+2\\right)\\left(x-1\\right)^{2}');
  close(s.f(1), 0, 1e-15);
});

// ---------------------------------------------------------------------------------------------
// auxiliary angle
// ---------------------------------------------------------------------------------------------

test('auxiliary: 3 sin x + 4 cos x = 5 sin(x + α), tan α = 4/3', () => {
  const { R, alpha } = M.auxiliary(3, 4, 'sin-plus');
  assert.equal(R, 5);
  close(alpha, Math.atan(4 / 3), 1e-15);
  close((alpha * 180) / Math.PI, 53.130102354, 1e-8);
});

test('auxiliary: every form equals a sin x + b cos x for every sign of a and b', () => {
  for (const [a, b] of [[3, 4], [-2, 5], [1, -1], [-3, -2], [0, 2], [2, 0]]) {
    for (const form of Object.keys(M.AUX_FORMS)) {
      const s = M.solveAuxiliary({ a, b, form });
      for (const x of [-2, -0.3, 0, 1.1, 4]) close(s.combined(x), s.sum(x), 1e-12, `${form} a=${a} b=${b} x=${x}`);
      close(s.combined(s.xMax), s.R, 1e-12, `${form} maximum R at xMax`);
      assert.ok(s.alpha > -Math.PI && s.alpha <= Math.PI);
    }
  }
});

// ---------------------------------------------------------------------------------------------
// blackbody
// ---------------------------------------------------------------------------------------------

test('§9.1: Planck peak λmax·T = 2.898e-3 m·K (0.5%), found numerically', () => {
  for (const T of [3000, 4000, 5800, 10000]) {
    const lp = M.peakWavelength(T);
    rel(lp * T, 2.898e-3, 0.005, `T = ${T} K`);
    rel(lp * T, M.WIEN_B, 1e-6, `T = ${T} K against CODATA b`);
  }
});

test('blackbody: Planck at a known point, and π∫B dλ = σT⁴ (Stefan–Boltzmann)', () => {
  // B(500 nm, 5800 K) from the formula by hand, with x = hc/(λkT)
  const x = (M.PLANCK_H * M.LIGHT_C) / (500e-9 * M.BOLTZMANN_K * 5800);
  const want = (2 * M.PLANCK_H * M.LIGHT_C ** 2) / (500e-9) ** 5 / (Math.exp(x) - 1);
  rel(M.planck(500e-9, 5800), want, 1e-12);
  for (const T of [3000, 5800]) rel(M.radiantExitance(T), M.STEFAN_SIGMA * T ** 4, 1e-4, `T = ${T}`);
  const s = M.solveBlackbody({ temperature: 5800, compare: true, temperature2: 4000, temperature3: 3000 });
  assert.equal(s.curves.length, 3);
  rel(s.exitance, M.STEFAN_SIGMA * 5800 ** 4, 1e-15);
  assert.ok(s.curves[1].peak > s.curves[0].peak, 'cooler bodies peak at longer wavelengths');
});

// ---------------------------------------------------------------------------------------------
// inequality
// ---------------------------------------------------------------------------------------------

const ineq = (left, relation, right = '0') => M.solveInequality({ ineqLeft: left, ineqRight: right, relation });

test('inequality: (x − 3)(x + 2) ≥ 0 ⇔ x ≤ −2 or x ≥ 3', () => {
  const s = ineq('(x-3)(x+2)', 'ge');
  assert.equal(s.pieces.length, 2);
  const [p, q] = s.pieces;
  assert.equal(p.a, -Infinity);
  close(p.b, -2, 1e-9);
  assert.equal(p.closedB, true);
  close(q.a, 3, 1e-9);
  assert.equal(q.closedA, true);
  assert.equal(q.b, Infinity);
  assert.equal(s.solutionTex, 'x\\le-2\\text{ or }x\\ge3');
});

test('inequality: (x + 2)/(x − 1) < 0 ⇔ −2 < x < 1 (the pole is never included)', () => {
  const s = ineq('(x+2)/(x-1)', 'lt');
  assert.equal(s.pieces.length, 1);
  close(s.pieces[0].a, -2, 1e-9);
  close(s.pieces[0].b, 1, 1e-6);
  assert.equal(s.pieces[0].closedA, false);
  assert.equal(s.pieces[0].closedB, false);
  assert.equal(s.zeroCount, 1);
  assert.equal(s.poleCount, 1);
  const le = ineq('(x+2)/(x-1)', 'le');
  assert.equal(le.pieces[0].closedA, true, 'zero included for ≤');
  assert.equal(le.pieces[0].closedB, false, 'pole still excluded');
});

test('inequality: all reals, none, an isolated point, a double root and a right-hand side', () => {
  assert.equal(ineq('x^2', 'ge').solutionTex, '\\text{all real }x');
  assert.equal(ineq('x^2 + 1', 'lt').solutionTex, '\\text{no real }x');
  assert.equal(ineq('(x-1)^2', 'le').solutionTex, 'x=1');
  // (x − 1)²(x + 2) > 0 ⇔ x > −2, x ≠ 1
  assert.equal(ineq('(x-1)^2(x+2)', 'gt').solutionTex, '-2<x<1\\text{ or }x>1');
  // 1/(x − 1) ≥ 1 ⇔ (2 − x)/(x − 1) ≥ 0 ⇔ 1 < x ≤ 2
  assert.equal(ineq('1/(x-1)', 'ge', '1').solutionTex, '1<x\\le2');
});

// ---------------------------------------------------------------------------------------------
// inverse trig
// ---------------------------------------------------------------------------------------------

test('inverse trig: derivative formulas match the slopes of sin⁻¹, cos⁻¹ and tan⁻¹', () => {
  for (const [name, inv] of [['sin', Math.asin], ['cos', Math.acos], ['tan', Math.atan]]) {
    const T = M.INVERSE_TRIG[name];
    for (const x of [-0.7, 0, 0.5, 0.9]) close(T.dInv(x), M.derivative(inv, x, 1e-4), 1e-8, `${name} at ${x}`);
    // The restricted branch inverts: inv(f(x)) = x on the restriction
    for (const x of [T.restrict[0] + 0.1, (T.restrict[0] + T.restrict[1]) / 2, T.restrict[1] - 0.1]) close(T.inv(T.f(x)), x, 1e-12);
  }
  const s = M.solveInverseTrig({ trigFn: 'sin', trigProbe: 0.5 });
  close(s.y0, Math.PI / 6, 1e-15);
  close(s.slope, 2 / Math.sqrt(3), 1e-12);
  close(s.fSlope, Math.cos(Math.PI / 6), 1e-12, 'mirror slope is the reciprocal');
  close(M.solveInverseTrig({ trigFn: 'tan', trigProbe: 1 }).slope, 0.5, 1e-15);
});

// ---------------------------------------------------------------------------------------------
// substitution
// ---------------------------------------------------------------------------------------------

test('substitution: ∫₀¹ 2x(x² + 1)³ dx = ∫₁² u³ du = 15/4', () => {
  const s = M.solveSubstitution({ subF: 'u^3', subG: 'x^2 + 1', subA: 0, subB: 1 });
  assert.equal(s.uA, 1);
  assert.equal(s.uB, 2);
  close(s.areaX, 3.75, 1e-10);
  close(s.areaU, 3.75, 1e-10);
  assert.equal(s.dgTex, "g'(x)=2x");
});

test('substitution: ∫ cos(x²)·2x dx from 0 to √(π/2) = sin(π/2) = 1', () => {
  const s = M.solveSubstitution({ subF: 'cos u', subG: 'x^2', subA: 0, subB: Math.sqrt(Math.PI / 2) });
  close(s.areaX, 1, 1e-10);
  close(s.areaU, 1, 1e-10);
});

// ---------------------------------------------------------------------------------------------
// by parts
// ---------------------------------------------------------------------------------------------

test('by parts: u = x, v = sin x on [0, π/2]: ∫u dv = π/2 − 1, ∫v du = 1, sum = [uv] = π/2', () => {
  const s = M.solveByParts({ partsView: 'area', partsU: 'x', partsV: 'sin x', partsA: 0, partsB: Math.PI / 2 });
  close(s.intUdv, Math.PI / 2 - 1, 1e-10);
  close(s.intVdu, 1, 1e-10);
  close(s.boundary, Math.PI / 2, 1e-15);
  close(s.intUdv + s.intVdu, s.boundary, 1e-10);
});

test('by parts: reduction formulas against closed forms and against direct integration', () => {
  const sin = (n) => M.solveByParts({ partsView: 'reduction', reduction: 'sin', reductionN: n });
  close(sin(4).reductionValue, (3 * Math.PI) / 16, 1e-15); // (3/4)(1/2)(π/2)
  close(sin(5).reductionValue, 8 / 15, 1e-15); // (4/5)(2/3)(1)
  const xex = (n) => M.solveByParts({ partsView: 'reduction', reduction: 'xex', reductionN: n });
  close(xex(1).reductionValue, 1, 1e-15); // e − (e − 1)
  close(xex(3).reductionValue, 6 - 2 * Math.E, 1e-14);
  for (const n of [0, 1, 2, 6, 9]) {
    close(sin(n).reductionValue, sin(n).reductionNumeric, 1e-10, `sin n = ${n}`);
    close(xex(n).reductionValue, xex(n).reductionNumeric, 1e-9, `xex n = ${n}`);
  }
});

// ---------------------------------------------------------------------------------------------
// partial fractions
// ---------------------------------------------------------------------------------------------

test('partial fractions: (3x + 1)/((x − 1)(x + 2)) = (4/3)/(x − 1) + (5/3)/(x + 2)', () => {
  const pf = M.partialFractions([3, 1], [1, -2]);
  const byRoot = Object.fromEntries(pf.terms.map((t) => [t.root, t.coef]));
  close(byRoot[1], 4 / 3, 1e-12);
  close(byRoot[-2], 5 / 3, 1e-12);
});

test('partial fractions: repeated factor 1/((x − 1)(x + 1)²) = ¼/(x − 1) − ¼/(x + 1) − ½/(x + 1)²', () => {
  const pf = M.partialFractions([1], [1, -1, -1]);
  const get = (root, power) => pf.terms.find((t) => t.root === root && t.power === power).coef;
  close(get(1, 1), 0.25, 1e-12);
  close(get(-1, 1), -0.25, 1e-12);
  close(get(-1, 2), -0.5, 1e-12);
});

test('partial fractions: improper (x² + 1)/((x − 1)(x + 1)) = 1 + 1/(x − 1) − 1/(x + 1)', () => {
  const s = M.solvePartialFractions({ pfNumerator: [1, 0, 1], pfRoots: [1, -1] });
  assert.ok(s.hasQuotient);
  assert.deepEqual(s.quotient, [1]);
  const byRoot = Object.fromEntries(s.terms.map((t) => [t.root, t.coef]));
  close(byRoot[1], 1, 1e-12);
  close(byRoot[-1], -1, 1e-12);
  for (const x of [-3.2, 0.4, 2.5]) close(s.quotientFn(x) + s.termFns.reduce((sum, f) => sum + f(x), 0), s.f(x), 1e-12);
});

// ---------------------------------------------------------------------------------------------
// heating curves and Newton's law of cooling
// ---------------------------------------------------------------------------------------------

const WATER_P = Object.fromEntries(Object.entries(M.WATER).map(([k, v]) => [k, v.value]));
const HEAT = { heatingMode: 'curve', mass: 1, power: 2000, startTemp: -20, endTemp: 120, ...WATER_P, coolStart: 90, ambient: 20, coolingK: 0.002 };

test('water data: every value carries a source', () => {
  for (const [k, v] of Object.entries(M.WATER)) assert.ok(typeof v.source === 'string' && v.source.length > 5, `${k} needs a source`);
});

test('heating: stage times are Q/P with Q = mcΔT and Q = mL', () => {
  const s = M.solveHeating(HEAT);
  const want = [
    ['solid', (1 * 2100 * 20) / 2000], // 21 s
    ['melting', 3.34e5 / 2000], // 167 s
    ['liquid', (1 * 4190 * 100) / 2000], // 209.5 s
    ['boiling', 2.256e6 / 2000], // 1128 s
    ['gas', (1 * 2010 * 20) / 2000], // 20.1 s
  ];
  assert.deepEqual(s.stages.map((st) => st.kind), want.map((w) => w[0]));
  s.stages.forEach((st, i) => close(st.t1 - st.t0, want[i][1], 1e-9, want[i][0]));
  close(s.meltTime, 167, 1e-9);
  close(s.boilTime, 1128, 1e-9);
  close(s.total, 21 + 167 + 209.5 + 1128 + 20.1, 1e-9);
  // Mid-melt the temperature is 0 °C; half-way through warming the water it is 50 °C.
  assert.equal(s.T(21 + 100), 0);
  close(s.T(21 + 167 + 104.75), 50, 1e-9);
  close(s.T(0), -20, 1e-12);
  close(s.T(s.total), 120, 1e-9);
});

test('heating: a start at the melting point skips warming the ice', () => {
  const s = M.solveHeating({ ...HEAT, startTemp: 0, endTemp: 100 });
  assert.deepEqual(s.stages.map((st) => st.kind), ['melting', 'liquid']);
});

test("Newton's law of cooling: the temperature difference halves every ln 2/k", () => {
  const s = M.solveHeating({ ...HEAT, heatingMode: 'cooling' });
  close(s.halfTime, Math.LN2 / 0.002, 1e-12);
  close(s.T(s.halfTime), 20 + 70 / 2, 1e-12);
  close(s.T(2 * s.halfTime), 20 + 70 / 4, 1e-12);
  assert.equal(s.T(0), 90);
});

test('heating run: RUN_STEPS fixed steps from t = 0 to the total time', () => {
  const s = M.solveHeating(HEAT);
  assert.equal(M.heatingTime(s, 0), 0);
  close(M.heatingTime(s, M.RUN_STEPS), s.total, 1e-12);
  assert.equal(M.heatingTime(s, M.RUN_STEPS + 10), M.heatingTime(s, M.RUN_STEPS), 'clamped at the end');
});

// ---------------------------------------------------------------------------------------------
// Every setup's scene builds, and every on-stage label is LaTeX that KaTeX can read
// ---------------------------------------------------------------------------------------------

const SOLVERS = {
  transform: M.solveTransform,
  inverse: M.solveInverse,
  parametric: M.solveParametric,
  polynomial: M.solvePolynomial,
  auxiliary: M.solveAuxiliary,
  blackbody: M.solveBlackbody,
  inequality: M.solveInequality,
  'inverse-trig': M.solveInverseTrig,
  substitution: M.solveSubstitution,
  'by-parts': M.solveByParts,
  'partial-fractions': M.solvePartialFractions,
  heating: M.solveHeating,
};
const VARIANTS = {
  transform: [{}, { transform: 'abs', fx: 'x^2 - 4' }, { transform: 'absx', fx: '(x-1)^3 - 1', layout: 'overlay' }, { fx: '2pi x sin(theta' }],
  inverse: [{}, { domainMin: 1, domainMax: 4 }, { inverseFx: 'x^3 - 3x', probeX: 0.5 }],
  parametric: ['line', 'parabola', 'circle', 'custom'].flatMap((curve) => [{ curve, eliminate: 3 }, { curve, eliminate: 1, h: -1.5, k: 2, pa: -0.5, pb: 3, t: 0 }]),
  polynomial: [{}, { roots: [1, 1, -2] }, { roots: [-1, 2, 2, 2], leading: 0.5 }, { roots: [0.5] }, { roots: [-3, -1, 0, 2, 4], leading: -2 }, { leading: 0 }],
  auxiliary: ['sin-plus', 'sin-minus', 'cos-plus', 'cos-minus'].flatMap((form) => [{ form }, { form, a: -1, b: 1.5, angleUnit: 'rad' }, { form, a: 2, b: 0 }]),
  blackbody: [{}, { compare: false, showLocus: true }, { temperature: 12000, temperature2: 1000 }],
  inequality: [{}, { ineqLeft: '(x+2)/(x-1)', relation: 'lt' }, { ineqLeft: '1/(x-1)', relation: 'ge', ineqRight: '1' }, { ineqLeft: 'x^2 + 1', relation: 'lt' }, { ineqLeft: 'x^2', relation: 'ge' }],
  'inverse-trig': ['sin', 'cos', 'tan'].flatMap((trigFn) => [{ trigFn }, { trigFn, trigProbe: -0.9, showDerivative: false }]),
  substitution: [{}, { subF: 'cos u', subG: 'x^2', subB: 1.25 }, { subF: 'e^u', subG: 'sin x', subB: 1.5 }, { subF: '1/u', subG: 'x^2 + 1' }],
  'by-parts': [{}, { partsV: 'sin x', partsB: 1.55 }, { partsView: 'reduction', reductionN: 0 }, { partsView: 'reduction', reductionN: 12 }, { partsView: 'reduction', reduction: 'xex', reductionN: 7 }],
  'partial-fractions': [{}, { pfNumerator: [1], pfRoots: [1, -1, -1] }, { pfNumerator: [1, 0, 1], pfRoots: [1, -1] }, { pfNumerator: [2, -3, 0, 5], pfRoots: [0, 0.5, -2.5, 3] }],
  heating: [{}, { heatingMode: 'cooling' }, { startTemp: 0, endTemp: 100 }],
};
const PAL = { bg: '#F6F6F4', panel: '#FFFFFF', ink: '#121316', muted: '#4A4D53', grid: '#DADAD6', axis: '#6B6E74', accent: '#FF4F00', accentText: '#B83A00', series: ['#FF4F00', '#0072B2', '#009E73', '#CC79A7', '#121316', '#E69F00'] };

test('every setup: scenes build at desktop and phone sizes, and every label renders in KaTeX', () => {
  assert.deepEqual(Object.keys(VARIANTS).sort(), [...meta.setups].sort(), 'a variant list for every setup');
  let labels = 0;
  for (const setup of meta.setups) {
    for (const variant of VARIANTS[setup]) {
      const p = { ...defaultsFor(meta.params, setup), ...clampParams(meta.params, setup, variant).params };
      const s = SOLVERS[setup](p);
      for (const [W, H, px] of [[1500, 844, 18], [360, 203, 14]]) {
        const scene = buildScene(setup, { s, p, state: { n: 300 }, version: 1, W, H, px, pal: PAL });
        const texts = [...(scene.tex ?? []).flatMap((t) => t.lines ?? [t.tex]), ...(scene.panels ?? []).flatMap((pn) => pn.items.filter((i) => i.kind === 'tex').map((i) => i.tex))].filter(Boolean);
        for (const t of texts) {
          labels += 1;
          assert.doesNotThrow(() => katex.renderToString(`\\displaystyle ${t}`, { throwOnError: true, strict: 'ignore' }), `${setup} ${JSON.stringify(variant)}: ${t}`);
        }
        for (const pn of scene.panels ?? []) assert.ok(pn.rect.w > 0 && pn.rect.h > 0, `${setup}: panel ${pn.id} has a size`);
      }
    }
  }
  assert.ok(labels > 300, `labels checked: ${labels}`);
});
