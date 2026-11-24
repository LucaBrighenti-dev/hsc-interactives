// npm run generate: create missing catalog fragments, spec stubs and notes stubs from docs/backlog.json.
// Idempotent. It never overwrites a catalog fragment that exists (W1-SYL and page builders edit those),
// and it only refreshes specs whose frontmatter says `status: stub` and notes that still carry the stub marker.
//
//   node scripts/generate-from-backlog.mjs           write
//   node scripts/generate-from-backlog.mjs --check   exit 1 if anything would change (CI drift check)
import fs from 'node:fs';
import path from 'node:path';
import { BACKLOG, CATALOG_DIR, NOTES_DIR, SPECS_DIR, isMain, pagePathForId } from './lib/paths.mjs';
import { readJSON, ensureDir } from './lib/fsutil.mjs';

export const NOTES_STUB_MARKER = '<!-- stub: generated from docs/backlog.json';
const FRAGMENT_KEYS = ['id', 'kind', 'title', 'summary', 'subject', 'engine', 'setup', 'priority', 'status', 'path', 'listingOf', 'preset', 'syllabus', 'thumbnail'];

function fragmentFor(entry) {
  const out = {};
  for (const key of FRAGMENT_KEYS) if (key in entry) out[key] = entry[key];
  out.status ??= 'planned';
  return out;
}

function specFor(page, listings, template) {
  const body = template.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  const fm = [
    '---',
    `id: ${page.id}`,
    `title: ${JSON.stringify(page.title)}`,
    `subject: ${page.subject}`,
    `engine: ${page.engine}`,
    `setup: ${page.setup ?? 'none'}`,
    `priority: ${page.priority}`,
    'status: stub            # stub → draft → approved (Gate B)',
    `page: ${page.path}`,
  ];
  if (listings.length) {
    fm.push('listings:            # catalogue listings that open this page with a preset; define these presets');
    for (const l of listings) fm.push(`  - ${JSON.stringify({ id: l.id, preset: l.preset, title: l.title })}`);
  }
  fm.push('syllabus:            # copied from the catalog fragment; verified by W1-SYL');
  for (const tag of page.syllabus) fm.push(`  - ${JSON.stringify(tag)}`);
  fm.push('---', '');
  const filled = body.replace('# <title>', `# ${page.title}\n\n> Backlog summary: ${page.summary}`);
  return `${fm.join('\n')}${filled.startsWith('\n') ? filled.slice(1) : filled}`;
}

function notesFor(page) {
  return `${NOTES_STUB_MARKER} for ${page.id}; the Wave 2 builder replaces this whole file (guide §5.9) -->

## Misconceptions

## 10-minute lesson flow

## Try this: answers

## Original HSC-style question

### Worked solution

## Assumptions and limits

## Syllabus links
`;
}

function isStubSpec(text) {
  return /^status:\s*stub\b/m.test(text.split(/\r?\n---\r?\n/)[0] ?? '');
}

export function generate({ check = false, quiet = false } = {}) {
  const backlog = readJSON(BACKLOG);
  const entries = [...backlog.pages, ...backlog.listings];
  const ids = new Set();
  for (const e of entries) {
    if (ids.has(e.id)) throw new Error(`backlog: duplicate id ${e.id}`);
    ids.add(e.id);
    if (e.kind === 'page' && e.path !== pagePathForId(e.id)) throw new Error(`backlog: ${e.id} path should be ${pagePathForId(e.id)}`);
  }
  const template = fs.readFileSync(path.join(SPECS_DIR, '_TEMPLATE.md'), 'utf8');
  const changes = [];
  const write = (file, content, why) => {
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
    changes.push(`${why}: ${path.relative(process.cwd(), file)}`);
    if (!check) {
      ensureDir(path.dirname(file));
      fs.writeFileSync(file, content);
    }
  };

  for (const e of entries) {
    const file = path.join(CATALOG_DIR, `${e.id}.json`);
    if (!fs.existsSync(file)) write(file, `${JSON.stringify(fragmentFor(e), null, 2)}\n`, 'catalog');
  }

  for (const page of backlog.pages) {
    const listings = backlog.listings.filter((l) => l.listingOf === page.id);
    const specFile = path.join(SPECS_DIR, `${page.id}.md`);
    if (!fs.existsSync(specFile) || isStubSpec(fs.readFileSync(specFile, 'utf8'))) write(specFile, specFor(page, listings, template), 'spec');
    const notesFile = path.join(NOTES_DIR, `${page.id}.md`);
    if (!fs.existsSync(notesFile) || fs.readFileSync(notesFile, 'utf8').startsWith(NOTES_STUB_MARKER)) write(notesFile, notesFor(page), 'notes');
  }

  if (!quiet) {
    console.log(`generate: ${backlog.pages.length} pages, ${backlog.listings.length} listings; ${changes.length} file(s) ${check ? 'out of date' : 'written'}`);
    if (check) for (const c of changes) console.log(`  ${c}`);
  }
  return changes;
}

if (isMain(import.meta.url)) {
  try {
    const check = process.argv.includes('--check');
    const changes = generate({ check });
    if (check && changes.length) process.exit(1);
  } catch (err) {
    console.error(`generate failed: ${err.message}`);
    process.exit(1);
  }
}
