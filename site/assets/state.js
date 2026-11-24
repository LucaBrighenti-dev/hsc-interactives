// URL state and parameter validation (guide §5.5). Pure except syncUrl(), which touches history.
//
// URL shape: ?preset=<name>&<param>=<value>&...  plus optional embed=1, theme=dark|projector,
// test=1, present=1, playlist=<id>&i=<n>.
// Numbers are plain decimals, booleans 1/0, enums by value, lists as comma lists.
// Unknown keys are ignored. Invalid values fall back or are clamped and reported in `invalid`.
//
// Param spec types (engine meta.params):
//   number  { min, max, step, default, integer? }
//   boolean { default }
//   enum    { options: [[value, label], ...], default }   (values are strings)
//   string  { default, maxLength? (200), pattern? }        (e.g. an expression for fnplot)
//   list    { default: number[], min?, max?, minItems?, maxItems? }
// Every spec may have `setups: [...]` (default: all setups) and `visibleWhen: { key: value | [values] }`.

export const RESERVED_KEYS = ['preset', 'embed', 'theme', 'test', 'present', 'playlist', 'i'];
const NUMBER_RE = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;

/** [key, spec] pairs that apply to `setup`. */
export function paramsFor(metaParams, setup) {
  return Object.entries(metaParams || {}).filter(([, spec]) => !spec.setups || !setup || spec.setups.includes(setup));
}

export function defaultsFor(metaParams, setup) {
  const out = {};
  for (const [key, spec] of paramsFor(metaParams, setup)) out[key] = clone(spec.default);
  return out;
}

function clone(v) {
  return Array.isArray(v) ? v.slice() : v;
}

function toNumber(raw) {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string' && NUMBER_RE.test(raw.trim())) return Number(raw.trim());
  return NaN;
}

function clampNumber(spec, n) {
  let v = n;
  if (spec.integer) v = Math.round(v);
  if (spec.min !== undefined && v < spec.min) v = spec.min;
  if (spec.max !== undefined && v > spec.max) v = spec.max;
  return v;
}

/**
 * Coerce one raw value (a URL string or a typed value) against its spec.
 * @returns {{ value: any, ok: boolean }} ok is false when the value was invalid or had to be clamped.
 */
export function coerceParam(spec, raw) {
  switch (spec.type) {
    case 'number': {
      const n = toNumber(raw);
      if (!Number.isFinite(n)) return { value: spec.default, ok: false };
      const v = clampNumber(spec, n);
      return { value: v, ok: v === n };
    }
    case 'boolean': {
      if (raw === true || raw === 1 || raw === '1' || raw === 'true') return { value: true, ok: true };
      if (raw === false || raw === 0 || raw === '0' || raw === 'false') return { value: false, ok: true };
      return { value: spec.default, ok: false };
    }
    case 'enum': {
      const values = spec.options.map(([v]) => v);
      const s = String(raw);
      return values.includes(s) ? { value: s, ok: true } : { value: spec.default, ok: false };
    }
    case 'string': {
      if (typeof raw !== 'string') return { value: spec.default, ok: false };
      const max = spec.maxLength ?? 200;
      if (raw.length > max) return { value: spec.default, ok: false };
      if (spec.pattern && !new RegExp(spec.pattern, 'u').test(raw)) return { value: spec.default, ok: false };
      return { value: raw, ok: true };
    }
    case 'list': {
      const items = Array.isArray(raw) ? raw : typeof raw === 'string' ? (raw.trim() === '' ? [] : raw.split(',')) : null;
      if (!items) return { value: clone(spec.default), ok: false };
      const nums = items.map(toNumber);
      if (nums.some((n) => !Number.isFinite(n))) return { value: clone(spec.default), ok: false };
      if (spec.minItems !== undefined && nums.length < spec.minItems) return { value: clone(spec.default), ok: false };
      let ok = true;
      let out = nums.map((n) => {
        const v = clampNumber(spec, n);
        if (v !== n) ok = false;
        return v;
      });
      if (spec.maxItems !== undefined && out.length > spec.maxItems) {
        out = out.slice(0, spec.maxItems);
        ok = false;
      }
      return { value: out, ok };
    }
    default:
      throw new Error(`Unknown param type "${spec.type}"`);
  }
}

