# MEMORY.md — Mémoire du projet

Dernière mise à jour : 2026-08-17

## CONTEXTE ACTUEL
- Où on en est : projet vierge. Le dossier ne contenait que `Formulaire_collecte_SOBOA.docx`
  (85 questions, 7 sections) et `Support soboa chr.pdf` (1 page scannée, non extractible en texte).
  Phase 0 faite, Phase 1 sans objet (aucun code existant), décisions de stack validées.
  Plan d'implémentation (Phase 3) en attente de feu vert.
- Dernière fonctionnalité travaillée : aucune pour l'instant
- Prochaine fonctionnalité prévue : plateforme web de collecte des réponses (v1 complète)
- Problèmes ouverts :
  - La liste nominative des 35 établissements CHR n'est pas récupérable (le PDF support est une image).
    11 noms seulement sont connus via le formulaire.
  - Le fichier `Grille_releve_CHR_SOBOA.xlsx` évoqué dans le formulaire n'est pas présent dans le dossier :
    les colonnes de la grille sont à définir.

## DÉCISIONS TECHNIQUES
| Date | Décision | Pourquoi | Alternative écartée |
|------|----------|----------|---------------------|
| 2026-08-17 | Next.js (App Router) déployé sur Vercel, base Postgres Neon | Un seul repo, un seul déploiement, base gratuite sans expiration | Front Vercel + API Render (2 déploiements, CORS, base Render qui expire à 30 j) ; tout sur Render (instance gratuite qui s'endort) |
| 2026-08-17 | Auth par identifiant + mot de passe, 2 comptes créés en ligne de commande par l'admin | Pas d'inscription publique, pas d'envoi d'emails, périmètre fermé à 2 personnes | Lien secret + code ; lien magique par email (nécessite Resend) |
| 2026-08-17 | Fichiers stockés directement en base (colonne `bytea`) | Demande explicite : « upload des fichiers sur la base » ; pas de service de stockage supplémentaire à gérer | Vercel Blob / S3 |
| 2026-08-17 | Échange de fichiers dans les deux sens | Le formulaire demande explicitement à la contributrice des photos (Q25) et l'organigramme (Q16) | Sens unique admin → contributrice |
| 2026-08-17 | Grille CHR (35 établissements) intégrée au site dès la v1 | Choix de l'utilisateur ; c'est le livrable qui débloque le plus de chapitres du rapport | Rester sur un fichier Excel échangé |

## CE QUI A ÉTÉ FAIT
| Date | Fonctionnalité | Statut | Notes |
|------|----------------|--------|-------|
| 2026-08-17 | Lecture et inventaire du formulaire source | fait | 85 questions, 7 sections, 5 questions à cases à cocher (Q5, Q6, Q19, Q22, Q53), ~45 marquées PRIORITAIRE |

## PROBLÈMES RENCONTRÉS & SOLUTIONS
| Date | Problème | Cause | Solution appliquée |
|------|----------|-------|--------------------|
| 2026-08-17 | Impossible d'extraire le texte de `Support soboa chr.pdf` | PDF d'une seule page contenant une image scannée, sans couche texte | Contournement : contenu à récupérer autrement (liste des établissements à fournir manuellement) |

## POINTS DE VIGILANCE
- Limite Vercel : une requête vers une route serveur ne peut pas dépasser ~4,5 Mo.
  Tout upload de fichier doit être plafonné en dessous, avec compression des images côté navigateur.
- Neon en offre gratuite met la base en veille : prévoir une latence au premier appel après inactivité.
- Les accents français doivent être vérifiés dans le PDF généré (encodage de police).
- Les réponses ne doivent jamais être perdues : la sauvegarde automatique doit être visible à l'écran
  et une réponse déjà enregistrée ne doit jamais être écrasée par une valeur vide au rechargement.
- Données potentiellement confidentielles (CA, volumes, marges — cf. Q19 du formulaire) :
  le site n'est accessible qu'authentifié, et rien ne doit être indexable.

## DETTE TECHNIQUE EN COURS
| Priorité | Problème | Impact | Effort |
|----------|----------|--------|--------|
| — | Aucune pour l'instant (projet vierge) | — | — |

## NOTES DE SESSION
- 2026-08-17 : session de cadrage. Lecture du formulaire source, choix de la stack
  (Next.js + Vercel + Neon), du mode d'authentification et du périmètre v1.
  Plan d'implémentation présenté, en attente de validation avant tout code.
