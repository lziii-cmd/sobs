import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { questions, sections } from '../data/questions';
import { establishments, typeLabels } from '../data/establishments';
import { gridColumns } from '../data/grid-columns';
import { computeSynthese, type GridData } from './synthese';
import { globalProgress, type AnswerMap } from './progress';
import { ellipsize, formatDateFr, sanitizeForPdf, wrapText } from './text';

export type PdfAnswer = {
  value: string;
  updatedAt?: string | Date | null;
  flagged?: boolean;
  revisions?: number;
};

export type PdfInput = {
  answers: Record<string, PdfAnswer>;
  grid: GridData;
  generatedAt?: Date;
};

const A4: [number, number] = [595.28, 841.89];
const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
const MARGIN = 50;

const INK = rgb(0.1, 0.1, 0.12);
const GREY = rgb(0.45, 0.45, 0.48);
const GREEN = rgb(0.12, 0.43, 0.24);
const LIGHT = rgb(0.88, 0.9, 0.89);

class Doc {
  pdf!: PDFDocument;
  regular!: PDFFont;
  bold!: PDFFont;
  oblique!: PDFFont;
  page!: PDFPage;
  y = 0;
  landscape = false;

  static async create(): Promise<Doc> {
    const doc = new Doc();
    doc.pdf = await PDFDocument.create();
    doc.regular = await doc.pdf.embedFont(StandardFonts.Helvetica);
    doc.bold = await doc.pdf.embedFont(StandardFonts.HelveticaBold);
    doc.oblique = await doc.pdf.embedFont(StandardFonts.HelveticaOblique);
    doc.addPage();
    return doc;
  }

  addPage(landscape = false): void {
    this.landscape = landscape;
    this.page = this.pdf.addPage(landscape ? A4_LANDSCAPE : A4);
    this.y = this.page.getHeight() - MARGIN;
  }

  get width(): number {
    return this.page.getWidth() - MARGIN * 2;
  }

  ensure(space: number): void {
    if (this.y - space < MARGIN + 24) this.addPage(this.landscape);
  }

  gap(amount: number): void {
    this.y -= amount;
  }

  /** Écrit un bloc de texte à la position courante et renvoie la hauteur consommée. */
  write(
    text: string,
    opts: {
      size?: number;
      font?: 'regular' | 'bold' | 'oblique';
      color?: ReturnType<typeof rgb>;
      indent?: number;
      lineHeight?: number;
      width?: number;
    } = {},
  ): void {
    const size = opts.size ?? 10;
    const font = this[opts.font ?? 'regular'];
    const color = opts.color ?? INK;
    const indent = opts.indent ?? 0;
    const lineHeight = opts.lineHeight ?? size * 1.35;
    const width = (opts.width ?? this.width) - indent;

    const lines = wrapText(text, width, size, (t, s) => font.widthOfTextAtSize(t, s));
    for (const line of lines) {
      this.ensure(lineHeight);
      this.page.drawText(line, {
        x: MARGIN + indent,
        y: this.y - size,
        size,
        font,
        color,
      });
      this.y -= lineHeight;
    }
  }

  rule(color = LIGHT): void {
    this.ensure(8);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: MARGIN + this.width, y: this.y },
      thickness: 0.7,
      color,
    });
    this.y -= 8;
  }

  cell(text: string, x: number, width: number, opts: { size?: number; font?: 'regular' | 'bold'; color?: ReturnType<typeof rgb> } = {}): void {
    const size = opts.size ?? 8;
    const font = this[opts.font ?? 'regular'];
    this.page.drawText(ellipsize(text, width - 4, size, (t, s) => font.widthOfTextAtSize(t, s)), {
      x,
      y: this.y - size,
      size,
      font,
      color: opts.color ?? INK,
    });
  }

  finish(): void {
    const pages = this.pdf.getPages();
    pages.forEach((page, index) => {
      const label = `${index + 1} / ${pages.length}`;
      const size = 8;
      const width = this.regular.widthOfTextAtSize(label, size);
      page.drawText(label, {
        x: page.getWidth() - MARGIN - width,
        y: MARGIN - 18,
        size,
        font: this.regular,
        color: GREY,
      });
    });
  }
}

function answerText(answer: PdfAnswer | undefined): string {
  return (answer?.value ?? '').trim();
}

