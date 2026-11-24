// Number, unit and angle formatting for readouts, labels and axes (guide §6.6: 3 s.f. by default).
// Pure functions: importable in Node for tests.
//
// Conventions:
// - Display strings use a true minus sign (U+2212) and group thousands with a narrow no-break space
//   (U+202F) from 10 000 up, e.g. "22 600". CSV export never uses these (see csv.js).
// - Very large or small magnitudes switch to "1.23 × 10⁵".

export const MINUS = '−';
export const NNBSP = ' ';
const SUPERSCRIPT = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };

export function superscript(n) {
  return String(n).split('').map((c) => SUPERSCRIPT[c] ?? c).join('');
}

/** Round to `n` significant figures, returning a number. */
export function roundSig(x, n = 3) {
  if (!Number.isFinite(x) || x === 0) return x;
  const e = Math.floor(Math.log10(Math.abs(x)));
  const factor = 10 ** (n - 1 - e);
  // Divide by the reciprocal for large factors to avoid float noise (e.g. 0.1 * 3).
  return factor >= 1 ? Math.round(x * factor) / factor : Math.round(x / (1 / factor)) * (1 / factor);
}

function group(intDigits) {
  return intDigits.length > 4 ? intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP) : intDigits;
}

/**
 * Format a number to significant figures.
 * @param {number} x
 * @param {{ sigfigs?: number, minus?: boolean, group?: boolean, sciAbove?: number, sciBelow?: number }} [opts]
 */
export function formatNumber(x, opts = {}) {
  const { sigfigs = 3, minus = true, group: useGroup = true, sciAbove = 1e6, sciBelow = 1e-3 } = opts;
  if (x === null || x === undefined || Number.isNaN(x)) return '—';
  const neg = x < 0 || Object.is(x, -0);
  const sign = (s) => (neg && !/^0(\.0*)?$/.test(s) ? (minus ? MINUS : '-') + s : s);
  if (!Number.isFinite(x)) return sign('∞');
  const ax = Math.abs(x);
  if (ax === 0) return (0).toPrecision(sigfigs);

  let e = Math.floor(Math.log10(ax));
  let mant = ax / 10 ** e;
  // Rounding can carry into a new power of ten (9.996 → 10.0).
  if (Number(mant.toPrecision(sigfigs)) >= 10) {
    e += 1;
    mant /= 10;
  }
  const rounded = roundSig(ax, sigfigs);

  if (rounded >= sciAbove || rounded < sciBelow) {
    const m = mant.toPrecision(sigfigs);
    return sign(`${m} × 10${superscript(e)}`);
  }
  let s;
  if (e >= sigfigs - 1) {
    s = group(Math.round(rounded).toFixed(0));
  } else {
    const decimals = sigfigs - 1 - e;
    const [int, frac] = rounded.toFixed(decimals).split('.');
    s = useGroup ? group(int) + (frac ? `.${frac}` : '') : int + (frac ? `.${frac}` : '');
  }
  return sign(s);
}

/** Whole numbers (counts): rounded, grouped from 10 000 up, true minus sign. formatInteger(12345) → "12 345". */
export function formatInteger(x) {
  if (!Number.isFinite(x)) return formatNumber(x);
  const n = Math.round(x);
  const s = group(String(Math.abs(n)));
  return n < 0 ? MINUS + s : s;
}

/**
 * A value as entered, for labels that echo inputs ("y = 2 sin(…)", "θ = 30°"): up to 6 significant
 * figures, trailing zeros dropped, true minus sign. Use formatNumber for computed results.
 */
export function formatPlain(x) {
  if (!Number.isFinite(x)) return formatNumber(x);
  const s = String(Number(x.toPrecision(6)));
  return s.startsWith('-') ? MINUS + s.slice(1) : s;
}

/** "40.8 m", "45.0°", "4.80 mm". Units that attach without a space: °, %, ′, ″. */
export function formatQuantity(value, unit = '', opts = {}) {
  const num = formatNumber(value, opts);
  if (!unit) return num;
  return /^[°%′″]/.test(unit) ? `${num}${unit}` : `${num}${NNBSP}${unit}`;
}

const PREFIXES = [
  [1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''],
  [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p'],
];

/** Scale into an SI prefix: siPrefix(0.0048, 'm') → "4.80 mm"; siPrefix(6.0e-7, 'm') → "600 nm". */
export function siPrefix(value, unit, opts = {}) {
  if (!Number.isFinite(value) || value === 0) return formatQuantity(value, unit, opts);
  const ax = Math.abs(roundSig(value, opts.sigfigs ?? 3));
  const [factor, prefix] = PREFIXES.find(([f]) => ax >= f) ?? PREFIXES[PREFIXES.length - 1];
  return formatQuantity(value / factor, `${prefix}${unit}`, { ...opts, sciAbove: 1e4, sciBelow: 1e-4 });
}

const DEG = Math.PI / 180;

/** Find p/q with q ≤ maxDen such that x ≈ p/q. */
function fraction(x, maxDen = 12, tol = 1e-9) {
  for (let q = 1; q <= maxDen; q++) {
    const p = Math.round(x * q);
    if (Math.abs(x - p / q) < tol) {
      const g = gcd(Math.abs(p), q);
      return [p / g, q / g];
    }
  }
  return null;
}
function gcd(a, b) {
  return b ? gcd(b, a % b) : a || 1;
}

/**
 * Format an angle.
 * @param {number} value
 * @param {{ from?: 'rad'|'deg', to?: 'deg'|'rad'|'pi', sigfigs?: number }} [opts]
 *   to: 'pi' gives exact multiples such as "3π/4", "−π/2", falling back to "0.318π".
 */
export function formatAngle(value, { from = 'rad', to = 'deg', sigfigs = 3 } = {}) {
  const rad = from === 'deg' ? value * DEG : value;
  if (to === 'deg') return formatQuantity(rad / DEG, '°', { sigfigs });
  if (to === 'rad') return formatQuantity(rad, 'rad', { sigfigs });
  const k = rad / Math.PI;
  const f = fraction(k);
  if (!f) return `${formatNumber(k, { sigfigs })}π`;
  const [p, q] = f;
  if (p === 0) return '0';
  const sign = p < 0 ? MINUS : '';
  const num = Math.abs(p) === 1 ? 'π' : `${Math.abs(p)}π`;
  return q === 1 ? `${sign}${num}` : `${sign}${num}/${q}`;
}

/** Decimal places implied by a slider step: 0.5 → 1, 0.01 → 2, 1 → 0, 2.5e-4 → 5. */
export function decimalsForStep(step) {
  if (!step || !Number.isFinite(step)) return 2;
  const s = String(step);
  if (s.includes('e-')) {
    const [m, exp] = s.split('e-');
    return Number(exp) + (m.split('.')[1]?.length ?? 0);
  }
  return s.split('.')[1]?.length ?? 0;
}

/** Plain value for a number input (ASCII minus, no grouping): formatStepValue(19.6000001, 0.1) → "19.6". */
export function formatStepValue(value, step) {
  if (!Number.isFinite(value)) return '';
  const d = decimalsForStep(step);
  const fixed = value.toFixed(Math.min(d + 2, 10));
  // Keep extra precision a teacher typed in, but trim float noise and trailing zeros beyond the step.
  const trimmed = String(Number(fixed));
  const minDecimals = d;
  const [int, frac = ''] = trimmed.split('.');
  return frac.length >= minDecimals ? trimmed : `${int}.${frac.padEnd(minDecimals, '0')}`.replace(/\.$/, '');
}
