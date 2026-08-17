import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { questions, sections } from '@/data/questions';
import { loadAnswers, loadGrid } from '@/lib/queries';
import { globalProgress, isAnswered } from '@/lib/progress';
import { computeSynthese } from '@/lib/synthese';
import { formatDateFr } from '@/lib/text';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await currentUser();
  if (!user || user.role !== 'admin') notFound();

  const [stored, grid] = await Promise.all([loadAnswers(), loadGrid()]);
  const answers = Object.fromEntries(
    Object.entries(stored).map(([id, a]) => [id, { value: a.value, flagged: a.flagged }]),
  );
  const global = globalProgress(answers);
  const synthese = computeSynthese(grid);

  const recent = Object.entries(stored)
    .filter(([, a]) => a.updatedAt && a.value.trim() !== '')
    .sort((a, b) => (a[1].updatedAt! < b[1].updatedAt! ? 1 : -1))
    .slice(0, 10);

  const flagged = questions.filter((q) => stored[q.id]?.flagged);
  const missingPriority = questions.filter((q) => q.priority && !isAnswered(stored[q.id]?.value));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Vue admin</h1>
          <p className="mt-1 text-sm text-ink/60">
            {global.answered}/{global.total} réponses · {global.priorityAnswered}/
            {global.priorityTotal} prioritaires · {synthese.lignesRenseignees}/
            {synthese.totalEtablissements} lignes de grille
          </p>
        </div>
        <a href="/api/export/pdf" className="btn btn-primary">
          Télécharger le PDF des réponses
        </a>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Dernières modifications</h2>
          {recent.length === 0 ? (
            <p className="card p-4 text-sm text-ink/55">Aucune réponse enregistrée pour l’instant.</p>
          ) : (
            <ul className="card divide-y divide-[#f0efe9]">
              {recent.map(([id, answer]) => (
                <li key={id} className="px-4 py-2.5 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-sobs-700">{id}</span>
                    <span className="text-xs text-ink/45">
                      {formatDateFr(answer.updatedAt)} · {answer.updatedBy}
                      {answer.revisions > 1 && ` · ${answer.revisions} versions`}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-ink/70">{answer.value}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold">
              Marquées « à revoir » <span className="font-normal text-ink/45">({flagged.length})</span>
            </h2>
            {flagged.length === 0 ? (
              <p className="card p-4 text-sm text-ink/55">Rien en suspens.</p>
            ) : (
              <ul className="card divide-y divide-[#f0efe9]">
                {flagged.map((q) => (
                  <li key={q.id} className="px-4 py-2 text-sm">
                    <Link
                      href={`/formulaire/${q.sectionId}#${q.id}`}
                      className="text-sobs-700 underline underline-offset-2"
                    >
                      {q.id}
                    </Link>{' '}
                    <span className="text-ink/60">{q.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">
              Prioritaires sans réponse{' '}
              <span className="font-normal text-ink/45">({missingPriority.length})</span>
            </h2>
            <ul className="card divide-y divide-[#f0efe9] max-h-80 overflow-y-auto">
              {missingPriority.map((q) => (
                <li key={q.id} className="px-4 py-2 text-sm">
                  <Link
                    href={`/formulaire/${q.sectionId}#${q.id}`}
                    className="text-sobs-700 underline underline-offset-2"
                  >
                    {q.id}
                  </Link>{' '}
                  <span className="text-ink/60">{q.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Toutes les réponses</h2>
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id}>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink/45">
                {section.number} · {section.title}
              </h3>
              <div className="card divide-y divide-[#f0efe9]">
                {questions
                  .filter((q) => q.sectionId === section.id)
                  .map((q) => {
                    const answer = stored[q.id];
                    return (
                      <div key={q.id} className="px-4 py-3 text-sm">
                        <p className="font-medium">
                          <span className="mr-1.5 text-sobs-600">{q.id}.</span>
                          {q.label}
                        </p>
                        {answer && answer.value.trim() !== '' ? (
                          <p className="mt-1 whitespace-pre-wrap text-ink/75">{answer.value}</p>
                        ) : (
                          <p className="mt-1 italic text-ink/35">Sans réponse</p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
