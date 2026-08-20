/**
 * Correspondance entre la numérotation du formulaire v1 (85 questions) et celle
 * du questionnaire v2 (`Questionnaire_SOBOA_v2.docx`, 196 questions).
 *
 * Le v2 renumérote tout : `Q42` ne désigne plus la même question dans les deux
 * documents. Sans cette table, les réponses déjà enregistrées se retrouveraient
 * rattachées à des questions sans rapport. Elle est appliquée une seule fois,
 * par `npm run db:migrate-v2`.
 *
 * Chaque ligne a été établie en comparant les intitulés un à un, pas
 * automatiquement : une correspondance approximative vaut ici une réponse fausse.
 */

import { questionById } from './questions';

/** v1 → v2, pour les questions dont le v2 conserve l'équivalent. */
export const V1_TO_V2: Record<string, string> = {
  // Section 0 — cadre administratif
  Q1: 'Q1', // nom et prénom sur la page de garde
  Q2: 'Q2', // le v2 sépare l'établissement (Q2) de l'intitulé de formation (Q3)
  Q3: 'Q5', // le v2 sépare l'année universitaire (Q5) du niveau d'études (Q4)
  Q4: 'Q6', // tuteur pédagogique
  Q5: 'Q7', // volume attendu pour le rapport
  Q6: 'Q8', // trame ou plan type imposé
  Q7: 'Q12', // autres exigences formelles
  Q8: 'Q15', // maître de stage
  Q9: 'Q16', // « tonton Hervé »
  Q10: 'Q17', // service d'accueil
  Q11: 'Q18', // rattachement au quotidien
  Q12: 'Q20', // seul ou accompagné
  Q13: 'Q22', // dates de stage
  Q14: 'Q24', // effectif
  Q15: 'Q26', // chiffre d'affaires
  Q16: 'Q33', // organigramme
  Q17: 'Q35', // découpage de la force de vente
  Q18: 'Q28', // capital social et actionnariat

  // Section 1 (v1 : visites) — méthodologie
  Q20: 'Q59', // qui a établi la liste
  Q21: 'Q60', // critères de sélection
  Q22: 'Q64', // clients ou prospects
  Q23: 'Q65', // visite type
  Q24: 'Q66', // prise de notes
  Q25: 'Q72', // photos
  Q26: 'Q68', // établissements visités plusieurs fois
  Q27: 'Q70', // difficultés d'accès
  Q28: 'Q63', // les trois établissements sans localisation
  Q29: 'Q62', // établissements absents de la liste

  // Section 2 (v1 : visibilité)
  Q30: 'Q113', // présence visuelle d'ensemble
  Q31: 'Q114', // supports les plus vus / les plus absents
  Q32: 'Q115', // état du matériel
  Q33: 'Q117', // contenu du matériel de froid
  Q34: 'Q118', // sigle RAF
  Q35: 'Q119', // autres établissements équipés
  Q36: 'Q40', // Bideew et 33 Export au portefeuille — devient une question « entreprise »
  Q37: 'Q39', // gamme complète — devient une question « entreprise »
  Q38: 'Q42', // conditionnements — devient une question « entreprise »
  Q39: 'Q120', // nombre moyen de références
  Q40: 'Q121', // pourquoi le Viking référence toute la gamme
  Q41: 'Q122', // pourquoi la gamme est étroite ailleurs

  // Section 3 (v1 : concurrence)
  Q42: 'Q130', // Heineken, Desperados, Coca-Cola
  Q43: 'Q135', // supports concurrents
  Q44: 'Q136', // état du matériel concurrent
  Q45: 'Q132', // où la concurrence est plus visible
  Q46: 'Q133', // où la SOBOA domine
  Q47: 'Q139', // animations concurrentes
  Q48: 'Q141', // exclusivités concurrentes
  Q49: 'Q143', // ce que disent les gérants
  Q50: 'Q147', // ancienneté de Heineken au Sénégal
  Q51: 'Q131', // autres concurrents
  Q52: 'Q51', // part de marché dans le CHR de Dakar — devient une question « marché »

  // Section 4 (v1 : implantation)
  Q56: 'Q149', // Almadies comparées au Plateau et à la Corniche
  Q58: 'Q154', // du potentiel sans être équipé
  Q59: 'Q155', // très équipé mais faible écoulement
  Q60: 'Q152', // zones absentes à travailler

  // Section 5 (v1 : business case)
  Q61: 'Q161', // coût d'une enseigne
  Q62: 'Q162', // coût d'un parasol
  Q63: 'Q163', // coût du mobilier de terrasse
  Q64: 'Q164', // coût d'un réfrigérateur
  Q65: 'Q166', // coût d'un kit PLV
  Q66: 'Q168', // coût d'une animation
  Q67: 'Q169', // budget visibilité annuel
  Q68: 'Q171', // prix et contenance d'un fût
  Q69: 'Q172', // prix d'une bouteille
  Q70: 'Q173', // marge par hectolitre
  Q71: 'Q47', // taille du marché — devient une question « marché »
  Q72: 'Q49', // part du CHR dans l'activité — devient une question « marché »
  Q73: 'Q176', // critères d'équipement d'un établissement
  Q74: 'Q177', // matériel prêté, donné ou vendu
  Q75: 'Q178', // suivi du matériel installé
  Q76: 'Q179', // fréquence des visites commerciales
  Q77: 'Q182', // attentes du tuteur

  // Section 6 (v1 : bilan)
  Q78: 'Q185',
  Q79: 'Q186',
  Q80: 'Q187',
  Q81: 'Q188',
  Q82: 'Q189',
  Q83: 'Q191',
  Q84: 'Q190',
  Q85: 'Q193',
};

/**
 * Questions v1 sans équivalent v2, avec la raison. Leurs réponses ne sont pas
 * perdues : elles restent dans la table d'archive, mais ne sont pas réinjectées.
 */
export const V1_ABANDONNEES: Record<string, string> = {
  Q19: "Le v2 ne demande plus quelles données sont diffusables : la question relevait du cadrage initial, désormais tranché.",
  Q53: "La prémisse est caduque : la nouvelle grille indique que les établissements des Almadies ont été visités.",
  Q54: "Même prémisse caduque ; le v2 pose une question différente (Q150 : la SOBOA est-elle bien implantée aux Almadies ?).",
  Q55: 'Le Tandem est désormais marqué comme visité dans la grille.',
  Q57: "La question « as-tu prévu d'y aller ? » n'a plus d'objet une fois les 35 établissements visités.",
};

/**
 * Les intitulés v2 utilisent l'apostrophe droite, le v1 l'apostrophe typographique.
 * Une réponse à choix enregistrée en v1 ne correspondrait donc à aucune option v2.
 */
function normaliseApostrophes(value: string): string {
  return value.replace(/[‘’‛]/g, "'");
}

/**
 * Valeur à réinjecter sous l'identifiant v2. Pour une question à choix, on
 * réaligne la réponse sur l'option v2 correspondante quand seule l'apostrophe
 * diffère ; sinon la valeur est reprise telle quelle.
 */
export function valeurPourV2(idV2: string, valeur: string): string {
  const question = questionById(idV2);
  if (!question?.options) return valeur;
  if (question.options.includes(valeur)) return valeur;

  const cible = normaliseApostrophes(valeur);
  return question.options.find((o) => normaliseApostrophes(o) === cible) ?? valeur;
}
