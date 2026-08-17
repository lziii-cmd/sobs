import { db } from './db';
import type { GridData } from './synthese';

export type StoredAnswer = {
  value: string;
  flagged: boolean;
  updatedAt: string | null;
  updatedBy: string;
  revisions: number;
};

export type AnswersById = Record<string, StoredAnswer>;

export async function loadAnswers(): Promise<AnswersById> {
  const sql = db();
  const rows = (await sql`
    SELECT
      a.question_id,
      a.value,
      a.flagged,
      a.updated_at,
      a.updated_by,
      (SELECT count(*) FROM answer_revisions r WHERE r.question_id = a.question_id) AS revisions
    FROM answers a
  `) as {
    question_id: string;
    value: string;
    flagged: boolean;
    updated_at: string;
    updated_by: string;
    revisions: string | number;
  }[];

  const out: AnswersById = {};
  for (const row of rows) {
    out[row.question_id] = {
      value: row.value ?? '',
      flagged: Boolean(row.flagged),
      updatedAt: row.updated_at ?? null,
      updatedBy: row.updated_by ?? '',
      revisions: Number(row.revisions ?? 0),
    };
  }
  return out;
}

export async function loadGrid(): Promise<GridData> {
  const sql = db();
  const rows = (await sql`SELECT num, data FROM grid_rows`) as {
    num: number;
    data: Record<string, string> | null;
  }[];

  const out: GridData = {};
  for (const row of rows) out[Number(row.num)] = row.data ?? {};
  return out;
}

export type StoredFile = {
  id: number;
  filename: string;
  mime: string;
  size_bytes: number;
  note: string;
  uploaded_by: string;
  created_at: string;
};

export async function loadFiles(): Promise<StoredFile[]> {
  const sql = db();
  const rows = (await sql`
    SELECT id, filename, mime, size_bytes, note, uploaded_by, created_at
    FROM files ORDER BY created_at DESC
  `) as StoredFile[];
  return rows.map((f) => ({ ...f, size_bytes: Number(f.size_bytes) }));
}

export type Revision = {
  id: number;
  question_id: string;
  value: string;
  created_at: string;
  created_by: string;
};

export async function loadRevisions(questionId: string): Promise<Revision[]> {
  const sql = db();
  return (await sql`
    SELECT id, question_id, value, created_at, created_by
    FROM answer_revisions
    WHERE question_id = ${questionId}
    ORDER BY created_at DESC
  `) as Revision[];
}
