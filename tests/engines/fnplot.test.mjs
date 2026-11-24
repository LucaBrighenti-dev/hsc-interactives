// fnplot engine tests (guide §9.1). Every expected number comes from a formula or a hand calculation.
// Part 1: the shared expression parser (site/assets/engines/fnplot/parser.js), also used by field2d.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parse, compile, tryCompile, evaluate, freeVariables, toTex, ExpressionError, EXPRESSION_PATTERN } from '../../site/assets/engines/fnplot/parser.js';

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
  for (const ok of ['2x^2-3x+1', 'sin(pi/6)', '|x−1| + 2π', 'x² + √x', 'a sin x + b cos x', '3×x ÷ 2', '']) assert.ok(re.test(ok), ok);
  for (const bad of ['<script>', 'x"y', "x'", 'x;y', 'x{1}', '`x`', 'x&y']) assert.ok(!re.test(bad), bad);
});
