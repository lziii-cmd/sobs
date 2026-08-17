import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
  }

  const sql = db();
  const rows = (await sql`
    SELECT filename, mime, data_base64 FROM files WHERE id = ${id}
  `) as { filename: string; mime: string; data_base64: string }[];

  const file = rows[0];
  if (!file) return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });

  const bytes = Buffer.from(file.data_base64, 'base64');
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': file.mime || 'application/octet-stream',
      'Content-Length': String(bytes.length),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Identifiant invalide.' }, { status: 400 });
  }

  const sql = db();
  const rows = (await sql`
    SELECT uploaded_by FROM files WHERE id = ${id}
  `) as { uploaded_by: string }[];

  const file = rows[0];
  if (!file) return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });

  // Chacun peut retirer ses propres dépôts ; l'admin peut tout retirer.
  if (user.role !== 'admin' && file.uploaded_by !== user.username) {
    return NextResponse.json({ error: 'Ce fichier ne t’appartient pas.' }, { status: 403 });
  }

  await sql`DELETE FROM files WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
