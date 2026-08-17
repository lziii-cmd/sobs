import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { questionById } from '@/data/questions';

export const runtime = 'nodejs';

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });

  let payload: { questionId?: string; value?: string; flagged?: boolean };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const questionId = payload.questionId ?? '';
  if (!questionById(questionId)) {
    return NextResponse.json({ error: `Question inconnue : ${questionId}` }, { status: 400 });
  }

  const sql = db();

  try {
    // Marquage « à revenir dessus » seul, sans toucher à la réponse.
    if (payload.value === undefined && typeof payload.flagged === 'boolean') {
      const rows = (await sql`
        INSERT INTO answers (question_id, value, flagged, updated_by)
        VALUES (${questionId}, '', ${payload.flagged}, ${user.username})
        ON CONFLICT (question_id) DO UPDATE SET flagged = ${payload.flagged}
        RETURNING updated_at
      `) as { updated_at: string }[];
      return NextResponse.json({ ok: true, updatedAt: rows[0]?.updated_at ?? null, unchanged: true });
    }

    const value = typeof payload.value === 'string' ? payload.value : '';

    const existing = (await sql`
      SELECT value FROM answers WHERE question_id = ${questionId}
    `) as { value: string }[];

    // Rien n'a changé : on ne crée ni révision ni bruit dans l'historique.
    if (existing[0]?.value === value && payload.flagged === undefined) {
      return NextResponse.json({ ok: true, unchanged: true });
    }

    const flagged = payload.flagged;
    const rows = (await sql`
      INSERT INTO answers (question_id, value, flagged, updated_at, updated_by)
      VALUES (${questionId}, ${value}, ${flagged ?? false}, now(), ${user.username})
      ON CONFLICT (question_id) DO UPDATE
        SET value = ${value},
            flagged = COALESCE(${flagged ?? null}, answers.flagged),
            updated_at = now(),
            updated_by = ${user.username}
      RETURNING updated_at
    `) as { updated_at: string }[];

    if (value.trim() !== '' && existing[0]?.value !== value) {
      await sql`
        INSERT INTO answer_revisions (question_id, value, created_by)
        VALUES (${questionId}, ${value}, ${user.username})
      `;
    }

    return NextResponse.json({ ok: true, updatedAt: rows[0]?.updated_at ?? null });
  } catch (error) {
    console.error('answers', error);
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  }
}
