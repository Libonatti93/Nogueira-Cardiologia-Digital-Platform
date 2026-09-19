import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';

// Run from apps/web. Keep the established systemd service, port and Traefik route.
const web=process.cwd();
const run=(command,args,options={})=>execFileSync(command,args,{cwd:web,stdio:'inherit',...options});
const git=(...args)=>execFileSync('git',args,{cwd:web,encoding:'utf8'}).trim();
if(git('status','--porcelain')) throw new Error('Commit and push changes before deployment.');
const sha=git('rev-parse','HEAD');
if(sha!==git('rev-parse','@{upstream}'))throw new Error('Local and upstream SHAs differ.');
const dist=`.next-releases/${sha}`;
const env={...process.env,RELEASE_SHA:sha,NEXT_DIST_DIR:dist,GIT_SHA:sha};
const tsconfig=await readFile('tsconfig.json');
try { run('npm',['run','build'],{env}); }
finally { await writeFile('tsconfig.json',tsconfig); }
if((await readFile(path.join(dist,'BUILD_ID'),'utf8')).trim()!==sha)throw new Error('Build SHA mismatch.');
run('node',['scripts/migrate.mjs']);
const lios=path.resolve(web,'../../services/lios');
run('docker',['compose','build'],{cwd:lios,env});
run('docker',['run','--rm',`nogueira-lios:${sha}`,'pytest','-q','-p','no:cacheprovider']);
run('docker',['compose','up','-d'],{cwd:lios,env});
async function waitHealth(url) {
  for(let attempt=0;attempt<60;attempt++){
    try { const response=await fetch(url,{signal:AbortSignal.timeout(3000)}); const data=await response.json();if(response.ok&&data.sha===sha)return; }catch{}
    await delay(1000);
  }
  throw new Error(`Health/SHA validation failed: ${url}`);
}
await waitHealth('http://127.0.0.1:8081/healthz');
const runtime=path.join(web,'.runtime.env');
const previous=await readFile(runtime,'utf8').catch(()=> 'NEXT_DIST_DIR=.next\n');
await writeFile(`${runtime}.previous`,previous,{mode:0o600});
await writeFile(runtime,`NEXT_DIST_DIR=${dist}\nRELEASE_SHA=${sha}\n`,{mode:0o600});
const dropin='/etc/systemd/system/nogueira-web.service.d';
await mkdir(dropin,{recursive:true});
await writeFile(path.join(dropin,'release.conf'),`[Service]\nEnvironmentFile=${runtime}\n`);
run('systemctl',['daemon-reload']);
run('systemctl',['restart','nogueira-web']);
try {
  await waitHealth('http://127.0.0.1:3002/api/health');
  await waitHealth('https://www.nogueiracardiologia.com.br/api/health');
} catch(error) {
  await copyFile(`${runtime}.previous`,runtime);
  run('systemctl',['restart','nogueira-web']);
  throw error;
}
if(git('status','--porcelain'))throw new Error('Unexpected working tree changes after build.');
console.log(`DEPLOY VERIFIED: ${sha}`);
