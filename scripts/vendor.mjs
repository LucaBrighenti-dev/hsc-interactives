// Copy and bundle self-hosted libraries and fonts into site/vendor/ (git-ignored).
// Nothing is loaded from a CDN at runtime (guide §2 rule 5).
//
//   /vendor/katex/katex.mjs, katex.min.css, fonts/*.woff2
//   /vendor/three/three.module.js, three.core.js, OrbitControls.js, CSS2DRenderer.js
//   /vendor/supabase.mjs        (esbuild bundle of @supabase/supabase-js)
//   /vendor/marked.esm.js
//   /vendor/qrcode.mjs
//   /vendor/fonts/fonts.css + woff2 files (Archivo with the wdth axis, Inter, JetBrains Mono)
//   /vendor/licenses/*
//
// Skips work when site/vendor/.stamp.json matches the installed versions and this script.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, VENDOR, isMain } from './lib/paths.mjs';
import { copyFile, ensureDir, rmrf, readJSON, writeJSON } from './lib/fsutil.mjs';

const NM = path.join(ROOT, 'node_modules');
const PACKAGES = [
  'katex',
  'three',
  '@supabase/supabase-js',
  'marked',
  'qrcode-generator',
  '@fontsource-variable/archivo',
  '@fontsource-variable/inter',
  '@fontsource-variable/jetbrains-mono',
  'esbuild',
];

// Fonts: latin + latin-ext subsets only. Family names match tokens.css.
const FONTS = [
  { family: 'Archivo', pkg: '@fontsource-variable/archivo', file: 'archivo', axis: 'wdth', weight: '100 900', stretch: '62% 125%' },
  { family: 'Inter', pkg: '@fontsource-variable/inter', file: 'inter', axis: 'wght', weight: '100 900' },
  { family: 'JetBrains Mono', pkg: '@fontsource-variable/jetbrains-mono', file: 'jetbrains-mono', axis: 'wght', weight: '100 800' },
];
const SUBSETS = {
  latin:
    'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'latin-ext':
    'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
};

function pkgDir(name) {
  return path.join(NM, ...name.split('/'));
}

function versions() {
  const out = {};
  for (const name of PACKAGES) out[name] = readJSON(path.join(pkgDir(name), 'package.json')).version;
  return out;
}

function scriptHash() {
  return crypto.createHash('sha256').update(fs.readFileSync(new URL(import.meta.url))).digest('hex').slice(0, 16);
}

function copyLicense(pkg, name) {
  const dir = pkgDir(pkg);
  const file = fs.readdirSync(dir).find((f) => /^(license|licence|ofl)(\.|$)/i.test(f));
  if (file) copyFile(path.join(dir, file), path.join(VENDOR, 'licenses', `${name}.txt`));
}

function vendorKatex() {
  const dist = path.join(pkgDir('katex'), 'dist');
  const out = path.join(VENDOR, 'katex');
  copyFile(path.join(dist, 'katex.mjs'), path.join(out, 'katex.mjs'));
  // Keep only the woff2 sources so the CSS never asks for files we don't ship.
  const css = fs
    .readFileSync(path.join(dist, 'katex.min.css'), 'utf8')
    .replace(/,url\(fonts\/[^)]+\.woff\) format\("woff"\)/g, '')
    .replace(/,url\(fonts\/[^)]+\.ttf\) format\("truetype"\)/g, '');
  if (/\.(woff|ttf)\)/.test(css)) throw new Error('KaTeX CSS still references woff/ttf fonts; update vendor.mjs');
  ensureDir(out);
  fs.writeFileSync(path.join(out, 'katex.min.css'), css);
  for (const f of fs.readdirSync(path.join(dist, 'fonts')).filter((f) => f.endsWith('.woff2'))) {
    copyFile(path.join(dist, 'fonts', f), path.join(out, 'fonts', f));
  }
  copyLicense('katex', 'katex');
}

