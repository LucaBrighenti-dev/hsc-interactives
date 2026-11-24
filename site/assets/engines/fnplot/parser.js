// Safe maths expression parser, shared by the fnplot and field2d engines (guide §9.1).
// Source text → tokens → Pratt parser → AST → a tree of small closures. It never builds code from
// strings: no eval, no Function constructor, no dynamic import. Pure: no DOM, importable in Node.
//
// ── API ────────────────────────────────────────────────────────────────────────────────────────
//   parse(src, { variables? })          → AST. Throws ExpressionError { message, pos, end } (0-based
//                                         character offsets into src) on bad input.
//   compile(srcOrAst, { variables? })   → evaluator (scope) => number, e.g. f({ x: 2, a: 1 }).
//                                         The evaluator also carries .ast, .variables (names used,
//                                         sorted), .source and .tex. Throws ExpressionError.
//   tryCompile(src, { variables? })     → { ok: true, fn, ast } | { ok: false, error: { message, pos, end } }
//                                         Use this in engines: show error.message calmly on stage.
//   evaluate(ast, scope)                → number (tree walk; compile() is faster inside loops).
//   freeVariables(ast)                  → sorted names of the variables an AST uses.
//   toTex(ast)                          → LaTeX for KaTeX labels, e.g. "2x^{2}-3x+1".
//   EXPRESSION_PATTERN                  → a `pattern` for string params that hold expressions (§5.10).
//   FUNCTION_NAMES, CONSTANT_NAMES, ExpressionError
//
//   `variables` lists the names an expression may use (['x'], ['x', 'y'], ['t', 'a', 'b'] …).
//   With it, any other name is an error that lists the allowed ones. Without it (exploring only),
//   every single letter is a variable (lower-cased, so X and x are the same). Variable names are
//   letters only and must not clash with a function or constant name (so never 'e').
//
// ── Syntax ─────────────────────────────────────────────────────────────────────────────────────
//   Numbers 2, 2.5, .5 (no 1e5 notation: "2e" means 2 × e). Constants pi (π) and e.
//   + − * / and right-associative ^ (2^3^2 = 2^9). Unary minus is weaker than ^, so -2^2 = −4.
//   Implicit multiplication has the same precedence as * : 2x, 2(x+1), (x+1)(x−1), 3sin x, x y,
//   2xy, pi x. Runs of letters split into known names, longest first: "sinx" = sin x, "ax" = a·x
//   when a and x are variables, "asinx" = asin x (write "a sin x" for a·sin x). A number may not
//   follow a value directly ("x2" is an error).
//   Typed exponents and fractions follow the precedence above, which differs from Desmos's editor:
//     e^2x = e²·x, e^-kt = e^(−k)·t, 1/2x = x/2, sin pi/6 = sin(π)/6. Use brackets: e^(2x), 1/(2x).
//   Functions: sin cos tan asin acos atan sec csc cot exp ln log (base 10) sqrt abs sign floor,
//   with aliases cosec, arcsin, arccos, arctan, sgn. Names are case-insensitive. Angles are in
//   radians. "log10(x)" and "ln2(x)" are errors (they would read as log(10x)): write log(x).
//   Arguments: sin(x+1), or without brackets, where the argument runs over implicit products and
//   powers and stops at + − * / or the next function: sin 2x = sin(2x), sin x^2 = sin(x²),
//   sin x/2 = (sin x)/2, 2 sin x cos x = 2·sin(x)·cos(x).
//   Function powers: sin^2 x = (sin x)². Inverse trig: sin^-1 x = asin x (also cos, tan).
//   Absolute value bars: |x − 1|, 2|x|, |sqrt(2|x|) − 3|. Bars directly inside bars are ambiguous
//   (|2|x| − 3| reads as |2|·x·|−3|): use abs() for nested absolute values.
//   Unicode: π θ α β λ μ ω φ, − – × · ÷ √ and superscript digits (x²³ = x^23) are accepted; any
//   Unicode space counts as a space.
//   x^(p/q) with q odd gives the real root of a negative base: (-8)^(1/3) = −2.
//   Domain errors evaluate to NaN or ±Infinity (sqrt(-1), ln 0, 1/0); they never throw.

