// Shared paths and naming rules for the build scripts (guide §4).
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SITE = path.join(ROOT, 'site');
export const DIST = path.join(ROOT, 'dist');
export const VENDOR = path.join(SITE, 'vendor');
export const CATALOG_DIR = path.join(SITE, 'catalog');
export const NOTES_DIR = path.join(SITE, 'content', 'notes');
export const SPECS_DIR = path.join(ROOT, 'specs');
export const BACKLOG = path.join(ROOT, 'docs', 'backlog.json');

/** Subject prefix → interactives folder. */
export const SUBJECT_FOLDERS = {
  me1: 'maths-ext1',
  me2: 'maths-ext2',
  phy: 'physics',
  eng: 'engineering',
};

export const SUBJECT_LABELS = {
  me1: 'Maths Ext 1',
  me2: 'Maths Ext 2',
  phy: 'Physics',
  eng: 'Engineering',
};

/** Page path rule: `phy-projectile-lab` → `/interactives/physics/projectile-lab.html`. */
export function pagePathForId(id) {
  const m = /^(me1|me2|phy|eng)-(.+)$/.exec(id);
  if (!m) throw new Error(`Not a page id: ${id}`);
  return `/interactives/${SUBJECT_FOLDERS[m[1]]}/${m[2]}.html`;
}

/** True when the module at `metaUrl` is the script Node was started with. */
export function isMain(metaUrl) {
  return Boolean(process.argv[1]) && metaUrl === pathToFileURL(path.resolve(process.argv[1])).href;
}