export async function buildPdf(input: PdfInput): Promise<Uint8Array> {
  const generatedAt = input.generatedAt ?? new Date();
  const doc = await Doc.create();

  const answerMap: AnswerMap = Object.fromEntries(
    Object.entries(input.answers).map(([id, a]) => [id, { value: a.value, flagged: a.flagged }]),
  );
  const progress = globalProgress(answerMap);

  // ------------------------------------------------------------- page de garde
  doc.gap(120);
  doc.write('SOBOA — Rapport de stage', { size: 24, font: 'bold' });
  doc.gap(6);
  doc.write('Formulaire de collecte — réponses', { size: 16, color: GREEN });
  doc.gap(18);
  doc.write(
    "« Évaluation de la visibilité de nos marques et identification des leviers de croissance dans le circuit CHR de Dakar »",
    { size: 11, font: 'oblique', color: GREY },
  );
  doc.gap(28);
  doc.rule();
  doc.gap(6);
  doc.write(`Export du ${formatDateFr(generatedAt)}`, { size: 10, color: GREY });
  doc.gap(10);
  doc.write(
    `${progress.answered} réponses sur ${progress.total} (${progress.percent} %) — dont ${progress.priorityAnswered} des ${progress.priorityTotal} questions prioritaires (${progress.priorityPercent} %).`,
    { size: 10 },
  );
  if (progress.flagged > 0) {
    doc.gap(4);
    doc.write(`${progress.flagged} question(s) marquée(s) « à revenir dessus ».`, {
      size: 10,
      color: GREY,
    });
  }

  // ----------------------------------------------------------------- réponses
  for (const section of sections) {
    doc.addPage();
    doc.write(`${section.number}  ${section.title}`, { size: 16, font: 'bold', color: GREEN });
    doc.gap(4);
    doc.write(section.intro, { size: 9, font: 'oblique', color: GREY });
    doc.gap(10);
    doc.rule();
    doc.gap(6);

    let currentGroup: string | undefined;
    for (const question of questions.filter((q) => q.sectionId === section.id)) {
      if (question.group && question.group !== currentGroup) {
        currentGroup = question.group;
        doc.ensure(40);
        doc.gap(6);
        doc.write(currentGroup, { size: 11, font: 'bold' });
        doc.gap(4);
      }

      const answer = input.answers[question.id];
      const value = answerText(answer);

      doc.ensure(46);
      // Le rond plein « ● » du document source n'existe pas dans les polices
      // standard du PDF : on garde un marqueur équivalent et lisible.
      doc.write(`${question.id}. ${question.label}${question.priority ? '   · PRIORITAIRE' : ''}`, {
        size: 10,
        font: 'bold',
      });
      doc.gap(2);

      if (value === '') {
        doc.write('Sans réponse', { size: 10, font: 'oblique', color: GREY, indent: 14 });
      } else {
        doc.write(value, { size: 10, indent: 14 });
        const meta: string[] = [];
        if (answer?.updatedAt) meta.push(`mise à jour le ${formatDateFr(answer.updatedAt)}`);
        if (answer?.revisions && answer.revisions > 1) meta.push(`${answer.revisions} versions`);
        if (answer?.flagged) meta.push('à revenir dessus');
        if (meta.length) {
          doc.gap(1);
          doc.write(meta.join(' · '), { size: 7.5, color: GREY, indent: 14 });
        }
      }
      doc.gap(9);
    }
  }

  // -------------------------------------------------------------- grille CHR
  drawGrid(doc, input.grid);

  // ---------------------------------------------------------------- synthèse
  drawSynthese(doc, input.grid);

  doc.finish();
  return doc.pdf.save();
}

