/**
 * Les 50 établissements du circuit CHR de Dakar.
 *
 * Source : l'échantillonnage CHR transmis le 2026-08-24, qui fait foi sur les
 * noms et les zones. Il compte 49 établissements ; s'y ajoute Lagon 2, présent
 * dans la grille d'origine (`Grille_releve_CHR_SOBOA.xlsx`) et cité par le
 * questionnaire parmi les meilleurs points de vente, donc conservé sur décision
 * explicite.
 *
 * La numérotation suit l'ordre de l'échantillonnage, Lagon 2 inséré à la suite
 * de Lagon 1. Sept établissements des Almadies restent à visiter, comme l'indique
 * `Questionnaire_missions_SOBOA.docx`.
 *
 * `type` et `visite` donnent la valeur par défaut, celle que l'étude tient pour
 * acquise aujourd'hui. Toutes deux se corrigent en ligne : la grille enregistre
 * la correction et elle prend le dessus sur la valeur d'ici. Voir `typeEffectif`
 * et `visiteEffective` dans `lib/synthese.ts`.
 *
 * `num`, `nom` et `zone` restent des colonnes d'identification : elles ne se saisissent pas.
 */

export type EstablishmentType = 'H' | 'R' | 'Pub';

export type Establishment = {
  num: number;
  nom: string;
  /** Typologie par défaut. Les entrées de 2026 sont portées en « R » faute de mieux (cf. Q4). */
  type: EstablishmentType;
  zone: string;
  /** Visite par défaut. Se coche en ligne une fois la visite faite. */
  visite: boolean;
};

export const typeLabels: Record<EstablishmentType, string> = {
  H: 'Hôtel',
  R: 'Restaurant',
  Pub: 'Pub / Bar',
};

export const establishments: Establishment[] = [
  { num: 1, nom: 'Pullman Teranga / Teranga Beach Club', type: 'H', zone: 'Corniche Est', visite: true },
  { num: 2, nom: 'Club de Pêche', type: 'R', zone: 'Port', visite: true },
  { num: 3, nom: "Club de l'Union", type: 'R', zone: 'Corniche Est', visite: true },
  { num: 4, nom: 'Lagon 1', type: 'R', zone: 'Corniche Est', visite: true },
  { num: 5, nom: 'Lagon 2', type: 'H', zone: 'Corniche Est', visite: true },
  { num: 6, nom: 'Club Corse', type: 'R', zone: 'Corniche Est', visite: true },
  { num: 7, nom: 'Océanium', type: 'R', zone: 'Corniche Est', visite: true },
  { num: 8, nom: 'Just For U', type: 'R', zone: 'Point E', visite: true },
  { num: 9, nom: 'Novotel', type: 'H', zone: 'Ville', visite: true },
  { num: 10, nom: 'Le Bideew (Institut français)', type: 'R', zone: 'Ville', visite: true },
  { num: 11, nom: 'Resto Chinois', type: 'R', zone: 'Ville', visite: true },
  { num: 12, nom: 'Restaurant Farid', type: 'R', zone: 'Ville', visite: true },
  { num: 13, nom: 'Le Viking', type: 'Pub', zone: 'Ville', visite: true },
  { num: 14, nom: 'Café de Rome', type: 'R', zone: 'Ville', visite: true },
  { num: 15, nom: 'Le Kermel (marché Kermel)', type: 'R', zone: 'Ville', visite: true },
  { num: 16, nom: 'Trattoria Da Alex', type: 'R', zone: 'Point E', visite: true },
  { num: 17, nom: "Jardin de l'Amitié", type: 'Pub', zone: 'Amitié', visite: true },
  { num: 18, nom: 'Bazoff', type: 'Pub', zone: 'Amitié', visite: true },
  { num: 19, nom: 'Azalaï', type: 'H', zone: 'Corniche Ouest', visite: true },
  { num: 20, nom: 'Terrou Bi', type: 'H', zone: 'Corniche Ouest', visite: true },
  { num: 21, nom: 'Beluga', type: 'R', zone: 'Ville', visite: true },
  { num: 22, nom: 'Hôtel Savana', type: 'H', zone: 'Ville', visite: true },
  { num: 23, nom: 'Noom Hôtel', type: 'H', zone: 'Corniche Ouest', visite: true },
  { num: 24, nom: 'Ayoka (Noom Hôtel)', type: 'R', zone: 'Corniche Ouest', visite: true },
  { num: 25, nom: 'Favélas', type: 'R', zone: 'Point E', visite: true },
  { num: 26, nom: "L'Héritage", type: 'R', zone: 'Avenue Bourguiba', visite: true },
  { num: 27, nom: 'Le Tandem', type: 'R', zone: 'Yoff', visite: true },
  { num: 28, nom: 'Chez Fatou', type: 'R', zone: 'Almadies', visite: true },
  { num: 29, nom: 'Club Olympique', type: 'R', zone: 'Mermoz', visite: true },
  { num: 30, nom: 'Bahia Beach Club', type: 'R', zone: 'Almadies', visite: false },
  { num: 31, nom: 'Le Carré', type: 'R', zone: 'Almadies', visite: false },
  { num: 32, nom: 'La Cabane du Pêcheur', type: 'R', zone: 'Almadies', visite: true },
  { num: 33, nom: "Sharky's", type: 'R', zone: 'Almadies', visite: true },
  { num: 34, nom: "L'Adresse", type: 'R', zone: 'Almadies', visite: true },
  { num: 35, nom: "Jardin d'Orient", type: 'R', zone: 'Almadies', visite: false },
  { num: 36, nom: 'Le Cabanon', type: 'R', zone: 'Almadies', visite: false },
  { num: 37, nom: 'Jardin Thaïlandais', type: 'R', zone: 'Point E', visite: true },
  { num: 38, nom: 'Chez Lulu', type: 'R', zone: 'Mermoz', visite: true },
  { num: 39, nom: "L'Impérial", type: 'R', zone: 'Ville', visite: true },
  { num: 40, nom: 'Casa Mara', type: 'R', zone: 'Amitié', visite: true },
  { num: 41, nom: 'Arisu', type: 'R', zone: 'Almadies', visite: true },
  { num: 42, nom: 'Boma', type: 'R', zone: 'Almadies', visite: true },
  { num: 43, nom: 'Chez Katia', type: 'R', zone: 'Almadies', visite: false },
  { num: 44, nom: 'Dolce Vita', type: 'R', zone: 'Almadies', visite: true },
  { num: 45, nom: 'Relais', type: 'R', zone: 'Corniche Ouest', visite: true },
  { num: 46, nom: 'Sao Brasil', type: 'R', zone: 'Yoff', visite: true },
  { num: 47, nom: 'Jet Café', type: 'R', zone: 'Almadies', visite: false },
  { num: 48, nom: 'Onomo', type: 'H', zone: 'Yoff', visite: true },
  { num: 49, nom: 'Basilic', type: 'R', zone: 'Almadies', visite: false },
  { num: 50, nom: "L'Hibiscus", type: 'R', zone: 'Point E', visite: true },
];
