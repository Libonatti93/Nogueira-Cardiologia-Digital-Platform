import { DriveError } from './drive-policy';

export const defaultCover = '/uploads-imagens-nogueira/nogueira-cardiologia-pauloecris2.png';
export const professorSlug = 'dr-paulo-roberto-nogueira';
export { DriveError as EditorialError };
export async function readLimitedJson(request: Request, max = 600_000): Promise<Record<string, unknown>> {
  if (!request.body || Number(request.headers.get('content-length') || 0) > max) throw new DriveError('Conteúdo muito grande.', 413);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length; if (size > max) throw new DriveError('Conteúdo muito grande.', 413);
      chunks.push(value);
    }
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch (error) {
    if (error instanceof DriveError) throw error;
    throw new DriveError('Dados inválidos.');
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
export function editorialErrorResponse(error: unknown) {
  const status = error instanceof DriveError ? error.status : (error as { code?: string })?.code === '23505' ? 409 : 500;
  if (status === 500) console.error('educativo_operation_failed');
  return Response.json({ message: error instanceof DriveError ? error.message : status === 409 ? 'Esta URL já está em uso. Escolha outra.' : 'Não foi possível concluir. Tente novamente.' }, { status, headers: { 'Cache-Control': 'private, no-store' } });
}
