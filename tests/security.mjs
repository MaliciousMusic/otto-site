// node tests/security.mjs: security checks on the source and on the built pages (run the build first).
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const read = (f) => readFileSync(f, 'utf8');

// Display choices live on an origin shared with other sites: any stored value must be harmless.
const boot = (stored, reduced = false) => {
  const html = { dataset: {}, classList: { add() {} } };
  vm.runInNewContext(read('src/js/boot.js'), { document: { documentElement: html }, localStorage: { getItem() { if (stored instanceof Error) throw stored; return stored; } }, matchMedia: () => ({ matches: reduced }) });
  return { ...html.dataset };
};
const base = { detail: 'simple', motion: 'on', letters: 'faces' };
for (const bad of [null, '', 'null', '0', '"x"', '[]', '{', 'true', '{"detail":{},"motion":"x\\" onload","letters":1}', new Error('blocked')]) assert.deepEqual(boot(bad), base, `stored ${bad}`);
assert.deepEqual(boot(null, true), { ...base, motion: 'off' });
assert.deepEqual(boot('{"detail":"full","motion":"off","letters":"plain"}'), { detail: 'full', motion: 'off', letters: 'plain' });

// No text from the address bar or storage can reach an HTML or code sink.
for (const f of readdirSync('src/js')) {
  const s = read(`src/js/${f}`);
  assert.doesNotMatch(s, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|createContextualFragment|setHTMLUnsafe|\beval\(|new Function|srcdoc|postMessage|document\.cookie|serviceWorker|importScripts|setTimeout\(\s*['"`]/, f);
}
assert.match(read('src/js/map.js'), /Object\.hasOwn\(byId, id\)/);
console.log('ok: stored values, no HTML or code sinks');