function drawGrid(doc: Doc, grid: GridData): void {
  doc.addPage(true);
  doc.write('Grille de relevé — circuit CHR de Dakar', { size: 16, font: 'bold', color: GREEN });
  doc.gap(4);
  doc.write('Une ligne par établissement. O = présent, N = absent, vide = non renseigné.', {
    size: 9,
    font: 'oblique',
    color: GREY,
  });
  doc.gap(12);

  const compact = gridColumns.filter((c) => c.type !== 'text');
  const columns = [
    { key: '__num', label: 'N°', width: 24 },
    { key: '__nom', label: 'Établissement', width: 170 },
    { key: '__type', label: 'Type', width: 34 },
    { key: '__zone', label: 'Zone', width: 74 },
    { key: '__visite', label: 'Visité', width: 34 },
    ...compact.map((c) => ({ key: c.key, label: c.short, width: c.key === 'fiabilite' ? 82 : 46 })),
  ];

  const drawHeader = () => {
    let x = MARGIN;
    for (const col of columns) {
      doc.cell(col.label, x, col.width, { font: 'bold', size: 7.5 });
      x += col.width;
    }
    doc.y -= 12;
    doc.rule();
  };

  drawHeader();

  for (const e of establishments) {
    if (doc.y - 14 < MARGIN + 24) {
      doc.addPage(true);
      drawHeader();
    }
    const row = grid[e.num] ?? {};
    const values: Record<string, string> = {
      __num: String(e.num),
      __nom: e.nom,
      __type: e.type,
      __zone: e.zone,
      __visite: e.visite ? 'Oui' : 'Non',
      ...row,
    };
    let x = MARGIN;
    for (const col of columns) {
      doc.cell(values[col.key] ?? '', x, col.width, { size: 7.5 });
      x += col.width;
    }
    doc.y -= 13;
  }

  // Colonnes de texte libre, listées à part pour rester lisibles.
  const textColumns = gridColumns.filter((c) => c.type === 'text');
  const withText = establishments.filter((e) =>
    textColumns.some((c) => (grid[e.num]?.[c.key] ?? '').trim() !== ''),
  );

  if (withText.length > 0) {
    doc.addPage();
    doc.write('Grille de relevé — commentaires et marques', { size: 16, font: 'bold', color: GREEN });
    doc.gap(12);
    for (const e of withText) {
      doc.ensure(50);
      doc.write(`${e.num}. ${e.nom} — ${typeLabels[e.type]}, ${e.zone}`, { size: 10, font: 'bold' });
      for (const col of textColumns) {
        const value = (grid[e.num]?.[col.key] ?? '').trim();
        if (value === '') continue;
        doc.write(`${col.label} : ${value}`, { size: 9, indent: 14 });
      }
      doc.gap(8);
    }
  }
}

function drawSynthese(doc: Doc, grid: GridData): void {
  const s = computeSynthese(grid);
  doc.addPage();
  doc.write('Synthèse', { size: 16, font: 'bold', color: GREEN });
  doc.gap(4);
  doc.write('Calculée à partir de la grille de relevé.', { size: 9, font: 'oblique', color: GREY });
  doc.gap(14);

  doc.write("Taux d'équipement", { size: 12, font: 'bold' });
  doc.gap(6);
  for (const eq of s.equipements) {
    doc.write(
      `${eq.label} : ${eq.oui} établissement(s) sur ${s.totalEtablissements} (${eq.partSurTotal} %) — ${eq.renseignes} ligne(s) renseignée(s).`,
      { size: 10, indent: 10 },
    );
  }

  doc.gap(14);
  doc.write('Couverture des visites', { size: 12, font: 'bold' });
  doc.gap(6);
  doc.write(`Établissements identifiés : ${s.totalEtablissements}`, { size: 10, indent: 10 });
  doc.write(`Établissements visités : ${s.visites} (${s.tauxCouverture} %)`, { size: 10, indent: 10 });
  doc.write(`Restant à visiter : ${s.restants}`, { size: 10, indent: 10 });
  doc.write(`Lignes de grille renseignées : ${s.lignesRenseignees}`, { size: 10, indent: 10 });

  doc.gap(14);
  doc.write('Couverture par zone', { size: 12, font: 'bold' });
  doc.gap(6);
  for (const zone of s.zones) {
    doc.write(
      `${zone.zone} : ${zone.visites} visité(s) sur ${zone.identifies} identifié(s)${
        zone.identifies > 0 && zone.visites === 0 ? ' — zone non couverte' : ''
      }`,
      { size: 10, indent: 10 },
    );
  }

  doc.gap(14);
  doc.write('Indicateurs clés', { size: 12, font: 'bold' });
  doc.gap(6);
  doc.write(
    `Nombre moyen de références SOBOA : ${s.moyenneReferences ?? '—'}`,
    { size: 10, indent: 10 },
  );
  doc.write(`Volume total estimé : ${s.volumeTotal} fûts/mois`, { size: 10, indent: 10 });
  doc.write(`Note de visibilité moyenne : ${s.noteMoyenne ?? '—'} / 5`, { size: 10, indent: 10 });
  doc.write(`Établissements sans aucun support : ${s.sansAucunSupport}`, { size: 10, indent: 10 });

  doc.gap(16);
  doc.write(
    sanitizeForPdf(
      "Rappel : ces chiffres ne valent que ce que vaut la saisie. La colonne Fiabilité de la grille distingue souvenir, estimation et donnée vérifiée.",
    ),
    { size: 9, font: 'oblique', color: GREY },
  );
}
