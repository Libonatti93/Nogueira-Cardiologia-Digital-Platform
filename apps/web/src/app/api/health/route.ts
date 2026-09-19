import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await query('select 1');
    return Response.json({ status: 'ok', sha: process.env.RELEASE_SHA || 'development' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ status: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
