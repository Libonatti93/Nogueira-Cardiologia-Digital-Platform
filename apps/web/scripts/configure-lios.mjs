import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes, createHash } from 'node:crypto';
import pg from 'pg';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const webFile = new URL('../.env.local', import.meta.url);
const liosFile = new URL('../../../services/lios/.env', import.meta.url);
const existing = await readFile(liosFile,'utf8').catch(()=> '');
const settings = Object.fromEntries(existing.split('\n').filter(line=>line.includes('=')&&!line.startsWith('#')).map(line=>[line.slice(0,line.indexOf('=')),line.slice(line.indexOf('=')+1)]));
const token = settings.LIOS_OPERATOR_TOKEN || randomBytes(32).toString('hex');
const password = settings.LIOS_DATABASE_URL ? decodeURIComponent(new URL(settings.LIOS_DATABASE_URL).password) : randomBytes(32).toString('hex');
if (!/^[a-f0-9]{64}$/.test(password)) throw new Error('Expected generated LIOS database credential');
const sql = `DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='nogueira_lios') THEN
  CREATE ROLE nogueira_lios LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT; END IF; END $$;
ALTER ROLE nogueira_lios PASSWORD '${password}';
GRANT CONNECT ON DATABASE nogueira_app TO nogueira_lios;
GRANT USAGE ON SCHEMA lios TO nogueira_lios;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA lios TO nogueira_lios;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA lios TO nogueira_lios;
ALTER DEFAULT PRIVILEGES FOR ROLE nogueira_app_user IN SCHEMA lios GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO nogueira_lios;
ALTER DEFAULT PRIVILEGES FOR ROLE nogueira_app_user IN SCHEMA lios GRANT USAGE,SELECT ON SEQUENCES TO nogueira_lios;
ALTER ROLE nogueira_lios SET search_path=lios;`;
execFileSync('docker',['exec','-i','nogueira-postgres','psql','-U','nogueira_admin','-d','nogueira_app','-v','ON_ERROR_STOP=1'],{input:sql,stdio:['pipe','ignore','pipe']});
const values={LIOS_ENV:'production',LIOS_DATABASE_URL:`postgresql://nogueira_lios:${password}@nogueira-postgres:5432/nogueira_app`,LIOS_OPERATOR_TOKEN:token,
  LIOS_AI_PROVIDER:'demo',LIOS_PUBLIC_URL:process.env.NEXT_PUBLIC_SITE_URL,LIOS_DOCKER_NETWORK:'easypanel',...settings};
await writeFile(liosFile,Object.entries(values).map(([key,value])=>`${key}=${value}`).join('\n')+'\n',{mode:0o600});
let web=await readFile(webFile,'utf8');
for(const [key,value] of Object.entries({LIOS_INTERNAL_URL:'http://127.0.0.1:8081',LIOS_OPERATOR_TOKEN:token,
  AUTH_ALLOWED_ORIGINS:'https://nogueiracardiologia.com.br,https://www.nogueiracardiologia.com.br'})) {
  const line=`${key}=${value}`;
  web=new RegExp(`^${key}=.*$`,'m').test(web)?web.replace(new RegExp(`^${key}=.*$`,'m'),line):`${web.trimEnd()}\n${line}\n`;
}
await writeFile(webFile,web,{mode:0o600});
const client=new pg.Client({connectionString:process.env.DATABASE_URL});await client.connect();
try {
  await client.query('begin');
  const timestamp=new Date().toISOString();
  await client.query(`insert into lios.applications(id,name,slug,description,publication_url,status,created_at,updated_at)
    values('app_0000000000000001','Nogueira Cardiologia','nogueira-cardiologia','Operação editorial da Nogueira Cardiologia',$1,'active',$2,$2) on conflict(slug) do nothing`,[process.env.NEXT_PUBLIC_SITE_URL,timestamp]);
  const app=(await client.query("select id from lios.applications where slug='nogueira-cardiologia'")).rows[0];
  for(const [kind,title,content] of [
    ['avatar','Público editorial','Pessoas adultas que buscam informação educativa sobre saúde cardiovascular em português. Usar linguagem acessível e orientar a avaliação individual com profissional de saúde. Não utilizar dados identificáveis de pacientes.'],
    ['offer','Atuação da Nogueira Cardiologia','Clínica de cardiologia com conteúdo educativo, agendamento e acompanhamento por profissionais de saúde. O conteúdo editorial não oferece diagnósticos individuais, não promete resultados e deve ser revisado antes da publicação.'],
  ]) {
    await client.query(`insert into lios.rag_documents(id,application_id,rag_type,title,content,checksum,created_at,updated_at)
      values($1,$2,$3,$4,$5,$6,$7,$7) on conflict(application_id,rag_type,checksum) do nothing`,
    [`doc_${randomBytes(8).toString('hex')}`,app.id,kind,title,content,createHash('sha256').update(content).digest('hex'),timestamp]);
  }
  await client.query('commit');
} catch(error){await client.query('rollback');throw error;} finally{await client.end();}
console.log('LIOS configurada com identidade de banco restrita e segredos em arquivos ignorados.');
