// Scrape NSW syllabus content for the syllabus-tagger (task W1-SYL, guide §9.4).
//
// NESA's curriculum site (curriculum.nsw.edu.au) renders with JavaScript, so this script drives Chromium through
// Playwright and saves the visible text of each focus-area page. The 2017 Physics and 2011 Engineering Studies
// syllabuses are now published only as Word downloads on www.nsw.gov.au; the script downloads those and extracts
// their text locally (no extra dependencies).
//
// Output goes to docs/syllabus-reference/<course>/<focus-area>.md, which is git-ignored. It is NESA copyright and
// is for agents' reference only: never commit it, never deploy it, never paste its text into the site.
//
//   node scripts/scrape-syllabus.mjs                    all courses
//   node scripts/scrape-syllabus.mjs physics-2025       one or more course keys
//   node scripts/scrape-syllabus.mjs --delay 4000       milliseconds between requests (minimum 2000)
//
// Politeness: one page at a time, at least 2 s between requests, a normal browser user agent. If a page will not
// render, the script records the failure in index.json and moves on rather than retrying aggressively.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs', 'syllabus-reference');
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const CURRICULUM = 'https://curriculum.nsw.edu.au/learning-areas';
const NSW_GOV = 'https://www.nsw.gov.au/education-and-training/nesa/curriculum';

const COURSES = [
  { key: 'maths-ext1-2024', name: 'Mathematics Extension 1 11–12 (2024)', kind: 'curriculum', base: `${CURRICULUM}/mathematics/mathematics-extension-1-11-12-2024` },
  { key: 'maths-ext2-2024', name: 'Mathematics Extension 2 11–12 (2024)', kind: 'curriculum', base: `${CURRICULUM}/mathematics/mathematics-extension-2-11-12-2024` },
  { key: 'physics-2025', name: 'Physics 11–12 (2025)', kind: 'curriculum', base: `${CURRICULUM}/science/physics-11-12-2025` },
  { key: 'engineering-2026', name: 'Engineering Studies 11–12 (2026)', kind: 'curriculum', base: `${CURRICULUM}/tas/engineering-studies-11-12-2026` },
  {
    key: 'physics-2017',
    name: 'Physics Stage 6 (2017)',
    kind: 'word',
    page: `${NSW_GOV}/science/physics-stage-6-2017`,
    // Module headings ("Module 1: Kinematics" … "Module 8: From the Universe to the Atom"); `name` keys the split.
    sections: /^Module\s+\d\s*:\s*(?<name>.{3,60})$/,
  },
  {
    key: 'engineering-2011',
    name: 'Engineering Studies Stage 6 (2011)',
    kind: 'word',
    page: `${NSW_GOV}/tas/engineering-studies-stage-6-2011`,
    // "Engineering application module 1: Engineering fundamentals", "Engineering focus module: Aeronautical engineering"
    sections: /^Engineering (?:application|focus) module\s*\d?\s*:\s*(?<name>.{3,60})$/i,
  },
];

const NOTICE = (course, url, extra = '') =>
  [
    '<!--',
    `  ${course}. Source: ${url}`,
    `  Retrieved ${new Date().toISOString().slice(0, 10)} by scripts/scrape-syllabus.mjs.${extra}`,
    '  NESA copyright. Reference for agents only: never commit, deploy or paste this text into the site.',
    '-->',
    '',
  ].join('\n');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) =>
  s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '') // drop combining accents left by NFKD
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

function writeFile(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.endsWith('\n') ? text : `${text}\n`);
}

// ---------------------------------------------------------------------------------------------------------------
// Browser, with a polite request gate
// ---------------------------------------------------------------------------------------------------------------

function politeGate(delay) {
  let last = 0;
  return async () => {
    const wait = last + delay - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
  };
}

