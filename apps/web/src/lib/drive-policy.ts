export class DriveError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const driveUuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function driveId(value: unknown, optional = false): string | null {
  if (optional && (value === undefined || value === null || value === '')) return null;
  if (typeof value !== 'string' || !driveUuid.test(value)) throw new DriveError('Identificador inválido.');
  return value.toLowerCase();
}
export function driveName(value: unknown) {
  if (typeof value !== 'string') throw new DriveError('Informe um nome.');
  const name = value.normalize('NFC').trim();
  if (!name || name.length > 180 || Buffer.byteLength(name) > 240 || /^[. ]+$/.test(name)
    || /[/\\\x00-\x1f\x7f<>:"|?*\u202a-\u202e\u2066-\u2069]/u.test(name)) {
    throw new DriveError('Use um nome de até 180 caracteres, sem barras ou caracteres especiais de caminho.');
  }
  return name;
}
export function driveExtension(name: string) { return name.includes('.') ? name.split('.').at(-1)!.toLowerCase().slice(0,30) : ''; }
export function detectDriveMime(bytes: Buffer, name: string, claimed: string) {
  if (claimed && !/^[\w.+-]+\/[\w.+-]+$/.test(claimed)) throw new DriveError('Tipo de arquivo inválido.');
  const ext = driveExtension(name), ascii = bytes.toString('latin1');
  const signatures: Record<string, [boolean, string]> = {
    pdf: [ascii.startsWith('%PDF-'), 'application/pdf'],
    png: [bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')), 'image/png'],
    jpg: [bytes[0]===255 && bytes[1]===216 && bytes[2]===255, 'image/jpeg'],
    jpeg: [bytes[0]===255 && bytes[1]===216 && bytes[2]===255, 'image/jpeg'],
    webp: [ascii.startsWith('RIFF') && ascii.slice(8,12)==='WEBP', 'image/webp'],
    gif: [/^GIF8[79]a/.test(ascii), 'image/gif'],
    mp4: [ascii.slice(4,8)==='ftyp', 'video/mp4'],
    mov: [['ftyp','moov','mdat','wide'].includes(ascii.slice(4,8)), 'video/quicktime'],
    mp3: [ascii.startsWith('ID3') || (bytes[0]===255 && (bytes[1]&224)===224), 'audio/mpeg'],
    wav: [ascii.startsWith('RIFF') && ascii.slice(8,12)==='WAVE', 'audio/wav'],
    m4a: [ascii.slice(4,8)==='ftyp', 'audio/mp4'],
    webm: [bytes.subarray(0,4).equals(Buffer.from('1a45dfa3','hex')), 'video/webm'],
  };
  if (ext in signatures) {
    if (!signatures[ext][0]) throw new DriveError('O conteúdo não corresponde ao formato do arquivo.');
    return signatures[ext][1];
  }
  if (['txt','csv'].includes(ext)) {
    if (bytes.includes(0)) return 'application/octet-stream';
    try { new TextDecoder('utf-8',{fatal:true}).decode(bytes,{stream:true}); } catch { return 'application/octet-stream'; }
    return ext==='txt' ? 'text/plain' : 'text/csv';
  }
  // Unrecognized/active formats remain downloadable, never executable or inline.
  return 'application/octet-stream';
}
export function canPreviewDrive(mime: string) {
  return mime==='application/pdf' || mime==='text/plain' || /^(image\/(jpeg|png|webp|gif)|video\/(mp4|quicktime|webm)|audio\/(mpeg|wav|mp4))$/.test(mime);
}
export function driveRange(header: string | null, size: number) {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!m || (!m[1]&&!m[2]) || !size) throw new DriveError('Intervalo inválido.',416);
  const start = m[1] ? Number(m[1]) : Math.max(0,size-Number(m[2]));
  const end = m[1] ? (m[2] ? Math.min(Number(m[2]),size-1) : size-1) : size-1;
  if (!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start) throw new DriveError('Intervalo inválido.',416);
  return {start,end};
}
