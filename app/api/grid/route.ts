import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { establishments } from '@/data/establishments';
import { allowedValues, gridColumnByKey } from '@/data/grid-columns';

export const runtime = 'nodejs';

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });

  let payload: { num?: number; key?: string; value?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const num = Number(payload.num);
  const key = payload.key ?? '';
  const value = (payload.value ?? '').trim();

  if (!establishments.some((e) => e.num === num)) {
    return NextResponse.json({ error: `Établissement inconnu : ${payload.num}` }, { status: 400 });
  }

  const column = gridColumnByKey(key);
  if (!column) {
    return NextResponse.json({ error: `Colonne inconnue : ${key}` }, { status: 400 });
  }

  const allowed = allowedValues(column);
  if (value !== '' && allowed && !allowed.includes(value)) {
    return NextResponse.json(
      { error: `Valeur non autorisée pour « ${column.label} » : ${value}` },
      { status: 400 },
    );
  }

  if (value !== '' && column.type === 'number' && !Number.isFinite(Number(value.replace(',', '.')))) {
    return NextResponse.json(
      { error: `« ${column.label} » attend un nombre.` },
      { status: 400 },
    );
  }

  try {
    const sql = db();
    const rows = (await sql`
      INSERT INTO grid_rows (num, data, updated_by)
      VALUES (${num}, jsonb_build_object(${key}::text, ${value}::text), ${user.username})
      ON CONFLICT (num) DO UPDATE
        SET data = grid_rows.data || jsonb_build_object(${key}::text, ${value}::text),
            updated_at = now(),
            updated_by = ${user.username}
      RETURNING updated_at
    `) as { updated_at: string }[];

    return NextResponse.json({ ok: true, updatedAt: rows[0]?.updated_at ?? null });
  } catch (error) {
    console.error('grid', error);
    return NextResponse.json({ error: 'Enregistrement impossible.' }, { status: 500 });
  }
}