async function open(page, gate, url) {
  await gate();
  const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  if (!resp || resp.status() >= 400) throw new Error(`HTTP ${resp?.status() ?? 'no response'} for ${url}`);
  // MathJax typesets lazily as content scrolls into view, so scroll through the page, then wait for the labels.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += Math.round(window.innerHeight * 0.8)) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page
    .waitForFunction(() => [...document.querySelectorAll('.math-tex')].every((m) => m.querySelector('mjx-container[aria-label]:not([aria-label=""])')), null, { timeout: 10_000 })
    .catch(() => {});
  // Some syllabuses (Engineering Studies 2026) hide a focus area's outcome codes behind a "Show outcomes" button.
  const show = page.locator('main button:visible', { hasText: /^Show outcomes$/ });
  if (await show.count()) {
    await show.first().click().catch(() => {});
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(300);
}

/** Visible text of <main>, with MathJax replaced by its spoken label and headings marked. Runs in the page. */
function extractMainText() {
  const main = document.querySelector('main') ?? document.body;
  for (const m of main.querySelectorAll('mjx-container')) {
    const label = m.getAttribute('aria-label') || m.textContent || '';
    m.replaceWith(document.createTextNode(` {${label.trim()}} `));
  }
  // Glossary terms are inline-flex wrappers that innerText splits onto their own lines.
  for (const t of main.querySelectorAll('[class*="RichtextLinkGlossary"]')) {
    const wrap = t.closest('span.inline-flex') ?? t;
    if (wrap.isConnected) wrap.replaceWith(document.createTextNode(t.textContent ?? ''));
  }
  for (const h of main.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="nsw-h"]')) {
    const level = Number((h.tagName.match(/^H(\d)$/) ?? h.className.match(/nsw-h(\d)/) ?? [0, 4])[1]);
    h.prepend(document.createTextNode(`\n${'#'.repeat(Math.min(Math.max(level, 2), 5))} `));
  }
  return main.innerText
    .replace(/[ \t]+\n/g, '\n')
    .replace(/ {2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function links(page, pattern) {
  // Skip in-page anchors ("Skip to content" points at the same URL plus #content).
  const all = await page.$$eval('a[href]:not([href*="#"])', (as) => as.map((a) => ({ href: a.href, text: a.innerText.trim().replace(/\s+/g, ' ') })));
  // Navigation links ("Content", "Year 12") can share a focus area's URL; prefer the specific name.
  const generic = (t) => !t || /^(content|year 1[12]|overview|view side-by-side)$/i.test(t);
  const out = new Map();
  for (const l of all) if (pattern.test(l.href) && (!out.has(l.href) || (generic(out.get(l.href).text) && !generic(l.text)))) out.set(l.href, l);
  return [...out.values()].map((l) => (generic(l.text) ? { ...l, text: '' } : l));
}

// ---------------------------------------------------------------------------------------------------------------
// curriculum.nsw.edu.au syllabuses (2024, 2025, 2026)
// ---------------------------------------------------------------------------------------------------------------

async function scrapeCurriculum(course, page, gate, index) {
  const dir = path.join(OUT, course.key);
  const entry = (index[course.key] = { name: course.name, base: course.base, pages: [], failures: [] });
  const tryPage = async (url, file, label) => {
    try {
      await open(page, gate, url);
      const text = await page.evaluate(extractMainText);
      writeFile(path.join(dir, file), `${NOTICE(course.name, url)}\n${text}\n`);
      entry.pages.push({ label, file, url });
      console.log(`  saved ${course.key}/${file}`);
      return true;
    } catch (err) {
      entry.failures.push({ url, error: err.message });
      console.warn(`  FAILED ${url}: ${err.message}`);
      return false;
    }
  };

  await tryPage(`${course.base}/overview`, '_overview.md', 'Syllabus overview');
  await tryPage(`${course.base}/outcomes`, '_outcomes.md', 'Outcomes');

  // Year landing pages, then every focus-area link they list.
  const yearPattern = /\/content\/year-1[12]\/fa[0-9a-f]+$/;
  let years = [];
  try {
    await open(page, gate, `${course.base}/content`);
    years = (await links(page, yearPattern)).map((l) => l.href);
    if (!years.length) years = [page.url().split('#')[0]].filter((u) => yearPattern.test(u)); // single-year courses redirect
  } catch (err) {
    entry.failures.push({ url: `${course.base}/content`, error: err.message });
  }
  const focusAreas = new Map();
  for (const y of years) {
    try {
      await open(page, gate, y);
      for (const l of await links(page, yearPattern)) if (l.text && !focusAreas.has(l.href)) focusAreas.set(l.href, l.text);
    } catch (err) {
      entry.failures.push({ url: y, error: err.message });
    }
  }
  // Some names repeat (Physics has a "Working scientifically" page in each year), so keep file names unique.
  const used = new Set();
  for (const [url, name] of focusAreas) {
    const year = Number(url.match(/year-(1[12])/)[1]);
    let file = `${slug(name)}.md`;
    for (let n = 2; used.has(file); n++) file = `${slug(name)}-year-${year}${n > 2 ? `-${n - 1}` : ''}.md`;
    used.add(file);
    if (await tryPage(url, file, name)) entry.pages.at(-1).year = year;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Word downloads on www.nsw.gov.au (2017 Physics, 2011 Engineering Studies)
// ---------------------------------------------------------------------------------------------------------------

/** Read one entry from a ZIP archive (enough of the format for a .docx). */
function unzipEntry(buf, name) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const xlen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const fname = buf.toString('utf8', p + 46, p + 46 + nlen);
    if (fname === name) {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const data = buf.subarray(start, start + csize);
      return method === 0 ? data : zlib.inflateRawSync(data);
    }
    p += 46 + nlen + xlen + clen;
  }
  throw new Error(`${name} not found in archive`);
}

const XML_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decodeXml = (s) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) =>
    e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (XML_ENTITIES[e] ?? m),
  );

/** Paragraphs of a .docx as { style, text }. */
function docxParagraphs(buf) {
  const xml = unzipEntry(buf, 'word/document.xml').toString('utf8');
  const paras = [];
  for (const m of xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)) {
    const p = m[0];
    const style = p.match(/<w:pStyle w:val="([^"]+)"/)?.[1] ?? '';
    let text = '';
    for (const r of p.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>/g)) text += r[1] !== undefined ? r[1] : r[0] === '<w:tab/>' ? '\t' : '\n';
    text = decodeXml(text).trim();
    if (text) paras.push({ style, text });
  }
  return paras;
}

