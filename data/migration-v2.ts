/**
 * Correspondance entre la numérotation du questionnaire v2 (196 questions) et
 * celle du questionnaire d'étude (`Questionnaire_etude_SOBOA.docx`, 97 questions).
 *
 * Le nouveau document n'est pas une révision du précédent : il lui succède.
 * Son mode d'emploi l'annonce explicitement — il fait suite à une base de
 * connaissances qui recense ce qui est déjà établi, et « les questions déjà
 * résolues n'y figurent donc pas ». La plupart des réponses déjà saisies ont
 * précisément servi à constituer cette base : elles n'ont plus de question
 * d'accueil, ce qui est le comportement attendu et non une perte.
 *
 * Sept questions font exception : le nouveau document les repose, parce que la
 * réponse obtenue était incomplète ou qu'elle appelle une précision chiffrée.
 * Elles seules sont reprises. Tout le reste est conservé en archive.
 *
 * Chaque ligne a été établie en comparant les intitulés un à un, pas
 * automatiquement : une correspondance approximative vaut ici une réponse fausse.
 */

/** v2 → questionnaire d'étude, pour les questions que le nouveau document repose. */
export const V2_VERS_ETUDE: Record<string, string> = {
  // Section 1 — la gamme référencée dans les grands comptes
  Q122: 'Q1', // « pourquoi la gamme est-elle étroite ? » devient la question centrale de l'étude
  Q141: 'Q3', // exclusivité concurrente, désormais ciblée sur les cinq grands comptes
  Q120: 'Q6', // nombre de références par établissement, désormais demandé pour les trente-cinq
  Q121: 'Q7', // pourquoi Le Viking référence l'intégralité de la gamme

  // Section 3 — la concurrence
  Q130: 'Q19', // poids des marques concurrentes : la présence est établie, le nombre reste à mesurer
  Q139: 'Q23', // animations et opérations promotionnelles concurrentes
  Q140: 'Q24', // animations conduites par l'entreprise, en regard de celles des concurrents
  Q131: 'Q28', // autres acteurs concurrents non identifiés lors des visites
};

/**
 * Questions v2 sans équivalent dans le questionnaire d'étude, avec la raison.
 * Leurs réponses ne sont pas perdues : elles restent intégralement dans la table
 * d'archive, mais ne sont pas réinjectées sous un numéro qui ne les concerne plus.
 *
 * La liste couvre les identifiants effectivement présents en base au moment du
 * changement de questionnaire. Toute autre réponse rencontrée est archivée avec
 * la mention générique prévue par le script.
 */
