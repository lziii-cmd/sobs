/**
 * Source de vérité du formulaire de collecte SOBOA.
 * Transposition fidèle de `Formulaire_collecte_SOBOA.docx` : les numéros, l'ordre,
 * les intitulés et les textes d'aide sont ceux du document d'origine.
 * Ce fichier alimente à la fois l'affichage du formulaire et la génération du PDF.
 */

export type QuestionType = 'short' | 'long' | 'choice' | 'multi';

export type Question = {
  id: string;
  sectionId: string;
  group?: string;
  label: string;
  help?: string;
  type: QuestionType;
  options?: string[];
  priority: boolean;
};

export type Section = {
  id: string;
  number: string;
  title: string;
  intro: string;
};

export const sections: Section[] = [
  {
    id: 'cadre',
    number: '0',
    title: 'Cadre administratif et institutionnel',
    intro:
      "Sans ces éléments, la page de garde, les remerciements et toute la Partie I restent incomplets.",
  },
  {
    id: 'visites',
    number: '1',
    title: 'Mission 1 — Les visites terrain',
    intro:
      "Comment tu as construit ton échantillon et conduit tes visites. Cette section consolide la Partie II du rapport, déjà largement rédigée.",
  },
  {
    id: 'visibilite',
    number: '2',
    title: 'Mission 2 — La visibilité des marques SOBOA',
    intro:
      "La mission la plus lacunaire aujourd'hui. Le détail établissement par établissement se remplit dans la grille de relevé ; ici, les questions d'ensemble.",
  },
  {
    id: 'concurrence',
    number: '3',
    title: 'Mission 4 — La concurrence',
    intro:
      "Traitée avant la mission 3 dans le rapport, pour des raisons expliquées en introduction. C'est aujourd'hui le chapitre le plus vide.",
  },
  {
    id: 'implantation',
    number: '4',
    title: "Mission 3 — Les opportunités d'implantation",
    intro:
      "C'est ici que se joue le point le plus fort du rapport : la zone des Almadies.",
  },
  {
    id: 'businesscase',
    number: '5',
    title: "Mission 5 — Plan d'amélioration et business case",
    intro:
      "Le chiffrage est aujourd'hui entièrement à construire. Ces données viennent des services internes, pas du terrain.",
  },
  {
    id: 'bilan',
    number: '6',
    title: 'Ton bilan personnel',
    intro:
      "Deux à trois pages du rapport. Réponds en vrac, la mise en forme suivra — mais le contenu doit venir de toi, il ne s'invente pas.",
  },
];

