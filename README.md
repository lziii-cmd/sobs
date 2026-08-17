# SOBS — Formulaire de collecte SOBOA

Site privé à deux comptes pour collecter, au fil de l'eau, les réponses au formulaire du rapport de
stage SOBOA, remplir la grille de relevé des 35 établissements CHR de Dakar, échanger des fichiers,
et exporter l'ensemble en PDF (`question : réponse`).

- **85 questions** réparties en 7 sections, sauvegarde automatique à la frappe
- **Historique des versions** : chaque modification d'une réponse est conservée
- **Grille de relevé** 35 établissements × 13 colonnes, sauvegarde cellule par cellule
- **Synthèse** recalculée en direct à partir de la grille
- **Fichiers** dans les deux sens, stockés en base, photos réduites automatiquement
- **Export PDF** réservé au compte admin

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

## Tests

```bash
npm test          # tests unitaires : questions, avancement, synthèse, PDF
npm run smoke     # bout en bout contre la vraie base (persistance, historique, PDF)
npm run test:http # bout en bout HTTP, serveur lancé (auth, autosave, grille, fichiers, export)
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
- Les deux comptes sont créés en ligne de commande ; il n'y a pas d'inscription ni de
  réinitialisation de mot de passe en ligne (rejouer `npm run db:user` suffit).
