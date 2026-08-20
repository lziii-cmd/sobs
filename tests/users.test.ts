import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPassword, checkRole, checkUsername, normaliseUsername } from '../lib/users';

test('un identifiant est normalisé en minuscules, sans espace autour', () => {
  assert.equal(normaliseUsername('  Nourah  '), 'nourah');
  assert.equal(normaliseUsername('ADMIN'), 'admin');
});

test('les identifiants valides sont acceptés', () => {
  for (const nom of ['nourah', 'el-hadji', 'admin.soboa', 'user_1', 'abc', 'a1b2c3']) {
    assert.equal(checkUsername(nom), null, `${nom} devrait être accepté`);
  }
});

test('les identifiants invalides sont refusés avec un message', () => {
  const refuses = [
    '', // vide
    'ab', // trop court
    'a'.repeat(33), // trop long
    'nourah dia', // espace
    'Nourah', // majuscule : la connexion normalise, le stockage doit rester en minuscules
    'noémie', // accent
    '-nourah', // ne commence pas par une lettre ou un chiffre
    'nourah@soboa', // caractère interdit
  ];

  for (const nom of refuses) {
    const erreur = checkUsername(nom);
    assert.ok(erreur, `${nom || '(vide)'} aurait dû être refusé`);
    assert.ok(erreur.length > 10, 'le message doit expliquer ce qui ne va pas');
  }
});

test('le mot de passe fait au moins 8 caractères', () => {
  assert.ok(checkPassword(''));
  assert.ok(checkPassword('court'));
  assert.ok(checkPassword('1234567'));
  assert.equal(checkPassword('12345678'), null);
  assert.equal(checkPassword('un mot de passe correct'), null);
});

test('un mot de passe démesuré est refusé', () => {
  assert.ok(checkPassword('a'.repeat(201)));
  assert.equal(checkPassword('a'.repeat(200)), null);
});

test('seuls les deux rôles connus sont acceptés', () => {
  assert.equal(checkRole('admin'), true);
  assert.equal(checkRole('contributor'), true);
  assert.equal(checkRole('superadmin'), false);
  assert.equal(checkRole(''), false);
});
