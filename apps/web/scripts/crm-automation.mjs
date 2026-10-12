import nextEnv from '@next/env';
import pg from 'pg';
nextEnv.loadEnvConfig(process.cwd());
const db = new pg.Client({connectionString:process.env.DATABASE_URL});
try {
 await db.connect();
 await db.query('begin');
 const result=await db.query('select crm_run_automation() enrolled');
 await db.query('commit');
 console.log(JSON.stringify({at:new Date().toISOString(),status:'ok',enrolled:result.rows[0].enrolled}));
} catch(error) {
 await db.query('rollback').catch(()=>{});
 console.error('crm_automation_failed',error.code||'unknown');process.exitCode=1;
} finally {await db.end();}
