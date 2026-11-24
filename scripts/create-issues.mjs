// npm run create-issues [-- --apply]
// One GitHub issue per backlog page (guide §13.2), labelled subject:*, engine:*, priority:* and wave:2.
// Dry run by default: prints what it would do. With --apply it creates the labels (idempotent) and any
// issues that don't exist yet, using the `gh` CLI (Luca runs `gh auth login` first, human task H1).
import { execFileSync } from 'node:child_process';
import { BACKLOG, SUBJECT_LABELS, isMain } from './lib/paths.mjs';
import { readJSON } from './lib/fsutil.mjs';

const COLOURS = { subject: '0072B2', engine: '6B6E74', priority: 'FF4F00', wave: '009E73' };

function gh(args, { input } = {}) {
  return execFileSync('gh', args, { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'] });
}

export function issueFor(page, listings) {
  const labels = [`subject:${page.subject}`, `engine:${page.engine}`, `priority:${page.priority}`, 'wave:2'];
  const title = `${page.id}: ${page.title}`;
  const owned = [
    `site${page.path}`,
    `site/catalog/${page.id}.json (except \`syllabus\`)`,
    `site/content/notes/${page.id}.md`,
    ...(page.engine === 'custom' ? [`site/assets/engines/custom/${page.id}/**`, `tests/engines/custom-${page.id}.test.mjs`] : []),
    `site/assets/thumbs/${page.id}.png`,
  ];
  const body = [
    `**${page.title}** (${SUBJECT_LABELS[page.subject]}, ${page.priority})`,
    '',
    page.summary,
    '',
    `- Spec: \`specs/${page.id}.md\` (must be approved at Gate B)`,
    `- Page: \`${page.path}\``,
    `- Engine: \`${page.engine}\`${page.setup ? ` / setup \`${page.setup}\`` : ' (custom engine built in this task)'}`,
    ...(listings.length ? [`- Listings that need a preset: ${listings.map((l) => `\`${l.id}\` → preset \`${l.preset}\``).join(', ')}`] : []),
    '',
    '**Owned paths** (guide §13.3):',
    ...owned.map((p) => `- \`${p}\``),
    '',
    'Role: `interactive-builder`. Branch: `w2/' + page.id + '`. Done = guide §16.',
  ].join('\n');
  return { title, labels, body };
}

export function plan() {
  const backlog = readJSON(BACKLOG);
  const order = { P0: 0, P1: 1, P2: 2 };
  return backlog.pages
    .slice()
    .sort((a, b) => order[a.priority] - order[b.priority] || a.id.localeCompare(b.id))
    .map((page) => issueFor(page, backlog.listings.filter((l) => l.listingOf === page.id)));
}

function main() {
  const apply = process.argv.includes('--apply');
  const issues = plan();
  const labels = [...new Set(issues.flatMap((i) => i.labels))].sort();
  if (!apply) {
    console.log(`create-issues (dry run): ${labels.length} labels and ${issues.length} issues. Run with --apply to create them.`);
    for (const i of issues) console.log(`  [${i.labels.join(', ')}] ${i.title}`);
    return;
  }
  try {
    gh(['auth', 'status']);
  } catch {
    console.error('create-issues: `gh` is not installed or not signed in. Luca: install the GitHub CLI and run `gh auth login` (human task H1).');
    process.exit(1);
  }
  for (const label of labels) {
    const kind = label.split(':')[0];
    gh(['label', 'create', label, '--color', COLOURS[kind] ?? '6B6E74', '--force']);
  }
  const existing = new Set(JSON.parse(gh(['issue', 'list', '--state', 'all', '--limit', '1000', '--json', 'title'])).map((i) => i.title.split(':')[0]));
  let created = 0;
  for (const issue of issues) {
    if (existing.has(issue.title.split(':')[0])) continue;
    gh(['issue', 'create', '--title', issue.title, '--body-file', '-', ...issue.labels.flatMap((l) => ['--label', l])], { input: issue.body });
    created += 1;
  }
  console.log(`create-issues: ${created} created, ${issues.length - created} already existed.`);
}

if (isMain(import.meta.url)) main();
