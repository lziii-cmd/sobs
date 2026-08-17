import './env';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { db, runStatements } from '../lib/db';

/** Applique `db/schema.sql`. Idempotent : peut être rejoué à volonté. */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL manquant. Renseigne-le dans .env.local.');
    process.exit(1);
  }

  const schema = readFileSync(join(process.cwd(), 'db', 'schema.sql'), 'utf8');

  const statements = schema
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s !== '' && !s.split('\n').every((line) => line.trim().startsWith('--')));

  await runStatements(url, statements, (statement) => {
    const label = statement.split('\n').find((l) => !l.trim().startsWith('--')) ?? '';
    console.log(`  ok  ${label.slice(0, 70)}`);
  });

  const sql = db();
  const tables = await sql<{ table_name: string }>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `;

  console.log(`\nBase prête. Tables : ${tables.map((t) => t.table_name).join(', ')}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