/** Best-effort text from a legacy binary .doc: printable runs, single-byte and UTF-16LE. */
function docParagraphs(buf) {
  const runs = [];
  const ascii = buf.toString('latin1').match(/[\x20-\x7e\x91-\x97\xa0-\xff\r\t]{12,}/g) ?? [];
  let utf16 = '';
  for (let i = 0; i + 1 < buf.length; i += 2) utf16 += String.fromCharCode(buf.readUInt16LE(i));
  // Printable Latin-1 plus dashes and curly quotes (Unicode categories Pd, Pi, Pf).
  const wide = utf16.match(/[\x20-\x7e\xa0-\xff\r\t\p{Pd}\p{Pi}\p{Pf}]{12,}/gu) ?? [];
  const pick = wide.join('').length > ascii.join('').length ? wide : ascii;
  // Windows-1252 punctuation bytes read as Latin-1 control codes; map them to the real characters.
  const cp1252 = { '\x91': '‘', '\x92': '’', '\x93': '“', '\x94': '”', '\x96': '–', '\x97': '—' };
  for (const r of pick) {
    for (const line of r.split(/\r/)) {
      if (line.trim()) runs.push({ style: '', text: line.replace(/[\x91-\x97]/g, (c) => cp1252[c] ?? c).trim() });
    }
  }
  return runs;
}

