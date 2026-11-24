// Shared helpers for the acceptance runner and repo checks: find spec acceptance blocks and their targets.
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..', '..');

/** The reference page has no catalog entry, so the runner always includes it. */
export const REFERENCE_TARGET = { id: '_template', path: '/interactives/_template.html', spec: 'specs/_demo.md' };

const BLOCK_RE = /```acceptance\s*\r?\n([\s\S]*?)\r?\n```/;
const RUN_VALUES = ['complete', 'static'];

/** Parse YAML-ish frontmatter keys we care about (flat `key: value` lines only). */
export function frontmatter(md) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z]+):\s*(.*?)\s*(#.*)?$/.exec(line);
    if (kv && kv[2] !== '') out[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1');
  }
  return out;
}

/** → { checks, error } where error is a readable problem with the block, or null. */
export function parseAcceptance(md) {
  const m = BLOCK_RE.exec(md);
  if (!m) return { checks: [], error: 'no ```acceptance block' };
  let checks;
  try {
    checks = JSON.parse(m[1]);
  } catch (err) {
    return { checks: [], error: `acceptance block is not valid JSON (${err.message})` };
  }
  if (!Array.isArray(checks) || checks.length === 0) return { checks: [], error: 'acceptance block must be a non-empty array' };
  for (const [i, c] of checks.entries()) {
    const where = `check ${i + 1}${c?.name ? ` "${c.name}"` : ''}`;
    if (!c || typeof c !== 'object') return { checks: [], error: `${where}: must be an object` };
    if (typeof c.name !== 'string' || !c.name.trim()) return { checks: [], error: `${where}: needs a name` };
    if (c.params !== undefined && (typeof c.params !== 'object' || Array.isArray(c.params))) return { checks: [], error: `${where}: params must be an object` };
    const runOk = RUN_VALUES.includes(c.run) || (c.run && typeof c.run === 'object' && Number.isInteger(c.run.steps) && c.run.steps > 0);
    if (!runOk) return { checks: [], error: `${where}: run must be "complete", "static" or { "steps": N }` };
    if (!c.expect || typeof c.expect !== 'object' || !Object.keys(c.expect).length) return { checks: [], error: `${where}: expect needs at least one output` };
    for (const [key, e] of Object.entries(c.expect)) {
      if (typeof e?.value !== 'number' || !Number.isFinite(e.value)) return { checks: [], error: `${where}: expect.${key}.value must be a number` };
      const hasTol = (typeof e.relTol === 'number' && e.relTol > 0) || (typeof e.absTol === 'number' && e.absTol > 0);
      if (!hasTol) return { checks: [], error: `${where}: expect.${key} needs relTol or absTol` };
    }
  }
  return { checks, error: null };
}

/** Pages the acceptance runner must check: catalog pages in review or live, plus the reference page. */
export function acceptanceTargets(catalogEntries) {
  const pages = catalogEntries.filter((e) => e.kind === 'page' && (e.status === 'review' || e.status === 'live'));
  return [REFERENCE_TARGET, ...pages.map((e) => ({ id: e.id, path: e.path, spec: `specs/${e.id}.md` }))];
}

/** Compare one output with its expectation. Returns null when it passes, or a message. */
export function compare(key, actual, { value, relTol, absTol }) {
  if (typeof actual !== 'number' || !Number.isFinite(actual)) return `${key}: expected ${value}, got ${actual}`;
  const err = Math.abs(actual - value);
  const tol = Math.max(typeof absTol === 'number' ? absTol : 0, typeof relTol === 'number' ? relTol * Math.abs(value) : 0);
  return err <= tol ? null : `${key}: expected ${value} ± ${tol}, got ${actual} (error ${err})`;
}

export function readSpec(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}
