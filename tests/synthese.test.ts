import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSynthese, hasAnyValue } from '../lib/synthese';
import { establishments } from '../data/establishments';
import { gridColumns, releveColumns, allowedValues, gridColumnByKey } from '../data/grid-columns';
import { typeEffectif, visiteEffective } from '../lib/synthese';
import { typeLabels } from '../data/establishments';

test('les 50 établissements de l’échantillonnage sont présents, numérotés de 1 à 50', () => {
  assert.equal(establishments.length, 50);
  assert.deepEqual(
    establishments.map((e) => e.num),
    Array.from({ length: 50 }, (_, i) => i + 1),
  );
  assert.equal(new Set(establishments.map((e) => e.nom)).size, 50);
});

test('sept établissements restent à visiter, tous aux Almadies', () => {
  // `Questionnaire_missions_SOBOA.docx` les nomme un par un.
  const restants = establishments.filter((e) => !e.visite);
  assert.equal(restants.length, 7);
  assert.deepEqual(
    restants.map((e) => e.nom),
    ['Bahia Beach Club', 'Le Carré', "Jardin d'Orient", 'Le Cabanon', 'Chez Katia', 'Jet Café', 'Basilic'],
  );
  assert.ok(restants.every((e) => e.zone === 'Almadies'));
});

test('la typologie est celle que le questionnaire tient pour acquise', () => {
  // Q4 : « trente-neuf restaurants, huit hôtels et trois pubs ».
  const compte = (t: string) => establishments.filter((e) => e.type === t).length;
  assert.equal(compte('R'), 39);
  assert.equal(compte('H'), 8);
  assert.equal(compte('Pub'), 3);
});

test('les Almadies comptent 14 établissements, dont 7 visités', () => {
  const almadies = establishments.filter((e) => e.zone === 'Almadies');
  assert.equal(almadies.length, 14);
  assert.equal(almadies.filter((e) => e.visite).length, 7);
});

test('plus aucun établissement n’est en attente de localisation', () => {
  assert.equal(establishments.filter((e) => e.zone === 'À localiser').length, 0);
  assert.equal(establishments.filter((e) => e.zone === 'Mermoz').length, 2);
});

test('l’échantillonnage fait foi sur les zones : quatre établissements passent en Corniche Ouest', () => {
  // Azalaï, Terrou Bi, le Noom et Ayoka étaient rangés en « Ville ».
  const ouest = establishments.filter((e) => e.zone === 'Corniche Ouest').map((e) => e.nom);
  assert.deepEqual(ouest, ['Azalaï', 'Terrou Bi', 'Noom Hôtel', 'Ayoka (Noom Hôtel)', 'Relais']);
});

test('Lagon 2 est conservé bien qu’absent de l’échantillonnage', () => {
  // Le questionnaire le cite parmi les meilleurs points de vente (rappel du constat, section gamme).
  const lagon2 = establishments.find((e) => e.nom === 'Lagon 2');
  assert.ok(lagon2);
  assert.equal(lagon2.zone, 'Corniche Est');
});

test('L’Hibiscus, cité par le questionnaire, entre enfin dans le périmètre', () => {
  const hibiscus = establishments.find((e) => e.nom === "L'Hibiscus");
  assert.ok(hibiscus);
  assert.equal(hibiscus.zone, 'Point E');
});

test('synthèse vide : aucun équipement, couverture des visites inchangée', () => {
  const s = computeSynthese({});
  assert.equal(s.totalEtablissements, 50);
  assert.equal(s.visites, 43);
  assert.equal(s.restants, 7);
  assert.equal(s.tauxCouverture, 86);
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
  assert.equal(enseigne.partSurTotal, 4); // 2/50
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
  assert.equal(total, 50);
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
  assert.equal(gridColumns.length, 15);
  assert.equal(releveColumns.length, 13, '13 colonnes relevées, plus Type et Visité');
  assert.deepEqual(allowedValues(gridColumnByKey('enseigne')!), ['O', 'N']);
  assert.deepEqual(allowedValues(gridColumnByKey('note')!), ['0', '1', '2', '3', '4', '5']);
  assert.equal(allowedValues(gridColumnByKey('commentaire')!), null);
  // « Non visité » a disparu de la liste déroulante : les 50 sont visités.
  assert.deepEqual(allowedValues(gridColumnByKey('fiabilite')!), [
    'Souvenir précis',
    'Estimation',
    'À vérifier sur place',
  ]);
});

test('type et visite : la correction saisie prend le dessus sur le défaut', () => {
  const bahia = establishments.find((e) => e.nom === 'Bahia Beach Club')!;
  assert.equal(bahia.visite, false);

  // Sans correction, on retombe sur la valeur portée par le code.
  assert.equal(typeEffectif(bahia, undefined), typeLabels[bahia.type]);
  assert.equal(visiteEffective(bahia, undefined), false);
  assert.equal(visiteEffective(bahia, {}), false);

  // Avec correction, c'est elle qui vaut.
  assert.equal(typeEffectif(bahia, { type: 'Pub / Bar' }), 'Pub / Bar');
  assert.equal(visiteEffective(bahia, { visite: 'Oui' }), true);

  // Une case vide n'est pas un « non » : c'est l'absence de correction.
  assert.equal(visiteEffective(bahia, { visite: '   ' }), false);
  const viking = establishments.find((e) => e.nom === 'Le Viking')!;
  assert.equal(visiteEffective(viking, { visite: '' }), true);
  assert.equal(visiteEffective(viking, { visite: 'Non' }), false);
});

test('corriger une typologie ne fait pas passer la ligne pour relevée', () => {
  // Sans cette exclusion, pré-remplir Type ferait basculer les 50 lignes en « renseignées ».
  assert.equal(hasAnyValue({ type: 'Hôtel' }), false);
  assert.equal(hasAnyValue({ visite: 'Oui' }), false);
  assert.equal(hasAnyValue({ type: 'Hôtel', visite: 'Oui' }), false);
  assert.equal(hasAnyValue({ type: 'Hôtel', enseigne: 'O' }), true);

  const s = computeSynthese({ 1: { type: 'Hôtel', visite: 'Oui' }, 2: { enseigne: 'O' } });
  assert.equal(s.lignesRenseignees, 1);
});

test('cocher une visite fait monter la couverture', () => {
  const s = computeSynthese({ 30: { visite: 'Oui' } });
  assert.equal(s.visites, 44);
  assert.equal(s.restants, 6);
  assert.equal(s.tauxCouverture, 88);
});
