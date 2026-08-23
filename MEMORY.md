# MEMORY.md — Mémoire du projet

Dernière mise à jour : 2026-08-23

## CONTEXTE ACTUEL
- Où on en est : plateforme livrée, déployée et en service sur
  https://sobs-k9ch.vercel.app (Vercel + Neon, redéploiement automatique à chaque push
  sur `main` de github.com/lziii-cmd/sobs). Les sept fonctionnalités de la v1 sont en
  production, plus un back-office d'administration ajouté en cours de route.
  Le questionnaire en ligne est celui de `Questionnaire_etude_SOBOA.docx` : 97 questions,
  7 sections, 43 prioritaires. La base a été remise à zéro le 2026-08-23 à la demande :
  aucune réponse active, la collecte repart de zéro sur le nouveau document.
- Dernière fonctionnalité travaillée : mise en avant des blocs de cadrage (« rappel du
  constat ») au-dessus des questions qu'ils introduisent — livrée et vérifiée en production
  par capture d'écran.
- Prochaine fonctionnalité prévue : aucune annoncée. En attente des réponses de la
  contributrice sur le nouveau questionnaire.
- Problèmes ouverts :
  - Les trois archives en base (`answers_v1` 37 lignes, `answers_v2` 46, `answers_archive` 8)
    n'ont pas été supprimées. Leur suppression est la seule opération irréversible du projet ;
    elle attend une demande explicite.
  - `L'Hibiscus` est cité par le questionnaire (Q64, et dans le rappel du constat de la
    section 2 comme établissement équipé) mais ne figure pas dans les 35 lignes de la grille.
    Sa zone et son type sont à déterminer.
  - Aucune vérification visuelle n'est possible côté assistant : tout le site est derrière
    l'authentification et aucun compte de test n'existe.

