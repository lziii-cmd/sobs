/**
 * Les 35 établissements du circuit CHR de Dakar, repris à l'identique de
 * `Grille_releve_CHR_SOBOA.xlsx` (onglet « Grille »).
 * Depuis la mise à jour de la grille, les 35 sont marqués visités : la colonne
 * « Visité » du fichier vaut Oui sur les 35 lignes, et l'onglet « Synthèse »
 * annonce une couverture complète du périmètre identifié.
 * Ces colonnes sont des colonnes d'identification : elles ne se saisissent pas dans le site.
 */

export type Establishment = {
  num: number;
  nom: string;
  type: 'H' | 'R' | 'Pub';
  zone: string;
  visite: boolean;
};

export const typeLabels: Record<Establishment['type'], string> = {
  H: 'Hôtel',
  R: 'Restaurant',
  Pub: 'Pub / Bar',
};

export const establishments: Establishment[] = [
  { num: 1, nom: 'Club de Pêche', type: 'R', zone: 'Port', visite: true },
  { num: 2, nom: 'Pullman Teranga / Teranga Beach Club', type: 'H', zone: 'Corniche Est', visite: true },
  { num: 3, nom: 'Lagon 1', type: 'R', zone: 'Corniche Est', visite: true },
  { num: 4, nom: 'Lagon 2', type: 'H', zone: 'Corniche Est', visite: true },
  { num: 5, nom: 'Club Corse', type: 'R', zone: 'Corniche Est', visite: true },
  { num: 6, nom: "Club de l'Union", type: 'R', zone: 'Corniche Est', visite: true },
  { num: 7, nom: 'Océanium', type: 'R', zone: 'Corniche Est', visite: true },
  { num: 8, nom: 'Novotel', type: 'H', zone: 'Ville', visite: true },
  { num: 9, nom: 'Azalaï', type: 'H', zone: 'Ville', visite: true },
  { num: 10, nom: 'Terrou Bi', type: 'H', zone: 'Ville', visite: true },
  { num: 11, nom: 'Hôtel Savana', type: 'H', zone: 'Ville', visite: true },
  { num: 12, nom: 'Noom Hôtel', type: 'H', zone: 'Ville', visite: true },
  { num: 13, nom: 'Le Bideew (Institut français)', type: 'R', zone: 'Ville', visite: true },
  { num: 14, nom: 'Restaurant Farid', type: 'R', zone: 'Ville', visite: true },
  { num: 15, nom: 'Resto Chinois', type: 'R', zone: 'Ville', visite: true },
  { num: 16, nom: 'Café de Rome', type: 'R', zone: 'Ville', visite: true },
  { num: 17, nom: 'Le Kermel (marché Kermel)', type: 'R', zone: 'Ville', visite: true },
  { num: 18, nom: 'Beluga', type: 'R', zone: 'Ville', visite: true },
  { num: 19, nom: 'Ayoka', type: 'R', zone: 'Ville', visite: true },
  { num: 20, nom: 'Le Viking', type: 'Pub', zone: 'Ville', visite: true },
  { num: 21, nom: 'Just For U', type: 'R', zone: 'Point E', visite: true },
  { num: 22, nom: 'Trattoria Da Alex', type: 'R', zone: 'Point E', visite: true },
  { num: 23, nom: "Jardin de l'Amitié", type: 'Pub', zone: 'Amitié', visite: true },
  { num: 24, nom: 'Bazoff', type: 'Pub', zone: 'Amitié', visite: true },
  { num: 25, nom: "L'Héritage (av. Bourguiba)", type: 'R', zone: 'Ville', visite: true },
  { num: 26, nom: 'Favélas', type: 'R', zone: 'Point E', visite: true },
  { num: 27, nom: 'Bahia Beach Club', type: 'R', zone: 'Almadies', visite: true },
  { num: 28, nom: 'Le Carré', type: 'R', zone: 'Almadies', visite: true },
  { num: 29, nom: 'La Cabane du Pêcheur', type: 'R', zone: 'Almadies', visite: true },
  { num: 30, nom: "Sharky's", type: 'R', zone: 'Almadies', visite: true },
  { num: 31, nom: "Jardin d'Orient", type: 'R', zone: 'Almadies', visite: true },
  { num: 32, nom: 'Le Tandem', type: 'R', zone: 'Yoff', visite: true },
  { num: 33, nom: 'Chez Fatou', type: 'R', zone: 'Almadies', visite: true },
  { num: 34, nom: 'Club Olympique', type: 'R', zone: 'Mermoz', visite: true },
  { num: 35, nom: "L'Adresse", type: 'R', zone: 'Almadies', visite: true },
];
