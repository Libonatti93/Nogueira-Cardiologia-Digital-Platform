import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import pg from 'pg';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("select pg_advisory_lock(hashtextextended('nogueira-migrations',0))");
  await client.query(`create table if not exists schema_migrations (
    name text primary key, checksum text not null, applied_at timestamptz not null default now())`);
  for (const name of ['007_governance.sql', '008_lios.sql']) {
    const sql = await readFile(new URL(`../database/${name}`, import.meta.url), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const prior = (await client.query('select checksum from schema_migrations where name=$1', [name])).rows[0];
    if (prior) {
      if (prior.checksum !== checksum) throw new Error(`Migration modificada após aplicação: ${name}`);
      console.log(`${name}: já aplicada`);
      continue;
    }
    await client.query('begin');
    try {
      await client.query(sql);
      await client.query('insert into schema_migrations(name,checksum) values($1,$2)', [name,checksum]);
      await client.query('commit');
      console.log(`${name}: aplicada`);
    } catch(error) {
      await client.query('rollback');
      throw error;
    }
  }
} finally { await client.end(); }
