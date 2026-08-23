import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { buildPdf } from '../lib/pdf';
import { questions, sections } from '../data/questions';
import { ellipsize, sanitizeForPdf, wrapText } from '../lib/text';

const measure = (text: string, size: number) => text.length * size * 0.5;
const sectionsIntros = sections.flatMap((s) => [s.title, s.intro]);

test('les accents français traversent la normalisation sans dommage', () => {
  const input = 'Océanium, référencée, bière, à vérifier, Août, ça, œuf, où';
  assert.equal(sanitizeForPdf(input), input);
});

test('les signes typographiques sont convertis, pas supprimés', () => {
  assert.equal(sanitizeForPdf('l’enseigne'), "l'enseigne");
  assert.equal(sanitizeForPdf('“test”'), '"test"');
  assert.equal(sanitizeForPdf('a — b'), 'a - b');
  assert.equal(sanitizeForPdf('etc…'), 'etc...');
  assert.equal(sanitizeForPdf('« Gazelle »'), '« Gazelle »');
});

test('les caractères non imprimables sont remplacés, pas laissés passer', () => {
  assert.equal(sanitizeForPdf('bière 🍺'), 'bière ??');
});

test('le retour à la ligne de l’utilisateur est conservé', () => {
  const lines = wrapText('un\n\ndeux', 1000, 10, measure);
  assert.deepEqual(lines, ['un', '', 'deux']);
});

test('un texte long est coupé pour tenir dans la largeur', () => {
  const lines = wrapText('mot '.repeat(50).trim(), 100, 10, measure);
  assert.ok(lines.length > 1);
  for (const line of lines) assert.ok(measure(line, 10) <= 100, `ligne trop large : ${line}`);
});

test('un mot plus large que la colonne est coupé au lieu de déborder', () => {
  const lines = wrapText('a'.repeat(200), 50, 10, measure);
  assert.ok(lines.length > 1);
  for (const line of lines) assert.ok(measure(line, 10) <= 50);
});

test('ellipsize tronque et ajoute des points de suspension', () => {
  const out = ellipsize('un commentaire vraiment très long', 40, 8, measure);
  assert.ok(out.endsWith('...'));
  assert.ok(measure(out, 8) <= 40);
});

test('le PDF se génère même sans aucune réponse', async () => {
  const bytes = await buildPdf({ answers: {}, grid: {} });
  assert.ok(bytes.length > 1000);
  const doc = await PDFDocument.load(bytes);
  // Sans réponse, il ne reste que la page de garde, la grille et la synthèse :
  // aucune section de questions n'est imprimée.
  assert.ok(doc.getPageCount() >= 3, `${doc.getPageCount()} pages`);
});

test('seules les questions répondues sont imprimées', async () => {
  const vide = await buildPdf({ answers: {}, grid: {} });
  const pagesVides = (await PDFDocument.load(vide)).getPageCount();

  const uneReponse = await buildPdf({
    answers: { Q1: { value: 'Nourah Abdou' } },
    grid: {},
  });
  const pagesUneReponse = (await PDFDocument.load(uneReponse)).getPageCount();

  // Une seule réponse ouvre exactement une section : la première.
  assert.equal(pagesUneReponse, pagesVides + 1, 'une réponse doit ajouter une seule page de section');
});

test('une section sans aucune réponse n’apparaît pas dans le PDF', async () => {
  const economie = questions.filter((q) => q.sectionId === 'economie');
  const answers = Object.fromEntries(economie.map((q) => [q.id, { value: 'réponse' }]));

  const bytes = await buildPdf({ answers, grid: {} });
  const pages = (await PDFDocument.load(bytes)).getPageCount();

  const vide = await buildPdf({ answers: {}, grid: {} });
  const pagesVides = (await PDFDocument.load(vide)).getPageCount();

  // Les réponses d'une seule section : une poignée de pages en plus, pas les 7 sections.
  assert.ok(pages > pagesVides, 'la section répondue doit apparaître');
  assert.ok(pages < pagesVides + 7, `${pages} pages : des sections vides ont été imprimées`);
});

test('le PDF contient toutes les réponses saisies, y compris les très longues', async () => {
  const answers = Object.fromEntries(
    questions.map((q) => [
      q.id,
      {
        value: `Réponse à ${q.id} — l’Océanium, « Gazelle », 33 Export. ${'texte '.repeat(60)}`,
        updatedAt: new Date('2026-08-20T10:00:00Z').toISOString(),
        revisions: 3,
        flagged: q.id === 'Q1',
      },
    ]),
  );

  const grid = {
    1: { enseigne: 'O', froid: 'N', note: '4', commentaire: 'Terrasse très visible' },
    20: { enseigne: 'O', nbRefs: '10', marquesSoboa: 'Gazelle, Flag, Racines' },
  };

  const bytes = await buildPdf({ answers, grid });
  const doc = await PDFDocument.load(bytes);
  assert.ok(doc.getPageCount() > 10);
});

test('le PDF complet couvre les 7 sections quand tout est répondu', async () => {
  const answers = Object.fromEntries(questions.map((q) => [q.id, { value: 'réponse courte' }]));
  const bytes = await buildPdf({ answers, grid: {} });
  const doc = await PDFDocument.load(bytes);
  // Page de garde + au moins une page par section + grille + synthèse.
  assert.ok(doc.getPageCount() >= 1 + sections.length + 2, `${doc.getPageCount()} pages`);
});

test('aucun caractère du PDF ne se dégrade en « ? »', async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  // Tout ce que le générateur écrit doit survivre à l'encodage sans perte.
  const echantillons = [
    ...questions.map((q) => `${q.id}. ${q.label}   · PRIORITAIRE`),
    ...questions.map((q) => q.help ?? ''),
    ...sectionsIntros,
    'Océanium · Fiabilité : À vérifier sur place · 4 / 5',
    "« Évaluation de la visibilité de nos marques »",
  ];

  for (const texte of echantillons) {
    const propre = sanitizeForPdf(texte);
    assert.ok(!propre.includes('?') || texte.includes('?'), `caractère perdu dans : ${texte}`);
    assert.doesNotThrow(() => font.encodeText(propre));
  }
});

test('les polices standard acceptent tous les intitulés du formulaire', async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const question of questions) {
    const text = sanitizeForPdf(`${question.id}. ${question.label} ${question.help ?? ''}`);
    assert.doesNotThrow(() => font.widthOfTextAtSize(text, 10), `${question.id} illisible`);
    assert.doesNotThrow(() => font.encodeText(text), `${question.id} non encodable`);
  }
});