function vendorThree() {
  const dir = pkgDir('three');
  const out = path.join(VENDOR, 'three');
  for (const f of ['three.module.js', 'three.core.js']) copyFile(path.join(dir, 'build', f), path.join(out, f));
  const addons = {
    'OrbitControls.js': 'examples/jsm/controls/OrbitControls.js',
    'CSS2DRenderer.js': 'examples/jsm/renderers/CSS2DRenderer.js',
  };
  for (const [name, rel] of Object.entries(addons)) {
    const src = fs.readFileSync(path.join(dir, rel), 'utf8');
    // Point the bare 'three' specifier at the vendored module so no import map is needed.
    const rewritten = src.replace(/from\s+'three';/g, "from './three.module.js';");
    if (rewritten === src || /from\s+['"]three['"]/.test(rewritten)) throw new Error(`Could not rewrite the three import in ${rel}`);
    ensureDir(out);
    fs.writeFileSync(path.join(out, name), rewritten);
  }
  copyLicense('three', 'three');
}

async function vendorSupabase() {
  const esbuild = await import('esbuild');
  await esbuild.build({
    stdin: { contents: "export { createClient } from '@supabase/supabase-js';", resolveDir: ROOT, loader: 'js' },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    minify: true,
    legalComments: 'eof',
    outfile: path.join(VENDOR, 'supabase.mjs'),
    logLevel: 'warning',
  });
  copyLicense('@supabase/supabase-js', 'supabase-js');
}

function vendorMarked() {
  copyFile(path.join(pkgDir('marked'), 'lib', 'marked.esm.js'), path.join(VENDOR, 'marked.esm.js'));
  copyLicense('marked', 'marked');
}

function vendorQrcode() {
  copyFile(path.join(pkgDir('qrcode-generator'), 'dist', 'qrcode.mjs'), path.join(VENDOR, 'qrcode.mjs'));
  copyLicense('qrcode-generator', 'qrcode-generator');
}

function vendorFonts() {
  const out = path.join(VENDOR, 'fonts');
  const rules = [];
  for (const font of FONTS) {
    for (const [subset, range] of Object.entries(SUBSETS)) {
      const file = `${font.file}-${subset}-${font.axis}-normal.woff2`;
      const src = path.join(pkgDir(font.pkg), 'files', file);
      if (!fs.existsSync(src)) throw new Error(`Missing font file ${src}`);
      copyFile(src, path.join(out, file));
      rules.push(
        [
          '@font-face {',
          `  font-family: '${font.family}';`,
          '  font-style: normal;',
          '  font-display: swap;',
          `  font-weight: ${font.weight};`,
          font.stretch ? `  font-stretch: ${font.stretch};` : null,
          `  src: url(./${file}) format('woff2');`,
          `  unicode-range: ${range};`,
          '}',
        ]
          .filter(Boolean)
          .join('\n'),
      );
    }
    copyLicense(font.pkg, `font-${font.file}`);
  }
  fs.writeFileSync(path.join(out, 'fonts.css'), `/* Generated by scripts/vendor.mjs. Fonts are under the SIL Open Font License; see /vendor/licenses/. */\n${rules.join('\n\n')}\n`);
}

export async function vendor({ force = false, quiet = false } = {}) {
  const stamp = { versions: versions(), script: scriptHash() };
  const stampFile = path.join(VENDOR, '.stamp.json');
  if (!force && fs.existsSync(stampFile) && JSON.stringify(readJSON(stampFile)) === JSON.stringify(stamp)) {
    if (!quiet) console.log('vendor: up to date');
    return false;
  }
  rmrf(VENDOR);
  ensureDir(VENDOR);
  vendorKatex();
  vendorThree();
  await vendorSupabase();
  vendorMarked();
  vendorQrcode();
  vendorFonts();
  writeJSON(stampFile, stamp);
  if (!quiet) console.log('vendor: libraries and fonts copied to site/vendor/');
  return true;
}

// Run directly: `node scripts/vendor.mjs [--force]`
if (isMain(import.meta.url)) {
  vendor({ force: process.argv.includes('--force') }).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
