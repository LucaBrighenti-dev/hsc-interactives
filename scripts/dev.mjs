// npm run dev: build, watch site/, and serve dist/ on http://localhost:5173.
//
//   node scripts/dev.mjs                 build + watch + serve on 5173
//   node scripts/dev.mjs --serve-only    serve an existing dist/ (used by Playwright and shots)
//   node scripts/dev.mjs --port 4173     choose the port
//
// No dependencies: Node's http server and fs.watch.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { DIST, SITE, isMain } from './lib/paths.mjs';
import { SECURITY_HEADERS } from './lib/headers.mjs';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.csv': 'text/csv; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function resolveFile(urlPath) {
  let rel;
  try {
    rel = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  } catch {
    return null;
  }
  const full = path.normalize(path.join(DIST, rel));
  if (full !== DIST && !full.startsWith(DIST + path.sep)) return null; // no path traversal
  if (fs.existsSync(full) && fs.statSync(full).isDirectory()) return path.join(full, 'index.html');
  return full;
}

export function createServer() {
  return http.createServer((req, res) => {
    const file = resolveFile(req.url || '/');
    const headers = { ...SECURITY_HEADERS, 'Cache-Control': 'no-store' };
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { ...headers, 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><meta charset="utf-8"><title>Not found</title><p>Not found. <a href="/">Back to the hub</a></p>');
      return;
    }
    res.writeHead(200, { ...headers, 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

async function watch() {
  const { syncFile, writeCatalog, isDeployed } = await import('./build.mjs');
  const pending = new Map();
  fs.watch(SITE, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    const rel = filename.split(path.sep).join('/');
    clearTimeout(pending.get(rel));
    pending.set(
      rel,
      setTimeout(() => {
        pending.delete(rel);
        try {
          if (rel.startsWith('catalog/')) {
            const catalog = writeCatalog();
            console.log(`dev: catalog re-merged (${catalog.count} entries)`);
          } else if (isDeployed(rel)) {
            syncFile(rel);
            console.log(`dev: ${rel}`);
          }
        } catch (err) {
          console.error(`dev: ${err.message}`);
        }
      }, 60),
    );
  });
}

async function main() {
  const args = process.argv.slice(2);
  const serveOnly = args.includes('--serve-only');
  const portArg = args.indexOf('--port');
  const port = Number(portArg >= 0 ? args[portArg + 1] : process.env.PORT || 5173);

  if (!serveOnly) {
    const { build } = await import('./build.mjs');
    await build();
    await watch();
  } else if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('dev: dist/ is missing. Run `npm run build` first.');
    process.exit(1);
  }

  createServer().listen(port, () => {
    console.log(`dev: serving dist/ on http://localhost:${port}${serveOnly ? '' : ' (watching site/)'}`);
  });
}

if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
