/**
 * Export de la grille de relevé au format Excel.
 *
 * Le classeur reprend la structure de `Grille_releve_CHR_SOBOA.xlsx`, le fichier
 * dont l'étude est partie : trois onglets — Mode d'emploi, Grille, Synthèse.
 * Les listes déroulantes de la grille en ligne sont reprises dans le fichier, de
 * sorte qu'il se remplit hors ligne dans les mêmes termes.
 *
 * Le format est écrit à la main par-dessus `lib/zip.ts`, sans dépendance. Voir
 * l'en-tête de ce fichier pour la justification.
 */

import { establishments } from '../data/establishments';
import { allowedValues, gridColumns } from '../data/grid-columns';
import { computeSynthese, typeEffectif, visiteEffective, type GridData } from './synthese';
import { createZip, type ZipEntry } from './zip';

const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_PKG_REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
const NS_CT = 'http://schemas.openxmlformats.org/package/2006/content-types';

/**
 * Excel rejette le fichier si une valeur contient un caractere de controle.
 * Les copier-coller depuis un traitement de texte en introduisent regulierement.
 * Tabulation, saut de ligne et retour chariot sont conserves : ils sont licites.
 */
function sansControles(v: string): string {
  let out = '';
  for (const ch of v) {
    const code = ch.charCodeAt(0);
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) continue;
    out += ch;
  }
  return out;
}

const escapeXml = (v: string): string =>
  sansControles(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** A, B, … Z, AA. Le classeur ne dépasse pas la colonne Z, mais autant être juste. */
export function columnLetter(index: number): string {
  let n = index;
  let out = '';
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

type Cell = { value: string | number; style?: number };
type Row = (Cell | null)[];

function cellXml(ref: string, cell: Cell): string {
  const style = cell.style ? ` s="${cell.style}"` : '';
  if (typeof cell.value === 'number') {
    return `<c r="${ref}"${style}><v>${cell.value}</v></c>`;
  }
  if (cell.value === '') return `<c r="${ref}"${style}/>`;
  return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell.value)}</t></is></c>`;
}

type SheetOptions = {
  rows: Row[];
  /** Largeurs en caractères, colonne par colonne. */
  widths?: number[];
  /** Fige les n premières lignes. */
  freezeRows?: number;
  validations?: { range: string; options: string[] }[];
};

function sheetXml({ rows, widths, freezeRows, validations }: SheetOptions): string {
  const cols =
    widths && widths.length
      ? `<cols>${widths
          .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
          .join('')}</cols>`
      : '';

  const views = freezeRows
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${freezeRows}" topLeftCell="A${
        freezeRows + 1
      }" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : '';

  const body = rows
    .map((row, r) => {
      const cells = row
        .map((cell, c) => (cell === null ? '' : cellXml(`${columnLetter(c)}${r + 1}`, cell)))
        .join('');
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join('');

  // Les listes déroulantes se déclarent après les données : l'ordre est imposé par le schéma.
  const dv = validations?.length
    ? `<dataValidations count="${validations.length}">${validations
        .map(
          (v) =>
            `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" sqref="${
              v.range
            }"><formula1>"${escapeXml(v.options.join(','))}"</formula1></dataValidation>`,
        )
        .join('')}</dataValidations>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${NS}">${views}<sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${body}</sheetData>${dv}</worksheet>`;
}

/* Styles : 0 normal · 1 en-tête vert · 2 titre · 3 gris · 4 gras · 5 retour à la ligne */
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${NS}"><fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="15"/><color rgb="FF17552F"/><name val="Calibri"/></font><font><sz val="10"/><color rgb="FF62655C"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F6E3C"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

const S = { normal: 0, entete: 1, titre: 2, gris: 3, gras: 4, retour: 5 } as const;

const txt = (value: string, style: number = S.normal): Cell => ({ value, style });

function modeEmploiSheet(generatedAt: Date): string {
  const prioritaires = gridColumns.filter((c) => c.priority).map((c) => c.label);
  const lignes: Row[] = [
    [txt('Grille de relevé — circuit CHR de Dakar', S.titre)],
    [txt(`SOBOA · étude sur la visibilité des marques · export du ${formatDate(generatedAt)}`, S.gris)],
    [],
    [txt('À quoi sert ce fichier', S.gras)],
    [
      txt(
        "L'onglet « Grille » reprend les cinquante établissements du périmètre et les treize colonnes du relevé. C'est le document qui débloque le plus de chapitres de l'étude : il alimente à lui seul les livrables 1, 2 et 3.",
        S.retour,
      ),
    ],
    [
      txt(
        "L'onglet « Synthèse » est recalculé à l'export. Il ne se saisit pas : il reflète l'état de la grille au moment du téléchargement.",
        S.retour,
      ),
    ],
    [],
    [txt('Les conventions', S.gras)],
    [
      txt(
        "Une case vide vaut « je ne sais pas ». Ce n'est pas la même chose qu'un « N », qui affirme une absence constatée.",
        S.retour,
      ),
    ],
    [
      txt(
        "La colonne « Fiabilité » indique sur quoi repose la ligne : souvenir précis, estimation, ou à vérifier sur place. Une estimation signalée vaut mieux qu'une case vide.",
        S.retour,
      ),
    ],
    [
      txt(
        "Les colonnes « Type » et « Visité » décrivent l'établissement, pas le relevé. Elles sont pré-remplies avec la valeur retenue par l'étude ; les corriger ici ne remplace pas la correction dans la grille en ligne.",
        S.retour,
      ),
    ],
    [],
    [txt('Les colonnes prioritaires', S.gras)],
    [
      txt(
        `Si le temps manque, ces quatre colonnes portent le diagnostic et se remplissent en premier : ${prioritaires.join(
          ', ',
        )}.`,
        S.retour,
      ),
    ],
  ];
  return sheetXml({ rows: lignes, widths: [110] });
}

