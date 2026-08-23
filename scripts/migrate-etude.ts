import './env';
import { db } from '../lib/db';
import {
  RAISON_PAR_DEFAUT,
  V2_ABANDONNEES,
  V2_VERS_ETUDE,
} from '../data/migration-v2';
import { questionById } from '../data/questions';

/**
 * Passage du questionnaire v2 (196 questions) au questionnaire d'étude
 * (`Questionnaire_etude_SOBOA.docx`, 97 questions).
 *
 * Le nouveau document renumérote tout : sans cette migration, une réponse
 * enregistrée sous `Q130` s'afficherait sous une question sans rapport.
 *
 * Le script archive d'abord l'intégralité de l'existant dans `answers_v2` et
 * `answer_revisions_v2` : rien n'est perdu, y compris ce qui n'est pas repris.
 * Il réécrit ensuite les identifiants selon `data/migration-v2.ts`.
 *
 *   npm run db:migrate-etude            # simulation, n'écrit rien
 *   npm run db:migrate-etude -- --apply # applique réellement
 *
 * Rejouer le script après application est refusé : l'archive existante serait
 * écrasée par des données déjà migrées.
 */

const APPLY = process.argv.slice(2).includes('--apply');

type Ligne = {
  question_id: string;
  value: string;
  flagged: boolean;
  updated_at: string;
  updated_by: string;
};
type Revision = {
  id: number;
  question_id: string;
  value: string;
  created_at: string;
  created_by: string;
};

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
    SELECT to_regclass('public.answers_v2') IS NOT NULL AS existe
  `) as { existe: boolean }[];

  if (dejaMigre[0]?.existe) {
    const restant = (await sql`SELECT count(*)::int AS n FROM answers_v2`) as { n: number }[];
    console.error(
      [
        `La table d'archive answers_v2 existe déjà (${restant[0]?.n ?? 0} ligne(s)).`,
        'La migration a donc déjà été appliquée. Rejouer écraserait cette archive.',
        "Si tu veux vraiment recommencer, renomme ou supprime answers_v2 à la main d'abord.",
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
    const cible = V2_VERS_ETUDE[ligne.question_id];

    if (cible && questionById(cible)) {
      reprises.push({ avant: ligne.question_id, apres: cible, extrait });
    } else {
      archivees.push({
        id: ligne.question_id,
        raison: V2_ABANDONNEES[ligne.question_id] ?? RAISON_PAR_DEFAUT,
        extrait,
      });
    }
  }

  console.log(`Réponses reposées par le nouveau document : ${reprises.length}`);
  for (const r of reprises) {
    const intitule = questionById(r.apres)?.label ?? '';
    console.log(`  ${r.avant.padEnd(6)} → ${r.apres.padEnd(5)} ${intitule.slice(0, 62)}`);
    console.log(`         ${r.extrait}`);
  }

  console.log('');
  console.log(`Réponses conservées en archive seulement : ${archivees.length}`);
  for (const a of archivees) {
    console.log(`  ${a.id.padEnd(6)} ${a.extrait}`);
    console.log(`         ${a.raison}`);
  }

  if (!APPLY) {
    console.log('');
    console.log('Simulation terminée, rien n’a été écrit.');
    console.log('Pour appliquer : npm run db:migrate-etude -- --apply');
    process.exit(0);
  }

  // --- Archive --------------------------------------------------------------
  await sql`CREATE TABLE answers_v2 AS SELECT *, now() AS archived_at FROM answers`;
  await sql`CREATE TABLE answer_revisions_v2 AS SELECT *, now() AS archived_at FROM answer_revisions`;
  console.log('');
  console.log(
    `Archive créée : answers_v2 (${lignes.length}), answer_revisions_v2 (${revisions.length}).`,
  );

  // --- Réécriture des identifiants -----------------------------------------
  // Les identifiants se recouvrent d'un document à l'autre (Q130 devient Q19
  // alors que Q19 existe déjà) : on vide puis on réinsère, ce qui évite toute
  // collision de clé primaire.
  await sql`DELETE FROM answers`;
  await sql`DELETE FROM answer_revisions`;

  for (const ligne of lignes) {
    const cible = V2_VERS_ETUDE[ligne.question_id];
    if (!cible || !questionById(cible)) continue;
    await sql`
      INSERT INTO answers (question_id, value, flagged, updated_at, updated_by)
      VALUES (${cible}, ${ligne.value ?? ''}, ${ligne.flagged}, ${ligne.updated_at}, ${ligne.updated_by})
    `;
  }

  for (const revision of revisions) {
    const cible = V2_VERS_ETUDE[revision.question_id];
    if (!cible || !questionById(cible)) continue;
    await sql`
      INSERT INTO answer_revisions (question_id, value, created_at, created_by)
      VALUES (${cible}, ${revision.value ?? ''}, ${revision.created_at}, ${revision.created_by})
    `;
  }

  const apres = (await sql`SELECT count(*)::int AS n FROM answers`) as { n: number }[];
  const apresRev = (await sql`SELECT count(*)::int AS n FROM answer_revisions`) as { n: number }[];

  console.log(`Réponses réécrites : ${apres[0]?.n ?? 0}`);
  console.log(`Révisions réécrites : ${apresRev[0]?.n ?? 0}`);
  console.log('');
  console.log('Migration terminée.');
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
