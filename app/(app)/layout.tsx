import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import Nav from '@/components/Nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect('/login');

  return (
    <>
      <Nav username={user.username} role={user.role} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-ink/40">
        Rapport de stage SOBOA — document de travail. Les réponses sont enregistrées automatiquement.
      </footer>
    </>
  );
}
