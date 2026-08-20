import './env';
import assert from 'node:assert/strict';
import { assertBaseDeTest } from './guard';
import { db } from '../lib/db';
import { authenticate, hashPassword } from '../lib/auth';
import { loadAnswers, loadGrid, loadFiles, loadRevisions } from '../lib/queries';
import { buildPdf } from '../lib/pdf';
import { PDFDocument } from 'pdf-lib';

/**
 * Test de bout en bout contre une vraie base Postgres.
 * Exécute le même code que les routes API (sans passer par HTTP) et vérifie
 * la persistance des réponses, l'historique, la grille, les fichiers et le PDF.
 */

function ok(label: string) {
  console.log(`  ✓ ${label}`);
}

async function upsertAnswer(sql: ReturnType<typeof db>, questionId: string, value: string, user: string) {
  const existing = (await sql`SELECT value FROM answers WHERE question_id = ${questionId}`) as {
    value: string;
  }[];
  await sql`
    INSERT INTO answers (question_id, value, updated_at, updated_by)
    VALUES (${questionId}, ${value}, now(), ${user})
    ON CONFLICT (question_id) DO UPDATE
      SET value = ${value}, updated_at = now(), updated_by = ${user}
  `;
  if (value.trim() !== '' && existing[0]?.value !== value) {
    await sql`INSERT INTO answer_revisions (question_id, value, created_by) VALUES (${questionId}, ${value}, ${user})`;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL manquant.');
    process.exit(1);
  }
  assertBaseDeTest();

  const sql = db();

  // Repartir d'une base propre pour un test déterministe.
  await sql`TRUNCATE answers, answer_revisions, grid_rows, files RESTART IDENTITY`;
  await sql`DELETE FROM users WHERE username IN ('smoke-admin', 'smoke-nourah')`;
  ok('base nettoyée');

  // --- Authentification -----------------------------------------------------
  const hash = await hashPassword('motdepasse-test');
  await sql`INSERT INTO users (username, password_hash, role) VALUES ('smoke-nourah', ${hash}, 'contributor')`;
  assert.equal((await authenticate('smoke-nourah', 'motdepasse-test'))?.role, 'contributor');
  assert.equal(await authenticate('smoke-nourah', 'mauvais'), null);
  assert.equal(await authenticate('inconnu', 'motdepasse-test'), null);
  ok('authentification : bon mot de passe accepté, mauvais refusé');

  // --- Réponses + historique ------------------------------------------------
  await upsertAnswer(sql, 'Q1', 'Nourah Abdou', 'smoke-nourah');
  await upsertAnswer(sql, 'Q1', 'Nourah Abdou Diallo', 'smoke-nourah'); // modification
  await upsertAnswer(sql, 'Q130', 'Heineken à peu près partout, Coca dans la moitié', 'smoke-nourah');

  const answers = await loadAnswers();
  assert.equal(answers.Q1.value, 'Nourah Abdou Diallo');
  assert.equal(answers.Q1.revisions, 2, 'les deux versions doivent être conservées');
  assert.ok(answers.Q1.updatedAt, 'date de mise à jour absente');
  ok('réponse enregistrée, modifiée, et son historique conservé');

  const revisions = await loadRevisions('Q1');
  assert.equal(revisions.length, 2);
  assert.equal(revisions[0].value, 'Nourah Abdou Diallo'); // la plus récente d'abord
  ok('historique des révisions relu dans le bon ordre');

  // Une réponse effacée ne doit pas perdre l'historique déjà écrit.
  await upsertAnswer(sql, 'Q1', '', 'smoke-nourah');
  assert.equal((await loadRevisions('Q1')).length, 2);
  ok('effacer une réponse ne détruit pas son historique');

  // --- Marquage « à revoir » ------------------------------------------------
  await sql`UPDATE answers SET flagged = true WHERE question_id = ${'Q130'}`;
  assert.equal((await loadAnswers()).Q130.flagged, true);
  ok('marquage « à revoir » persistant');

  // --- Grille + upsert par cellule ------------------------------------------
  await sql`
    INSERT INTO grid_rows (num, data, updated_by)
    VALUES (20, jsonb_build_object('enseigne', 'O'), 'smoke-nourah')
    ON CONFLICT (num) DO UPDATE SET data = grid_rows.data || EXCLUDED.data
  `;
  await sql`
    INSERT INTO grid_rows (num, data, updated_by)
    VALUES (20, jsonb_build_object('nbRefs', '10'), 'smoke-nourah')
    ON CONFLICT (num) DO UPDATE SET data = grid_rows.data || EXCLUDED.data
  `;
  const grid = await loadGrid();
  assert.deepEqual(grid[20], { enseigne: 'O', nbRefs: '10' }, 'les cellules doivent fusionner, pas s’écraser');
  ok('grille : mise à jour cellule par cellule sans écrasement');

  // --- Fichiers -------------------------------------------------------------
  const contenu = Buffer.from('contenu de test').toString('base64');
  await sql`
    INSERT INTO files (filename, mime, size_bytes, data_base64, note, uploaded_by)
    VALUES ('note.txt', 'text/plain', 15, ${contenu}, 'un essai', 'smoke-nourah')
  `;
  const files = await loadFiles();
  assert.equal(files.length, 1);
  assert.equal(files[0].filename, 'note.txt');
  assert.equal(files[0].size_bytes, 15);
  ok('fichier stocké et relu depuis la base');

  // --- PDF sur données réelles ----------------------------------------------
  const pdf = await buildPdf({
    answers: Object.fromEntries(
      Object.entries(await loadAnswers()).map(([id, a]) => [
        id,
        { value: a.value, updatedAt: a.updatedAt, revisions: a.revisions, flagged: a.flagged },
      ]),
    ),
    grid: await loadGrid(),
  });
  const doc = await PDFDocument.load(pdf);
  // Le PDF ne reprend que les questions répondues : avec une seule réponse en
  // base, il reste la page de garde, une section, la grille et la synthèse.
  assert.ok(doc.getPageCount() >= 3, `${doc.getPageCount()} pages`);
  ok(`PDF généré sur données réelles (${doc.getPageCount()} pages)`);

  // Nettoyage.
  await sql`TRUNCATE answers, answer_revisions, grid_rows, files RESTART IDENTITY`;
  await sql`DELETE FROM users WHERE username IN ('smoke-admin', 'smoke-nourah')`;

  console.log('\nTous les tests de bout en bout passent.');
  process.exit(0);
}

main().catch((error) => {
  console.error('\nÉchec du test de bout en bout :');
  console.error(error);
  process.exit(1);
});
