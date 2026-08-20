'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Account, Role } from '@/lib/users';

type Props = { initial: Account[]; me: string };

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administration',
  contributor: 'Contribution',
};

function humanDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function UsersPanel({ initial, me }: Props) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Formulaire de création / réinitialisation.
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('contributor');

  /** Un appel, un message : toutes les opérations passent par ici. */
  async function call(
    init: RequestInit & { url?: string },
    succes: (data: { accounts?: Account[]; created?: boolean; selfRenamed?: boolean }) => string,
  ) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(init.url ?? '/api/admin/users', {
        method: init.method,
        headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
        body: init.body,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? 'Opération impossible.');
        return;
      }

      if (Array.isArray(data.accounts)) setAccounts(data.accounts);
      setMessage(succes(data));
      router.refresh();
    } catch {
      setError('Pas de réseau — réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await call(
      {
        method: 'POST',
        body: JSON.stringify({ username, password, role }),
      },
      (data) => {
        setPassword('');
        const nom = username.trim().toLowerCase();
        if (data.created) {
          setUsername('');
          return `Compte « ${nom} » créé. Transmets-lui son mot de passe par un autre canal que le site.`;
        }
        return `Mot de passe de « ${nom} » réinitialisé. Sa session en cours reste ouverte.`;
      },
    );
  }

  async function changeRole(account: Account, next: Role) {
    await call(
      { method: 'PATCH', body: JSON.stringify({ username: account.username, role: next }) },
      () => `« ${account.username} » est désormais en ${ROLE_LABELS[next].toLowerCase()}.`,
    );
  }

  async function rename(account: Account) {
    const cible = window.prompt(
      `Nouvel identifiant pour « ${account.username} » :\n\nSes réponses et ses fichiers suivront le nouveau nom.`,
      account.username,
    );
    if (cible === null || cible.trim() === '' || cible.trim() === account.username) return;

    await call(
      { method: 'PATCH', body: JSON.stringify({ username: account.username, newUsername: cible }) },
      (data) =>
        data.selfRenamed
          ? `Ton compte s'appelle maintenant « ${cible.trim().toLowerCase()} ». Reconnecte-toi pour que le changement soit pris en compte partout.`
          : `Compte renommé en « ${cible.trim().toLowerCase()} ». La personne devra se reconnecter.`,
    );
  }

  async function remove(account: Account) {
    const confirme = window.confirm(
      [
        `Supprimer le compte « ${account.username} » ?`,
        '',
        `Ses ${account.answers} réponse(s) et ses ${account.files} fichier(s) sont conservés :`,
        "seul l'accès au site est retiré.",
      ].join('\n'),
    );
    if (!confirme) return;

    await call(
      { method: 'DELETE', url: `/api/admin/users?username=${encodeURIComponent(account.username)}` },
      () => `Compte « ${account.username} » supprimé. Ses contributions restent en base.`,
    );
  }

  const existe = accounts.some((a) => a.username === username.trim().toLowerCase());

  return (
    <div className="space-y-4">
      <div className="card divide-y divide-[#f0efe9]">
        {accounts.map((account) => (
          <div
            key={account.username}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-semibold">
                {account.username}
                {account.username === me && (
                  <span className="ml-2 text-xs font-normal text-ink/45">(toi)</span>
                )}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 align-middle text-[0.65rem] font-bold uppercase tracking-wide ${
                    account.role === 'admin'
                      ? 'bg-sobs-100 text-sobs-700'
                      : 'bg-[#f0efe9] text-ink/55'
                  }`}
                >
                  {ROLE_LABELS[account.role]}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-ink/45">
                {account.answers} réponse(s) · {account.files} fichier(s)
                {account.createdAt && ` · créé le ${humanDate(account.createdAt)}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => rename(account)}
                className="btn btn-secondary !py-1 !text-xs"
              >
                Renommer
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  changeRole(account, account.role === 'admin' ? 'contributor' : 'admin')
                }
                className="btn btn-secondary !py-1 !text-xs"
              >
                {account.role === 'admin' ? 'Passer en contribution' : 'Passer en administration'}
              </button>
              <button
                type="button"
                disabled={busy || account.username === me}
                onClick={() => remove(account)}
                title={
                  account.username === me
                    ? 'On ne supprime pas son propre compte.'
                    : 'Supprimer ce compte'
                }
                className="btn !py-1 !text-xs border-[#e6c9c9] bg-white text-red-700 hover:border-red-400"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="card space-y-3 p-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-ink/45">
          Créer un compte ou réinitialiser un mot de passe
        </h3>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block text-ink/60">Identifiant</span>
            <input
              className="field"
              value={username}
              autoComplete="off"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex. nourah"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink/60">Mot de passe</span>
            <input
              className="field"
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8 caractères minimum"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink/60">Rôle</span>
            <select className="field" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="contributor">Contribution</option>
              <option value="admin">Administration</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy} className="btn btn-primary">
            {existe ? 'Réinitialiser le mot de passe' : 'Créer le compte'}
          </button>
          {existe && (
            <span className="text-xs text-ink/50">
              « {username.trim().toLowerCase()} » existe déjà : son mot de passe et son rôle seront
              remplacés.
            </span>
          )}
        </div>

        {error && <p className="text-sm font-medium text-red-700">⚠ {error}</p>}
        {message && <p className="text-sm text-sobs-700">✓ {message}</p>}
      </form>

      <p className="text-xs text-ink/45">
        Le mot de passe n'est jamais affiché ni relisible après coup : il n'est stocké que sous forme
        chiffrée. En cas d'oubli, réinitialise-le ici.
      </p>
    </div>
  );
}
