import { readFile } from 'fs/promises';
import { NextResponse, type NextRequest } from 'next/server';
import { canAccessInternalArea, getSessionUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

type ExamFileRow = {
  id: string;
  uploaded_by_user_id: string | null;
  patient_email: string;
  original_file_name: string;
  storage_path: string;
  mime_type: string;
};

export async function GET(_request: NextRequest, context: RouteContext<'/api/exams/[id]/file'>) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: 'Acesso não autorizado.' }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await query<ExamFileRow>(
    `
      select id, uploaded_by_user_id, patient_email, original_file_name, storage_path, mime_type
      from patient_exam_uploads
      where id = $1
      limit 1
    `,
    [id],
  );
  const exam = result.rows[0];

  if (!exam) {
    return NextResponse.json({ message: 'Exame não encontrado.' }, { status: 404 });
  }

  const isInternal = canAccessInternalArea(user);
  const isOwner = exam.uploaded_by_user_id === user.id || exam.patient_email.toLowerCase() === user.email.toLowerCase();

  if (!isInternal && !isOwner) {
    return NextResponse.json({ message: 'Acesso não autorizado.' }, { status: 403 });
  }

  if (!isInternal) {
    const userResult = await query<{ email_verified_at: Date | null; is_active: boolean }>(
      'select email_verified_at, is_active from app_users where id = $1 limit 1',
      [user.id],
    );
    const currentUser = userResult.rows[0];

    if (!currentUser?.is_active || !currentUser.email_verified_at) {
      return NextResponse.json({ message: 'Confirme seu e-mail para acessar seus exames.' }, { status: 403 });
    }
  }

  const file = await readFile(exam.storage_path).catch(() => null);

  if (!file) {
    return NextResponse.json({ message: 'Arquivo indisponivel.' }, { status: 404 });
  }

  return new NextResponse(file, {
    headers: {
      'Content-Type': exam.mime_type,
      'Content-Disposition': `inline; filename="${exam.original_file_name.replaceAll('"', '')}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
