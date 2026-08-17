import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'sobs_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 jours : pas de reconnexion permanente

export type SessionUser = {
  username: string;
  role: 'admin' | 'contributor';
};

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "SESSION_SECRET n'est pas défini (ou trop court). Renseigne une chaîne aléatoire d'au moins 32 caractères.",
    );
  }
  return new TextEncoder().encode(value);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.username)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function readSessionToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const role = payload.role;
    if (typeof payload.sub !== 'string') return null;
    if (role !== 'admin' && role !== 'contributor') return null;
    return { username: payload.sub, role };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
};