async function scrapeWord(course, page, gate, index) {
  const dir = path.join(OUT, course.key);
  const entry = (index[course.key] = { name: course.name, base: course.page, pages: [], failures: [] });
  try {
    await open(page, gate, course.page);
    const overview = await page.evaluate(extractMainText);
    writeFile(path.join(dir, '_overview.md'), `${NOTICE(course.name, course.page)}\n${overview}\n`);
    entry.pages.push({ label: 'Course page', file: '_overview.md', url: course.page });
    const download = (await links(page, /\.(docx?|pdf)$/i)).find((l) => /syllabus/i.test(l.text) && /\.docx?$/i.test(l.href));
    if (!download) throw new Error('no syllabus download link found');
    await gate();
    const res = await page.context().request.get(download.href, { timeout: 120_000 });
    if (!res.ok()) throw new Error(`HTTP ${res.status()} for ${download.href}`);
    const buf = Buffer.from(await res.body());
    const srcDir = path.join(dir, '_source');
    fs.mkdirSync(srcDir, { recursive: true });
    const srcFile = path.join(srcDir, path.basename(new URL(download.href).pathname));
    fs.writeFileSync(srcFile, buf);
    console.log(`  downloaded ${path.relative(ROOT, srcFile)} (${buf.length} bytes)`);

    const paras = /\.docx$/i.test(srcFile) ? docxParagraphs(buf) : docParagraphs(buf);
    const asText = (ps) => ps.map((p) => (/heading|title/i.test(p.style) ? `\n## ${p.text}\n` : p.text)).join('\n');
    const note = ` Extracted from ${download.href}.`;
    writeFile(path.join(dir, '_full.md'), `${NOTICE(course.name, course.page, note)}\n${asText(paras)}\n`);
    entry.pages.push({ label: 'Full syllabus text', file: '_full.md', url: download.href });

    // Split by module: for each module name keep the heading occurrence followed by the most text
    // (the course-structure table and contents list every module name too). Files are in syllabus order.
    const heads = paras.map((p, i) => ({ i, m: p.text.match(course.sections) })).filter((h) => h.m);
    const best = new Map();
    for (let k = 0; k < heads.length; k++) {
      const end = heads.slice(k + 1).find((h) => h.i > heads[k].i + 1)?.i ?? paras.length;
      const body = paras.slice(heads[k].i, end);
      const size = body.reduce((n, p) => n + p.text.length, 0);
      const name = slug(heads[k].m.groups.name);
      if (!best.has(name) || size > best.get(name).size) best.set(name, { size, body, start: heads[k].i, title: paras[heads[k].i].text.replace(/\s+/g, ' ') });
    }
    for (const s of [...best.values()].sort((a, b) => a.start - b.start)) {
      if (s.size < 400) continue;
      const file = `${slug(s.title.replace(/^Engineering (application|focus) /i, ''))}.md`;
      writeFile(path.join(dir, file), `${NOTICE(course.name, course.page, note)}\n${asText(s.body)}\n`);
      entry.pages.push({ label: s.title, file, url: course.page });
      console.log(`  saved ${course.key}/${file}`);
    }
  } catch (err) {
    entry.failures.push({ url: course.page, error: err.message });
    console.warn(`  FAILED ${course.key}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const di = args.indexOf('--delay');
  const delay = Math.max(2000, di >= 0 ? Number(args[di + 1]) : 2500);
  const wanted = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--delay');
  const courses = wanted.length ? COURSES.filter((c) => wanted.includes(c.key)) : COURSES;
  if (wanted.length && courses.length !== wanted.length) {
    console.error(`Unknown course key. Known: ${COURSES.map((c) => c.key).join(', ')}`);
    process.exit(1);
  }

  const indexFile = path.join(OUT, 'index.json');
  const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : {};
  const browser = await chromium.launch();
  const context = await browser.newContext({ userAgent: USER_AGENT, locale: 'en-AU', viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const gate = politeGate(delay);
  try {
    for (const course of courses) {
      console.log(`${course.name}`);
      if (course.kind === 'curriculum') await scrapeCurriculum(course, page, gate, index);
      else await scrapeWord(course, page, gate, index);
      index[course.key].retrieved = new Date().toISOString();
      writeFile(indexFile, JSON.stringify(index, null, 2));
    }
  } finally {
    await browser.close();
  }
  const failures = Object.values(index).flatMap((c) => c.failures ?? []);
  console.log(`done: ${Object.values(index).reduce((n, c) => n + c.pages.length, 0)} page(s) saved, ${failures.length} failure(s); see docs/syllabus-reference/index.json`);
}

main().catch((err) => {
  console.error(`scrape-syllabus failed: ${err.message}`);
  process.exit(1);
});
