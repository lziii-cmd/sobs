import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { MAX_FILE_BYTES } from '@/lib/constants';

export const runtime = 'nodejs';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });

  const sql = db();
  const rows = await sql`
    SELECT id, filename, mime, size_bytes, note, uploaded_by, created_at
    FROM files ORDER BY created_at DESC
  `;
  return NextResponse.json({ files: rows });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Envoi invalide.' }, { status: 400 });
  }

  const file = form.get('file');
  const note = String(form.get('note') ?? '').slice(0, 500);

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      {
        error: `Fichier trop lourd (${Math.round(file.size / 1024 / 1024 * 10) / 10} Mo). Maximum : 4 Mo.`,
      },
      { status: 413 },
    );
  }

  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    const sql = db();
    const rows = (await sql`
      INSERT INTO files (filename, mime, size_bytes, data_base64, note, uploaded_by)
      VALUES (
        ${file.name},
        ${file.type || 'application/octet-stream'},
        ${file.size},
        ${base64},
        ${note},
        ${user.username}
      )
      RETURNING id, filename, mime, size_bytes, note, uploaded_by, created_at
    `) as Record<string, unknown>[];

    return NextResponse.json({ ok: true, file: rows[0] });
  } catch (error) {
    console.error('upload', error);
    return NextResponse.json({ error: 'Enregistrement du fichier impossible.' }, { status: 500 });
  }
}
