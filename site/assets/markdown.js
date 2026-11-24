// Markdown → HTML for teacher notes and other site prose, with KaTeX maths.
// Inline maths: $...$ (no space just inside the dollars). Display maths: $$...$$. A literal dollar: \$.
// Libraries are self-hosted and loaded only when needed. Content is our own reviewed repo content.

const MATH_RE = /\$\$([\s\S]+?)\$\$|\$([^\s$](?:[^$\n]*?[^\s$\\])?)\$/g;
let katexCssAdded = false;

export function ensureKatexCss() {
  if (katexCssAdded || typeof document === 'undefined') return;
  katexCssAdded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/vendor/katex/katex.min.css';
  document.head.append(link);
}

/** Render maths with KaTeX into an HTML string (never throws; errors are shown inline in red by KaTeX). */
export async function renderTex(tex, { display = false } = {}) {
  const katex = (await import('/vendor/katex/katex.mjs')).default;
  ensureKatexCss();
  return katex.renderToString(tex, { displayMode: display, throwOnError: false, output: 'html', strict: 'ignore' });
}

/** @param {string} md @returns {Promise<string>} HTML */
export async function renderMarkdown(md) {
  const { marked } = await import('/vendor/marked.esm.js');
  const maths = [];
  const DOLLAR = 'HSCDOLLARTOKEN';
  const protectedMd = md.replace(/\\\$/g, DOLLAR).replace(MATH_RE, (_m, display, inline) => {
    maths.push({ tex: display ?? inline, display: display !== undefined });
    return `HSCMATH${maths.length - 1}TOKEN`;
  });
  let html = marked.parse(protectedMd, { gfm: true, breaks: false });
  if (maths.length) {
    const katex = (await import('/vendor/katex/katex.mjs')).default;
    ensureKatexCss();
    html = html.replace(/HSCMATH(\d+)TOKEN/g, (_m, i) =>
      katex.renderToString(maths[Number(i)].tex, { displayMode: maths[Number(i)].display, throwOnError: false, output: 'html', strict: 'ignore' }),
    );
  }
  return html.replaceAll(DOLLAR, '$');
}

/** Strip YAML frontmatter if present. */
export function stripFrontmatter(md) {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}
