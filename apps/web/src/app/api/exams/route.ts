import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { createHash, randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getVerifiedPatientUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getPublicBaseUrl } from '@/lib/email-verification';

export const runtime = 'nodejs';

const maxFileSizeBytes = 15 * 1024 * 1024;
const storageRoot = path.join(process.cwd(), 'storage', 'exam-uploads');
const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

function clean(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function redirectToExams(request: Request, params: Record<string, string>) {
  const url = new URL('/portal/paciente/exames', getPublicBaseUrl(request));
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return NextResponse.redirect(url, 303);
}

function errorRedirect(request: Request, message: string) {
  return redirectToExams(request, { error: message });
}

function parseCoordinate(value: string, min: number, max: number) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function getRequestIp(request: Request) {
  const candidate =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '';

  return /^[0-9a-f:.]+$/i.test(candidate) ? candidate : null;
}

function extensionForType(mimeType: string) {
  switch (mimeType) {
    case 'application/pdf':
      return 'pdf';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}

export async function POST(request: Request) {
  const user = await getVerifiedPatientUser();

  if (!user) {
    return errorRedirect(request, 'Confirme seu e-mail e entre novamente no portal para enviar exames.');
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return errorRedirect(request, 'Os dados do formulário não puderam ser lidos. Tente novamente.');
  }

  const examFile = formData.get('examFile');

  if (!(examFile instanceof File)) {
    return errorRedirect(request, 'Selecione um arquivo de exame antes de enviar.');
  }

  if (!allowedTypes.has(examFile.type)) {
    return errorRedirect(request, 'O formato não é aceito. Envie PDF, JPG, PNG ou WEBP.');
  }

  if (examFile.size <= 0 || examFile.size > maxFileSizeBytes) {
    return errorRedirect(request, 'O arquivo precisa ter conteúdo e no máximo 15 MB.');
  }

  const patientFullName = clean(formData.get('patientFullName')) || user.fullName;
  const patientEmail = clean(formData.get('patientEmail')).toLowerCase() || user.email;
  const patientPhoneWhatsapp = clean(formData.get('patientPhoneWhatsapp'));
  const examType = clean(formData.get('examType')) || 'Outro exame';
  const examDate = clean(formData.get('examDate')) || null;
  const notes = clean(formData.get('notes')) || null;
  const consent = formData.get('lgpdConsent');
  const internationalTransferConsent = formData.get('internationalTransferConsent');
  const privacyNoticeVersion = clean(formData.get('privacyNoticeVersion')) || '2026-07-25';
  const locationLatitude = parseCoordinate(clean(formData.get('locationLatitude')), -90, 90);
  const locationLongitude = parseCoordinate(clean(formData.get('locationLongitude')), -180, 180);
  const locationAccuracy = Math.max(0, Math.round(Number(clean(formData.get('locationAccuracy'))) || 0)) || null;
  const hasLocationConsent = locationLatitude !== null && locationLongitude !== null;

  if (patientFullName.length < 3) {
    return errorRedirect(request, 'Informe o nome completo do paciente.');
  }

  if (consent !== 'true') {
    return errorRedirect(request, 'Confirme a autorização para tratamento do exame.');
  }

  if (internationalTransferConsent !== 'true') {
    return errorRedirect(request, 'Confirme a ciência sobre o armazenamento internacional para continuar.');
  }

  const examId = randomUUID();
  const storedFileName = `${examId}.${extensionForType(examFile.type)}`;
  const storagePath = path.join(storageRoot, user.id);
  const absoluteFilePath = path.join(storagePath, storedFileName);

  const fileBuffer = Buffer.from(await examFile.arrayBuffer());
  const fileSha256 = createHash('sha256').update(fileBuffer).digest('hex');

  try {
    await mkdir(storagePath, { recursive: true });
    await writeFile(absoluteFilePath, fileBuffer, { flag: 'wx', mode: 0o600 });

    await query(
      `
        insert into patient_exam_uploads (
          id, uploaded_by_user_id, patient_full_name, patient_email, patient_phone_whatsapp,
          exam_type, exam_date, notes, original_file_name, stored_file_name, storage_path,
          mime_type, file_size_bytes, status, upload_ip, user_agent, device_platform,
          accept_language, location_latitude, location_longitude, location_accuracy_m,
          location_consent_at, international_transfer_consent_at, privacy_notice_version, file_sha256
        )
        values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'received',
          $14, $15, $16, $17, $18, $19, $20,
          case when $21::boolean then now() else null end, now(), $22, $23
        )
      `,
      [
        examId, user.id, patientFullName, patientEmail, patientPhoneWhatsapp || null,
        examType, examDate, notes, examFile.name, storedFileName, absoluteFilePath,
        examFile.type, examFile.size, getRequestIp(request), request.headers.get('user-agent'),
        request.headers.get('sec-ch-ua-platform'), request.headers.get('accept-language'),
        locationLatitude, locationLongitude, locationAccuracy, hasLocationConsent,
        privacyNoticeVersion, fileSha256,
      ],
    );
  } catch (error) {
    await unlink(absoluteFilePath).catch(() => undefined);
    console.error('patient exam upload failed', error);
    return errorRedirect(request, 'O arquivo não foi salvo. Nenhum envio foi concluído; tente novamente em alguns instantes.');
  }

  return redirectToExams(request, { sent: '1' });
}
