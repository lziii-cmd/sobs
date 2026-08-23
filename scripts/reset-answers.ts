import './env';
import { db } from '../lib/db';
import { questionById } from '../data/questions';

/**
 * Remet le questionnaire à zéro : toutes les réponses et tout leur historique
 * sont retirés, et le formulaire repart vierge.
 *
 *   npm run db:reset            # simulation, n'écrit rien
 *   npm run db:reset -- --apply # applique réellement
 *
 * Rien n'est perdu pour autant. Avant de supprimer quoi que ce soit, le script
 * recopie l'intégralité de l'existant dans `answers_archive` et
 * `answer_revisions_archive`, datées du moment de la remise à zéro. Ces deux
 * tables s'empilent : une remise à zéro ultérieure ajoute ses lignes sans
 * écraser les précédentes.
 *
 * Ce que le script ne touche pas, volontairement :
 *   - les comptes (`users`) ;
 *   - les fichiers échangés (`files`) ;
 *   - les archives des changements de questionnaire (`answers_v1`, `answers_v2`).
 * Ajoute `--grille` pour vider aussi la grille de relevé.
 */

const ARGS = process.argv.slice(2);
const APPLY = ARGS.includes('--apply');
const GRILLE = ARGS.includes('--grille');

type Ligne = { question_id: string; value: string; updated_by: string };

function hote(url: string): string {
  return /@([^/?]+)/.exec(url)?.[1] ?? url;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL manquant. Renseigne-le dans .env.local.');
    process.exit(1);
  }

  const sql = db();
  console.log(`Base visée : ${hote(url)}`);
  console.log(APPLY ? 'Mode : APPLICATION' : 'Mode : simulation (ajoute --apply pour écrire)');
  console.log('');

  const lignes = (await sql`
    SELECT question_id, value, updated_by FROM answers ORDER BY question_id
  `) as Ligne[];
  const revisions = (await sql`SELECT count(*)::int AS n FROM answer_revisions`) as { n: number }[];
  const grille = (await sql`SELECT num, data FROM grid_rows`) as {
    num: number;
    data: Record<string, string> | null;
  }[];

  const grilleRenseignee = grille.filter((g) =>
    Object.values(g.data ?? {}).some((v) => String(v).trim() !== ''),
  );

  console.log(`Réponses à retirer : ${lignes.length}`);
  for (const ligne of lignes) {
    const intitule = questionById(ligne.question_id)?.label ?? '(question inconnue)';
    console.log(`  ${ligne.question_id.padEnd(5)} ${intitule.slice(0, 62)}`);
    console.log(`        ${(ligne.value ?? '').replace(/\s+/g, ' ').slice(0, 62)}`);
  }

  console.log('');
  console.log(`Révisions à retirer : ${revisions[0]?.n ?? 0}`);
  console.log(
    `Grille : ${grille.length} ligne(s) en base, dont ${grilleRenseignee.length} renseignée(s)` +
      (GRILLE ? ' — sera vidée (--grille)' : ' — conservée (ajoute --grille pour la vider)'),
  );

  if (!APPLY) {
    console.log('');
    console.log('Simulation terminée, rien n’a été écrit.');
    console.log('Pour appliquer : npm run db:reset -- --apply');
    process.exit(0);
  }

  // --- Sauvegarde avant suppression ----------------------------------------
  // Les tables s'empilent : chaque remise à zéro y dépose ses lignes, datées.
  await sql`
    CREATE TABLE IF NOT EXISTS answers_archive (
      question_id TEXT NOT NULL,
      value       TEXT NOT NULL DEFAULT '',
      flagged     BOOLEAN NOT NULL DEFAULT false,
      updated_at  TIMESTAMPTZ,
      updated_by  TEXT NOT NULL DEFAULT '',
      reset_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS answer_revisions_archive (
      question_id TEXT NOT NULL,
      value       TEXT NOT NULL,
      created_at  TIMESTAMPTZ,
      created_by  TEXT NOT NULL DEFAULT '',
      reset_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    INSERT INTO answers_archive (question_id, value, flagged, updated_at, updated_by)
    SELECT question_id, value, flagged, updated_at, updated_by FROM answers
  `;
  await sql`
    INSERT INTO answer_revisions_archive (question_id, value, created_at, created_by)
    SELECT question_id, value, created_at, created_by FROM answer_revisions
  `;

  console.log('');
  console.log(
    `Sauvegarde : ${lignes.length} réponse(s) et ${revisions[0]?.n ?? 0} révision(s) ` +
      'recopiées dans answers_archive / answer_revisions_archive.',
  );

  // --- Remise à zéro --------------------------------------------------------
  await sql`DELETE FROM answers`;
  await sql`DELETE FROM answer_revisions`;

  if (GRILLE) {
    await sql`DELETE FROM grid_rows`;
    console.log('Grille de relevé vidée.');
  }

  const restantes = (await sql`SELECT count(*)::int AS n FROM answers`) as { n: number }[];
  const restantesRev = (await sql`SELECT count(*)::int AS n FROM answer_revisions`) as { n: number }[];
  const archivees = (await sql`SELECT count(*)::int AS n FROM answers_archive`) as { n: number }[];

  console.log('');
  console.log(`Réponses restantes : ${restantes[0]?.n ?? 0}`);
  console.log(`Révisions restantes : ${restantesRev[0]?.n ?? 0}`);
  console.log(`Total conservé dans answers_archive : ${archivees[0]?.n ?? 0}`);
  console.log('');
  console.log('Questionnaire remis à zéro.');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
