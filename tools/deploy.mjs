// Prepares a version for gh-pages on top of the previous one, so that going back is always possible. Sends nothing without --push.
// node tools/deploy.mjs             tests, builds, makes the commit, prints the command that publishes it
// node tools/deploy.mjs --release   same with the final version (refused while a legal fact is missing)
// node tools/deploy.mjs --rollback  makes a commit that puts the previous version back
// add --push to send it (never forced)
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), has = (x) => process.argv.includes(x);
const stop = (m) => { console.error(m); process.exit(1); };
const git = (args, env = {}) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ...env } }).trim();
const run = (...a) => { if (spawnSync('npm', ['run', '-s', ...a], { cwd: ROOT, stdio: 'inherit' }).status) stop(`npm run ${a[0]} failed, nothing prepared`); };

if (git(['status', '--porcelain'])) stop('Commit your changes first');
git(['fetch', '-q', 'origin', 'gh-pages']);
const live = git(['rev-parse', 'FETCH_HEAD']);
let tree, message;
if (has('--rollback')) {
  const earlier = git(['rev-list', '--first-parent', live]).split('\n').slice(1), now = git(['rev-parse', `${live}^{tree}`]);
  const target = earlier.find((c) => git(['rev-parse', `${c}^{tree}`]) !== now);
  if (!target) stop('No earlier version on gh-pages');
  tree = git(['rev-parse', `${target}^{tree}`]);
  message = `Back to ${git(['log', '-1', '--format=%h %s', target])}`;
} else {
  run('test');
  run(has('--release') ? 'release' : 'preview');
  const env = { GIT_INDEX_FILE: join(mkdtempSync(join(tmpdir(), 'otto-index-')), 'index'), GIT_WORK_TREE: join(ROOT, 'dist') };
  git(['--literal-pathspecs', 'add', '-A', '-f', '.'], { ...env, GIT_DIR: git(['rev-parse', '--absolute-git-dir']) });
  tree = git(['write-tree'], env);
  if (tree === git(['rev-parse', `${live}^{tree}`])) { console.log('Already online, nothing to publish'); process.exit(0); }
  message = `${has('--release') ? 'Version' : 'Version provisoire (noindex)'}, depuis ${git(['rev-parse', '--short', 'HEAD'])}`;
}
const commit = git(['commit-tree', tree, '-p', live, '-m', message]);
console.log(`${message}\n${git(['diff', '--shortstat', live, commit])}`);
if (!has('--push')) console.log(`Ready. To publish:\n  git push origin ${commit}:refs/heads/gh-pages`);
else { git(['push', '-q', 'origin', `${commit}:refs/heads/gh-pages`]); console.log('Published'); }