export const questions: Question[] = [
  // ---------------------------------------------------------------- Section 0
  {
    id: 'Q1',
    sectionId: 'cadre',
    group: 'Toi et ta formation',
    label: 'Ton nom et ton prénom, tels qu’ils doivent apparaître sur la page de garde.',
    type: 'short',
    priority: true,
  },
  {
    id: 'Q2',
    sectionId: 'cadre',
    group: 'Toi et ta formation',
    label: "Le nom exact de ton établissement et l’intitulé complet de ta formation.",
    help: 'Exemple : Licence professionnelle Marketing et Commerce, Institut supérieur de management, Dakar.',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q3',
    sectionId: 'cadre',
    group: 'Toi et ta formation',
    label: "L’année universitaire concernée, et le niveau d’études.",
    type: 'short',
    priority: true,
  },
  {
    id: 'Q4',
    sectionId: 'cadre',
    group: 'Toi et ta formation',
    label: 'Le nom de ton tuteur pédagogique.',
    type: 'short',
    priority: false,
  },
  {
    id: 'Q5',
    sectionId: 'cadre',
    group: 'Toi et ta formation',
    label: 'Quel volume ton école attend-elle pour le rapport ?',
    help: "Le rapport actuel est calibré sur environ 45 pages hors annexes. Si l’attendu diffère nettement, il faut le savoir avant que la rédaction continue.",
    type: 'choice',
    options: [
      'Moins de 25 pages',
      'Entre 25 et 40 pages',
      'Entre 40 et 60 pages',
      'Plus de 60 pages',
      'Aucune consigne de volume',
      'Je ne sais pas — je vais vérifier',
    ],
    priority: true,
  },
  {
    id: 'Q6',
    sectionId: 'cadre',
    group: 'Toi et ta formation',
    label: 'Ton école impose-t-elle une trame, un plan type ou une charte de présentation ?',
    type: 'choice',
    options: [
      'Oui, et je peux te la transmettre',
      "Oui, mais je ne l’ai pas sous la main",
      'Non, le plan est libre',
      'Je ne sais pas',
    ],
    priority: true,
  },
  {
    id: 'Q7',
    sectionId: 'cadre',
    group: 'Toi et ta formation',
    label:
      "Y a-t-il d’autres exigences formelles à respecter ? Date de remise, style de citation, résumé ou abstract, nombre d’exemplaires, format de dépôt.",
    help: 'Le style de citation compte : APA, Harvard et notes de bas de page ne se présentent pas de la même façon.',
    type: 'long',
    priority: false,
  },
  {
    id: 'Q8',
    sectionId: 'cadre',
    group: 'Ton stage et ton encadrement',
    label: 'Le nom et la fonction exacte de ton maître de stage en entreprise.',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q9',
    sectionId: 'cadre',
    group: 'Ton stage et ton encadrement',
    label:
      "Le nom et la fonction de la personne que tes notes désignent comme « tonton Hervé », rencontrée en entretien.",
    help: "Il faut son intitulé de poste officiel pour pouvoir citer l’entretien en annexe. Un entretien attribué à un prénom seul n’a pas de valeur probante devant un jury.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q10',
    sectionId: 'cadre',
    group: 'Ton stage et ton encadrement',
    label: "Quel service t’a accueilli exactement ? Direction commerciale, marketing, force de vente, autre.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q11',
    sectionId: 'cadre',
    group: 'Ton stage et ton encadrement',
    label: 'À qui rapportais-tu au quotidien, et avec qui travaillais-tu ?',
    type: 'long',
    priority: false,
  },
  {
    id: 'Q12',
    sectionId: 'cadre',
    group: 'Ton stage et ton encadrement',
    label: 'Étais-tu seule sur cette mission, ou accompagnée lors des visites ?',
    help: "Si tu étais accompagnée d’un commercial, précise-le : cela change la façon dont il faut présenter la méthodologie.",
    type: 'long',
    priority: false,
  },
  {
    id: 'Q13',
    sectionId: 'cadre',
    group: 'Ton stage et ton encadrement',
    label:
      'Les dates exactes de début et de fin de stage. Hypothèse retenue : du 15 juillet au 15 septembre 2026 — confirme ou corrige.',
    type: 'short',
    priority: false,
  },
  {
    id: 'Q14',
    sectionId: 'cadre',
    group: "L’entreprise",
    label: "Quel est l’effectif de la SOBOA, et comment se répartit-il entre les grandes directions ?",
    help: "Un ordre de grandeur suffit si le chiffre exact n’est pas communicable.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q15',
    sectionId: 'cadre',
    group: "L’entreprise",
    label: "Quel est le chiffre d’affaires du dernier exercice, et le volume produit en hectolitres ?",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q16',
    sectionId: 'cadre',
    group: "L’entreprise",
    label:
      "Peux-tu obtenir l’organigramme de l’entreprise, au moins celui de la direction commerciale ?",
    help: "Une photo d’un document affiché au mur fait l’affaire — dépose-la dans l’espace Fichiers, elle sera remise au propre.",
    type: 'long',
    priority: false,
  },
  {
    id: 'Q17',
    sectionId: 'cadre',
    group: "L’entreprise",
    label:
      'Comment la force de vente est-elle organisée ? Par canal, par secteur géographique, par type de client ? Existe-t-il une équipe dédiée au CHR ?',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q18',
    sectionId: 'cadre',
    group: "L’entreprise",
    label: "Quels sont le capital social, le statut juridique précis et la répartition de l’actionnariat ?",
    type: 'long',
    priority: false,
  },
  {
    id: 'Q19',
    sectionId: 'cadre',
    group: "L’entreprise",
    label: 'Quelles données peuvent figurer dans un document remis à ton école ?',
    help: "Question à poser explicitement à ton tuteur. Si des données sont sensibles, on peut les présenter en base 100 ou ajouter une mention de confidentialité en page de garde — mais il faut le décider avant, pas la veille du dépôt. Plusieurs réponses possibles.",
    type: 'multi',
    options: [
      'Tout peut être communiqué',
      "Les volumes et le chiffre d’affaires sont confidentiels",
      'Les prix et les marges sont confidentiels',
      'Les parts de marché sont confidentielles',
      'Je dois demander l’autorisation avant de publier quoi que ce soit',
    ],
    priority: true,
  },

  // ---------------------------------------------------------------- Section 1
  {
    id: 'Q20',
    sectionId: 'visites',
    label:
      'Comment as-tu choisi les établissements à visiter ? Qui a établi la liste — toi, ton tuteur, un commercial ?',
    help: "C’est la question de méthode que le jury posera à coup sûr. Réponds franchement : si la liste t’a été donnée, dis-le, c’est un choix méthodologique légitime.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q21',
    sectionId: 'visites',
    label:
      'Sur quels critères ces établissements ont-ils été retenus ? Volume, notoriété, proximité, clients existants, prospects ?',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q22',
    sectionId: 'visites',
    label: 'Les 24 établissements que tu as visités étaient-ils déjà clients de la SOBOA ?',
    help: "Cette distinction change complètement la lecture du diagnostic : un établissement non équipé qui est déjà client relève d’un problème d’exécution ; un prospect non équipé relève d’un problème de conquête.",
    type: 'choice',
    options: [
      'Tous étaient clients',
      'La plupart étaient clients, quelques prospects',
      'Un mélange à peu près équilibré',
      'Majoritairement des prospects',
      'Je ne sais pas',
    ],
    priority: true,
  },
  {
    id: 'Q23',
    sectionId: 'visites',
    label:
      'Comment se déroulait une visite type ? Te présentais-tu au gérant, observais-tu discrètement, consommais-tu sur place ?',
    help: "Décris le déroulé concret, même banal. C’est ce qui donne de la chair au chapitre méthodologique.",
    type: 'long',
    priority: false,
  },
  {
    id: 'Q24',
    sectionId: 'visites',
    label: 'Notais-tu des choses systématiquement à chaque visite, ou selon ce qui te frappait ?',
    type: 'long',
    priority: false,
  },
  {
    id: 'Q25',
    sectionId: 'visites',
    label: 'As-tu pris des photos pendant tes visites ?',
    help: "Si oui, elles valent de l’or pour les annexes et pour la soutenance : dépose-les dans l’espace Fichiers. Si non, prends-en systématiquement lors des visites qui te restent.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q26',
    sectionId: 'visites',
    label:
      "Pourquoi certains établissements ont-ils été visités plusieurs fois — le Club de Pêche et le Club de l’Union quatre fois, Lagon 1 et l’Océanium trois fois ?",
    help: "L’hypothèse retenue est celle d’un choix méthodologique de vérification. Si c’était simplement le hasard des tournées, dis-le, ce sera reformulé.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q27',
    sectionId: 'visites',
    label: "As-tu rencontré des difficultés d’accès ? Refus, établissements fermés, accueil réticent ?",
    help: 'Utile pour le chapitre des limites et pour ton bilan personnel.',
    type: 'long',
    priority: false,
  },
  {
    id: 'Q28',
    sectionId: 'visites',
    label:
      "Trois établissements de ta liste n’ont pas de localisation : Chez Fatou, le Club Olympique et L’Adresse. Où se trouvent-ils ?",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q29',
    sectionId: 'visites',
    label: 'Y a-t-il des établissements importants du CHR dakarois qui ne figurent pas dans ta liste de 35 ?',
    help: 'Si oui, lesquels et pourquoi ont-ils été écartés ? Un jury peut connaître le terrain et remarquer une absence.',
    type: 'long',
    priority: false,
  },

  // ---------------------------------------------------------------- Section 2
  {
    id: 'Q30',
    sectionId: 'visibilite',
    group: "Vue d’ensemble",
    label:
      'De manière générale, comment décrirais-tu la présence visuelle de la SOBOA dans les établissements que tu as visités ? Forte, correcte, discrète, inexistante ?',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q31',
    sectionId: 'visibilite',
    group: "Vue d’ensemble",
    label: 'Quels types de supports SOBOA as-tu vus le plus souvent, et lesquels manquaient le plus ?',
    help: 'Enseignes, parasols, tables et chaises, réfrigérateurs et armoires froides, PLV, affiches, sous-bocks, menus, verres marqués.',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q32',
    sectionId: 'visibilite',
    group: "Vue d’ensemble",
    label: "L’état du matériel installé était-il globalement bon ? As-tu vu des supports abîmés, décolorés, obsolètes ?",
    help: "Un support dégradé est pire que pas de support : il travaille contre la marque. Si tu te souviens d’exemples précis, cite-les.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q33',
    sectionId: 'visibilite',
    group: "Vue d’ensemble",
    label:
      'Le matériel de froid aux couleurs SOBOA contenait-il bien des produits SOBOA, ou aussi ceux de la concurrence ?',
    help: 'Classique du CHR et très parlant dans un rapport. Un réfrigérateur de marque rempli de produits concurrents est un constat fort.',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q34',
    sectionId: 'visibilite',
    group: "Vue d’ensemble",
    label:
      'Tes notes signalent Le Bideew, Le Kermel et Le Viking comme équipés en RAF et PLV. Que recouvre exactement le sigle RAF ?',
    help: "Il est provisoirement traduit par « matériel de froid » dans le rapport. Confirme ou corrige.",
    type: 'short',
    priority: true,
  },
  {
    id: 'Q35',
    sectionId: 'visibilite',
    group: "Vue d’ensemble",
    label: "D’autres établissements sont-ils équipés en matériel de froid ou en PLV, en dehors de ces trois ?",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q36',
    sectionId: 'visibilite',
    group: 'Les produits',
    label:
      'Tes notes citent Bideew et 33 Export parmi les bières. Ces deux marques appartiennent-elles bien au portefeuille SOBOA ?',
    help: "Elles n’apparaissent pas sur le site institutionnel. Attention aussi à ne pas confondre la bière Bideew et l’établissement Le Bideew de l’Institut français.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q37',
    sectionId: 'visibilite',
    group: 'Les produits',
    label:
      'Quelle est la gamme complète que la SOBOA commercialise dans le circuit CHR ? Liste tout, bières et boissons gazeuses.',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q38',
    sectionId: 'visibilite',
    group: 'Les produits',
    label: 'Quels conditionnements existent pour chaque produit ? Fût, bouteille consignée, canette, formats.',
    help: "Tes notes mentionnent une « petite bouteille » de Flag chez Lagon 1 : quel format exactement ?",
    type: 'long',
    priority: false,
  },
  {
    id: 'Q39',
    sectionId: 'visibilite',
    group: 'Les produits',
    label: 'Combien de références SOBOA un établissement propose-t-il en moyenne ? Et le Viking, combien exactement ?',
    help: "C’est la donnée qui permet de tester l’hypothèse centrale du rapport : la largeur de gamme référencée serait corrélée à la performance.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q40',
    sectionId: 'visibilite',
    group: 'Les produits',
    label:
      'Sais-tu pourquoi le Viking est le seul à référencer toute la gamme ? Relation commerciale particulière, choix du gérant, historique ?',
    help: "Si tu comprends pourquoi ça marche là, tu sais quoi répliquer ailleurs. C’est le cœur de la première recommandation.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q41',
    sectionId: 'visibilite',
    group: 'Les produits',
    label:
      "Dans les établissements où la gamme est étroite, sais-tu pourquoi ? Manque de place, méconnaissance de l’offre, refus, rupture d’approvisionnement ?",
    type: 'long',
    priority: false,
  },

  // ---------------------------------------------------------------- Section 3
  {
    id: 'Q42',
    sectionId: 'concurrence',
    label: 'Dans combien des établissements visités as-tu vu Heineken ? Et Desperados ? Et Coca-Cola ?',
    help: "Même un ordre de grandeur — « à peu près la moitié », « presque partout » — suffit pour commencer. Le chiffre exact viendra de la grille de relevé.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q43',
    sectionId: 'concurrence',
    label: 'Quels supports de visibilité concurrents as-tu vus ? Enseignes, parasols, mobilier, matériel de froid, PLV ?',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q44',
    sectionId: 'concurrence',
    label: 'Le matériel concurrent était-il en meilleur état que celui de la SOBOA, équivalent, ou moins bon ?',
    help: "Question centrale du diagnostic comparatif. Réponds même à l’impression.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q45',
    sectionId: 'concurrence',
    label: 'Y a-t-il des établissements où la concurrence est nettement plus visible que la SOBOA ? Lesquels ?',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q46',
    sectionId: 'concurrence',
    label: "À l’inverse, des établissements où la SOBOA domine visuellement ?",
    type: 'long',
    priority: false,
  },
  {
    id: 'Q47',
    sectionId: 'concurrence',
    label:
      "As-tu vu ou entendu parler d’animations, d’opérations promotionnelles ou d’événements organisés par les concurrents ?",
    help: 'Soirées de marque, hôtesses, dégustations, jeux, dotations exceptionnelles.',
    type: 'long',
    priority: false,
  },
  {
    id: 'Q48',
    sectionId: 'concurrence',
    label: "Sais-tu si des concurrents ont signé des contrats d’exclusivité avec certains établissements ?",
    help: "Point sensible mais déterminant. Un contrat d’exclusivité dans un établissement du top 10 serait une menace de premier ordre. Les gérants en parlent parfois plus facilement qu’on ne le croit.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q49',
    sectionId: 'concurrence',
    label:
      'Que disent les gérants quand tu les interroges sur les concurrents ? Sont-ils sollicités souvent ? Que leur propose-t-on ?',
    type: 'long',
    priority: false,
  },
  {
    id: 'Q50',
    sectionId: 'concurrence',
    label: 'Depuis quand Heineken est-il présent au Sénégal, et comment ? Importation, production locale, partenariat ?',
    type: 'long',
    priority: false,
  },
  {
    id: 'Q51',
    sectionId: 'concurrence',
    label:
      'Y a-t-il d’autres concurrents que tes notes ne mentionnent pas ? Marques importées, brasseries artisanales, autres embouteilleurs ?',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q52',
    sectionId: 'concurrence',
    label: 'Selon ton service commercial, quelle est la part de marché de la SOBOA dans le circuit CHR de Dakar ?',
    help: "Même une estimation grossière permet de chiffrer l’enjeu du business case.",
    type: 'long',
    priority: true,
  },

  // ---------------------------------------------------------------- Section 4
  {
    id: 'Q53',
    sectionId: 'implantation',
    label: "Pourquoi les établissements des Almadies n’ont-ils pas été visités ?",
    help: "Question à trancher en priorité absolue. Soit tu n’y es pas encore allée pour des raisons de planning, et c’est une limite méthodologique à corriger. Soit la SOBOA n’y est pas présente commercialement, et c’est alors le résultat central de ton étude : un territoire premium laissé à la concurrence. La vérification prend une demi-journée : demande le fichier client de la direction commerciale.",
    type: 'choice',
    options: [
      "Manque de temps, c’était prévu pour plus tard",
      "Ils ne sont pas clients de la SOBOA, donc pas dans le périmètre qu’on m’a donné",
      "Ils sont clients mais je n’y suis pas encore allée",
      "La zone n’était pas dans mon périmètre de mission",
      'Je ne sais pas',
    ],
    priority: true,
  },
  {
    id: 'Q54',
    sectionId: 'implantation',
    label: 'La SOBOA compte-t-elle des clients aux Almadies ? Si oui, lesquels ?',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q55',
    sectionId: 'implantation',
    label: 'Même question pour Yoff, où Le Tandem est identifié sans avoir été visité.',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q56',
    sectionId: 'implantation',
    label:
      'Comment décrirais-tu les établissements des Almadies par rapport à ceux du Plateau et de la Corniche ? Clientèle, prix, ambiance, positionnement.',
    help: "Même de mémoire ou par réputation. Cela permet d’étayer l’argument du potentiel de la zone.",
    type: 'long',
    priority: false,
  },
  {
    id: 'Q57',
    sectionId: 'implantation',
    label: "As-tu prévu d’y aller avant la fin de ton stage ?",
    help: "Si oui, c’est la priorité terrain numéro un. Si tu ne dois faire qu’une chose des semaines qui restent, fais celle-là.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q58',
    sectionId: 'implantation',
    label:
      'Parmi les établissements que tu as visités, lesquels te semblent avoir du potentiel sans être correctement équipés ?',
    help: "Ton impression de terrain vaut ici autant qu’un tableau. Cite des noms.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q59',
    sectionId: 'implantation',
    label: "À l’inverse, y a-t-il des établissements très équipés mais qui écoulent peu ? Du matériel immobilisé sans contrepartie ?",
    help: "Constat rare dans les rapports d’étudiants et très apprécié : il montre que tu regardes le rendement de l’investissement, pas seulement sa présence.",
    type: 'long',
    priority: false,
  },
  {
    id: 'Q60',
    sectionId: 'implantation',
    label: "Y a-t-il des zones de Dakar où la SOBOA est absente et qui mériteraient d’être travaillées ?",
    type: 'long',
    priority: false,
  },

  // ---------------------------------------------------------------- Section 5
  {
    id: 'Q61',
    sectionId: 'businesscase',
    group: 'Les coûts',
    label: 'Combien coûte une enseigne SOBOA, en FCFA ?',
    help: 'Toutes les questions de coût de cette section sont à poser au service marketing ou au service achats. Un ordre de grandeur suffit.',
    type: 'short',
    priority: true,
  },
  {
    id: 'Q62',
    sectionId: 'businesscase',
    group: 'Les coûts',
    label: 'Combien coûte un parasol ?',
    type: 'short',
    priority: true,
  },
  {
    id: 'Q63',
    sectionId: 'businesscase',
    group: 'Les coûts',
    label: 'Combien coûte un ensemble de mobilier de terrasse — tables et chaises ?',
    type: 'short',
    priority: true,
  },
  {
    id: 'Q64',
    sectionId: 'businesscase',
    group: 'Les coûts',
    label: 'Combien coûte un réfrigérateur ou une armoire froide ?',
    type: 'short',
    priority: true,
  },
  {
    id: 'Q65',
    sectionId: 'businesscase',
    group: 'Les coûts',
    label: 'Combien coûte un kit de PLV et d’affiches ?',
    type: 'short',
    priority: true,
  },
  {
    id: 'Q66',
    sectionId: 'businesscase',
    group: 'Les coûts',
    label: 'Combien coûte une animation en établissement — soirée, dégustation, hôtesses ?',
    type: 'long',
    priority: false,
  },
  {
    id: 'Q67',
    sectionId: 'businesscase',
    group: 'Les coûts',
    label: 'Quel est le budget visibilité CHR actuellement engagé par la SOBOA, sur une année ?',
    help: 'Permet de dimensionner des recommandations réalistes. Proposer un plan à 50 millions quand le budget annuel en fait 10 décrédibilise tout le rapport.',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q68',
    sectionId: 'businesscase',
    group: 'Les revenus',
    label: 'Quel est le prix de vente d’un fût, en FCFA ? Et sa contenance en litres ?',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q69',
    sectionId: 'businesscase',
    group: 'Les revenus',
    label: 'Quel est le prix de vente d’une bouteille, par format ?',
    type: 'long',
    priority: true,
  },
  {
    id: 'Q70',
    sectionId: 'businesscase',
    group: 'Les revenus',
    label: 'Quelle est la marge par hectolitre, ou le taux de marge par produit ?',
    help: "Sans cette donnée, le business case s’arrête au chiffre d’affaires et ne peut pas calculer de retour sur investissement.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q71',
    sectionId: 'businesscase',
    group: 'Les revenus',
    label: 'Quelle est la taille estimée du marché CHR de Dakar, en volume ou en valeur ?',
    type: 'long',
    priority: false,
  },
  {
    id: 'Q72',
    sectionId: 'businesscase',
    group: 'Les revenus',
    label: "Quelle part du chiffre d’affaires ou des volumes de la SOBOA le circuit CHR représente-t-il ?",
    help: "Ce chiffre transformerait toute l’argumentation d’ouverture du rapport, aujourd’hui purement qualitative.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q73',
    sectionId: 'businesscase',
    group: 'Les pratiques commerciales',
    label:
      "Comment la SOBOA décide-t-elle d’équiper un établissement ? Existe-t-il un seuil de volume, une contrepartie, un contrat ?",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q74',
    sectionId: 'businesscase',
    group: 'Les pratiques commerciales',
    label: "Le matériel est-il prêté, donné, ou vendu à l’établissement ?",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q75',
    sectionId: 'businesscase',
    group: 'Les pratiques commerciales',
    label: 'Existe-t-il un suivi du matériel installé ? Un inventaire, des visites de contrôle ?',
    help: "S’il n’y en a pas, c’est en soi une recommandation à formuler.",
    type: 'long',
    priority: false,
  },
  {
    id: 'Q76',
    sectionId: 'businesscase',
    group: 'Les pratiques commerciales',
    label: 'À quelle fréquence les commerciaux visitent-ils les établissements CHR ?',
    type: 'long',
    priority: false,
  },
  {
    id: 'Q77',
    sectionId: 'businesscase',
    group: 'Les pratiques commerciales',
    label:
      'Ton tuteur a-t-il exprimé des attentes précises sur tes recommandations ? Y a-t-il des sujets sensibles à éviter ou au contraire à creuser ?',
    help: "Utile de le savoir : un rapport qui recommande ce que l’entreprise a déjà écarté pour de bonnes raisons perd de sa crédibilité.",
    type: 'long',
    priority: true,
  },

  // ---------------------------------------------------------------- Section 6
  {
    id: 'Q78',
    sectionId: 'bilan',
    label: "Qu’est-ce que tu as appris à faire pendant ce stage que tu ne savais pas faire avant ?",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q79',
    sectionId: 'bilan',
    label: "Qu’est-ce qui a été le plus difficile ?",
    help: "Sois concrète. « Aborder un gérant qui n’a pas envie de me parler » vaut mieux que « la gestion du temps ».",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q80',
    sectionId: 'bilan',
    label: 'Comment as-tu surmonté ces difficultés ?',
    type: 'long',
    priority: false,
  },
  {
    id: 'Q81',
    sectionId: 'bilan',
    label: "Qu’est-ce qui t’a surprise, en bien ou en mal ?",
    type: 'long',
    priority: false,
  },
  {
    id: 'Q82',
    sectionId: 'bilan',
    label: "Avec le recul, qu’est-ce que tu ferais différemment si tu recommençais ce stage demain ?",
    help: "La question la plus importante de cette section. Les jurys valorisent fortement la lucidité méthodologique. Une réponse possible, si elle correspond à ce que tu ressens : formaliser une grille de relevé dès la première visite plutôt que tenir un carnet libre, et expliquer ce que cela a coûté en temps de reconstitution.",
    type: 'long',
    priority: true,
  },
  {
    id: 'Q83',
    sectionId: 'bilan',
    label: 'Ce stage a-t-il changé ta vision de ton projet professionnel ?',
    type: 'long',
    priority: false,
  },
  {
    id: 'Q84',
    sectionId: 'bilan',
    label:
      "Qu’est-ce que tu as compris du métier de commercial ou du marketing terrain que tu ne soupçonnais pas ?",
    type: 'long',
    priority: false,
  },
  {
    id: 'Q85',
    sectionId: 'bilan',
    label: 'Y a-t-il un moment, une rencontre ou une anecdote qui t’a marquée ?',
    help: 'Une anecdote bien racontée vaut trois paragraphes de généralités et rend le bilan vivant.',
    type: 'long',
    priority: false,
  },
];

export const questionsBySection = (sectionId: string): Question[] =>
  questions.filter((q) => q.sectionId === sectionId);

export const questionById = (id: string): Question | undefined =>
  questions.find((q) => q.id === id);