/**
 * Validate a partial params object against meta.params (used by engines in setParams).
 * Unknown keys and keys for other setups are dropped.
 * @returns {{ params: object, invalid: string[] }}
 */
export function clampParams(metaParams, setup, partial) {
  const allowed = new Map(paramsFor(metaParams, setup));
  const params = {};
  const invalid = [];
  for (const [key, raw] of Object.entries(partial || {})) {
    const spec = allowed.get(key);
    if (!spec) continue;
    const { value, ok } = coerceParam(spec, raw);
    params[key] = value;
    if (!ok) invalid.push(key);
  }
  return { params, invalid };
}

/**
 * Read state from a query string.
 * @returns {{ preset: string|null, params: object, invalid: string[], flags: object }}
 */
export function parseQuery(search, metaParams, setup) {
  const q = new URLSearchParams(search);
  const raw = {};
  for (const [key, value] of q) if (!RESERVED_KEYS.includes(key)) raw[key] = value;
  const { params, invalid } = clampParams(metaParams, setup, raw);
  const theme = q.get('theme');
  const i = Number(q.get('i'));
  return {
    preset: q.get('preset') || null,
    params,
    invalid,
    flags: {
      embed: q.get('embed') === '1',
      test: q.get('test') === '1',
      present: q.get('present') === '1',
      theme: theme === 'dark' || theme === 'projector' ? theme : null,
      playlist: q.get('playlist') || null,
      i: Number.isInteger(i) && i >= 0 ? i : 0,
    },
  };
}

/** Defaults for the setup ← presets.default ← presets[name] ← URL params. */
export function resolveParams({ metaParams, setup, presets = {}, presetName = null, urlParams = {} }) {
  const base = defaultsFor(metaParams, setup);
  const fromPreset = (name) => (name && presets[name] ? clampParams(metaParams, setup, presets[name]).params : {});
  return { ...base, ...fromPreset('default'), ...(presetName && presetName !== 'default' ? fromPreset(presetName) : {}), ...urlParams };
}

export function serializeValue(spec, value) {
  switch (spec.type) {
    case 'number':
      return String(Number(Number(value).toPrecision(12)));
    case 'boolean':
      return value ? '1' : '0';
    case 'list':
      return (value || []).map((n) => String(Number(Number(n).toPrecision(12)))).join(',');
    default:
      return String(value);
  }
}

/**
 * Build a query string. Writes every param of the setup so a shared link is exact even if
 * presets change later, plus the preset name and any flags.
 */
export function toQuery(params, metaParams, setup, { preset = null, flags = {} } = {}) {
  const q = new URLSearchParams();
  if (preset && preset !== 'default') q.set('preset', preset);
  for (const [key, spec] of paramsFor(metaParams, setup)) {
    if (key in params) q.set(key, serializeValue(spec, params[key]));
  }
  if (flags.embed) q.set('embed', '1');
  if (flags.theme === 'dark') q.set('theme', 'dark');
  if (flags.present) q.set('present', '1');
  if (flags.test) q.set('test', '1');
  if (flags.playlist) {
    q.set('playlist', flags.playlist);
    q.set('i', String(flags.i ?? 0));
  }
  return q.toString();
}

/** Is a control visible given the current params? (spec.visibleWhen) */
export function isVisible(spec, params) {
  if (!spec.visibleWhen) return true;
  return Object.entries(spec.visibleWhen).every(([key, want]) => (Array.isArray(want) ? want.includes(params[key]) : params[key] === want));
}

export function debounce(fn, ms) {
  let timer = null;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.flush = (...args) => {
    clearTimeout(timer);
    fn(...args);
  };
  return debounced;
}

/** Debounced (300 ms) history.replaceState with the current params. Browser only. */
export function createUrlSync({ metaParams, setup, getState }) {
  return debounce(() => {
    const { params, preset, flags } = getState();
    const query = toQuery(params, metaParams, setup, { preset, flags });
    const url = `${location.pathname}${query ? `?${query}` : ''}${location.hash}`;
    if (url !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(history.state, '', url);
  }, 300);
}
