import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

const maxFileSizeBytes = 15 * 1024 * 1024;
const storageRoot = path.join(process.cwd(), 'storage', 'exam-uploads');
const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

function clean(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
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
  const user = await getSessionUser();

  if (!user || user.role !== 'patient') {
    return NextResponse.json({ message: 'Entre no portal do paciente para enviar exames.' }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ message: 'Dados invalidos.' }, { status: 400 });
  }

  const examFile = formData.get('examFile');

  if (!(examFile instanceof File)) {
    return NextResponse.json({ message: 'Anexe um arquivo de exame.' }, { status: 400 });
  }

  if (!allowedTypes.has(examFile.type)) {
    return NextResponse.json({ message: 'Envie PDF, JPG, PNG ou WEBP.' }, { status: 400 });
  }

  if (examFile.size <= 0 || examFile.size > maxFileSizeBytes) {
    return NextResponse.json({ message: 'O arquivo precisa ter ate 15 MB.' }, { status: 400 });
  }

  const patientFullName = clean(formData.get('patientFullName')) || user.fullName;
  const patientEmail = clean(formData.get('patientEmail')).toLowerCase() || user.email;
  const patientPhoneWhatsapp = clean(formData.get('patientPhoneWhatsapp'));
  const examType = clean(formData.get('examType')) || 'Outro exame';
  const examDate = clean(formData.get('examDate')) || null;
  const notes = clean(formData.get('notes')) || null;
  const consent = formData.get('lgpdConsent');

  if (patientFullName.length < 3) {
    return NextResponse.json({ message: 'Informe o nome do paciente.' }, { status: 400 });
  }

  if (consent !== 'true') {
    return NextResponse.json({ message: 'Aceite o consentimento LGPD para enviar exames.' }, { status: 400 });
  }

  const examId = randomUUID();
  const storedFileName = `${examId}.${extensionForType(examFile.type)}`;
  const storagePath = path.join(storageRoot, user.id);
  const absoluteFilePath = path.join(storagePath, storedFileName);

  await mkdir(storagePath, { recursive: true });
  await writeFile(absoluteFilePath, Buffer.from(await examFile.arrayBuffer()));

  await query(
    `
      insert into patient_exam_uploads (
        id,
        uploaded_by_user_id,
        patient_full_name,
        patient_email,
        patient_phone_whatsapp,
        exam_type,
        exam_date,
        notes,
        original_file_name,
        stored_file_name,
        storage_path,
        mime_type,
        file_size_bytes,
        status
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'received')
    `,
    [
      examId,
      user.id,
      patientFullName,
      patientEmail,
      patientPhoneWhatsapp || null,
      examType,
      examDate,
      notes,
      examFile.name,
      storedFileName,
      absoluteFilePath,
      examFile.type,
      examFile.size,
    ],
  );

  return NextResponse.redirect(new URL('/portal/paciente/exames?sent=1', request.url), 303);
}
