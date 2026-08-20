# SOBS — Formulaire de collecte SOBOA

Site privé à deux comptes pour collecter, au fil de l'eau, les réponses au formulaire du rapport de
stage SOBOA, remplir la grille de relevé des 35 établissements CHR de Dakar, échanger des fichiers,
et exporter l'ensemble en PDF (`question : réponse`).

- **196 questions** réparties en 10 sections, sauvegarde automatique à la frappe
- **Historique des versions** : chaque modification d'une réponse est conservée
- **Grille de relevé** 35 établissements × 13 colonnes, sauvegarde cellule par cellule
- **Synthèse** recalculée en direct à partir de la grille
- **Fichiers** dans les deux sens, stockés en base, photos réduites automatiquement
- **Export PDF** réservé au compte d'administration, limité aux questions répondues
- **Back-office** : gestion des comptes depuis le site (création, renommage, rôle, mot de passe)

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · PostgreSQL (Neon) · pdf-lib
Hébergement : Vercel + Neon.

## Mise en route en local

```bash
npm install
cp .env.example .env.local   # puis renseigner DATABASE_URL et SESSION_SECRET
npm run db:setup             # crée les tables
npm run db:user -- admin "motdepasse" admin
npm run db:user -- nourah "motdepasse" contributor
npm run dev
```

En local, `DATABASE_URL` peut pointer vers n'importe quel Postgres ; en production vers Neon.
Le pilote est choisi automatiquement selon l'hôte de la chaîne de connexion.

## Comptes

Le premier compte d'administration se crée en ligne de commande :

```bash
npm run db:user -- admin "motdepasse" admin
```

Ensuite, tout se fait depuis la page **Administration** du site : créer un compte, le renommer,
changer son rôle, réinitialiser un mot de passe, le supprimer. Le dernier compte d'administration
ne peut être ni rétrogradé ni supprimé, pour ne pas se retrouver enfermé dehors.

## Passage du formulaire v1 au questionnaire v2

Le questionnaire est passé de 85 à 196 questions, avec une numérotation entièrement différente.
Les réponses déjà saisies sont conservées et remises sous leur nouveau numéro :

```bash
npm run db:migrate-v2            # simulation : affiche ce qui serait fait, n'écrit rien
npm run db:migrate-v2 -- --apply # applique
```

L'application archive d'abord l'intégralité de l'existant dans `answers_v1` et
`answer_revisions_v1`, y compris les réponses sans équivalent en v2. La table de correspondance,
établie intitulé par intitulé, est dans `data/migration-v1.ts`. Le script refuse de s'exécuter
deux fois.

## Tests

```bash
npm test          # tests unitaires : questions, correspondance v1/v2, comptes, avancement, synthèse, PDF
npm run smoke     # bout en bout contre la vraie base (persistance, historique, PDF)
npm run test:http # bout en bout HTTP, serveur lancé (auth, autosave, grille, fichiers, comptes, export)
```

## Déploiement

### 1. Base de données — Neon

1. Créer un compte sur [neon.tech](https://neon.tech) (offre gratuite).
2. Créer un projet, région **Europe (Frankfurt)** — la plus proche de Dakar parmi les régions
   gratuites.
3. Copier la chaîne de connexion (bouton **Connect**, onglet **Node.js**), de la forme
   `postgresql://…@ep-….eu-central-1.aws.neon.tech/neondb?sslmode=require`.
4. En local, la mettre dans `.env.local` puis lancer :
   ```bash
   npm run db:setup
   npm run db:user -- admin "motdepasse" admin
   npm run db:user -- nourah "motdepasse" contributor
   ```

### 2. Application — Vercel

1. Créer un compte sur [vercel.com](https://vercel.com) et connecter GitHub.
2. **Add New… → Project**, importer le dépôt `sobs`.
3. Aucun réglage de build à changer (Next.js est détecté automatiquement).
4. Ajouter les deux variables d'environnement :
   | Nom | Valeur |
   |-----|--------|
   | `DATABASE_URL` | la chaîne de connexion Neon |
   | `SESSION_SECRET` | une longue chaîne aléatoire (32 caractères minimum) |
5. **Deploy**. L'URL obtenue est celle à envoyer.

Après chaque `git push`, Vercel redéploie tout seul.

## Variables d'environnement

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | Connexion PostgreSQL |
| `SESSION_SECRET` | Signature des cookies de session (JWT HS256) |

## Limites connues

- **4 Mo par fichier** : limite de charge utile des routes serveur Vercel. Les images sont
  redimensionnées côté navigateur avant l'envoi, ce qui suffit pour les photos de téléphone.
- **Base Neon en veille** après inactivité : le premier chargement peut prendre quelques secondes.
- **Pas d'inscription publique** : seuls les comptes créés par l'administration existent. Le tout
  premier compte d'administration passe forcément par `npm run db:user`.
- **Un renommage de compte oblige la personne à se reconnecter** : le cookie de session porte
  l'ancien identifiant tant qu'il n'est pas réémis.
- **Une réinitialisation de mot de passe ne ferme pas les sessions en cours** : la personne reste
  connectée sur ses appareils jusqu'à expiration du cookie.