/** Bad input. `pos` and `end` are 0-based character offsets into the source. */
export class ExpressionError extends Error {
  constructor(message, pos = 0, end = pos + 1) {
    super(message);
    this.name = 'ExpressionError';
    this.pos = pos;
    this.end = end;
  }
}

const sec = (x) => 1 / Math.cos(x);
const csc = (x) => 1 / Math.sin(x);
const cot = (x) => Math.cos(x) / Math.sin(x);

// Lookup tables have no prototype, so names such as "constructor" or "toString" are never found.
const table = (entries) => Object.freeze(Object.assign(Object.create(null), entries));

// name → [implementation, LaTeX command]
const FUNCTIONS = table({
  sin: [Math.sin, '\\sin'],
  cos: [Math.cos, '\\cos'],
  tan: [Math.tan, '\\tan'],
  asin: [Math.asin, '\\sin^{-1}'],
  acos: [Math.acos, '\\cos^{-1}'],
  atan: [Math.atan, '\\tan^{-1}'],
  sec: [sec, '\\sec'],
  csc: [csc, '\\operatorname{cosec}'],
  cot: [cot, '\\cot'],
  exp: [Math.exp, '\\exp'],
  ln: [Math.log, '\\ln'],
  log: [Math.log10, '\\log_{10}'],
  sqrt: [Math.sqrt, null],
  abs: [Math.abs, null],
  sign: [Math.sign, '\\operatorname{sgn}'],
  floor: [Math.floor, null],
});
const ALIASES = table({ cosec: 'csc', arcsin: 'asin', arccos: 'acos', arctan: 'atan', sgn: 'sign' });
const INVERSES = table({ sin: 'asin', cos: 'acos', tan: 'atan' });
const CONSTANTS = table({ pi: Math.PI, e: Math.E });
const GREEK = table({ 'π': 'pi', 'θ': 'theta', 'α': 'alpha', 'β': 'beta', 'λ': 'lambda', 'μ': 'mu', 'ω': 'omega', 'φ': 'phi' });
const GREEK_TEX = table({ theta: '\\theta', alpha: '\\alpha', beta: '\\beta', lambda: '\\lambda', mu: '\\mu', omega: '\\omega', phi: '\\phi' });

export const FUNCTION_NAMES = Object.freeze([...Object.keys(FUNCTIONS), ...Object.keys(ALIASES)]);
export const CONSTANT_NAMES = Object.freeze(Object.keys(CONSTANTS));

/**
 * `pattern` for string params holding an expression: letters, digits, spaces, operators, brackets,
 * bars and the Unicode maths symbols the parser accepts. Markup and quote characters never pass.
 */
// Every punctuation mark is escaped, so the pattern is valid with the `u` flag (state.js) and the
// stricter `v` flag that browsers use for an HTML input's `pattern` attribute.
export const EXPRESSION_PATTERN = '^[0-9A-Za-z\\s\\.\\+\\-\\*\\/\\^\\(\\)\\|πθαβλμωφ−–×·⋅÷√⁰¹²³⁴⁵⁶⁷⁸⁹]*$';

// Binding powers (Pratt).
const BP = table({ '+': 10, '-': 10, '*': 20, '/': 20, '^': 30 });
const IMPLICIT_BP = 20;
const UNARY_BP = 25; // weaker than ^, stronger than * and /
const FN_ARG_BP = 19; // a bare function argument takes implicit products, not explicit * or /
const MAX_DEPTH = 200; // nested brackets and operators; far beyond any real expression

