/**
 * Colonnes de la grille de relevé, reprises de `Grille_releve_CHR_SOBOA.xlsx`.
 * Les listes de valeurs sont celles des validations de données du fichier Excel.
 */

export type GridColumnType = 'on' | 'number' | 'text' | 'choice';

export type GridColumn = {
  key: string;
  label: string;
  short: string;
  type: GridColumnType;
  options?: string[];
  hint?: string;
  /** Colonne prioritaire : porte le diagnostic (cf. onglet « Mode d'emploi »). */
  priority?: boolean;
  width: number;
};

/**
 * Liste déroulante de la colonne « Fiabilité », reprise de la validation de
 * données du fichier Excel. L'option « Non visité » a disparu de la nouvelle
 * grille : les 35 établissements y sont tous marqués visités.
 */
export const FIABILITE_OPTIONS = ['Souvenir précis', 'Estimation', 'À vérifier sur place'];

export const gridColumns: GridColumn[] = [
  {
    key: 'enseigne',
    label: 'Enseigne SOBOA',
    short: 'Enseigne',
    type: 'on',
    hint: 'O pour oui, N pour non. Laisse vide si tu ne sais pas.',
    priority: true,
    width: 110,
  },
  {
    key: 'parasols',
    label: 'Parasols (nb)',
    short: 'Parasols',
    type: 'number',
    hint: 'Un ordre de grandeur suffit.',
    width: 100,
  },
  {
    key: 'mobilier',
    label: 'Mobilier terrasse',
    short: 'Mobilier',
    type: 'on',
    hint: 'O pour oui, N pour non. Laisse vide si tu ne sais pas.',
    width: 110,
  },
  {
    key: 'froid',
    label: 'Matériel de froid',
    short: 'Froid',
    type: 'on',
    hint: 'Réfrigérateur ou armoire froide aux couleurs SOBOA.',
    priority: true,
    width: 110,
  },
  {
    key: 'plv',
    label: 'PLV / affiches',
    short: 'PLV',
    type: 'on',
    hint: 'O pour oui, N pour non. Laisse vide si tu ne sais pas.',
    priority: true,
    width: 110,
  },
  {
    key: 'nbRefs',
    label: 'Nb références SOBOA',
    short: 'Nb réf.',
    type: 'number',
    hint: 'Combien de produits SOBOA différents sont proposés.',
    width: 110,
  },
  {
    key: 'marquesSoboa',
    label: 'Marques SOBOA proposées',
    short: 'Marques SOBOA',
    type: 'text',
    hint: 'Ex. : Gazelle, Flag, Racines, 33 Export…',
    width: 240,
  },
  {
    key: 'marquesConcurrentes',
    label: 'Marques concurrentes présentes',
    short: 'Concurrents',
    type: 'text',
    hint: 'Ex. : Heineken, Coca-Cola…',
    priority: true,
    width: 240,
  },
  {
    key: 'supportsConcurrents',
    label: 'Supports concurrents visibles',
    short: 'Supports conc.',
    type: 'text',
    hint: 'Ex. : 1 enseigne Heineken en façade, frigo Coca.',
    width: 240,
  },
  {
    key: 'volume',
    label: 'Volume estimé (fûts/mois)',
    short: 'Volume',
    type: 'number',
    hint: 'Estimation mensuelle, même approximative.',
    width: 120,
  },
  {
    key: 'note',
    label: 'Note visibilité /5',
    short: 'Note /5',
    type: 'choice',
    options: ['0', '1', '2', '3', '4', '5'],
    hint: '0 = aucune visibilité, 5 = visibilité optimale.',
    width: 110,
  },
  {
    key: 'fiabilite',
    label: 'Fiabilité',
    short: 'Fiabilité',
    type: 'choice',
    options: FIABILITE_OPTIONS,
    hint: 'Sur quoi repose cette ligne ?',
    width: 160,
  },
  {
    key: 'commentaire',
    label: 'Commentaire libre',
    short: 'Commentaire',
    type: 'text',
    width: 320,
  },
];

export const gridColumnByKey = (key: string): GridColumn | undefined =>
  gridColumns.find((c) => c.key === key);

/** Valeurs acceptées pour une colonne donnée. `null` = pas de contrainte de liste. */
export function allowedValues(col: GridColumn): string[] | null {
  if (col.type === 'on') return ['O', 'N'];
  if (col.type === 'choice') return col.options ?? null;
  return null;
}
