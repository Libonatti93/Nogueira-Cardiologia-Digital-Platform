import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, open, unlink, rename } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';

// Run from apps/web; preserve the existing systemd, PostgreSQL and Traefik deployment.
const web = process.cwd();
const run = (command, args, options = {}) => execFileSync(command, args, { cwd: web, stdio: 'inherit', ...options });
const capture = (command, args) => execFileSync(command, args, { cwd: web, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const git = (...args) => capture('git', args);
const lock = await open('.deploy.lock', 'wx', 0o600);
await lock.writeFile(String(process.pid));

async function waitHealth(url, sha) {
  for (let attempt = 0; attempt < 45; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000), redirect: 'error' });
      const data = await response.json();
      if (response.ok && data.status === 'ok' && data.sha === sha) return;
    } catch { /* Service may still be starting. */ }
    await delay(1000);
  }
  throw new Error(`Health/SHA validation failed: ${url}`);
}
try {
  run('git', ['fetch', '--all', '--prune']);
  if (git('status', '--porcelain')) throw new Error('Commit and push changes before deployment.');
  const sha = git('rev-parse', 'HEAD');
  if (sha !== git('rev-parse', '@{upstream}')) throw new Error('Local and upstream SHAs differ.');
  const dist = `.next-releases/${sha}`;
  const env = { ...process.env, RELEASE_SHA: sha, NEXT_DIST_DIR: dist, GIT_SHA: sha };
  const runtime = path.join(web, '.runtime.env');
  const previous = await readFile(runtime, 'utf8').catch(() => 'NEXT_DIST_DIR=.next\n');
  const buildId = await readFile(path.join(dist, 'BUILD_ID'), 'utf8').catch(() => '');
  // Never rebuild a release serving requests. Preserve failed partial builds for investigation.
  if (buildId.trim() !== sha) {
    if (previous.includes(`NEXT_DIST_DIR=${dist}\n`)) throw new Error('Active release has an invalid BUILD_ID.');
    await rename(dist, `${dist}.incomplete-${Date.now()}`).catch(error => { if (error.code !== 'ENOENT') throw error; });
    const tsconfig = await readFile('tsconfig.json');
    try { run('npm', ['run', 'build'], { env }); }
    finally { await writeFile('tsconfig.json', tsconfig); }
  }
  if ((await readFile(path.join(dist, 'BUILD_ID'), 'utf8')).trim() !== sha) throw new Error('Build SHA mismatch.');
  const lios = path.resolve(web, '../../services/lios');
  const image = `nogueira-lios:${sha}`;
  let imageExists = false;
  try { capture('docker', ['image', 'inspect', image]); imageExists = true; } catch { /* Build this revision below. */ }
  if (!imageExists) run('docker', ['compose', 'build'], { cwd: lios, env });
  const imageSha = capture('docker', ['image', 'inspect', '--format', '{{ index .Config.Labels "org.opencontainers.image.revision" }}', image]);
  if (imageSha !== sha) throw new Error('LIOS image revision mismatch.');
  run('docker', ['run', '--rm', image, 'pytest', '-q', '-p', 'no:cacheprovider']);
  run('docker', ['run', '--rm', image, 'ruff', 'check', '--no-cache', 'src', 'tests']);
  run('/opt/nogueira-postgres/backup.sh', []);
  run('node', ['scripts/migrate.mjs']);
  run('node', ['scripts/ensure-traefik-nogueira-route.js']);
  if (git('status', '--porcelain') || git('rev-parse', 'HEAD') !== sha) throw new Error('Source changed during build.');
  let previousImage = '';
  try { previousImage = capture('docker', ['inspect', '--format', '{{.Config.Image}}', 'nogueira-lios']); } catch { /* First deployment. */ }
  if (previousImage && !/^nogueira-lios:[a-f0-9]{40}$/.test(previousImage)) throw new Error('Existing LIOS image cannot be rolled back by SHA.');
  let webChanged = false;
  try {
    run('docker', ['compose', 'up', '-d', '--no-build'], { cwd: lios, env });
    await waitHealth('http://127.0.0.1:8081/healthz', sha);
    // A repeated deployment must retain the actual rollback target.
    if (previous !== `NEXT_DIST_DIR=${dist}\nRELEASE_SHA=${sha}\n`) {
      await writeFile(`${runtime}.previous`, previous, { mode: 0o600 });
    }
    await writeFile(runtime, `NEXT_DIST_DIR=${dist}\nRELEASE_SHA=${sha}\n`, { mode: 0o600 });
    webChanged = true;
    const dropin = '/etc/systemd/system/nogueira-web.service.d';
    await mkdir(dropin, { recursive: true });
    await writeFile(path.join(dropin, 'release.conf'), `[Service]\nEnvironmentFile=${runtime}\n`);
    run('systemctl', ['daemon-reload']);
    run('systemctl', ['restart', 'nogueira-web']);
    await waitHealth('http://127.0.0.1:3002/api/health', sha);
    await waitHealth('https://www.nogueiracardiologia.com.br/api/health', sha);
    run('node', ['scripts/smoke-production.mjs']);
  } catch (error) {
    if (webChanged) {
      await writeFile(runtime, previous, { mode: 0o600 });
      run('systemctl', ['restart', 'nogueira-web']);
    }
    if (previousImage) {
      const priorSha = previousImage.slice('nogueira-lios:'.length);
      run('docker', ['compose', 'up', '-d', '--no-build'], { cwd: lios, env: { ...env, GIT_SHA: priorSha } });
      await waitHealth('http://127.0.0.1:8081/healthz', priorSha);
    } else {
      run('docker', ['compose', 'stop'], { cwd: lios, env });
    }
    throw error;
  }
  run('git', ['fetch', '--all', '--prune']);
  if (git('status', '--porcelain')) throw new Error('Unexpected working tree changes after deployment.');
  if (sha !== git('rev-parse', 'HEAD') || sha !== git('rev-parse', '@{upstream}')) throw new Error('Repository changed during deployment; reconcile before claiming success.');
  console.log(`DEPLOY VERIFIED: ${sha}`);
} finally {
  await lock.close();
  await unlink('.deploy.lock');
}
