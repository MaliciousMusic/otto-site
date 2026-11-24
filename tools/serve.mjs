// node tools/serve.mjs [port]   builds into .preview/, serves it on localhost, rebuilds when src/ changes
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), DIST = join(ROOT, '.preview'), port = +(process.argv[2] ?? 4173);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.xml': 'application/xml' };
const build = () => spawnSync('node', [join(ROOT, 'tools/build.mjs'), '--out=.preview'], { stdio: 'inherit' });
build();
let t;
for (const d of ['src', 'site.config.json']) watch(join(ROOT, d), { recursive: d === 'src' }, () => { clearTimeout(t); t = setTimeout(build, 150); });

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = join(DIST, path.endsWith('/') ? `${path}index.html` : path);
  const send = (code, body, type) => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); };
  if (!file.startsWith(DIST)) return send(403, 'no', 'text/plain');
  try { send(200, await readFile(file), TYPES[extname(file)] ?? 'application/octet-stream'); }
  catch { send(404, await readFile(join(DIST, '404.html')).catch(() => 'not found'), TYPES['.html']); }
}).listen(port, '127.0.0.1', () => console.log(`http://localhost:${port}`));
