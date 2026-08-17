import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { loadAnswers, loadGrid } from '@/lib/queries';
import { buildPdf } from '@/lib/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Session expirée.' }, { status: 401 });
  if (user.role !== 'admin') {
    return NextResponse.json({ error: "L'export est réservé au compte admin." }, { status: 403 });
  }

  try {
    const [answers, grid] = await Promise.all([loadAnswers(), loadGrid()]);
    const generatedAt = new Date();
    const bytes = await buildPdf({ answers, grid, generatedAt });

    const stamp = generatedAt.toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(bytes.length),
        'Content-Disposition': `attachment; filename="reponses-soboa-${stamp}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('export pdf', error);
    return NextResponse.json({ error: 'Génération du PDF impossible.' }, { status: 500 });
  }
}
