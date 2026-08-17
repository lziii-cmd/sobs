import { test } from 'node:test';
import assert from 'node:assert/strict';
import { questions, sections, questionById } from '../data/questions';

test('le formulaire contient bien les 85 questions du document source', () => {
  assert.equal(questions.length, 85);
});

test('les identifiants vont de Q1 à Q85, sans trou ni doublon', () => {
  const ids = questions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, 'identifiants en double');
  for (let n = 1; n <= 85; n += 1) {
    assert.ok(ids.includes(`Q${n}`), `Q${n} manquante`);
  }
});

test("l'ordre des questions suit celui du document", () => {
  const numbers = questions.map((q) => Number(q.id.slice(1)));
  const sorted = [...numbers].sort((a, b) => a - b);
  assert.deepEqual(numbers, sorted);
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

test('les questions à choix ont des options, les autres n’en ont pas', () => {
  for (const question of questions) {
    if (question.type === 'choice' || question.type === 'multi') {
      assert.ok(question.options && question.options.length >= 2, `${question.id} sans options`);
    } else {
      assert.equal(question.options, undefined, `${question.id} ne devrait pas avoir d'options`);
    }
  }
});

test('les cinq questions à cases à cocher du document sont bien typées', () => {
  for (const id of ['Q5', 'Q6', 'Q19', 'Q22', 'Q53']) {
    const question = questionById(id);
    assert.ok(question, `${id} introuvable`);
    assert.ok(
      question.type === 'choice' || question.type === 'multi',
      `${id} devrait être une question à choix`,
    );
  }
});

test('les intitulés ne sont ni vides ni tronqués', () => {
  for (const question of questions) {
    assert.ok(question.label.trim().length > 10, `${question.id} : intitulé trop court`);
  }
});

test('les questions prioritaires sont exactement celles marquées ● PRIORITAIRE dans le document', () => {
  // Liste extraite du .docx source : 56 marqueurs.
  const attendu = [
    'Q1', 'Q2', 'Q3', 'Q5', 'Q6', 'Q8', 'Q9', 'Q10', 'Q14', 'Q15', 'Q17', 'Q19',
    'Q20', 'Q21', 'Q22', 'Q25', 'Q26', 'Q28', 'Q30', 'Q31', 'Q32', 'Q33', 'Q34',
    'Q35', 'Q36', 'Q37', 'Q39', 'Q40', 'Q42', 'Q43', 'Q44', 'Q45', 'Q48', 'Q51',
    'Q52', 'Q53', 'Q54', 'Q55', 'Q57', 'Q58', 'Q61', 'Q62', 'Q63', 'Q64', 'Q65',
    'Q67', 'Q68', 'Q69', 'Q70', 'Q72', 'Q73', 'Q74', 'Q77', 'Q78', 'Q79', 'Q82',
  ];

  const obtenu = questions.filter((q) => q.priority).map((q) => q.id);
  assert.deepEqual(obtenu, attendu);
  assert.equal(obtenu.length, 56);
});
