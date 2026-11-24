// Load, validate and merge catalog fragments (guide §5.3).
// The build fails on an invalid fragment, a duplicate id or a broken listing reference.
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG_DIR, SUBJECT_FOLDERS, pagePathForId } from './paths.mjs';
import { readJSON } from './fsutil.mjs';
import { validate } from './schema.mjs';

const PRIORITY_ORDER = { P0: 0, P1: 1, P2: 2 };
const SUBJECT_ORDER = { me1: 0, me2: 1, phy: 2, eng: 3 };

/** Returns { entries, errors }. Files whose names start with "_" are not fragments. */
export function loadCatalog(dir = CATALOG_DIR) {
  const schema = readJSON(path.join(dir, '_schema.json'));
  const errors = [];
  const entries = [];
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('_')) : [];

  for (const file of files.sort()) {
    let entry;
    try {
      entry = readJSON(path.join(dir, file));
    } catch (err) {
      errors.push(`${file}: invalid JSON (${err.message})`);
      continue;
    }
    for (const e of validate(schema, entry)) errors.push(`${file}: ${e}`);
    if (entry.id && `${entry.id}.json` !== file) errors.push(`${file}: id "${entry.id}" does not match the filename`);
    if (entry.id && entry.subject && !entry.id.startsWith(`${entry.subject}-`)) {
      errors.push(`${file}: id prefix does not match subject "${entry.subject}"`);
    }
    if (entry.kind === 'page' && entry.id && entry.path && entry.path !== pagePathForId(entry.id)) {
      errors.push(`${file}: path should be ${pagePathForId(entry.id)} (page path rule, guide §4)`);
    }
    if (entry.subject && entry.path && entry.kind === 'page' && !entry.path.startsWith(`/interactives/${SUBJECT_FOLDERS[entry.subject]}/`)) {
      errors.push(`${file}: path folder does not match subject`);
    }
    entries.push(entry);
  }

  const byId = new Map();
  for (const e of entries) {
    if (byId.has(e.id)) errors.push(`duplicate id "${e.id}"`);
    byId.set(e.id, e);
  }
  for (const e of entries.filter((x) => x.kind === 'listing')) {
    const page = byId.get(e.listingOf);
    if (!page) {
      errors.push(`${e.id}.json: listingOf "${e.listingOf}" is not a catalog page`);
      continue;
    }
    if (page.kind !== 'page') errors.push(`${e.id}.json: listingOf must point at a page, not a listing`);
    const expected = `${page.path}?preset=${e.preset}`;
    if (e.path !== expected) errors.push(`${e.id}.json: path should be ${expected}`);
    if (e.engine !== page.engine || e.setup !== page.setup) errors.push(`${e.id}.json: engine/setup must match ${page.id}`);
  }

  entries.sort(
    (a, b) =>
      SUBJECT_ORDER[a.subject] - SUBJECT_ORDER[b.subject] ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      a.title.localeCompare(b.title, 'en-AU'),
  );
  return { entries, errors };
}

/** Throws with every problem listed if the catalog is invalid. */
export function buildCatalogJSON(dir = CATALOG_DIR) {
  const { entries, errors } = loadCatalog(dir);
  if (errors.length) {
    const err = new Error(`Catalog invalid (${errors.length} problem${errors.length === 1 ? '' : 's'}):\n  - ${errors.join('\n  - ')}`);
    err.catalogErrors = errors;
    throw err;
  }
  return { generated: new Date().toISOString(), count: entries.length, entries };
}
