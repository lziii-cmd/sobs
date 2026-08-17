import './env';
import bcrypt from 'bcryptjs';
import { db } from '../lib/db';

/**
 * Crée ou met à jour un compte. Deux syntaxes équivalentes, parce que PowerShell
 * ne transmet pas toujours les options longues à travers npm :
 *   npm run db:user -- nourah "motdepasse" contributor
 *   npm run db:user -- --username nourah --password "motdepasse" --role contributor
 * Rejouer la commande sur un identifiant existant réinitialise le mot de passe.
 */
const argv = process.argv.slice(2);
const flags: Record<string, string> = {};
const positional: string[] = [];

for (let i = 0; i < argv.length; i += 1) {
  const item = argv[i];
  if (item.startsWith('--')) {
    flags[item.slice(2)] = argv[i + 1] ?? '';
    i += 1;
  } else {
    positional.push(item);
  }
}

function arg(name: string, position: number): string | undefined {
  return flags[name] ?? positional[position];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL manquant. Renseigne-le dans .env.local.');
    process.exit(1);
  }

  const username = (arg('username', 0) ?? '').trim().toLowerCase();
  const password = arg('password', 1) ?? '';
  const role = (arg('role', 2) ?? 'contributor').trim();

  if (username === '' || password === '') {
    console.error('Usage : npm run db:user -- <identifiant> <motdepasse> [admin|contributor]');
    process.exit(1);
  }
  if (role !== 'admin' && role !== 'contributor') {
    console.error("Le rôle doit être 'admin' ou 'contributor'.");
    process.exit(1);
  }
  if (password.length < 6) {
    console.error('Mot de passe trop court (6 caractères minimum).');
    process.exit(1);
  }

  const sql = db();
  const hash = await bcrypt.hash(password, 10);

  await sql`
    INSERT INTO users (username, password_hash, role)
    VALUES (${username}, ${hash}, ${role})
    ON CONFLICT (username) DO UPDATE
      SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
  `;

  console.log(`Compte « ${username} » (${role}) prêt.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
