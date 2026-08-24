import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateRawSync } from 'zlib';
import { buildGrilleXlsx, columnLetter } from '../lib/xlsx';
import { createZip } from '../lib/zip';
import { establishments } from '../data/establishments';
import { gridColumns } from '../data/grid-columns';

/**
 * Relit une archive produite par `createZip`, en repartant du répertoire central
 * comme le ferait Excel. Si cette lecture échoue, le fichier ne s'ouvrira pas.
 */
function readZip(buffer: Buffer): Map<string, string> {
  const out = new Map<string, string>();

  // Fin du répertoire central : signature 0x06054b50, cherchée depuis la fin.
  let eocd = buffer.length - 22;
  while (eocd >= 0 && buffer.readUInt32LE(eocd) !== 0x06054b50) eocd -= 1;
  assert.ok(eocd >= 0, 'fin de répertoire central introuvable');

  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);

  for (let i = 0; i < count; i += 1) {
    assert.equal(buffer.readUInt32LE(offset), 0x02014b50, `entrée ${i} : signature centrale`);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf-8');

    assert.equal(buffer.readUInt32LE(localOffset), 0x04034b50, `${name} : signature locale`);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const deflated = buffer.subarray(dataStart, dataStart + compressedSize);

    out.set(name, inflateRawSync(deflated).toString('utf-8'));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return out;
}

test('createZip produit une archive relisible, contenu intact', () => {
  const zip = readZip(createZip([
    { name: 'a.txt', content: 'bonjour' },
    { name: 'dossier/b.xml', content: '<x>é à ü</x>' },
  ]));
  assert.deepEqual([...zip.keys()], ['a.txt', 'dossier/b.xml']);
  assert.equal(zip.get('a.txt'), 'bonjour');
  assert.equal(zip.get('dossier/b.xml'), '<x>é à ü</x>');
});

test('columnLetter suit la numérotation des colonnes Excel', () => {
  assert.equal(columnLetter(0), 'A');
  assert.equal(columnLetter(25), 'Z');
  assert.equal(columnLetter(26), 'AA');
  assert.equal(columnLetter(27), 'AB');
});

test('le classeur contient les pièces qu’Excel exige, et rien d’orphelin', () => {
  const zip = readZip(buildGrilleXlsx({}));
  for (const piece of [
    '[Content_Types].xml',
    '_rels/.rels',
    'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels',
    'xl/styles.xml',
    'xl/worksheets/sheet1.xml',
    'xl/worksheets/sheet2.xml',
    'xl/worksheets/sheet3.xml',
  ]) {
    assert.ok(zip.has(piece), `pièce manquante : ${piece}`);
  }

  // Toute feuille déclarée doit être décrite dans [Content_Types].xml, sinon Excel refuse.
  const types = zip.get('[Content_Types].xml')!;
  for (const n of [1, 2, 3]) {
    assert.ok(types.includes(`/xl/worksheets/sheet${n}.xml`), `sheet${n} absente des content-types`);
  }

  // Toute relation doit pointer sur une pièce réellement présente.
  const rels = zip.get('xl/_rels/workbook.xml.rels')!;
  for (const cible of [...rels.matchAll(/Target="([^"]+)"/g)].map((m) => m[1])) {
    assert.ok(zip.has(`xl/${cible}`), `relation orpheline : ${cible}`);
  }
});

test('les trois onglets sont nommés comme dans le fichier Excel d’origine', () => {
  const workbook = readZip(buildGrilleXlsx({})).get('xl/workbook.xml')!;
  assert.ok(workbook.includes('name="Mode d&apos;emploi"') || workbook.includes("name=\"Mode d'emploi\""));
  assert.ok(workbook.includes('name="Grille"'));
  assert.ok(workbook.includes('name="Synthèse"'));
});

test('l’onglet Grille porte une ligne par établissement, plus l’en-tête', () => {
  const sheet = readZip(buildGrilleXlsx({})).get('xl/worksheets/sheet2.xml')!;
  const lignes = [...sheet.matchAll(/<row r="(\d+)"/g)].map((m) => Number(m[1]));
  assert.equal(lignes.length, establishments.length + 1);
  assert.deepEqual(lignes, Array.from({ length: establishments.length + 1 }, (_, i) => i + 1));
  assert.ok(sheet.includes('Pullman Teranga'), 'le premier établissement est absent');
  assert.ok(sheet.includes("L&apos;Hibiscus") || sheet.includes("L'Hibiscus"), 'le dernier est absent');
});

test('les valeurs saisies sont reprises, les nombres restent des nombres', () => {
  const sheet = readZip(buildGrilleXlsx({ 1: { enseigne: 'O', parasols: '12', commentaire: 'terrasse & bar' } }))
    .get('xl/worksheets/sheet2.xml')!;
  const ligne = sheet.match(/<row r="2">.*?<\/row>/s)![0];
  assert.ok(ligne.includes('<v>12</v>'), 'les parasols devraient être un nombre');
  assert.ok(ligne.includes('terrasse &amp; bar'), 'le commentaire devrait être échappé');
  assert.ok(!ligne.includes('terrasse & bar'), 'une esperluette nue casserait le XML');
});

test('les listes déroulantes de la grille sont reprises dans le fichier', () => {
  const sheet = readZip(buildGrilleXlsx({})).get('xl/worksheets/sheet2.xml')!;
  const attendues = gridColumns.filter((c) => c.type === 'on' || c.type === 'choice').length;
  assert.equal([...sheet.matchAll(/<dataValidation /g)].length, attendues);
  assert.ok(sheet.includes('"O,N"'), 'la liste O/N est absente');
  assert.ok(sheet.includes('Hôtel,Restaurant,Pub / Bar'), 'la liste des types est absente');
  assert.ok(sheet.includes('Oui,Non'), 'la liste Visité est absente');
  // Les listes se déclarent après les données : l'ordre est imposé par le schéma.
  assert.ok(sheet.indexOf('</sheetData>') < sheet.indexOf('<dataValidations'));
});

test('la typologie et l’état de visite exportés suivent la correction saisie', () => {
  const zip = readZip(buildGrilleXlsx({ 30: { type: 'Pub / Bar', visite: 'Oui' } }));
  const grille = zip.get('xl/worksheets/sheet2.xml')!;
  // Bahia Beach Club porte le n° 30 : ligne 31 de l'onglet, en-tête compris.
  const ligne = grille.match(/<row r="31">.*?<\/row>/s)![0];
  assert.ok(ligne.includes('Bahia Beach Club'));
  assert.ok(ligne.includes('Pub / Bar'), 'la correction de type devrait être exportée');
  assert.ok(ligne.includes('Oui'), 'la visite cochée devrait être exportée');

  // Et la synthèse doit en tenir compte : 43 visités par défaut, 44 avec cette correction.
  const synthese = zip.get('xl/worksheets/sheet3.xml')!;
  assert.ok(synthese.includes('<v>44</v>'), 'la synthèse devrait compter 44 visités');
});

test('l’onglet Synthèse reprend la couverture réelle', () => {
  const synthese = readZip(buildGrilleXlsx({})).get('xl/worksheets/sheet3.xml')!;
  assert.ok(synthese.includes('<v>50</v>'), 'total du périmètre');
  assert.ok(synthese.includes('<v>43</v>'), 'visités');
  assert.ok(synthese.includes('<v>7</v>'), 'restant à visiter');
  assert.ok(synthese.includes('<v>86</v>'), 'taux de couverture');
});
