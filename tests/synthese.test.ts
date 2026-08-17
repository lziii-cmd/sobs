import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSynthese, hasAnyValue } from '../lib/synthese';
import { establishments } from '../data/establishments';
import { gridColumns, allowedValues, gridColumnByKey } from '../data/grid-columns';

test('les 35 établissements du fichier Excel sont présents, numérotés de 1 à 35', () => {
  assert.equal(establishments.length, 35);
  assert.deepEqual(
    establishments.map((e) => e.num),
    Array.from({ length: 35 }, (_, i) => i + 1),
  );
});

test('24 établissements sont marqués comme visités, 11 restent à faire', () => {
  assert.equal(establishments.filter((e) => e.visite).length, 24);
  assert.equal(establishments.filter((e) => !e.visite).length, 11);
});

test('les Almadies comptent 5 établissements, tous non visités', () => {
  const almadies = establishments.filter((e) => e.zone === 'Almadies');
  assert.equal(almadies.length, 5);
  assert.equal(almadies.filter((e) => e.visite).length, 0);
});

test('synthèse vide : aucun équipement, couverture des visites inchangée', () => {
  const s = computeSynthese({});
  assert.equal(s.totalEtablissements, 35);
  assert.equal(s.visites, 24);
  assert.equal(s.restants, 11);
  assert.equal(s.tauxCouverture, 69);
  assert.equal(s.lignesRenseignees, 0);
  for (const eq of s.equipements) {
    assert.equal(eq.oui, 0);
    assert.equal(eq.renseignes, 0);
  }
  assert.equal(s.moyenneReferences, null);
  assert.equal(s.noteMoyenne, null);
});

test('les « O » sont comptés, les « N » comptent comme renseignés mais pas comme équipés', () => {
  const s = computeSynthese({
    1: { enseigne: 'O', froid: 'N' },
    2: { enseigne: 'O' },
    3: { enseigne: 'N' },
  });
  const enseigne = s.equipements.find((e) => e.key === 'enseigne')!;
  assert.equal(enseigne.oui, 2);
  assert.equal(enseigne.renseignes, 3);
  assert.equal(enseigne.partSurTotal, 6); // 2/35
  assert.equal(s.lignesRenseignees, 3);
});

test('un établissement sans aucun support est repéré, un établissement partiel ne l’est pas', () => {
  const s = computeSynthese({
    1: { enseigne: 'N', mobilier: 'N', froid: 'N', plv: 'N' },
    2: { enseigne: 'N', mobilier: 'N', froid: 'O', plv: 'N' },
    3: { enseigne: 'N' },
  });
  assert.equal(s.sansAucunSupport, 1);
});

test('moyennes et totaux : les cases vides ou illisibles sont ignorées', () => {
  const s = computeSynthese({
    1: { nbRefs: '10', volume: '18', note: '4' },
    2: { nbRefs: '4', volume: '', note: '2' },
    3: { nbRefs: 'je ne sais pas', volume: '6' },
    4: { nbRefs: '1,5' },
  });
  assert.equal(s.moyenneReferences, 5.2); // (10 + 4 + 1.5) / 3
  assert.equal(s.volumeTotal, 24);
  assert.equal(s.noteMoyenne, 3);
});

test('la couverture par zone additionne bien les établissements', () => {
  const s = computeSynthese({});
  const total = s.zones.reduce((sum, z) => sum + z.identifies, 0);
  assert.equal(total, 35);
  const almadies = s.zones.find((z) => z.zone === 'Almadies')!;
  assert.equal(almadies.visites, 0);
});

test('hasAnyValue ignore les chaînes blanches', () => {
  assert.equal(hasAnyValue(undefined), false);
  assert.equal(hasAnyValue({}), false);
  assert.equal(hasAnyValue({ a: '  ' }), false);
  assert.equal(hasAnyValue({ a: 'O' }), true);
});

test('les colonnes de la grille reprennent les listes de valeurs du fichier Excel', () => {
  assert.equal(gridColumns.length, 13);
  assert.deepEqual(allowedValues(gridColumnByKey('enseigne')!), ['O', 'N']);
  assert.deepEqual(allowedValues(gridColumnByKey('note')!), ['0', '1', '2', '3', '4', '5']);
  assert.equal(allowedValues(gridColumnByKey('commentaire')!), null);
  assert.deepEqual(allowedValues(gridColumnByKey('fiabilite')!), [
    'Souvenir précis',
    'Estimation',
    'À vérifier sur place',
    'Non visité',
  ]);
});
