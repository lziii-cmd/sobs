import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import {
  accountExists,
  checkPassword,
  checkRole,
  checkUsername,
  deleteAccount,
  isLastAdmin,
  listAccounts,
  normaliseUsername,
  renameAccount,
  setRole,
  upsertAccount,
  type Role,
} from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Toutes les opérations de cette route sont réservées au compte admin. */
async function requireAdmin() {
  const user = await currentUser();
  if (!user) {
    return { user: null, refus: NextResponse.json({ error: 'Session expirée.' }, { status: 401 }) };
  }
  if (user.role !== 'admin') {
    return {
      user: null,
      refus: NextResponse.json({ error: "Réservé au compte d'administration." }, { status: 403 }),
    };
  }
  return { user, refus: null };
}

async function body<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function GET() {
  const { refus } = await requireAdmin();
  if (refus) return refus;

  try {
    return NextResponse.json({ accounts: await listAccounts() });
  } catch (error) {
    console.error('admin users list', error);
    return NextResponse.json({ error: 'Lecture des comptes impossible.' }, { status: 500 });
  }
}

/** Création d'un compte, ou réinitialisation du mot de passe d'un compte existant. */
export async function POST(request: Request) {
  const { refus } = await requireAdmin();
  if (refus) return refus;

  const payload = await body<{ username?: string; password?: string; role?: string }>(request);
  if (!payload) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });

  const username = normaliseUsername(payload.username ?? '');
  const password = payload.password ?? '';
  const role = payload.role ?? 'contributor';

  const erreurIdentifiant = checkUsername(username);
  if (erreurIdentifiant) return NextResponse.json({ error: erreurIdentifiant }, { status: 400 });

  const erreurMotDePasse = checkPassword(password);
  if (erreurMotDePasse) return NextResponse.json({ error: erreurMotDePasse }, { status: 400 });

  if (!checkRole(role)) {
    return NextResponse.json({ error: "Le rôle doit être « admin » ou « contributor »." }, { status: 400 });
  }

  try {
    const existait = await accountExists(username);

    if (existait && role !== 'admin' && (await isLastAdmin(username))) {
      return NextResponse.json(
        { error: "Impossible : c'est le dernier compte d'administration." },
        { status: 409 },
      );
    }

    await upsertAccount(username, password, role as Role);
    return NextResponse.json({ ok: true, created: !existait, accounts: await listAccounts() });
  } catch (error) {
    console.error('admin users upsert', error);
    return NextResponse.json({ error: 'Enregistrement du compte impossible.' }, { status: 500 });
  }
}

/** Changement de rôle, ou renommage. Le mot de passe n'est pas touché. */
export async function PATCH(request: Request) {
  const { user, refus } = await requireAdmin();
  if (refus) return refus;

  const payload = await body<{ username?: string; newUsername?: string; role?: string }>(request);
  if (!payload) return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });

  const username = normaliseUsername(payload.username ?? '');
  if (username === '' || !(await accountExists(username))) {
    return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
  }

  try {
    if (payload.role !== undefined) {
      if (!checkRole(payload.role)) {
        return NextResponse.json({ error: 'Rôle inconnu.' }, { status: 400 });
      }
      if (payload.role !== 'admin' && (await isLastAdmin(username))) {
        return NextResponse.json(
          { error: "Impossible : c'est le dernier compte d'administration." },
          { status: 409 },
        );
      }
      await setRole(username, payload.role);
    }

    if (payload.newUsername !== undefined) {
      const cible = normaliseUsername(payload.newUsername);
      const erreur = checkUsername(cible);
      if (erreur) return NextResponse.json({ error: erreur }, { status: 400 });
      if (cible !== username && (await accountExists(cible))) {
        return NextResponse.json(
          { error: `L'identifiant « ${cible} » est déjà pris.` },
          { status: 409 },
        );
      }
      if (cible !== username) await renameAccount(username, cible);

      // Le jeton de session porte l'ancien identifiant : il faut se reconnecter.
      return NextResponse.json({
        ok: true,
        renamed: cible,
        selfRenamed: user!.username === username,
        accounts: await listAccounts(),
      });
    }

    return NextResponse.json({ ok: true, accounts: await listAccounts() });
  } catch (error) {
    console.error('admin users patch', error);
    return NextResponse.json({ error: 'Modification du compte impossible.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { user, refus } = await requireAdmin();
  if (refus) return refus;

  const username = normaliseUsername(new URL(request.url).searchParams.get('username') ?? '');
  if (username === '') {
    return NextResponse.json({ error: 'Identifiant manquant.' }, { status: 400 });
  }
  if (username === user!.username) {
    return NextResponse.json({ error: 'On ne supprime pas son propre compte.' }, { status: 409 });
  }
  if (!(await accountExists(username))) {
    return NextResponse.json({ error: 'Compte introuvable.' }, { status: 404 });
  }

  try {
    if (await isLastAdmin(username)) {
      return NextResponse.json(
        { error: "Impossible : c'est le dernier compte d'administration." },
        { status: 409 },
      );
    }

    await deleteAccount(username);
    return NextResponse.json({ ok: true, accounts: await listAccounts() });
  } catch (error) {
    console.error('admin users delete', error);
    return NextResponse.json({ error: 'Suppression impossible.' }, { status: 500 });
  }
}
