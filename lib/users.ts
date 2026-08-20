import bcrypt from 'bcryptjs';
import { db } from './db';
import type { SessionUser } from './session';

/**
 * Gestion des comptes, côté serveur.
 *
 * Jusqu'ici les comptes ne se créaient qu'en ligne de commande
 * (`npm run db:user`). Le compte admin dispose désormais d'un vrai back-office :
 * ces fonctions en sont le socle, la route `/api/admin/users` ne fait que les
 * appeler après avoir vérifié le rôle.
 */

export type Role = SessionUser['role'];

export type Account = {
  username: string;
  role: Role;
  createdAt: string | null;
  /** Nombre de réponses et de fichiers portant ce nom, pour informer avant suppression. */
  answers: number;
  files: number;
};

/** Minuscules, sans espace : c'est ce que `authenticate` attend à la connexion. */
export function normaliseUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;

/** Message d'erreur, ou `null` si l'identifiant est acceptable. */
export function checkUsername(username: string): string | null {
  if (username === '') return "L'identifiant est obligatoire.";
  if (!USERNAME_PATTERN.test(username)) {
    return "L'identifiant doit faire 3 à 32 caractères : lettres non accentuées, chiffres, point, tiret ou tiret bas, en commençant par une lettre ou un chiffre.";
  }
  return null;
}

/** Message d'erreur, ou `null` si le mot de passe est acceptable. */
export function checkPassword(password: string): string | null {
  if (password.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.';
  if (password.length > 200) return 'Mot de passe trop long (200 caractères maximum).';
  return null;
}

export function checkRole(role: string): role is Role {
  return role === 'admin' || role === 'contributor';
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function listAccounts(): Promise<Account[]> {
  const sql = db();
  const rows = (await sql`
    SELECT
      u.username,
      u.role,
      u.created_at,
      (SELECT count(*) FROM answers a WHERE a.updated_by = u.username) AS answers,
      (SELECT count(*) FROM files f WHERE f.uploaded_by = u.username) AS files
    FROM users u
    ORDER BY u.role, u.username
  `) as {
    username: string;
    role: Role;
    created_at: unknown;
    answers: string | number;
    files: string | number;
  }[];

  return rows.map((row) => ({
    username: row.username,
    role: row.role,
    createdAt: toIso(row.created_at),
    answers: Number(row.answers ?? 0),
    files: Number(row.files ?? 0),
  }));
}

export async function accountExists(username: string): Promise<boolean> {
  const sql = db();
  const rows = (await sql`SELECT 1 AS found FROM users WHERE username = ${username}`) as unknown[];
  return rows.length > 0;
}

export async function countAdmins(): Promise<number> {
  const sql = db();
  const rows = (await sql`SELECT count(*)::int AS n FROM users WHERE role = 'admin'`) as {
    n: number;
  }[];
  return rows[0]?.n ?? 0;
}

/**
 * Ce compte est-il le seul administrateur ? Le rétrograder ou le supprimer
 * fermerait la porte à clé de l'intérieur : plus personne ne pourrait
 * administrer le site sans repasser par la ligne de commande.
 */
export async function isLastAdmin(username: string): Promise<boolean> {
  const sql = db();
  const rows = (await sql`
    SELECT username FROM users WHERE role = 'admin'
  `) as { username: string }[];
  return rows.length === 1 && rows[0].username === username;
}

/** Crée le compte s'il n'existe pas, met à jour mot de passe et rôle sinon. */
export async function upsertAccount(
  username: string,
  password: string,
  role: Role,
): Promise<void> {
  const sql = db();
  const hash = await bcrypt.hash(password, 10);
  await sql`
    INSERT INTO users (username, password_hash, role)
    VALUES (${username}, ${hash}, ${role})
    ON CONFLICT (username) DO UPDATE
      SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
  `;
}

/** Change le rôle sans toucher au mot de passe. */
export async function setRole(username: string, role: Role): Promise<void> {
  const sql = db();
  await sql`UPDATE users SET role = ${role} WHERE username = ${username}`;
}

/**
 * Renomme un compte. Les réponses et les fichiers gardent trace de leur auteur
 * sous forme de texte : on les met à jour aussi, sinon l'historique désignerait
 * un compte qui n'existe plus.
 */
export async function renameAccount(from: string, to: string): Promise<void> {
  const sql = db();
  await sql`UPDATE users SET username = ${to} WHERE username = ${from}`;
  await sql`UPDATE answers SET updated_by = ${to} WHERE updated_by = ${from}`;
  await sql`UPDATE answer_revisions SET created_by = ${to} WHERE created_by = ${from}`;
  await sql`UPDATE grid_rows SET updated_by = ${to} WHERE updated_by = ${from}`;
  await sql`UPDATE files SET uploaded_by = ${to} WHERE uploaded_by = ${from}`;
}

/**
 * Supprime le compte. Les réponses, la grille et les fichiers ne sont jamais
 * supprimés avec lui : ce sont les données du rapport, pas celles du compte.
 */
export async function deleteAccount(username: string): Promise<void> {
  const sql = db();
  await sql`DELETE FROM users WHERE username = ${username}`;
}
