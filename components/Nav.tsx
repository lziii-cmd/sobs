'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = { username: string; role: 'admin' | 'contributor' };

const LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/formulaire', label: 'Questions' },
  { href: '/grille', label: 'Grille CHR' },
  { href: '/synthese', label: 'Synthèse' },
  { href: '/fichiers', label: 'Fichiers' },
];

export default function Nav({ username, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const links = role === 'admin' ? [...LINKS, { href: '/admin', label: 'Admin' }] : LINKS;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  async function logout() {
    setBusy(true);
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#e7e5de] bg-[#faf9f6]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="mr-2 font-bold tracking-tight text-sobs-700">
          SOBOA <span className="font-normal text-ink/50">· collecte</span>
        </Link>

        <nav className="flex flex-1 flex-wrap items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-2.5 py-1.5 text-sm ${
                isActive(link.href)
                  ? 'bg-sobs-100 font-semibold text-sobs-700'
                  : 'text-ink/70 hover:bg-sobs-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 text-sm text-ink/60">
          <span className="hidden sm:inline">{username}</span>
          <button onClick={logout} disabled={busy} className="btn btn-secondary !py-1 !text-xs">
            Se déconnecter
          </button>
        </div>
      </div>
    </header>
  );
}
