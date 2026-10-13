import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { EditorialError } from './educativo-policy';
import { escapeHtml } from './educativo-html';

let converting = false;
export async function renderEducationalDocument(bytes: Buffer, extension: string) {
  if (converting) throw new EditorialError('Outro material está sendo preparado. Tente novamente em instantes.', 429);
  const image = process.env.EDUCATIVO_RENDERER_IMAGE;
  if (!image || !/^nogueira-educativo-renderer:[a-z0-9-]+$/.test(image)) throw new EditorialError('O visualizador está temporariamente indisponível.', 503);
  converting = true;
  const name = `educativo-render-${randomUUID()}`;
  try {
    const output = await new Promise<Buffer>((resolve, reject) => {
      const child = execFile('docker', ['run', '--pull', 'never', '--rm', '-i', '--name', name, '--network', 'none', '--read-only',
        '--user', '65534:65534', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges:true',
        '--memory', '768m', '--memory-swap', '768m', '--cpus', '1', '--pids-limit', '128',
        '--tmpfs', '/tmp:rw,noexec,nosuid,size=512m,mode=1777', image, extension],
      { timeout: 120_000, maxBuffer: 48 * 1024 * 1024, encoding: 'buffer' }, (error, stdout) => error ? reject(error) : resolve(stdout));
      child.stdin?.on('error', () => { /* Process exit is handled above. */ });
      child.stdin?.end(bytes);
    });
    const result = JSON.parse(output.toString()) as { pages: string[] };
    if (!Array.isArray(result.pages) || !result.pages.length || result.pages.length > 100) throw new Error();
    const pages: Buffer[] = [];
    let size = 0;
    for (const encoded of result.pages) {
      const page = await sharp(Buffer.from(encoded, 'base64'), {limitInputPixels: 3_000_000}).jpeg({quality: 85}).toBuffer();
      size += page.length;
      if (size > 32 * 1024 * 1024) throw new Error();
      pages.push(page);
    }
    return pages;
  } catch {
    throw new EditorialError('Não foi possível preparar a visualização. Envie PDF ou PowerPoint válido, sem senha, com até 100 páginas.');
  } finally {
    await new Promise<void>(resolve => execFile('docker', ['rm', '-f', name], {timeout: 5000}, () => resolve()));
    converting = false;
  }
}

export async function watermarkEducationalImage(bytes: Buffer, identity: string) {
  const resized = await sharp(bytes, {limitInputPixels: 24_000_000}).resize(1600, 1600, {fit: 'inside', withoutEnlargement: true}).toBuffer();
  const {width = 1200, height = 800} = await sharp(resized).metadata();
  const font = Math.max(12, Math.round(width / 65));
  const label = escapeHtml(identity.slice(0, 85));
  let marks = '';
  for (let y = Math.round(height / 6); y < height; y += Math.max(100, Math.round(height / 3))) {
    marks += `<g transform="translate(${Math.round(width / 2)},${y}) rotate(-14)"><text text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="${font}" fill="#123d66" fill-opacity="0.30" stroke="white" stroke-opacity="0.25" stroke-width="0.4">Prof. Dr. Paulo Nogueira · Uso pessoal</text><text y="${font * 1.6}" text-anchor="middle" font-family="sans-serif" font-size="${font}" fill="#123d66" fill-opacity="0.35">${label}</text></g>`;
  }
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${marks}</svg>`);
  return sharp(resized).composite([{input: overlay}]).jpeg({quality: 85}).toBuffer();
}
