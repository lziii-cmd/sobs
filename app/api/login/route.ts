import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let payload: { username?: string; password?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const username = (payload.username ?? '').trim();
  const password = payload.password ?? '';

  if (username === '' || password === '') {
    return NextResponse.json({ error: 'Identifiant et mot de passe obligatoires.' }, { status: 400 });
  }

  try {
    const user = await authenticate(username, password);
    if (!user) {
      return NextResponse.json({ error: 'Identifiant ou mot de passe incorrect.' }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true, user });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(user), sessionCookieOptions);
    return response;
  } catch (error) {
    console.error('login', error);
    return NextResponse.json(
      { error: "Connexion à la base impossible. Réessaie dans un instant." },
      { status: 500 },
    );
  }
}
