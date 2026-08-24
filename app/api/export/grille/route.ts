import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { loadGrid } from '@/lib/queries';
import { buildGrilleXlsx } from '@/lib/xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Export de la grille au format Excel.
 *
 * Ouvert aux deux comptes, contrairement au PDF des réponses : la grille est un
 * document de travail partagé, et le fichier ne contient rien de plus que ce qui
 * est déjà affiché à l'écran.
 */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });

  try {
    const grid = await loadGrid();
    const generatedAt = new Date();
    const bytes = buildGrilleXlsx(grid, generatedAt);

    const stamp = generatedAt.toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': XLSX_MIME,
        'Content-Length': String(bytes.length),
        'Content-Disposition': `attachment; filename="grille-chr-soboa-${stamp}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('export grille', error);
    return NextResponse.json({ error: 'Génération du fichier Excel impossible.' }, { status: 500 });
  }
}