const OP_CHARS = table({ '+': '+', '-': '-', '*': '*', '/': '/', '^': '^', '−': '-', '–': '-', '×': '*', '·': '*', '⋅': '*', '÷': '/' });
const SUPERSCRIPTS = table({ '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 });

const isSpace = (c) => /\s/u.test(c);
const isDigit = (c) => c >= '0' && c <= '9';
const isLetter = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
const quote = (s) => `"${s}"`;
const at = (pos) => `at character ${pos + 1}`;

function checkVariables(variables) {
  if (!variables) return null;
  const set = new Set();
  for (const v of variables) {
    if (typeof v !== 'string' || !/^[A-Za-z]+$/.test(v)) throw new Error(`Variable names must be letters only: ${quote(v)}`);
    const lower = v.toLowerCase();
    if (lower in FUNCTIONS || lower in ALIASES || lower in CONSTANTS) throw new Error(`The variable name ${quote(v)} is already a function or constant.`);
    set.add(v);
  }
  return set;
}

// ── Tokenizer ──────────────────────────────────────────────────────────────────────────────────

function tokenize(src, vars) {
  const tokens = [];
  const n = src.length;
  let i = 0;
  while (i < n) {
    const c = src[i];
    if (isSpace(c)) {
      i += 1;
      continue;
    }
    if (isDigit(c) || (c === '.' && isDigit(src[i + 1] ?? ''))) {
      const start = i;
      while (i < n && isDigit(src[i])) i += 1;
      if (src[i] === '.') {
        i += 1;
        while (i < n && isDigit(src[i])) i += 1;
      }
      if (src[i] === '.') throw new ExpressionError(`The number ${at(start)} has two decimal points.`, start, i + 1);
      const text = src.slice(start, i);
      tokens.push({ type: 'num', value: Number(text), text, pos: start, end: i });
      continue;
    }
    if (isLetter(c)) {
      const start = i;
      while (i < n && isLetter(src[i])) i += 1;
      splitWord(src.slice(start, i), start, vars, tokens);
      continue;
    }
    if (c in GREEK) {
      tokens.push(nameToken(GREEK[c], c, i, vars, true));
      i += 1;
      continue;
    }
    if (c === '*' && src[i + 1] === '*') {
      tokens.push({ type: 'op', value: '^', text: '**', pos: i, end: i + 2 });
      i += 2;
      continue;
    }
    if (c in OP_CHARS) {
      tokens.push({ type: 'op', value: OP_CHARS[c], text: c, pos: i, end: i + 1 });
      i += 1;
      continue;
    }
    if (c in SUPERSCRIPTS) {
      // A run of superscript digits is one exponent: x²³ = x^23.
      const start = i;
      let digits = '';
      while (i < n && src[i] in SUPERSCRIPTS) digits += SUPERSCRIPTS[src[i++]];
      tokens.push({ type: 'op', value: '^', text: src.slice(start, i), pos: start, end: i });
      tokens.push({ type: 'num', value: Number(digits), text: digits, pos: start, end: i });
      continue;
    }
    if (c === '√') {
      tokens.push({ type: 'name', kind: 'fn', name: 'sqrt', text: c, pos: i, end: i + 1 });
      i += 1;
      continue;
    }
    if (c === '(' || c === ')') {
      tokens.push({ type: c === '(' ? 'lparen' : 'rparen', text: c, pos: i, end: i + 1 });
      i += 1;
      continue;
    }
    if (c === '|') {
      tokens.push({ type: 'bar', text: c, pos: i, end: i + 1 });
      i += 1;
      continue;
    }
    throw new ExpressionError(`${quote(c)} ${at(i)} can't be used in an expression.`, i, i + 1);
  }
  tokens.push({ type: 'end', text: '', pos: n, end: n });
  return tokens;
}

/** What a name means: a variable (exact match first), a function, a constant, or null. */
function lookup(name, vars) {
  if (vars ? vars.has(name) : false) return { kind: 'var', name };
  const lower = name.toLowerCase();
  if (lower in FUNCTIONS) return { kind: 'fn', name: lower };
  if (lower in ALIASES) return { kind: 'fn', name: ALIASES[lower] };
  if (lower in CONSTANTS) return { kind: 'const', name: lower };
  if (vars) {
    for (const v of vars) if (v.toLowerCase() === lower) return { kind: 'var', name: v };
    return null;
  }
  if (name.length === 1 || lower in GREEK_TEX) return { kind: 'var', name: lower };
  return null;
}

function nameToken(name, text, pos, vars, isGreekChar = false) {
  const hit = lookup(name, vars);
  if (!hit) throw unknownName(isGreekChar ? text : name, pos, vars);
  return { type: 'name', kind: hit.kind, name: hit.name, text, pos, end: pos + text.length };
}

function unknownName(name, pos, vars) {
  const list = vars && vars.size ? ` Variables you can use: ${[...vars].join(', ')}.` : '';
  return new ExpressionError(`${quote(name)} ${at(pos)} is not a function or variable here.${list}`, pos, pos + name.length);
}

/** Split a run of letters into known names, longest match first ("sinx" → sin, x). */
function splitWord(word, start, vars, tokens) {
  const maxLen = Math.max(6, ...[...(vars ?? [])].map((v) => v.length));
  let j = 0;
  while (j < word.length) {
    let found = null;
    for (let len = Math.min(maxLen, word.length - j); len >= 1; len -= 1) {
      const part = word.slice(j, j + len);
      const hit = lookup(part, vars);
      if (hit) {
        found = { ...hit, len, text: part };
        break;
      }
    }
    if (!found) {
      // Report the whole word if no part of it is known, otherwise the letter that failed.
      const bad = j === 0 ? word : word[j];
      throw unknownName(bad, start + j, vars);
    }
    tokens.push({ type: 'name', kind: found.kind, name: found.name, text: found.text, pos: start + j, end: start + j + found.len });
    j += found.len;
  }
}

// ── Pratt parser ───────────────────────────────────────────────────────────────────────────────

/**
 * Parse an expression into an AST. Node shapes:
 *   { type: 'num', value, text } · { type: 'const', name } · { type: 'var', name }
 *   { type: 'neg', arg } · { type: 'bin', op: '+'|'-'|'*'|'/'|'^', left, right, implicit?, fnPower? }
 *   { type: 'call', name, arg }
 * Every node also has pos and end (0-based offsets into src).
 * @param {string} src
 * @param {{ variables?: string[] }} [opts]
 */
export function parse(src, opts = {}) {
  if (typeof src !== 'string') throw new ExpressionError('Enter an expression.', 0, 0);
  const vars = checkVariables(opts.variables);
  const tokens = tokenize(src, vars);
  const p = new Parser(tokens);
  return p.parseAll();
}

class Parser {
  constructor(tokens) {
    this.toks = tokens;
    this.i = 0;
    this.absDepth = 0; // open |…| groups at the current bracket level
    this.depth = 0; // recursion guard
  }

  /** The inside of ( … ) after the "(" token: bars inside brackets start afresh. */
  bracketed(open) {
    const saved = this.absDepth;
    this.absDepth = 0;
    const inner = this.expr(0);
    const close = this.expectClose(open);
    this.absDepth = saved;
    return { inner, close };
  }

  peek(k = 0) {
    return this.toks[Math.min(this.i + k, this.toks.length - 1)];
  }

  next() {
    const t = this.toks[this.i];
    if (this.i < this.toks.length - 1) this.i += 1;
    return t;
  }

  parseAll() {
    if (this.peek().type === 'end') throw new ExpressionError('Enter an expression, for example 2x^2 - 3x + 1.', 0, 0);
    const node = this.expr(0);
    const t = this.peek();
    if (t.type !== 'end') {
      if (t.type === 'rparen') throw new ExpressionError(`The ")" ${at(t.pos)} has no "(" to match it.`, t.pos, t.end);
      if (t.type === 'bar') throw new ExpressionError(`The "|" ${at(t.pos)} has no "|" to match it.`, t.pos, t.end);
      throw new ExpressionError(`Unexpected ${quote(t.text)} ${at(t.pos)}.`, t.pos, t.end);
    }
    return node;
  }

  /** Parse while the next operator binds tighter than rbp. fnArg: a bare function argument. */
  expr(rbp, fnArg = false) {
    if (++this.depth > MAX_DEPTH) {
      const t = this.peek();
      throw new ExpressionError(`This expression is nested too deeply to read (${at(t.pos)}).`, t.pos, t.end);
    }
    try {
      return this.exprInner(rbp, fnArg);
    } finally {
      this.depth -= 1;
    }
  }

  exprInner(rbp, fnArg) {
    let left = this.nud(this.next());
    for (;;) {
      const t = this.peek();
      if (t.type === 'op') {
        if (fnArg && t.value !== '^') break;
        const lbp = BP[t.value];
        if (lbp <= rbp) break;
        this.next();
        left = this.led(t, left);
        continue;
      }
      if (t.type === 'bar' && this.absDepth > 0) break; // closes the current |…|
      if (t.type === 'num') {
        throw new ExpressionError(`Put an operator before the number ${quote(t.text)} ${at(t.pos)}, for example * or ^.`, t.pos, t.end);
      }
      if (t.type === 'name' || t.type === 'lparen' || t.type === 'bar') {
        // Implicit multiplication.
        if (fnArg && t.type === 'name' && t.kind === 'fn') break;
        if (IMPLICIT_BP <= rbp) break;
        const right = this.expr(IMPLICIT_BP);
        left = { type: 'bin', op: '*', left, right, implicit: true, pos: left.pos, end: right.end };
        continue;
      }
      break; // ')' or end
    }
    return left;
  }

  nud(t) {
    switch (t.type) {
      case 'num':
        return { type: 'num', value: t.value, text: t.text, pos: t.pos, end: t.end };
      case 'name':
        if (t.kind === 'const') return { type: 'const', name: t.name, pos: t.pos, end: t.end };
        if (t.kind === 'var') return { type: 'var', name: t.name, pos: t.pos, end: t.end };
        return this.call(t);
      case 'op': {
        if (t.value === '-' || t.value === '+') {
          const arg = this.expr(UNARY_BP);
          return t.value === '-' ? { type: 'neg', arg, pos: t.pos, end: arg.end } : arg;
        }
        throw new ExpressionError(`${quote(t.text)} ${at(t.pos)} needs something before it.`, t.pos, t.end);
      }
      case 'lparen':
        return this.bracketed(t).inner;
      case 'bar': {
        this.absDepth += 1;
        const inner = this.expr(0);
        const close = this.peek();
        if (close.type !== 'bar') throw new ExpressionError(`The "|" ${at(t.pos)} needs a closing "|".`, t.pos, t.end);
        this.next();
        this.absDepth -= 1;
        return { type: 'call', name: 'abs', arg: inner, pos: t.pos, end: close.end };
      }
      case 'rparen':
        throw new ExpressionError(`Unexpected ")" ${at(t.pos)}. Something is missing before it.`, t.pos, t.end);
      case 'end': {
        const prev = this.toks[this.toks.indexOf(t) - 1];
        const after = prev ? ` after ${quote(prev.text)}` : '';
        throw new ExpressionError(`Something is missing${after} at the end.`, t.pos, t.end);
      }
      default:
        throw new ExpressionError(`Unexpected ${quote(t.text)} ${at(t.pos)}.`, t.pos, t.end);
    }
  }

  led(t, left) {
    const right = t.value === '^' ? this.expr(BP['^'] - 1) : this.expr(BP[t.value]);
    return { type: 'bin', op: t.value, left, right, pos: left.pos, end: right.end };
  }

  expectClose(open) {
    const t = this.peek();
    if (t.type !== 'rparen') throw new ExpressionError(`The "(" ${at(open.pos)} needs a closing ")".`, open.pos, open.end);
    return this.next();
  }

  /** A function name: optional ^power or ^-1, then a bracketed or bare argument. */
  call(t) {
    let name = t.name;
    let power = null;
    const after = this.peek();
    if ((name === 'log' || name === 'ln') && after.type === 'num' && after.pos === t.end) {
      // "log10(x)" would read as log(10x): almost certainly not what was meant.
      throw new ExpressionError(
        `"${t.text}${after.text}" isn't a function here (it would mean ${t.text}(${after.text}x)). Write log(x) for base 10 or ln(x) for base e; for base b use ln(x)/ln(b).`,
        t.pos,
        after.end,
      );
    }
    if (this.peek().type === 'op' && this.peek().value === '^') {
      const caret = this.next();
      if (this.isMinusOne()) {
        if (!INVERSES[name]) throw new ExpressionError(`${name}^-1 isn't supported ${at(t.pos)}. Only sin, cos and tan have an inverse written this way.`, t.pos, caret.end);
        name = INVERSES[name];
      } else {
        const pt = this.next();
        if (pt.type === 'num') power = { type: 'num', value: pt.value, text: pt.text, pos: pt.pos, end: pt.end };
        else if (pt.type === 'lparen') power = this.bracketed(pt).inner;
        else throw new ExpressionError(`Write the power of ${quote(t.text)} as a number, for example sin^2 x.`, caret.pos, caret.end);
      }
    }
    const nx = this.peek();
    let arg;
    if (nx.type === 'lparen') {
      this.next();
      const { inner, close } = this.bracketed(nx);
      arg = { ...inner, end: close.end };
    } else if (nx.type === 'end' || nx.type === 'rparen' || (nx.type === 'bar' && this.absDepth > 0) || (nx.type === 'op' && nx.value !== '-')) {
      throw new ExpressionError(`${quote(t.text)} ${at(t.pos)} needs something to act on, for example ${t.name === 'sqrt' ? 'sqrt(x)' : `${t.text}(x)`}.`, t.pos, t.end);
    } else {
      arg = this.expr(FN_ARG_BP, true);
    }
    let node = { type: 'call', name, arg, pos: t.pos, end: arg.end };
    if (power) node = { type: 'bin', op: '^', left: node, right: power, fnPower: true, pos: t.pos, end: arg.end };
    return node;
  }

  /** Consume "-1" or "(-1)" after a function's ^ if present. */
  isMinusOne() {
    const a = this.peek(0);
    const b = this.peek(1);
    if (a.type === 'op' && a.value === '-' && b.type === 'num' && b.value === 1) {
      this.next();
      this.next();
      return true;
    }
    const c = this.peek(2);
    const d = this.peek(3);
    if (a.type === 'lparen' && b.type === 'op' && b.value === '-' && c.type === 'num' && c.value === 1 && d.type === 'rparen') {
      for (let k = 0; k < 4; k++) this.next();
      return true;
    }
    return false;
  }
}

// ── Evaluation ─────────────────────────────────────────────────────────────────────────────────

/** a^b, with the real root for a negative base and an exponent p/q (q odd, up to 9). */
function power(a, b) {
  if (a < 0 && !Number.isInteger(b) && Number.isFinite(b)) {
    for (const q of [3, 5, 7, 9]) {
      const p = Math.round(b * q);
      if (Math.abs(b * q - p) < 1e-9) {
        const r = Math.abs(a) ** b;
        return p % 2 === 0 ? r : -r;
      }
    }
  }
  return a ** b;
}

function build(node) {
  switch (node.type) {
    case 'num': {
      const v = node.value;
      return () => v;
    }
    case 'const': {
      const v = CONSTANTS[node.name];
      return () => v;
    }
    case 'var': {
      const name = node.name;
      return (s) => {
        const v = s[name];
        return typeof v === 'number' ? v : NaN;
      };
    }
    case 'neg': {
      const a = build(node.arg);
      return (s) => -a(s);
    }
    case 'call': {
      const f = FUNCTIONS[node.name][0];
      const a = build(node.arg);
      return (s) => f(a(s));
    }
    case 'bin': {
      const a = build(node.left);
      const b = build(node.right);
      switch (node.op) {
        case '+':
          return (s) => a(s) + b(s);
        case '-':
          return (s) => a(s) - b(s);
        case '*':
          return (s) => a(s) * b(s);
        case '/':
          return (s) => a(s) / b(s);
        case '^':
          return (s) => power(a(s), b(s));
        default:
          throw new Error(`Unknown operator ${node.op}`);
      }
    }
    default:
      throw new Error(`Unknown node ${node.type}`);
  }
}

/** Fold constant sub-trees (no variables) into numbers, so loops don't recompute sin(pi/6). */
function fold(node) {
  if (node.type === 'num' || node.type === 'var' || node.type === 'const') return node;
  const out = { ...node };
  if (node.type === 'neg' || node.type === 'call') out.arg = fold(node.arg);
  if (node.type === 'bin') {
    out.left = fold(node.left);
    out.right = fold(node.right);
  }
  const kids = node.type === 'bin' ? [out.left, out.right] : [out.arg];
  if (kids.every((k) => k.type === 'num' || k.type === 'const')) {
    return { type: 'num', value: build(out)({}), pos: node.pos, end: node.end };
  }
  return out;
}

/**
 * Compile an expression (or an AST from parse) into a fast evaluator `(scope) => number`.
 * @param {string|object} srcOrAst
 * @param {{ variables?: string[] }} [opts]
 */
export function compile(srcOrAst, opts = {}) {
  const ast = typeof srcOrAst === 'string' ? parse(srcOrAst, opts) : srcOrAst;
  if (typeof srcOrAst !== 'string') checkVariables(opts.variables);
  const run = build(fold(ast));
  const fn = (scope = {}) => run(scope);
  fn.ast = ast;
  fn.variables = freeVariables(ast);
  fn.source = typeof srcOrAst === 'string' ? srcOrAst : null;
  Object.defineProperty(fn, 'tex', { get: () => toTex(ast) });
  return fn;
}

/** Like compile, but returns { ok, fn, ast } or { ok: false, error: { message, pos, end } }. */
export function tryCompile(src, opts = {}) {
  try {
    const fn = compile(src, opts);
    return { ok: true, fn, ast: fn.ast };
  } catch (err) {
    if (err instanceof ExpressionError) return { ok: false, error: { message: err.message, pos: err.pos, end: err.end } };
    // Anything else (an engine passing bad options, or an absurdly long input) gets a calm message.
    return { ok: false, error: { message: "This expression can't be read. Try a shorter or simpler one.", pos: 0, end: 0 } };
  }
}

/** Evaluate an AST directly (tree walk). */
export function evaluate(ast, scope = {}) {
  return build(ast)(scope);
}

/** Sorted, de-duplicated variable names used by an AST. */
export function freeVariables(ast) {
  const names = new Set();
  const walk = (n) => {
    if (n.type === 'var') names.add(n.name);
    else if (n.type === 'neg' || n.type === 'call') walk(n.arg);
    else if (n.type === 'bin') {
      walk(n.left);
      walk(n.right);
    }
  };
  walk(ast);
  return [...names].sort();
}

// ── LaTeX ──────────────────────────────────────────────────────────────────────────────────────

const PREC = { add: 1, mul: 2, neg: 2, pow: 4, atom: 5 };

function numText(node) {
  // As typed, but ".5" reads as "0.5" and "3." as "3".
  if (node.text) return node.text.replace(/^\./, '0.').replace(/\.$/, '');
  const v = node.value;
  if (!Number.isFinite(v)) return v > 0 ? '\\infty' : v < 0 ? '-\\infty' : '\\text{undefined}';
  return String(Number(v.toPrecision(12)));
}

function precOf(node) {
  if (node.type === 'bin') {
    if (node.op === '+' || node.op === '-') return PREC.add;
    if (node.op === '*') return PREC.mul;
    if (node.op === '/') return PREC.atom; // \frac is self-contained
    return PREC.pow;
  }
  if (node.type === 'neg') return PREC.neg;
  if (node.type === 'num' && node.value < 0) return PREC.neg;
  return PREC.atom;
}

const paren = (s) => `\\left(${s}\\right)`;
const isSimpleArg = (n) => n.type === 'var' || n.type === 'const' || (n.type === 'num' && n.value >= 0) || (n.type === 'call' && n.name === 'abs');

function callTex(node, { bracket = false, powerTex = '' } = {}) {
  const arg = tex(node.arg);
  if (node.name === 'sqrt') return `\\sqrt{${arg}}`;
  if (node.name === 'abs') return `\\left|${arg}\\right|`;
  if (node.name === 'floor') return `\\left\\lfloor ${arg}\\right\\rfloor`;
  const cmd = FUNCTIONS[node.name][1] + powerTex;
  if (!bracket && isSimpleArg(node.arg)) return `${cmd} ${arg}`;
  return `${cmd}${paren(arg)}`;
}

/** First character of a LaTeX string that will be printed (to decide between juxtaposition and ×). */
const startsWithDigit = (s) => /^[0-9.]/.test(s);
/** Joining "\pi" and "x" needs a space, or LaTeX reads one command "\pix". */
/** A number straight before a fraction would read as a mixed number (2\frac{1}{3} looks like 2⅓). */
const mixedNumber = (l, r) => /[0-9.]$/.test(l) && r.startsWith('\\frac');
const joinTex = (l, r) => (startsWithDigit(r) || mixedNumber(l, r) ? `${l}\\times ${r}` : /\\[A-Za-z]+$/.test(l) && /^[A-Za-z]/.test(r) ? `${l} ${r}` : `${l}${r}`);

/**
 * LaTeX for an AST, for KaTeX labels.
 * @param {object} node
 * @param {{ trailing?: boolean }} [ctx] internal: whether something is printed straight after this node
 */
export function toTex(node, ctx = {}) {
  return tex(node, ctx);
}

function tex(node, { trailing = false } = {}) {
  switch (node.type) {
    case 'num':
      return numText(node);
    case 'const':
      return node.name === 'pi' ? '\\pi' : 'e';
    case 'var':
      return GREEK_TEX[node.name] ?? (node.name.length > 1 ? `\\mathit{${node.name}}` : node.name);
    case 'neg': {
      const a = tex(node.arg, { trailing });
      return precOf(node.arg) <= PREC.add || a.startsWith('-') ? `-${paren(a)}` : `-${a}`;
    }
    case 'call':
      return callTex(node, { bracket: trailing });
    case 'bin': {
      const { op, left, right } = node;
      // A leading minus goes in front of the fraction: (-x)/2 → -\frac{x}{2}.
      if (op === '/') return left.type === 'neg' ? `-\\frac{${tex(left.arg)}}{${tex(right)}}` : `\\frac{${tex(left)}}{${tex(right)}}`;
      if (op === '^') {
        // sin^2 x style, only for functions written as a command (not sqrt, |x| or floor).
        // Commands that already carry a superscript (\sin^{-1}) take the bracketed form instead,
        // because \sin^{-1}^{2} is a double superscript: (\sin^{-1} x)^{2}.
        const cmd = left.type === 'call' ? FUNCTIONS[left.name][1] : null;
        if (node.fnPower && cmd && !cmd.includes('^')) return callTex(left, { bracket: trailing, powerTex: `^{${tex(right)}}` });
        let base = tex(left);
        if (precOf(left) < PREC.atom || left.type === 'call' && !['abs', 'floor'].includes(left.name)) base = paren(left.type === 'call' ? callTex(left) : base);
        else if (left.type === 'bin' && left.op === '/') base = paren(base);
        return `${base}^{${tex(right)}}`;
      }
      // Anything on the right that starts with a minus sign keeps its brackets: 2(−3x), x − (−2x).
      if (op === '+' || op === '-') {
        const l = tex(left);
        let r = tex(right, { trailing });
        if (r.startsWith('-') || (op === '-' && precOf(right) <= PREC.add)) r = paren(r);
        return `${l}${op}${r}`;
      }
      // Multiplication: juxtapose ("2x", "x\sin x"), with × only before a digit. A function call on
      // the left keeps its brackets so "sin(x) y" never reads as sin(xy).
      let l = tex(left, { trailing: true });
      if (precOf(left) < PREC.mul) l = paren(l);
      let r = tex(right, { trailing });
      if (precOf(right) < PREC.mul || r.startsWith('-')) r = paren(r);
      return joinTex(l, r);
    }
    default:
      return '';
  }
}
