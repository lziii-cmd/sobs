import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupIntro, groups, questionById, questions, sections } from '../data/questions';

/**
 * Le tableau « Récapitulatif » de `Questionnaire_etude_SOBOA.docx` donne le
 * compte attendu par section. Il sert ici de contrôle : si la transposition
 * dérive, ces chiffres ne tombent plus.
 */
const RECAPITULATIF = [
  { id: 'gamme', number: '1', questions: 10, prioritaires: 7 },
  { id: 'equipement', number: '2', questions: 8, prioritaires: 5 },
  { id: 'concurrence', number: '3', questions: 10, prioritaires: 7 },
  { id: 'etablissements', number: '4', questions: 36, prioritaires: 1 },
  { id: 'marche', number: '5', questions: 9, prioritaires: 5 },
  { id: 'entreprise', number: '6', questions: 11, prioritaires: 8 },
  { id: 'economie', number: '7', questions: 13, prioritaires: 10 },
];

test('le questionnaire contient bien les 97 questions du document source', () => {
  assert.equal(questions.length, 97);
});

test('les identifiants vont de Q1 à Q97, sans trou ni doublon', () => {
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants en double');
  for (let n = 1; n <= 97; n += 1) {
    assert.ok(ids.includes(`Q${n}`), `Q${n} manquante`);
  }
});

test("l'ordre des questions suit celui du document", () => {
  const numbers = questions.map((q) => Number(q.id.slice(1)));
  const sorted = [...numbers].sort((a, b) => a - b);
  assert.deepEqual(numbers, sorted);
});

test('les 7 sections sont celles du document, dans le même ordre', () => {
  assert.deepEqual(
    sections.map((s) => s.id),
    RECAPITULATIF.map((r) => r.id),
  );
  assert.deepEqual(
    sections.map((s) => s.number),
    RECAPITULATIF.map((r) => r.number),
  );
});

test('le compte par section correspond au récapitulatif du document', () => {
  for (const attendu of RECAPITULATIF) {
    const liste = questions.filter((q) => q.sectionId === attendu.id);
    assert.equal(liste.length, attendu.questions, `section ${attendu.number} : mauvais total`);
    assert.equal(
      liste.filter((q) => q.priority).length,
      attendu.prioritaires,
      `section ${attendu.number} : mauvais nombre de prioritaires`,
    );
  }
});

test('le document annonce 97 questions dont 43 prioritaires', () => {
  assert.equal(
    RECAPITULATIF.reduce((total, r) => total + r.questions, 0),
    97,
  );
  assert.equal(questions.filter((q) => q.priority).length, 43);
});

test('chaque question appartient à une section connue et aucune section n’est vide', () => {
  const sectionIds = new Set(sections.map((s) => s.id));
  for (const question of questions) {
    assert.ok(sectionIds.has(question.sectionId), `${question.id} : section inconnue`);
  }
  for (const section of sections) {
    const count = questions.filter((q) => q.sectionId === section.id).length;
    assert.ok(count > 0, `section ${section.id} vide`);
  }
});

test('le questionnaire est entièrement ouvert : aucune case à cocher', () => {
  // Le document ne conserve plus de question à choix : tout attend un texte.
  for (const question of questions) {
    assert.ok(
      question.type === 'short' || question.type === 'long',
      `${question.id} : type inattendu (${question.type})`,
    );
    assert.equal(question.options, undefined, `${question.id} ne devrait pas avoir d'options`);
  }
});

test('les intitulés ne sont ni vides ni tronqués', () => {
  for (const question of questions) {
    assert.ok(question.label.trim().length > 10, `${question.id} : intitulé trop court`);
  }
});

test('la section 4 couvre les 35 établissements plus le cas de L’Hibiscus', () => {
  const releve = questions.filter((q) => q.sectionId === 'etablissements');
  assert.equal(releve.length, 36);

  const decrites = releve.filter((q) => q.label.startsWith('Décrire les observations'));
  assert.equal(decrites.length, 35, 'une question de relevé par établissement du périmètre');

  const hibiscus = releve.find((q) => q.label.includes('Hibiscus'));
  assert.ok(hibiscus, "la question sur L'Hibiscus est absente");
  assert.equal(hibiscus.id, 'Q64');
});

test('les questions de relevé sont regroupées par zone', () => {
  const zones = new Set(
    questions.filter((q) => q.sectionId === 'etablissements' && q.group).map((q) => q.group),
  );
  for (const zone of ['PORT', 'CORNICHE EST', 'VILLE ET PLATEAU', 'ALMADIES', 'MERMOZ']) {
    assert.ok(zones.has(zone), `zone ${zone} absente du relevé`);
  }
});

test('les renvois de chapitre sont repris quand le document en donne un', () => {
  const avecChapitre = questions.filter((q) => q.chapter);
  assert.equal(avecChapitre.length, 61);
  for (const question of avecChapitre) {
    assert.match(question.chapter!, /^Chapitres? /, `${question.id} : renvoi mal formé`);
  }
});

test('les blocs de cadrage du document sont conservés', () => {
  assert.equal(groups.length, 4);
  for (const groupe of groups) {
    assert.ok(groupe.intro.trim().length > 100, `${groupe.name} : bloc trop court`);
    assert.ok(
      sections.some((s) => s.id === groupe.sectionId),
      `${groupe.name} : section inconnue`,
    );
  }

  // Le rappel du constat de la section 1 porte la démonstration centrale.
  const constat = groupIntro('gamme', 'RAPPEL DU CONSTAT');
  assert.ok(constat?.includes('treize références'));
  assert.ok(constat?.includes('Gazelle'));
});

test('les sept premières questions portent le constat fondateur de l’étude', () => {
  // Le mode d'emploi les désigne comme les plus déterminantes du document.
  for (let n = 1; n <= 7; n += 1) {
    const question = questionById(`Q${n}`)!;
    assert.equal(question.sectionId, 'gamme', `Q${n} hors de la section 1`);
    assert.equal(question.priority, true, `Q${n} devrait être prioritaire`);
  }
});
