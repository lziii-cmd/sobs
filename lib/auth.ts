import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { SESSION_COOKIE, readSessionToken, type SessionUser } from './session';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Vérifie un couple identifiant / mot de passe contre la table `users`. */
export async function authenticate(
  username: string,
  password: string,
): Promise<SessionUser | null> {
  const sql = db();
  const rows = (await sql`
    SELECT username, password_hash, role FROM users WHERE username = ${username.trim().toLowerCase()}
  `) as { username: string; password_hash: string; role: 'admin' | 'contributor' }[];

  const user = rows[0];
  if (!user) return null;
  if (!(await verifyPassword(password, user.password_hash))) return null;
  return { username: user.username, role: user.role };
}

/** Utilisateur de la requête courante, ou `null` si la session est absente ou invalide. */
export async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Comme `currentUser`, mais lève une erreur si personne n'est connecté. */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new Error('NON_AUTHENTIFIE');
  return user;
}
