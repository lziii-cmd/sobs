# SPEC.md — Spécifications du projet SOBS

Dernière mise à jour : 2026-08-17

## 1. OBJECTIF

Plateforme web privée à deux utilisateurs permettant de collecter, au fil de l'eau, les réponses
au formulaire « SOBOA — Formulaire de collecte » (85 questions, 7 sections) nécessaire à la
rédaction d'un rapport de stage, puis d'exporter ces réponses en PDF au format `question : réponse`.

Utilisateurs :
- **Admin** (le rédacteur du rapport) : consulte les réponses, exporte le PDF, dépose des fichiers.
- **Contributrice** (la stagiaire) : répond aux questions quand elle veut, remplit la grille de
  relevé CHR, télécharge les fichiers déposés par l'admin et dépose les siens.

## 2. PÉRIMÈTRE FONCTIONNEL (v1)

| # | Fonctionnalité | Statut |
|---|----------------|--------|
| F1 | Authentification par identifiant + mot de passe, 2 comptes créés par l'admin en ligne de commande | à faire |
| F2 | Formulaire de 85 questions réparties en 7 sections, avec sauvegarde automatique par question | à faire |
| F3 | Reprise à tout moment : les réponses déjà saisies sont rechargées, progression affichée par section | à faire |
| F4 | Grille de relevé CHR : 35 établissements × colonnes de relevé, éditable en ligne, sauvegarde automatique | à faire |
| F5 | Espace fichiers bidirectionnel : upload et téléchargement par les deux comptes, fichiers stockés en base | à faire |
| F6 | Export PDF des réponses (`question : réponse`), réservé à l'admin | à faire |
| F7 | Persistance permanente des réponses en base Postgres | à faire |

Hors périmètre v1 : notifications par email, gestion de plus de deux comptes, versionnage des
réponses, export Word/Excel.

## 3. STACK TECHNIQUE

| Élément | Choix |
|---------|-------|
| Framework | Next.js (App Router) + TypeScript + React |
| Styles | Tailwind CSS |
| Base de données | PostgreSQL hébergé sur Neon |
| Accès base | Requêtes SQL directes via le pilote Neon serverless (pas d'ORM) |
| Schéma | Fichier `schema.sql` unique appliqué par un script `npm run db:setup` |
| Authentification | Mots de passe hachés (bcrypt) + cookie de session signé, `httpOnly` |
| Génération PDF | Bibliothèque PDF côté serveur, police embarquée pour les accents |
| Hébergement | Vercel (application) + Neon (base) |

## 4. MODÈLE DE DONNÉES

- `users` — identifiant, hash du mot de passe, rôle (`admin` / `contributor`).
- `answers` — une ligne par question (`question_id` texte, ex. `Q42`), valeur texte,
  date de mise à jour, auteur.
- `grid_rows` — une ligne par établissement : ordre, nom, zone, et les colonnes de relevé
  stockées en JSON pour pouvoir évoluer sans migration.
- `files` — nom, type MIME, taille, contenu binaire, déposant, date.

## 5. CONVENTIONS

- Langue de l'interface et des libellés : français.
- Nommage : `camelCase` en TypeScript, `snake_case` en base de données.
- Les 85 questions sont définies dans un fichier de données unique
  (identifiant, section, intitulé, aide, type, options, caractère prioritaire) : c'est la source
  de vérité, aussi bien pour l'affichage que pour la génération du PDF.
- Gestion d'erreurs : les routes serveur renvoient `{ error: "message" }` avec un code HTTP
  explicite ; l'interface affiche l'échec d'une sauvegarde automatique au lieu de l'ignorer.

## 6. VARIABLES D'ENVIRONNEMENT

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Chaîne de connexion Postgres Neon |
| `SESSION_SECRET` | Clé de signature des cookies de session |

## 7. CONTRAINTES ET RISQUES

- Taille maximale d'un fichier déposé : ~4 Mo (limite de charge utile des routes serveur Vercel).
  Les images sont redimensionnées côté navigateur avant envoi.
- Base Neon en offre gratuite : mise en veille après inactivité, d'où une latence au premier appel.
- Confidentialité : certaines données du formulaire (chiffre d'affaires, volumes, marges) peuvent
  être sensibles. Aucun accès anonyme, aucune indexation par les moteurs de recherche.

## 8. À COMPLÉTER

- [À COMPLÉTER] Liste nominative des 35 établissements CHR (11 seulement sont connus via le
  formulaire : Club de Pêche, Club de l'Union, Lagon 1, Océanium, Chez Fatou, Club Olympique,
  L'Adresse, Le Bideew, Le Kermel, Le Viking, Le Tandem).
- [À COMPLÉTER] Colonnes définitives de la grille de relevé CHR (une proposition est faite dans le
  plan d'implémentation, à valider).
- [À COMPLÉTER] Nom de domaine ou URL finale du site.
- [À COMPLÉTER] Identifiants des deux comptes.

## 9. SCORE DE SANTÉ

Non applicable : aucun code livré à ce jour.