## DÉCISIONS TECHNIQUES
| Date | Décision | Pourquoi | Alternative écartée |
|------|----------|----------|---------------------|
| 2026-08-17 | Next.js (App Router) déployé sur Vercel, base Postgres Neon | Un seul repo, un seul déploiement, base gratuite sans expiration | Front Vercel + API Render (2 déploiements, CORS, base Render qui expire à 30 j) ; tout sur Render (instance gratuite qui s'endort) |
| 2026-08-17 | Auth par identifiant + mot de passe, 2 comptes créés en ligne de commande par l'admin | Pas d'inscription publique, pas d'envoi d'emails, périmètre fermé à 2 personnes | Lien secret + code ; lien magique par email (nécessite Resend) |
| 2026-08-17 | Fichiers stockés directement en base (colonne `bytea`) | Demande explicite : « upload des fichiers sur la base » ; pas de service de stockage supplémentaire à gérer | Vercel Blob / S3 |
| 2026-08-17 | Échange de fichiers dans les deux sens | Le formulaire demande explicitement à la contributrice des photos (Q25) et l'organigramme (Q16) | Sens unique admin → contributrice |
| 2026-08-17 | Grille CHR (35 établissements) intégrée au site dès la v1 | Choix de l'utilisateur ; c'est le livrable qui débloque le plus de chapitres du rapport | Rester sur un fichier Excel échangé |
| 2026-08-20 | Le PDF n'imprime que les questions ayant reçu une réponse | Demande explicite. Un export de 196 mentions « Sans réponse » n'est pas un document exploitable | Garder toutes les questions avec la mention « Sans réponse » |
| 2026-08-20 | Back-office complet plutôt qu'un simple compte nominatif | Choix de l'utilisateur face aux quatre options proposées : gestion des comptes depuis le site, sans ligne de commande | Renommer le compte `admin` ; cloisonner davantage les permissions |
| 2026-08-20 | Le dernier compte d'administration ne peut être ni rétrogradé ni supprimé | Sans ce garde-fou, une fausse manœuvre depuis le back-office enferme dehors définitivement | Se fier à la vigilance de l'utilisateur |
| 2026-08-20 | Chaque changement de questionnaire passe par un script de migration dédié, archive d'abord | Les numérotations se recouvrent d'un document à l'autre : sans table de correspondance, `Q42` s'afficherait sous une question sans rapport | Repartir de zéro à chaque changement ; renuméroter à la main |
| 2026-08-20 | Table de correspondance établie intitulé par intitulé, à la main | Une correspondance approximative vaut une réponse fausse attribuée à la mauvaise question | Rapprochement automatique par similarité de texte |
| 2026-08-23 | Les blocs de cadrage sont rendus dans un encadré à filet vert, pas en texte courant | Sans le constat, les questions de la section 1 sont incompréhensibles : la personne qui répond doit le lire avant elles | Les laisser en petit texte gris sous l'intertitre |
| 2026-08-23 | La remise à zéro est un script versionné, pas une commande jetable | Le questionnaire a déjà changé trois fois ; l'opération se represente | `DELETE FROM answers` à la main |

## CE QUI A ÉTÉ FAIT
| Date | Fonctionnalité | Statut | Notes |
|------|----------------|--------|-------|
| 2026-08-17 | Lecture et inventaire du formulaire source | fait | 85 questions, 7 sections, 5 questions à cases à cocher (Q5, Q6, Q19, Q22, Q53), ~45 marquées PRIORITAIRE |
| 2026-08-17 | Plateforme v1 complète (F1 à F7) | stable | Auth, formulaire à sauvegarde automatique, reprise, grille CHR, fichiers bidirectionnels, export PDF, persistance Neon |
| 2026-08-19 | Historique des versions des réponses | stable | Table `answer_revisions`, une ligne par modification |
| 2026-08-20 | Questionnaire v2 (196 questions, 10 sections) | remplacé | Migration v1 → v2 appliquée en production : 33 réponses reprises, 4 archivées |
| 2026-08-20 | PDF limité aux questions répondues | stable | Sections et groupes entièrement vides non imprimés |
| 2026-08-20 | Back-office d'administration | stable | Création, renommage, rôle, mot de passe, suppression de comptes depuis le site ; tableau de bord ; recherche dans les réponses |
| 2026-08-23 | Questionnaire d'étude (97 questions, 7 sections) | stable | `Questionnaire_etude_SOBOA.docx`. Migration v2 → étude appliquée : 8 réponses reposées, 38 archivées |
| 2026-08-23 | Zones des établissements corrigées | stable | Chez Fatou et L'Adresse aux Almadies, Club Olympique à Mermoz. Plus aucun « À localiser » |
| 2026-08-23 | Renvois de chapitre par question | stable | 61 questions sur 97 portent leur renvoi, affiché sous l'intitulé et repris dans le PDF |
| 2026-08-23 | Blocs de cadrage mis en avant | stable | Encadré à filet vert au-dessus des questions introduites, vérifié en production |
| 2026-08-23 | Script de remise à zéro | stable | `npm run db:reset`, simulation par défaut, sauvegarde avant suppression |
| 2026-08-23 | Remise à zéro appliquée en production | fait | 8 réponses et 97 révisions retirées, grille vidée, comptes et fichiers conservés |

## PROBLÈMES RENCONTRÉS & SOLUTIONS
| Date | Problème | Cause | Solution appliquée |
|------|----------|-------|--------------------|
| 2026-08-17 | Impossible d'extraire le texte de `Support soboa chr.pdf` | PDF d'une seule page contenant une image scannée, sans couche texte | Contournement : contenu à récupérer autrement (liste des établissements à fournir manuellement) |
| 2026-08-19 | Les dates remontaient différemment selon l'environnement | `pg` construit des objets `Date`, le pilote Neon renvoie des chaînes | Normalisation en ISO dans `lib/queries.ts` (`toIso`) |
| 2026-08-20 | Le marqueur `●` du document ne s'encode pas en WinAnsi | Les polices standard du PDF ne couvrent pas ce caractère | Marqueur textuel équivalent (`· PRIORITAIRE`) et `sanitizeForPdf` pour le reste |
| 2026-08-20 | Un changement de questionnaire réattribue les réponses à des questions sans rapport | Les numérotations se recouvrent : `Q42` ne désigne pas la même chose d'un document à l'autre | Table de correspondance manuelle + script qui archive avant de réécrire, et refuse de s'exécuter deux fois |
| 2026-08-23 | La liste des réponses en base avait changé entre la simulation et l'application | La contributrice avait répondu à 13 questions de plus entre-temps | Relance de la simulation juste avant l'application ; `Q140 → Q24` ajoutée à la table après relecture |
| 2026-08-23 | Les blocs de cadrage passaient inaperçus | Rendus en petit texte gris, indistincts du reste de la page | Classe `.constat` : fond vert clair, filet vertical, texte à pleine opacité |

## POINTS DE VIGILANCE
- Limite Vercel : une requête vers une route serveur ne peut pas dépasser ~4,5 Mo.
  Tout upload de fichier doit être plafonné en dessous, avec compression des images côté navigateur.
- Neon en offre gratuite met la base en veille : prévoir une latence au premier appel après inactivité.
- Les accents français doivent être vérifiés dans le PDF généré (encodage de police).
- Les réponses ne doivent jamais être perdues : la sauvegarde automatique doit être visible à l'écran
  et une réponse déjà enregistrée ne doit jamais être écrasée par une valeur vide au rechargement.
- Données potentiellement confidentielles (CA, volumes, marges — cf. Q19 du formulaire) :
  le site n'est accessible qu'authentifié, et rien ne doit être indexable.
- `.env.local` pointe sur la base de **production**. Tout script lancé en local écrit donc en prod.
  `scripts/guard.ts` protège `smoke` et `test:http` ; les scripts de migration et de remise à zéro
  se protègent autrement, par une simulation obligatoire avant `--apply`.
- Avant d'appliquer une migration ou une remise à zéro, relancer la simulation : la contributrice
  peut avoir répondu entre-temps. C'est arrivé le 2026-08-23.
- Le questionnaire a déjà changé trois fois. Toute liste d'identifiants figée en dur dans le code
  ou les tests (`scripts/smoke.ts`, `scripts/http-test.ts`) doit être revue à chaque changement.
- Aucune vérification visuelle n'est possible sans compte : le build vert ne prouve pas le rendu.
  Demander une capture d'écran après un changement d'interface.

## DETTE TECHNIQUE EN COURS
| Priorité | Problème | Impact | Effort |
|----------|----------|--------|--------|
| Moyenne | Trois tables d'archive (`answers_v1`, `answers_v2`, `answers_archive`) aux schémas voisins mais distincts | Lecture de l'historique malaisée ; un quatrième changement de questionnaire en ajouterait une | M |
| Moyenne | `QuestionType` conserve `'choice'` et `'multi'`, et `QuestionField` leur code, alors qu'aucune question ne les utilise plus | Code mort maintenu au cas où le document redonnerait des cases à cocher | S |
| Basse | Aucun test de bout en bout ne couvre le back-office d'administration hors `test:http` | Une régression sur la gestion des comptes ne serait pas vue par `npm test` | M |
| Basse | La grille (35 établissements) et la section 4 du questionnaire (36 questions) décrivent les mêmes lieux sans lien entre elles | Double saisie possible, aucune navigation de l'une vers l'autre | M |

## NOTES DE SESSION
- 2026-08-17 : session de cadrage. Lecture du formulaire source, choix de la stack
  (Next.js + Vercel + Neon), du mode d'authentification et du périmètre v1.
  Plan d'implémentation présenté, en attente de validation avant tout code.
- 2026-08-20 : passage au questionnaire v2 (196 questions), PDF limité aux réponses,
  back-office d'administration. Migration v1 → v2 appliquée en production (33 reprises,
  4 archivées), code poussé, Vercel redéployé.
- 2026-08-23 : remplacement du questionnaire par celui de l'étude (97 questions, 7 sections).
  Migration v2 → étude appliquée (8 reposées, 38 archivées), zones des établissements corrigées,
  renvois de chapitre ajoutés, blocs de cadrage mis en avant, formulation « rapport de stage »
  remplacée par « étude » dans toute l'interface et le PDF. Remise à zéro complète des réponses
  à la demande, avec sauvegarde préalable. Rendu vérifié en production par capture d'écran.
  Reste en suspens : la suppression des trois archives, non déclenchée faute de demande explicite.
