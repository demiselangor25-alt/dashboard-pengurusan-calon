// Pelayan ujian tempatan: meniru Netlify (fail statik + redirect + functions) tanpa Netlify CLI.
// Jalankan: node --experimental-strip-types test/pelayan-ujian.mjs
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8888);
process.env.MOCK_SHEET ??= '1';
process.env.SESSION_SECRET ??= 'rahsia-ujian-tempatan';
process.env.SITE_PASSWORD ??= 'ujian123';
globalThis.Netlify = { env: { get: (k) => process.env[k] } };

const REDIRECT = { '/kuang': '/index.html', '/udm': '/udm.html', '/admin': '/admin.html', '/log-masuk': '/log-masuk.html', '/': '/index.html' };
const JENIS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

const fungsi = [];
for (const f of await fs.readdir(path.join(AKAR, 'netlify/functions'))) {
  const mod = await import(pathToFileURL(path.join(AKAR, 'netlify/functions', f)).href);
  fungsi.push({ laluan: mod.config.path, kaedah: [].concat(mod.config.method || []), handler: mod.default });
}

function kuki(req) {
  const peta = new Map();
  (req.headers.cookie || '').split(';').forEach((p) => { const i = p.indexOf('='); if (i > 0) peta.set(p.slice(0, i).trim(), decodeURIComponent(p.slice(i + 1).trim())); });
  return peta;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const fn = fungsi.find((f) => f.laluan === url.pathname);
  if (fn) {
    if (fn.kaedah.length && !fn.kaedah.includes(req.method)) { res.writeHead(405); return res.end(); }
    const badan = await new Promise((ok) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => ok(Buffer.concat(c))); });
    const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : badan });
    const peta = kuki(req);
    const setKuki = [];
    const context = {
      cookies: {
        get: (n) => peta.get(n),
        set: (o) => setKuki.push(`${o.name}=${encodeURIComponent(o.value)}; Path=${o.path || '/'}; HttpOnly; SameSite=${o.sameSite || 'Lax'}${o.expires ? '; Expires=' + o.expires.toUTCString() : ''}`),
        delete: (o) => setKuki.push(`${typeof o === 'string' ? o : o.name}=; Path=/; Max-Age=0`),
      },
      params: {}, geo: {}, ip: '127.0.0.1',
    };
    const r = await fn.handler(request, context);
    const h = Object.fromEntries(r.headers);
    if (setKuki.length) h['set-cookie'] = setKuki;
    res.writeHead(r.status, h);
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  const fail = REDIRECT[url.pathname] || url.pathname;
  try {
    const data = await fs.readFile(path.join(AKAR, 'public', path.normalize(fail).replace(/^(\.\.[/\\])+/, '')));
    res.writeHead(200, { 'content-type': JENIS[path.extname(fail)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('404');
  }
}).listen(PORT, () => console.log(`Pelayan ujian di http://localhost:${PORT}`));