export const V2_ABANDONNEES: Record<string, string> = {
  // Le nouveau document ne traite plus du cadre administratif du stage :
  // l'étude est un livrable d'entreprise, pas un rapport scolaire.
  Q1: "Le questionnaire d'étude ne comporte pas de page de garde d'étudiant : le livrable est un document d'entreprise.",
  Q2: "L'établissement de formation ne figure pas dans un livrable destiné à la direction.",
  Q3: "L'intitulé de la formation ne figure pas dans un livrable destiné à la direction.",
  Q4: "Le niveau d'études servait à calibrer l'exigence attendue par un jury ; l'étude n'a plus de jury.",
  Q5: "L'année universitaire ne figure pas dans un livrable d'entreprise.",
  Q7: "Le volume attendu par l'école ne s'applique plus : le format du livrable est celui de l'étude.",
  Q8: "La trame imposée par l'école ne s'applique plus : le plan est celui des chapitres de l'étude.",
  Q9: "L'exigence d'une problématique formelle relevait des consignes scolaires.",
  Q10: 'Le style de citation imposé par une école ne concerne plus le livrable.',
  Q13: "L'organisation d'une soutenance relevait du cadre scolaire.",
  Q15: "Le questionnaire d'étude ne traite plus du cadre du stage : le livrable s'adresse à la direction, pas à un jury.",
  Q17: "Le service d'accueil relève de la base de connaissances déjà constituée, pas du questionnaire.",
  Q18: "Le rattachement hiérarchique pendant le stage ne conditionne aucun chapitre du livrable.",
  Q16: "Même raison : l'identité des interlocuteurs relève désormais de la base de connaissances, pas du questionnaire.",
  Q20: "Le déroulement du stage ne fait plus partie du périmètre du document.",
  Q22: "Les dates de stage ne figurent plus dans le livrable d'étude.",

  // Méthodologie des visites : absorbée par la base de connaissances.
  Q59: "La constitution du périmètre est désormais établie : le document part des trente-cinq établissements comme d'un acquis.",
  Q62: "Remplacée par une question de cadrage marché (Q68 : combien d'établissements compte le circuit CHR dans son ensemble ?).",
  Q63: "Résolue : les trois localisations manquantes sont intégrées au document, qui place Chez Fatou et L'Adresse aux Almadies et le Club Olympique à Mermoz.",
  Q64: "Le statut client des établissements est acquis et ne fait plus l'objet d'une question.",
  Q65: "Le déroulement des visites relève de la méthodologie, que le nouveau document ne réinterroge pas.",
  Q66: 'Même raison : la manière de prendre des notes ne conditionne aucun chapitre du livrable.',
  Q68: "La fréquence des visites par établissement est établie et n'est plus réinterrogée.",
  Q70: "Les conditions d'accès aux établissements ne sont plus demandées.",
  Q72: "La question des photographies relevait de la constitution des annexes du rapport de stage.",

  // Visibilité : le constat est posé, le document ne demande plus de le refaire.
  Q113: "Le constat d'ensemble sur la visibilité est établi ; le document demande désormais des mesures, pas des appréciations.",
  Q114: "Remplacée par des questions ciblées sur le dispositif d'équipement (section 2) et sur le mobilier de terrasse (Q18).",
  Q115: "Remplacée par Q17, qui porte sur la durée de vie du matériel et la politique de renouvellement.",
  Q117: "Le contenu du matériel de froid est acquis et ne conditionne plus de chapitre.",
  Q118: "Résolue : le document emploie directement « réfrigérateur à froid ventilé » (Q88).",
  Q119: "Résolue : le rappel du constat de la section 2 recense les cinq établissements équipés.",

  // Concurrence : le constat de présence est acquis, la mesure reste à faire.
  Q133: "Le document ne pose plus que la question inverse (Q21 : où la concurrence est-elle plus visible ?).",
  Q135: "Remplacée par Q20 et Q22, qui demandent une mesure de l'occupation et une estimation des investissements concurrents.",
  Q136: "L'état comparé du matériel concurrent n'est plus demandé.",
  Q147: "L'ancienneté de Heineken au Sénégal relève de la base de connaissances déjà constituée.",

  // Portefeuille produits : établi dans la base de connaissances.
  Q39: "La gamme des treize références est désormais un acquis du document, qui l'énonce dans le rappel du constat de la section 1.",
  Q40: "Résolue : Bideew et 33 Export figurent au portefeuille, ce que le document tient pour acquis.",
  Q42: "Remplacée par des questions ciblées : Q8 sur le conditionnement fût, Q9 sur le Tonic et le World Cola.",
};

/** Identifiants relevés en base au moment du changement de questionnaire. */
export const V2_EN_BASE = [
  'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q7', 'Q8', 'Q9', 'Q10', 'Q13', 'Q15', 'Q16',
  'Q17', 'Q18', 'Q20', 'Q22', 'Q39', 'Q40', 'Q42', 'Q59', 'Q62', 'Q63', 'Q64',
  'Q65', 'Q66', 'Q68', 'Q70', 'Q72', 'Q113', 'Q114', 'Q115', 'Q117', 'Q118',
  'Q119', 'Q120', 'Q121', 'Q122', 'Q130', 'Q131', 'Q133', 'Q135', 'Q136',
  'Q139', 'Q140', 'Q141', 'Q147',
];

export const RAISON_PAR_DEFAUT =
  "Aucune correspondance dans le questionnaire d'étude : la question relève de points déjà établis.";
