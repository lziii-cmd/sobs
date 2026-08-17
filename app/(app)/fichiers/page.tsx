import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { loadFiles } from '@/lib/queries';
import FilesPanel from '@/components/FilesPanel';

export const dynamic = 'force-dynamic';

export default async function FichiersPage() {
  const user = await currentUser();
  if (!user) redirect('/login');

  const files = await loadFiles();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight">Fichiers</h1>
        <p className="mt-2 max-w-3xl text-sm text-ink/65">
          Espace d’échange dans les deux sens : documents de travail d’un côté, photos de visite,
          organigramme et relevés de l’autre. Tout est stocké dans la base du site.
        </p>
      </header>

      <FilesPanel files={files} username={user.username} role={user.role} />
    </div>
  );
}
