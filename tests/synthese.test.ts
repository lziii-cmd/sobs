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

test('la nouvelle grille marque les 35 établissements comme visités', () => {
  assert.equal(establishments.filter((e) => e.visite).length, 35);
  assert.equal(establishments.filter((e) => !e.visite).length, 0);
});

test('les Almadies comptent 7 établissements, désormais tous visités', () => {
  // Le questionnaire d'étude localise Chez Fatou et L'Adresse aux Almadies.
  const almadies = establishments.filter((e) => e.zone === 'Almadies');
  assert.equal(almadies.length, 7);
  assert.equal(almadies.filter((e) => e.visite).length, 7);
});

test('plus aucun établissement n’est en attente de localisation', () => {
  assert.equal(establishments.filter((e) => e.zone === 'À localiser').length, 0);
  assert.equal(establishments.filter((e) => e.zone === 'Mermoz').length, 1);
});

test('synthèse vide : aucun équipement, couverture des visites inchangée', () => {
  const s = computeSynthese({});
  assert.equal(s.totalEtablissements, 35);
  assert.equal(s.visites, 35);
  assert.equal(s.restants, 0);
  assert.equal(s.tauxCouverture, 100);
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
  assert.equal(almadies.visites, 7);
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
  // « Non visité » a disparu de la liste déroulante : les 35 sont visités.
  assert.deepEqual(allowedValues(gridColumnByKey('fiabilite')!), [
    'Souvenir précis',
    'Estimation',
    'À vérifier sur place',
  ]);
});
