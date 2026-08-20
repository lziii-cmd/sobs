import { test } from 'node:test';
import assert from 'node:assert/strict';
import { questions, sections, questionById } from '../data/questions';

/**
 * Le tableau « Récapitulatif des sections » de `Questionnaire_SOBOA_v2.docx`
 * donne, pour chaque section, le nombre de questions et le nombre de
 * prioritaires. C'est la meilleure vérification disponible de la transposition :
 * si un intitulé avait été oublié ou dupliqué, ces comptes ne tomberaient pas juste.
 */
const RECAPITULATIF = [
  { id: 'cadre', questions: 23, prioritaires: 14 },
  { id: 'entreprise', questions: 23, prioritaires: 11 },
  { id: 'marche', questions: 12, prioritaires: 6 },
  { id: 'visites', questions: 19, prioritaires: 14 },
  { id: 'etablissements', questions: 35, prioritaires: 0 },
  { id: 'visibilite', questions: 17, prioritaires: 12 },
  { id: 'concurrence', questions: 19, prioritaires: 13 },
  { id: 'implantation', questions: 12, prioritaires: 7 },
  { id: 'businesscase', questions: 24, prioritaires: 19 },
  { id: 'bilan', questions: 12, prioritaires: 6 },
];

test('le formulaire contient bien les 196 questions du document source', () => {
  assert.equal(questions.length, 196);
});

test('les identifiants vont de Q1 à Q196, sans trou ni doublon', () => {
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants en double');
  for (let n = 1; n <= 196; n += 1) {
    assert.ok(ids.includes(`Q${n}`), `Q${n} manquante`);
  }
});

test("l'ordre des questions suit celui du document", () => {
  const numbers = questions.map((q) => Number(q.id.slice(1)));
  const sorted = [...numbers].sort((a, b) => a - b);
  assert.deepEqual(numbers, sorted);
});

test('les 10 sections sont celles du document, dans le même ordre', () => {
  assert.deepEqual(
    sections.map((s) => s.id),
    RECAPITULATIF.map((r) => r.id),
  );
  assert.deepEqual(
    sections.map((s) => s.number),
    ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  );
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

test('le compte par section correspond au récapitulatif du document', () => {
  for (const attendu of RECAPITULATIF) {
    const list = questions.filter((q) => q.sectionId === attendu.id);
    assert.equal(list.length, attendu.questions, `section ${attendu.id} : nombre de questions`);
    assert.equal(
      list.filter((q) => q.priority).length,
      attendu.prioritaires,
      `section ${attendu.id} : nombre de prioritaires`,
    );
  }
});

test('le document annonce 196 questions dont 102 prioritaires', () => {
  assert.equal(
    RECAPITULATIF.reduce((sum, r) => sum + r.questions, 0),
    196,
  );
  assert.equal(questions.filter((q) => q.priority).length, 102);
});

test('la section « établissements » couvre les 35 points de vente de la grille', () => {
  const list = questions.filter((q) => q.sectionId === 'etablissements');
  assert.equal(list.length, 35);
  assert.equal(list[0].id, 'Q78');
  assert.equal(list[34].id, 'Q112');
  // Aucune n'est marquée individuellement : la section entière est prioritaire.
  assert.equal(list.filter((q) => q.priority).length, 0);
});

test('les questions à choix ont des options, les autres n’en ont pas', () => {
  for (const question of questions) {
    if (question.type === 'choice' || question.type === 'multi') {
      assert.ok(question.options && question.options.length >= 2, `${question.id} sans options`);
    } else {
      assert.equal(question.options, undefined, `${question.id} ne devrait pas avoir d'options`);
    }
  }
});

test('les huit questions à cases à cocher du document sont bien typées', () => {
  const attendu = ['Q4', 'Q7', 'Q8', 'Q9', 'Q10', 'Q13', 'Q32', 'Q36'];
  const obtenu = questions.filter((q) => q.type === 'choice' || q.type === 'multi').map((q) => q.id);
  assert.deepEqual(obtenu, attendu);

  for (const id of attendu) {
    const question = questionById(id);
    assert.ok(question, `${id} introuvable`);
    assert.ok(question.options!.length >= 3, `${id} : trop peu d'options`);
  }
});

test('les intitulés ne sont ni vides ni tronqués', () => {
  for (const question of questions) {
    assert.ok(question.label.trim().length > 10, `${question.id} : intitulé trop court`);
    assert.ok(!question.label.includes('PRIORITAIRE'), `${question.id} : marqueur resté dans l'intitulé`);
  }
});

test('les textes d’aide ne contiennent pas de résidu de mise en forme', () => {
  for (const question of questions) {
    if (!question.help) continue;
    assert.ok(!question.help.includes('☐'), `${question.id} : case à cocher dans l'aide`);
    assert.ok(!question.help.includes('●'), `${question.id} : puce dans l'aide`);
  }
});
