import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  RAISON_PAR_DEFAUT,
  V2_ABANDONNEES,
  V2_EN_BASE,
  V2_VERS_ETUDE,
} from '../data/migration-v2';
import { questionById } from '../data/questions';

test('chaque cible pointe vers une question qui existe vraiment', () => {
  for (const [avant, apres] of Object.entries(V2_VERS_ETUDE)) {
    assert.ok(questionById(apres), `${avant} → ${apres} : cible inexistante`);
  }
});

test('deux réponses ne peuvent pas atterrir sur la même question', () => {
  // `answers.question_id` est clé primaire : une collision ferait échouer la migration.
  const cibles = Object.values(V2_VERS_ETUDE);
  const doublons = cibles.filter((c, i) => cibles.indexOf(c) !== i);
  assert.deepEqual(doublons, [], `cibles en double : ${doublons.join(', ')}`);
});

test('aucune question n’est à la fois reprise et abandonnée', () => {
  for (const id of Object.keys(V2_VERS_ETUDE)) {
    assert.ok(!(id in V2_ABANDONNEES), `${id} figure dans les deux tables`);
  }
});

test('chaque abandon est motivé', () => {
  for (const [id, raison] of Object.entries(V2_ABANDONNEES)) {
    assert.ok(raison.trim().length > 30, `${id} : raison trop vague`);
  }
  assert.ok(RAISON_PAR_DEFAUT.trim().length > 30);
});

test('toutes les réponses présentes en base sont traitées explicitement', () => {
  for (const id of V2_EN_BASE) {
    const traitee = id in V2_VERS_ETUDE || id in V2_ABANDONNEES;
    assert.ok(traitee, `${id} : ni repris ni explicitement abandonné`);
  }
});

test('le partage entre reprises et archives est celui attendu', () => {
  const reprises = V2_EN_BASE.filter((id) => id in V2_VERS_ETUDE);
  const abandonnees = V2_EN_BASE.filter((id) => id in V2_ABANDONNEES);

  assert.equal(V2_EN_BASE.length, 46);
  assert.deepEqual(reprises.sort(), [
    'Q120', 'Q121', 'Q122', 'Q130', 'Q131', 'Q139', 'Q140', 'Q141',
  ]);
  assert.equal(abandonnees.length, 38);
  assert.equal(reprises.length + abandonnees.length, V2_EN_BASE.length);
});

test('les identifiants de départ restent dans la plage du questionnaire v2', () => {
  for (const id of [...Object.keys(V2_VERS_ETUDE), ...Object.keys(V2_ABANDONNEES), ...V2_EN_BASE]) {
    assert.match(id, /^Q\d+$/, `${id} mal formé`);
    const n = Number(id.slice(1));
    assert.ok(n >= 1 && n <= 196, `${id} hors de la plage v2`);
  }
});

test('les huit questions reposées le sont sur le bon sujet', () => {
  // Contrôle de fond : une correspondance approximative vaudrait une réponse fausse.
  assert.match(questionById(V2_VERS_ETUDE.Q122!)!.label, /boissons gazeuses/);
  assert.match(questionById(V2_VERS_ETUDE.Q121!)!.label, /Viking/);
  assert.match(questionById(V2_VERS_ETUDE.Q120!)!.label, /nombre exact de références/);
  assert.match(questionById(V2_VERS_ETUDE.Q141!)!.label, /exclusivité/);
  assert.match(questionById(V2_VERS_ETUDE.Q130!)!.label, /marque concurrente/);
  assert.match(questionById(V2_VERS_ETUDE.Q139!)!.label, /animations/);
  assert.match(questionById(V2_VERS_ETUDE.Q140!)!.label, /animations comparables/);
  assert.match(questionById(V2_VERS_ETUDE.Q131!)!.label, /concurrents/);
});

test('les questions reposées le sont majoritairement au rang prioritaire', () => {
  // Seules les trois questions sur les animations et les autres acteurs ne le sont pas.
  const nonPrioritaires = Object.values(V2_VERS_ETUDE)
    .filter((cible) => !questionById(cible)!.priority)
    .sort();
  assert.deepEqual(nonPrioritaires, ['Q23', 'Q24', 'Q28']);
});
