import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allProgress, globalProgress, isAnswered, sectionProgress } from '../lib/progress';
import { questions } from '../data/questions';

test('une réponse vide ou blanche ne compte pas comme répondue', () => {
  assert.equal(isAnswered(undefined), false);
  assert.equal(isAnswered(''), false);
  assert.equal(isAnswered('   \n  '), false);
  assert.equal(isAnswered('non'), true);
});

test('avancement global à zéro quand rien n’est saisi', () => {
  const progress = globalProgress({});
  assert.equal(progress.answered, 0);
  assert.equal(progress.percent, 0);
  assert.equal(progress.total, 97);
});

test('avancement global à 100 % quand tout est saisi', () => {
  const answers = Object.fromEntries(questions.map((q) => [q.id, { value: 'réponse' }]));
  const progress = globalProgress(answers);
  assert.equal(progress.answered, 97);
  assert.equal(progress.percent, 100);
  assert.equal(progress.priorityAnswered, progress.priorityTotal);
});

test('les questions prioritaires sont comptées séparément', () => {
  const priority = questions.filter((q) => q.priority).slice(0, 3);
  const answers = Object.fromEntries(priority.map((q) => [q.id, { value: 'ok' }]));
  const progress = globalProgress(answers);
  assert.equal(progress.priorityAnswered, 3);
  assert.equal(progress.answered, 3);
});

test('le marquage « à revoir » est comptabilisé', () => {
  const progress = globalProgress({ Q1: { value: '', flagged: true }, Q2: { value: 'x' } });
  assert.equal(progress.flagged, 1);
});

test('l’avancement par section ne déborde pas sur les autres', () => {
  const progress = sectionProgress({ Q1: { value: 'un refus du gerant' } }, 'gamme');
  assert.equal(progress.answered, 1);
  assert.equal(progress.total, questions.filter((q) => q.sectionId === 'gamme').length);

  const autre = sectionProgress({ Q1: { value: 'un refus du gerant' } }, 'economie');
  assert.equal(autre.answered, 0);
});

test('la somme des sections égale le total global', () => {
  const sections = allProgress({});
  assert.equal(
    sections.reduce((sum, s) => sum + s.total, 0),
    97,
  );
});
