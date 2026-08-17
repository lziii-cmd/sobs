import { establishments } from '../data/establishments';

export type GridData = Record<number, Record<string, string>>;

const isO = (v: string | undefined) => (v ?? '').trim().toUpperCase() === 'O';
const isN = (v: string | undefined) => (v ?? '').trim().toUpperCase() === 'N';

function num(v: string | undefined): number | null {
  if (v === undefined) return null;
  const cleaned = v.replace(',', '.').trim();
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export type EquipmentStat = {
  key: string;
  label: string;
  oui: number;
  renseignes: number;
  /** Part de « oui » sur les 35 établissements identifiés. */
  partSurTotal: number;
};

export type ZoneStat = {
  zone: string;
  identifies: number;
  visites: number;
  renseignes: number;
};

export type Synthese = {
  equipements: EquipmentStat[];
  totalEtablissements: number;
  visites: number;
  restants: number;
  tauxCouverture: number;
  lignesRenseignees: number;
  zones: ZoneStat[];
  moyenneReferences: number | null;
  volumeTotal: number;
  noteMoyenne: number | null;
  sansAucunSupport: number;
};

const EQUIPMENTS: { key: string; label: string }[] = [
  { key: 'enseigne', label: 'Enseigne SOBOA' },
  { key: 'mobilier', label: 'Mobilier de terrasse' },
  { key: 'froid', label: 'Matériel de froid' },
  { key: 'plv', label: 'PLV et affiches' },
];

/** Reproduit l'onglet « Synthèse » du fichier Excel, recalculé à chaque saisie. */
export function computeSynthese(data: GridData): Synthese {
  const total = establishments.length;

  const equipements = EQUIPMENTS.map(({ key, label }) => {
    let oui = 0;
    let renseignes = 0;
    for (const e of establishments) {
      const v = data[e.num]?.[key];
      if (isO(v)) {
        oui += 1;
        renseignes += 1;
      } else if (isN(v)) {
        renseignes += 1;
      }
    }
    return {
      key,
      label,
      oui,
      renseignes,
      partSurTotal: total === 0 ? 0 : Math.round((oui / total) * 100),
    };
  });

  const zoneMap = new Map<string, ZoneStat>();
  for (const e of establishments) {
    const stat = zoneMap.get(e.zone) ?? { zone: e.zone, identifies: 0, visites: 0, renseignes: 0 };
    stat.identifies += 1;
    if (e.visite) stat.visites += 1;
    if (hasAnyValue(data[e.num])) stat.renseignes += 1;
    zoneMap.set(e.zone, stat);
  }

  const refs = establishments
    .map((e) => num(data[e.num]?.nbRefs))
    .filter((n): n is number => n !== null);
  const volumes = establishments
    .map((e) => num(data[e.num]?.volume))
    .filter((n): n is number => n !== null);
  const notes = establishments
    .map((e) => num(data[e.num]?.note))
    .filter((n): n is number => n !== null);

  const sansAucunSupport = establishments.filter((e) => {
    const row = data[e.num];
    if (!row) return false;
    const values = EQUIPMENTS.map(({ key }) => row[key]);
    return values.every((v) => isN(v));
  }).length;

  const visites = establishments.filter((e) => e.visite).length;

  return {
    equipements,
    totalEtablissements: total,
    visites,
    restants: total - visites,
    tauxCouverture: total === 0 ? 0 : Math.round((visites / total) * 100),
    lignesRenseignees: establishments.filter((e) => hasAnyValue(data[e.num])).length,
    zones: [...zoneMap.values()].sort((a, b) => b.identifies - a.identifies || a.zone.localeCompare(b.zone)),
    moyenneReferences: refs.length ? Math.round((refs.reduce((a, b) => a + b, 0) / refs.length) * 10) / 10 : null,
    volumeTotal: volumes.reduce((a, b) => a + b, 0),
    noteMoyenne: notes.length ? Math.round((notes.reduce((a, b) => a + b, 0) / notes.length) * 10) / 10 : null,
    sansAucunSupport,
  };
}

export function hasAnyValue(row: Record<string, string> | undefined): boolean {
  if (!row) return false;
  return Object.values(row).some((v) => typeof v === 'string' && v.trim() !== '');
}
