import Link from 'next/link';
import { sections, questions } from '@/data/questions';
import { loadAnswers, loadGrid } from '@/lib/queries';
import { allProgress, globalProgress, isAnswered } from '@/lib/progress';
import { computeSynthese } from '@/lib/synthese';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [stored, grid] = await Promise.all([loadAnswers(), loadGrid()]);
  const answers = Object.fromEntries(
    Object.entries(stored).map(([id, a]) => [id, { value: a.value, flagged: a.flagged }]),
  );

  const global = globalProgress(answers);
  const perSection = allProgress(answers);
  const synthese = computeSynthese(grid);

  const nextQuestion =
    questions.find((q) => q.priority && !isAnswered(answers[q.id]?.value)) ??
    questions.find((q) => !isAnswered(answers[q.id]?.value));
  const nextSection = nextQuestion ? sections.find((s) => s.id === nextQuestion.sectionId) : undefined;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">Formulaire de collecte</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/65">
          Tu n’as pas à tout remplir d’un coup, ni dans l’ordre. Chaque réponse est enregistrée
          automatiquement dès que tu écris : tu peux fermer l’onglet et revenir plus tard, tout est
          conservé. Tu peux aussi revenir modifier ou compléter une réponse déjà donnée à tout moment.
        </p>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-ink/60">Avancement global</p>
            <p className="text-3xl font-bold text-sobs-700">
              {global.answered}
              <span className="text-lg font-normal text-ink/45"> / {global.total} questions</span>
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-ink/60">Questions prioritaires</p>
            <p className="text-xl font-semibold">
              {global.priorityAnswered} / {global.priorityTotal}
            </p>
          </div>
        </div>

        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-sobs-100">
          <div
            className="h-full rounded-full bg-sobs-600 transition-[width]"
            style={{ width: `${global.percent}%` }}
          />
        </div>

        {nextQuestion && nextSection && (
          <p className="mt-4 text-sm">
            <Link
              href={`/formulaire/${nextSection.id}#${nextQuestion.id}`}
              className="font-semibold text-sobs-700 underline underline-offset-4"
            >
              Reprendre à la question {nextQuestion.id}
            </Link>
            <span className="text-ink/50"> — {nextSection.title}</span>
          </p>
        )}

        {global.flagged > 0 && (
          <p className="mt-2 text-sm text-amber-800">
            {global.flagged} question{global.flagged > 1 ? 's' : ''} marquée
            {global.flagged > 1 ? 's' : ''} « à revoir ».
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Les sections</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {perSection.map((section) => {
            const percent = section.total === 0 ? 0 : Math.round((section.answered / section.total) * 100);
            return (
              <Link
                key={section.sectionId}
                href={`/formulaire/${section.sectionId}`}
                className="card block p-4 transition hover:border-sobs-500"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold">
                    <span className="mr-2 text-sobs-600">{section.number}</span>
                    {section.title}
                  </h3>
                  <span className="shrink-0 text-sm text-ink/50">
                    {section.answered}/{section.total}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sobs-100">
                  <div className="h-full rounded-full bg-sobs-500" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-2 text-xs text-ink/50">
                  {section.priorityTotal - section.priorityAnswered === 0
                    ? 'Toutes les prioritaires sont traitées'
                    : `${section.priorityTotal - section.priorityAnswered} prioritaire(s) restante(s)`}
                  {section.flagged > 0 && ` · ${section.flagged} à revoir`}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/grille" className="card block p-4 transition hover:border-sobs-500">
          <h3 className="font-semibold">Grille CHR</h3>
          <p className="mt-1 text-sm text-ink/60">
            {synthese.lignesRenseignees} ligne(s) renseignée(s) sur {synthese.totalEtablissements}{' '}
            établissements. C’est ce qui débloque le plus de chapitres du rapport.
          </p>
        </Link>
        <Link href="/fichiers" className="card block p-4 transition hover:border-sobs-500">
          <h3 className="font-semibold">Fichiers</h3>
          <p className="mt-1 text-sm text-ink/60">
            Photos de visite, organigramme, documents de travail — dans les deux sens.
          </p>
        </Link>
      </section>
    </div>
  );
}
