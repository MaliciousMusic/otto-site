// node tools/check-live.mjs [url]   a few ordinary reads of the public site: pages, HTTPS, certificate, nothing private.
import { connect } from 'node:tls';
const SITE = (process.argv[2] ?? 'https://maliciousmusic.github.io/otto-site').replace(/\/$/, ''), secure = SITE.startsWith('https:');
const problems = [];
const get = async (path, opt) => { for (let i = 0; ; i++) try { return await fetch(path.startsWith('http') ? path : SITE + path, { signal: AbortSignal.timeout(20000), headers: { 'accept-encoding': 'identity' }, ...opt }); } catch (e) { if (i === 2) throw e; } };
const check = async (what, run) => { try { const bad = await run(); if (bad) problems.push(`${what}: ${bad}`); } catch (e) { problems.push(`${what}: ${e.message}`); } };

for (const p of ['/', '/map/', '/results/', '/lab/', '/method/', '/questions/', '/record/', '/font/', '/legal/', '/privacy/', '/terms/', '/accessibility/'])
  await check(p, async () => {
    const r = await get(p), h = await r.text();
    if (r.status !== 200) return `status ${r.status}`;
    if (!/<title>[^<]*Otto/.test(h)) return 'not the Otto site';
    if (!h.includes('http-equiv="Content-Security-Policy"')) return 'no content policy';
    if (/(?:src|href)="http:\/\//.test(h)) return 'insecure link';
  });
for (const p of ['/.git/config', '/.env', '/site.config.json', '/README.md', '/js/main.js.map', '/no-such-page'])
  await check(p, async () => { const r = await get(p); if (r.status !== 404) return `status ${r.status}, expected 404`; });
if (secure) {
  await check('http', async () => { const r = await get(SITE.replace('https:', 'http:') + '/', { redirect: 'manual' }); if (r.status !== 301 || !r.headers.get('location')?.startsWith('https:')) return `no redirect to https (${r.status})`; });
  await check('certificate', () => new Promise((ok, no) => {
    const host = new URL(SITE).hostname, s = connect({ host, port: 443, servername: host, timeout: 20000 }, () => { const days = (Date.parse(s.getPeerCertificate().valid_to) - Date.now()) / 864e5; s.end(); ok(days < 10 ? `expires in ${Math.round(days)} days` : null); });
    s.on('error', no); s.on('timeout', () => s.destroy(new Error('timeout')));
  }));
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`ok: ${SITE}`);