function grilleSheet(grid: GridData): string {
  const entetes = ['N°', 'Établissement', 'Zone', ...gridColumns.map((c) => c.label)];
  const rows: Row[] = [entetes.map((h) => txt(h, S.entete))];

  for (const e of establishments) {
    const row = grid[e.num];
    const cells: Row = [{ value: e.num }, txt(e.nom), txt(e.zone)];

    for (const col of gridColumns) {
      if (col.key === 'type') {
        cells.push(txt(typeEffectif(e, row)));
        continue;
      }
      if (col.key === 'visite') {
        cells.push(txt(visiteEffective(e, row) ? 'Oui' : 'Non'));
        continue;
      }
      const value = (row?.[col.key] ?? '').trim();
      if (value === '') {
        cells.push(txt(''));
        continue;
      }
      if (col.type === 'number') {
        const n = Number(value.replace(',', '.'));
        cells.push(Number.isFinite(n) ? { value: n } : txt(value));
        continue;
      }
      cells.push(txt(value));
    }
    rows.push(cells);
  }

  const widths = [5, 34, 18, ...gridColumns.map((c) => Math.max(9, Math.round(c.width / 7.5)))];

  const derniere = establishments.length + 1;
  const validations = gridColumns
    .map((col, i) => {
      const options = allowedValues(col);
      if (!options) return null;
      const letter = columnLetter(i + 3); // les trois premières colonnes sont fixes
      return { range: `${letter}2:${letter}${derniere}`, options };
    })
    .filter((v): v is { range: string; options: string[] } => v !== null);

  return sheetXml({ rows, widths, freezeRows: 1, validations });
}

function syntheseSheet(grid: GridData): string {
  const s = computeSynthese(grid);
  const rows: Row[] = [
    [txt('Synthèse', S.titre)],
    [txt('Recalculée au moment de l’export. Cet onglet ne se saisit pas.', S.gris)],
    [],
    [txt('Couverture', S.gras)],
    [txt('Établissements du périmètre'), { value: s.totalEtablissements }],
    [txt('Visités'), { value: s.visites }],
    [txt('Restant à visiter'), { value: s.restants }],
    [txt('Taux de couverture (%)'), { value: s.tauxCouverture }],
    [txt('Lignes renseignées'), { value: s.lignesRenseignees }],
    [],
    [txt('Équipement', S.gras)],
    [txt('Support', S.entete), txt('Oui', S.entete), txt('Renseignés', S.entete), txt('% du total', S.entete)],
    ...s.equipements.map((eq): Row => [
      txt(eq.label),
      { value: eq.oui },
      { value: eq.renseignes },
      { value: eq.partSurTotal },
    ]),
    [],
    [txt('Par zone', S.gras)],
    [txt('Zone', S.entete), txt('Identifiés', S.entete), txt('Visités', S.entete), txt('Renseignés', S.entete)],
    ...s.zones.map((z): Row => [
      txt(z.zone),
      { value: z.identifies },
      { value: z.visites },
      { value: z.renseignes },
    ]),
    [],
    [txt('Moyennes', S.gras)],
    [txt('Références SOBOA (moyenne)'), s.moyenneReferences === null ? txt('—') : { value: s.moyenneReferences }],
    [txt('Volume total (fûts/mois)'), { value: s.volumeTotal }],
    [txt('Note de visibilité (moyenne /5)'), s.noteMoyenne === null ? txt('—') : { value: s.noteMoyenne }],
    [txt('Sans aucun support'), { value: s.sansAucunSupport }],
  ];
  return sheetXml({ rows, widths: [34, 14, 14, 14] });
}

function formatDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Construit le classeur complet. Le résultat est un `.xlsx` valide, prêt à être servi. */
export function buildGrilleXlsx(grid: GridData, generatedAt: Date = new Date()): Buffer {
  const feuilles = [
    { nom: "Mode d'emploi", xml: modeEmploiSheet(generatedAt) },
    { nom: 'Grille', xml: grilleSheet(grid) },
    { nom: 'Synthèse', xml: syntheseSheet(grid) },
  ];

  const entries: ZipEntry[] = [
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="${NS_CT}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${feuilles
        .map(
          (_, i) =>
            `<Override PartName="/xl/worksheets/sheet${
              i + 1
            }.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
        )
        .join(
          '',
        )}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS_PKG_REL}"><Relationship Id="rId1" Type="${NS_R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="${NS}" xmlns:r="${NS_R}"><sheets>${feuilles
        .map(
          (f, i) =>
            `<sheet name="${escapeXml(f.nom)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
        )
        .join('')}</sheets></workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS_PKG_REL}">${feuilles
        .map(
          (_, i) =>
            `<Relationship Id="rId${i + 1}" Type="${NS_R}/worksheet" Target="worksheets/sheet${
              i + 1
            }.xml"/>`,
        )
        .join('')}<Relationship Id="rId${feuilles.length + 1}" Type="${NS_R}/styles" Target="styles.xml"/></Relationships>`,
    },
    { name: 'xl/styles.xml', content: STYLES },
    ...feuilles.map((f, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, content: f.xml })),
  ];

  return createZip(entries);
}
