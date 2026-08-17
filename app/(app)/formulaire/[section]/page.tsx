import Link from 'next/link';
import { notFound } from 'next/navigation';
import { questions, sections } from '@/data/questions';
import { loadAnswers } from '@/lib/queries';
import { sectionProgress } from '@/lib/progress';
import QuestionField from '@/components/QuestionField';

export const dynamic = 'force-dynamic';

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section: sectionId } = await params;
  const section = sections.find((s) => s.id === sectionId);
  if (!section) notFound();

  const stored = await loadAnswers();
  const answers = Object.fromEntries(
    Object.entries(stored).map(([id, a]) => [id, { value: a.value, flagged: a.flagged }]),
  );
  const progress = sectionProgress(answers, section.id);
  const list = questions.filter((q) => q.sectionId === section.id);

  const index = sections.findIndex((s) => s.id === section.id);
  const previous = sections[index - 1];
  const next = sections[index + 1];

  let currentGroup: string | undefined;

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1.5">
        {sections.map((s) => (
          <Link
            key={s.id}
            href={`/formulaire/${s.id}`}
            className={`rounded-md px-2 py-1 text-xs ${
              s.id === section.id
                ? 'bg-sobs-600 font-semibold text-white'
                : 'bg-white text-ink/60 ring-1 ring-[#e7e5de] hover:ring-sobs-500'
            }`}
          >
            {s.number} · {s.title.replace(/^Mission \d+ — /, '')}
          </Link>
        ))}
      </nav>

      <header>
        <h1 className="text-xl font-bold tracking-tight">
          <span className="mr-2 text-sobs-600">{section.number}</span>
          {section.title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-ink/60">{section.intro}</p>
        <p className="mt-2 text-sm text-ink/50">
          {progress.answered} réponse(s) sur {progress.total}
          {progress.priorityTotal > 0 &&
            ` — ${progress.priorityAnswered}/${progress.priorityTotal} prioritaires`}
        </p>
      </header>

      <div className="space-y-4">
        {list.map((question) => {
          const showGroup = question.group && question.group !== currentGroup;
          if (question.group) currentGroup = question.group;
          const answer = stored[question.id];

          return (
            <div key={question.id} className="space-y-4">
              {showGroup && (
                <h2 className="pt-3 text-sm font-bold uppercase tracking-wide text-ink/45">
                  {question.group}
                </h2>
              )}
              <QuestionField
                question={question}
                initialValue={answer?.value ?? ''}
                initialFlagged={answer?.flagged ?? false}
                initialUpdatedAt={answer?.updatedAt ?? null}
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-between gap-3 border-t border-[#e7e5de] pt-5">
        {previous ? (
          <Link href={`/formulaire/${previous.id}`} className="btn btn-secondary">
            ← {previous.number} · {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/formulaire/${next.id}`} className="btn btn-primary">
            {next.number} · {next.title} →
          </Link>
        ) : (
          <Link href="/grille" className="btn btn-primary">
            Passer à la grille CHR →
          </Link>
        )}
      </div>
    </div>
  );
}
