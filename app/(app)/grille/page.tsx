import Link from 'next/link';
import { loadGrid } from '@/lib/queries';
import GrilleTable from '@/components/GrilleTable';

export const dynamic = 'force-dynamic';

export default async function GrillePage() {
  const grid = await loadGrid();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight">Grille de relevé — circuit CHR de Dakar</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/65">
          Une ligne par établissement, 50 au total, dont sept restent à visiter aux Almadies.
          Remplis-la de mémoire pour les autres, même approximativement — une donnée incertaine
          signalée comme telle vaut mieux qu’une absence de donnée. La colonne « Fiabilité » sert
          justement à marquer ce qui reste à vérifier sur place, et « Visité » se coche une fois
          la visite faite.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-ink/55">
          Si tu manques de temps, remplis d’abord les colonnes marquées ● : Enseigne, Matériel de
          froid, PLV et Marques concurrentes. Ce sont elles qui portent le diagnostic.{' '}
          <Link href="/synthese" className="text-sobs-700 underline underline-offset-2">
            Voir la synthèse
          </Link>
          .
        </p>
        <p className="mt-3">
          <a href="/api/export/grille" className="btn btn-primary">
            Télécharger la grille (Excel)
          </a>
        </p>
      </header>

      <GrilleTable initial={grid} />
    </div>
  );
}
