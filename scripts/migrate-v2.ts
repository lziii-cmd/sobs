import './env';
import { db } from '../lib/db';
import { V1_ABANDONNEES, V1_TO_V2, valeurPourV2 } from '../data/migration-v1';
import { questionById } from '../data/questions';

/**
 * Passage du formulaire v1 (85 questions) au questionnaire v2 (196 questions).
 *
 * Le v2 renumérote tout : sans cette migration, une réponse enregistrée sous
 * `Q42` se retrouverait affichée sous une question qui n'a rien à voir.
 *
 * Le script commence par archiver l'intégralité de l'existant dans
 * `answers_v1` et `answer_revisions_v1` : rien n'est perdu, même ce qui n'est
 * pas repris. Il réécrit ensuite les identifiants selon la table de
 * correspondance de `data/migration-v1.ts`.
 *
 *   npm run db:migrate-v2            # simulation, n'écrit rien
 *   npm run db:migrate-v2 -- --apply # applique réellement
 *
 * Rejouer le script après application est refusé : l'archive existante serait
 * écrasée par des données déjà migrées.
 */

const APPLY = process.argv.slice(2).includes('--apply');

type Ligne = { question_id: string; value: string; flagged: boolean; updated_at: string; updated_by: string };
type Revision = { id: number; question_id: string; value: string; created_at: string; created_by: string };

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

  // --- Refus de rejouer une migration déjà appliquée -------------------------
  const dejaMigre = (await sql`
    SELECT to_regclass('public.answers_v1') IS NOT NULL AS existe
  `) as { existe: boolean }[];

  if (dejaMigre[0]?.existe) {
    const restant = (await sql`SELECT count(*)::int AS n FROM answers_v1`) as { n: number }[];
    console.error(
      [
        `La table d'archive answers_v1 existe déjà (${restant[0]?.n ?? 0} ligne(s)).`,
        'La migration a donc déjà été appliquée. Rejouer écraserait cette archive.',
        "Si tu veux vraiment recommencer, renomme ou supprime answers_v1 à la main d'abord.",
      ].join('\n'),
    );
    process.exit(1);
  }

  const lignes = (await sql`
    SELECT question_id, value, flagged, updated_at, updated_by FROM answers ORDER BY question_id
  `) as Ligne[];
  const revisions = (await sql`
    SELECT id, question_id, value, created_at, created_by FROM answer_revisions ORDER BY id
  `) as Revision[];

  console.log(`${lignes.length} réponse(s) et ${revisions.length} révision(s) en base.`);
  console.log('');

  const reprises: { avant: string; apres: string; extrait: string }[] = [];
  const archivees: { id: string; raison: string; extrait: string }[] = [];

  for (const ligne of lignes) {
    const extrait = (ligne.value ?? '').replace(/\s+/g, ' ').slice(0, 60);
    const cible = V1_TO_V2[ligne.question_id];

    if (cible && questionById(cible)) {
      reprises.push({ avant: ligne.question_id, apres: cible, extrait });
    } else {
      archivees.push({
        id: ligne.question_id,
        raison: V1_ABANDONNEES[ligne.question_id] ?? 'Aucune correspondance dans le questionnaire v2.',
        extrait,
      });
    }
  }

  console.log(`Réponses reprises sous leur nouveau numéro : ${reprises.length}`);
  for (const r of reprises) {
    console.log(`  ${r.avant.padEnd(5)} → ${r.apres.padEnd(6)} ${r.extrait}`);
  }

  console.log('');
  console.log(`Réponses conservées en archive seulement : ${archivees.length}`);
  for (const a of archivees) {
    console.log(`  ${a.id.padEnd(5)} ${a.extrait}`);
    console.log(`        ${a.raison}`);
  }

  if (!APPLY) {
    console.log('');
    console.log('Simulation terminée, rien n’a été écrit.');
    console.log('Pour appliquer : npm run db:migrate-v2 -- --apply');
    process.exit(0);
  }

  // --- Archive --------------------------------------------------------------
  await sql`CREATE TABLE answers_v1 AS SELECT *, now() AS archived_at FROM answers`;
  await sql`CREATE TABLE answer_revisions_v1 AS SELECT *, now() AS archived_at FROM answer_revisions`;
  console.log('');
  console.log(`Archive créée : answers_v1 (${lignes.length}), answer_revisions_v1 (${revisions.length}).`);

  // --- Réécriture des identifiants -----------------------------------------
  // Les identifiants sont permutés (Q42 devient Q130 alors que Q130 n'existait
  // pas encore) : on vide puis on réinsère, ce qui évite toute collision de clé.
  await sql`DELETE FROM answers`;
  await sql`DELETE FROM answer_revisions`;

  for (const ligne of lignes) {
    const cible = V1_TO_V2[ligne.question_id];
    if (!cible || !questionById(cible)) continue;
    await sql`
      INSERT INTO answers (question_id, value, flagged, updated_at, updated_by)
      VALUES (${cible}, ${valeurPourV2(cible, ligne.value ?? '')}, ${ligne.flagged}, ${ligne.updated_at}, ${ligne.updated_by})
    `;
  }

  for (const revision of revisions) {
    const cible = V1_TO_V2[revision.question_id];
    if (!cible || !questionById(cible)) continue;
    await sql`
      INSERT INTO answer_revisions (question_id, value, created_at, created_by)
      VALUES (${cible}, ${valeurPourV2(cible, revision.value ?? '')}, ${revision.created_at}, ${revision.created_by})
    `;
  }

  // --- Grille : l'option « Non visité » n'existe plus ------------------------
  const grille = (await sql`
    UPDATE grid_rows
       SET data = jsonb_set(data, '{fiabilite}', '"À vérifier sur place"')
     WHERE data->>'fiabilite' = 'Non visité'
    RETURNING num
  `) as { num: number }[];

  const apres = (await sql`SELECT count(*)::int AS n FROM answers`) as { n: number }[];
  const apresRev = (await sql`SELECT count(*)::int AS n FROM answer_revisions`) as { n: number }[];

  console.log(`Réponses réécrites : ${apres[0]?.n ?? 0}`);
  console.log(`Révisions réécrites : ${apresRev[0]?.n ?? 0}`);
  if (grille.length > 0) {
    console.log(`Grille : ${grille.length} ligne(s) « Non visité » basculée(s) en « À vérifier sur place ».`);
  }
  console.log('');
  console.log('Migration terminée.');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
