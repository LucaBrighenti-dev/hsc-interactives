// npm run build: clean dist/, vendor libraries, copy site/, merge + validate the catalog.
import fs from 'node:fs';
import path from 'node:path';
import { DIST, SITE, isMain } from './lib/paths.mjs';
import { copyDir, copyFile, rmrf, writeJSON, ensureDir } from './lib/fsutil.mjs';
import { buildCatalogJSON } from './lib/catalog.mjs';
import { vendor } from './vendor.mjs';

/** Files under site/ that are not deployed as-is. */
export function isDeployed(rel) {
  if (rel.startsWith('catalog/')) return false; // merged into /catalog.json instead
  if (rel.endsWith('.DS_Store') || rel.endsWith('Thumbs.db')) return false;
  if (rel === 'vendor/.stamp.json') return false;
  return true;
}

export function writeCatalog() {
  const catalog = buildCatalogJSON();
  writeJSON(path.join(DIST, 'catalog.json'), catalog);
  return catalog;
}

/** Copy (or remove) one site-relative file in dist/. Used by the dev watcher. */
export function syncFile(rel) {
  const src = path.join(SITE, rel);
  const dest = path.join(DIST, rel);
  if (fs.existsSync(src) && fs.statSync(src).isFile()) copyFile(src, dest);
  else rmrf(dest);
}

export async function build({ quiet = false } = {}) {
  const started = Date.now();
  await vendor({ quiet: true });
  rmrf(DIST);
  ensureDir(DIST);
  const files = copyDir(SITE, DIST, isDeployed);
  const catalog = writeCatalog();
  if (!quiet) {
    const live = catalog.entries.filter((e) => e.status === 'live').length;
    console.log(`build: ${files} files, catalog ${catalog.count} entries (${live} live) → dist/ in ${Date.now() - started} ms`);
  }
  return catalog;
}

if (isMain(import.meta.url)) {
  build().catch((err) => {
    console.error(`build failed: ${err.message}`);
    process.exit(1);
  });
}
