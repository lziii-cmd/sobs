# SPEC.md — Spécifications du projet SOBS

Dernière mise à jour : 2026-08-23

## 1. OBJECTIF

Plateforme web privée à deux utilisateurs permettant de collecter, au fil de l'eau, les réponses
au questionnaire de l'étude SOBOA sur le circuit CHR de Dakar, puis d'exporter ces réponses en PDF
au format `question : réponse`.

> Historique de l'objectif : le projet a d'abord servi la rédaction d'un rapport de stage
> (« SOBOA — Formulaire de collecte », 85 questions). Le livrable est devenu une étude destinée à
> la direction de l'entreprise. Le questionnaire en ligne suit ce changement ; l'interface et le
> PDF ne parlent plus de rapport de stage mais d'étude.

Utilisateurs :
- **Admin** (le rédacteur de l'étude) : consulte les réponses, exporte le PDF, dépose des fichiers,
  administre les comptes depuis le site.
- **Contributrice** (la stagiaire) : répond aux questions quand elle veut, remplit la grille de
  relevé CHR, télécharge les fichiers déposés par l'admin et dépose les siens.

## 2. PÉRIMÈTRE FONCTIONNEL

| # | Fonctionnalité | Statut |
|---|----------------|--------|
| F1 | Authentification par identifiant + mot de passe, comptes créés par l'admin | stable |
| F2 | Questionnaire à sauvegarde automatique par question | stable |
| F3 | Reprise à tout moment : réponses rechargées, progression affichée par section | stable |
| F4 | Grille de relevé CHR : 35 établissements × 13 colonnes, éditable en ligne, sauvegarde cellule par cellule | stable |
| F5 | Espace fichiers bidirectionnel : upload et téléchargement par les deux comptes, fichiers stockés en base | stable |
| F6 | Export PDF des réponses (`question : réponse`), réservé à l'admin | stable |
| F7 | Persistance permanente des réponses en base Postgres | stable |
| F8 | Historique des versions : chaque modification d'une réponse est conservée | stable |
| F9 | Marquage « à revoir » d'une question, sans toucher à la réponse | stable |
| F10 | Synthèse recalculée en direct à partir de la grille | stable |
| F11 | Export PDF limité aux questions ayant reçu une réponse | stable |
| F12 | Back-office d'administration : création, renommage, rôle, mot de passe, suppression de comptes depuis le site | stable |
| F13 | Tableau de bord admin et recherche filtrée dans les réponses | stable |
| F14 | Blocs de cadrage du document rendus au-dessus des questions qu'ils introduisent | stable |
| F15 | Renvoi de chapitre par question, affiché dans l'interface et repris dans le PDF | stable |
| F16 | Migration assistée à chaque changement de questionnaire (archive puis renumérotation) | stable |
| F17 | Remise à zéro des réponses, avec sauvegarde préalable | stable |

Hors périmètre : notifications par email, versionnage des réponses au-delà de l'historique simple,
export Word/Excel.

## 3. STACK TECHNIQUE

| Élément | Choix |
|---------|-------|
| Framework | Next.js 15 (App Router) + TypeScript + React 19 |
| Styles | Tailwind CSS 4 |
| Base de données | PostgreSQL hébergé sur Neon |
| Accès base | Requêtes SQL directes via le pilote Neon serverless en production, `pg` en local (pas d'ORM) |
| Schéma | Fichier `db/schema.sql` unique appliqué par `npm run db:setup` |
| Authentification | Mots de passe hachés (bcryptjs) + cookie de session JWT signé (jose), `httpOnly` |
| Génération PDF | `pdf-lib`, polices standard WinAnsi, normalisation des signes typographiques |
| Tests | Exécuteur natif `node --test` via `tsx` |
| Hébergement | Vercel (application) + Neon (base) |

Dépendances de production : `@neondatabase/serverless`, `bcryptjs`, `jose`, `next`, `pdf-lib`,
`pg`, `react`, `react-dom`.
Développement : `@tailwindcss/postcss`, `@types/*`, `dotenv`, `tailwindcss`, `tsx`, `typescript`.

## 4. MODÈLE DE DONNÉES

- `users` — identifiant, hash du mot de passe, rôle (`admin` / `contributor`).
- `answers` — une ligne par question (`question_id` texte, ex. `Q42`), valeur texte,
  marqueur « à revoir », date de mise à jour, auteur.
- `answer_revisions` — une ligne par modification, pour conserver l'historique.
- `grid_rows` — une ligne par établissement : numéro, et les colonnes de relevé
  stockées en JSON pour pouvoir évoluer sans migration.
- `files` — nom, type MIME, taille, contenu encodé en base64, déposant, date.

Tables d'archive, créées par les scripts et jamais lues par l'application :
- `answers_v1` / `answer_revisions_v1` — état avant le passage au questionnaire v2.
- `answers_v2` / `answer_revisions_v2` — état avant le passage au questionnaire d'étude.
- `answers_archive` / `answer_revisions_archive` — s'empilent à chaque remise à zéro,
  chaque lot daté par `reset_at`.

## 5. LE QUESTIONNAIRE

Document source actuel : `Questionnaire_etude_SOBOA.docx` — **97 questions, 7 sections,
43 prioritaires**. Le compte par section est contrôlé par les tests contre le tableau
« Récapitulatif » du document.

| # | Section | Questions | Prioritaires |
|---|---------|-----------|--------------|
| 1 | La gamme référencée dans les grands comptes | 10 | 7 |
| 2 | Le dispositif d'équipement et le statut de partenaire | 8 | 5 |
| 3 | La concurrence | 10 | 7 |
| 4 | Relevé par établissement | 36 | 1 |
| 5 | Le marché et le périmètre | 9 | 5 |
| 6 | L'entreprise et son organisation | 11 | 8 |
| 7 | Les données économiques | 13 | 10 |

Particularités de ce document, par rapport aux précédents :
- Aucune case à cocher : toutes les questions attendent un texte.
- Chaque question peut porter un renvoi vers le chapitre de l'étude qu'elle alimente (61 sur 97).
- Quatre **blocs de cadrage** posent le constat sur lequel portent les questions qui suivent.
  Ils sont exportés dans `groups` et rendus dans un encadré, avant les questions concernées.
- La section 4 comporte une question par établissement du périmètre, plus une question sur
  `L'Hibiscus`, établissement cité par le document mais absent de la grille.

Historique des documents : formulaire v1 (85 questions, 7 sections) → questionnaire v2
(196 questions, 10 sections) → questionnaire d'étude (97 questions, 7 sections).

## 6. CONVENTIONS

- Langue de l'interface, des libellés, des commentaires et des messages de commit : français.
- Nommage : `camelCase` en TypeScript, `snake_case` en base de données.
- Les questions sont définies dans un fichier de données unique `data/questions.ts`
  (identifiant, section, groupe, intitulé, aide, renvoi de chapitre, type, caractère prioritaire) :
  c'est la source de vérité, aussi bien pour l'affichage que pour la génération du PDF.
  Ce fichier est une transposition fidèle du document source, jamais une réécriture.
- Gestion d'erreurs : les routes serveur renvoient `{ error: "message" }` avec un code HTTP
  explicite ; l'interface affiche l'échec d'une sauvegarde automatique au lieu de l'ignorer.
- **Tout script qui écrit ou efface en base est en simulation par défaut** et n'agit qu'avec
  `--apply`. Il affiche d'abord ce qu'il ferait, ligne par ligne.
- **Tout script destructif archive avant de supprimer**, et refuse de s'exécuter deux fois
  lorsque son archive existe déjà.
- Une table de correspondance entre deux numérotations est établie **intitulé par intitulé, à la
  main**, jamais par rapprochement automatique : une correspondance approximative vaut une
  réponse fausse. Chaque abandon porte sa raison.
- Styles partagés déclarés dans `app/globals.css` (`.field`, `.btn`, `.card`, `.constat`)
  plutôt que répétés en classes utilitaires.

## 7. VARIABLES D'ENVIRONNEMENT

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Chaîne de connexion Postgres Neon |
| `SESSION_SECRET` | Clé de signature des cookies de session (JWT HS256), 32 caractères minimum |
| `ALLOW_DESTRUCTIVE` | Facultatif. Lève le garde-fou de `smoke` et `test:http` sur une base distante |

## 8. COMMANDES

```bash
npm run dev                          # serveur de développement
npm run build                        # build de production
npm run typecheck                    # tsc --noEmit
npm test                             # 61 tests unitaires
npm run smoke                        # bout en bout contre la vraie base
npm run test:http                    # bout en bout HTTP, serveur lancé
npm run db:setup                     # applique db/schema.sql
npm run db:user -- <id> <mdp> <rôle> # crée ou réinitialise un compte
npm run db:migrate-etude             # migration du questionnaire (simulation)
npm run db:reset                     # remise à zéro des réponses (simulation)
```

## 9. CONTRAINTES ET RISQUES

- Taille maximale d'un fichier déposé : ~4 Mo (limite de charge utile des routes serveur Vercel).
  Les images sont redimensionnées côté navigateur avant envoi.
- Base Neon en offre gratuite : mise en veille après inactivité, d'où une latence au premier appel.
- Confidentialité : certaines données du questionnaire (chiffre d'affaires, volumes, marges) sont
  sensibles. Aucun accès anonyme, aucune indexation par les moteurs de recherche.
  Les documents source (`*.docx`, `*.xlsx`, `*.pdf`) sont exclus du dépôt par `.gitignore`.
- `.env.local` pointe sur la base de production : tout script lancé en local y écrit.
- Aucune intégration continue : les tests ne tournent pas automatiquement avant un déploiement.

## 10. À COMPLÉTER

- ~~Liste nominative des 35 établissements CHR~~ — **résolu** : reprise de
  `Grille_releve_CHR_SOBOA.xlsx` dans `data/establishments.ts`. Les trois localisations
  manquantes ont été comblées le 2026-08-23 (Chez Fatou et L'Adresse aux Almadies,
  Club Olympique à Mermoz).
- ~~Colonnes définitives de la grille de relevé CHR~~ — **résolu** : 13 colonnes dans
  `data/grid-columns.ts`, reprises des validations de données du fichier Excel.
- ~~Nom de domaine ou URL finale du site~~ — **résolu** : https://sobs-k9ch.vercel.app
- ~~Identifiants des deux comptes~~ — **résolu** : `admin` (administration) et `nourah`
  (contribution). Les mots de passe ne figurent nulle part dans le dépôt.
- [À COMPLÉTER] Zone et type de `L'Hibiscus`, cité par le questionnaire (Q64) mais absent des
  35 lignes de la grille. Une fois connu, décider s'il rejoint le périmètre.
- [À COMPLÉTER] Sort des trois familles de tables d'archive : à conserver indéfiniment,
  ou à purger une fois l'étude rendue.

## 11. SCORE DE SANTÉ

| Axe | Note | Justification |
|-----|------|---------------|
| Architecture | 8/10 | Séparation nette données / accès base / routes / interface. Source de vérité unique pour le questionnaire. Pas d'ORM, mais une couche de requêtes fine et cohérente. |
| Qualité code | 8/10 | Conventions tenues, commentaires qui expliquent le pourquoi. Reste du code mort : `'choice'` et `'multi'` n'ont plus d'usage. |
| Tests | 6/10 | 61 tests unitaires solides sur les données, l'avancement, la synthèse et le PDF, plus deux suites de bout en bout. Mais aucun test de composant, et le back-office n'est couvert que par `test:http`, qui ne tourne pas dans `npm test`. |
| Sécurité | 7/10 | Mots de passe hachés, session JWT `httpOnly`, middleware sur toutes les routes, contrôle de rôle côté serveur, dernier compte d'administration protégé. Point faible : `.env.local` pointe sur la production, une erreur de script écrit en prod. |
| Performance | 7/10 | Pages dynamiques, chargement complet des réponses à chaque rendu, 97 questions rendues d'un bloc. Suffisant à cette échelle, mais rien n'est mis en cache et Neon s'endort. |
| Maintenabilité | 7/10 | Les changements de questionnaire sont outillés et documentés, ce qui est le risque principal du projet. En face, trois familles de tables d'archive aux schémas voisins commencent à peser. |
| Infrastructure | 6/10 | Déploiement automatique Vercel + Neon, simple et fiable. Mais aucune intégration continue : rien n'empêche de déployer du code dont les tests échouent. |
| **Global** | **7/10** | Plateforme en service, qui fait ce qu'on lui demande et qui a absorbé trois changements de questionnaire sans perdre une réponse. Ce qui manque relève du filet de sécurité (CI, tests d'interface) plus que de la conception. |
