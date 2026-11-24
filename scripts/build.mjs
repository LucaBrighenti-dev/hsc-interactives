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

function changed(src, dest) {
  if (!fs.existsSync(dest)) return true;
  const a = fs.statSync(src);
  const b = fs.statSync(dest);
  return a.size !== b.size || a.mtimeMs > b.mtimeMs;
}

/**
 * Bring one site-relative path in dist/ up to date. Used by the dev watcher.
 * A file is copied; a directory (some platforms report the parent folder when a child changes) has its
 * changed files copied; only a path that no longer exists in site/ is removed from dist/.
 */
export function syncFile(rel) {
  const src = path.join(SITE, rel);
  const dest = path.join(DIST, rel);
  if (!fs.existsSync(src)) {
    rmrf(dest);
    return;
  }
  if (fs.statSync(src).isDirectory()) {
    copyDir(src, dest, (child) => isDeployed(`${rel}/${child}`) && changed(path.join(src, child), path.join(dest, child)));
    return;
  }
  copyFile(src, dest);
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
