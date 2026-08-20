import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { questions, sections } from '@/data/questions';
import { loadAnswers, loadFiles, loadGrid } from '@/lib/queries';
import { listAccounts } from '@/lib/users';
import { globalProgress, allProgress, isAnswered } from '@/lib/progress';
import { computeSynthese } from '@/lib/synthese';
import { formatDateFr } from '@/lib/text';
import UsersPanel from '@/components/UsersPanel';
import AdminAnswers, { type AdminAnswerRow } from '@/components/AdminAnswers';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await currentUser();
  if (!user || user.role !== 'admin') notFound();

  const [stored, grid, files, accounts] = await Promise.all([
    loadAnswers(),
    loadGrid(),
    loadFiles(),
    listAccounts(),
  ]);

  const answers = Object.fromEntries(
    Object.entries(stored).map(([id, a]) => [id, { value: a.value, flagged: a.flagged }]),
  );
  const global = globalProgress(answers);
  const parSection = allProgress(answers);
  const synthese = computeSynthese(grid);

  const recent = Object.entries(stored)
    .filter(([, a]) => a.updatedAt && a.value.trim() !== '')
    .sort((a, b) => (a[1].updatedAt! < b[1].updatedAt! ? 1 : -1))
    .slice(0, 10);

  const flagged = questions.filter((q) => stored[q.id]?.flagged);
  const missingPriority = questions.filter((q) => q.priority && !isAnswered(stored[q.id]?.value));

  const sectionById = new Map(sections.map((s) => [s.id, s]));
  const rows: AdminAnswerRow[] = questions.map((question) => {
    const section = sectionById.get(question.sectionId);
    const answer = stored[question.id];
    return {
      id: question.id,
      sectionId: question.sectionId,
      sectionNumber: section?.number ?? '',
      sectionTitle: section?.title ?? '',
      label: question.label,
      priority: question.priority,
      value: answer?.value ?? '',
      flagged: Boolean(answer?.flagged),
      updatedAt: answer?.updatedAt ?? null,
      updatedBy: answer?.updatedBy ?? '',
    };
  });

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Administration</h1>
          <p className="mt-1 text-sm text-ink/60">
            Connecté en tant que {user.username}. Cette page n'est visible que des comptes
            d'administration.
          </p>
        </div>
        <a href="/api/export/pdf" className="btn btn-primary">
          Télécharger le PDF des réponses
        </a>
      </header>

      {/* ------------------------------------------------------------ chiffres */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-ink/45">Réponses</p>
          <p className="mt-1 text-2xl font-bold">
            {global.answered}
            <span className="text-base font-normal text-ink/40"> / {global.total}</span>
          </p>
          <p className="mt-0.5 text-xs text-ink/50">{global.percent} % du questionnaire</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-ink/45">Prioritaires</p>
          <p className="mt-1 text-2xl font-bold">
            {global.priorityAnswered}
            <span className="text-base font-normal text-ink/40"> / {global.priorityTotal}</span>
          </p>
          <p className="mt-0.5 text-xs text-ink/50">{global.priorityPercent} % des prioritaires</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-ink/45">Grille CHR</p>
          <p className="mt-1 text-2xl font-bold">
            {synthese.lignesRenseignees}
            <span className="text-base font-normal text-ink/40">
              {' '}
              / {synthese.totalEtablissements}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-ink/50">lignes renseignées</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wide text-ink/45">Fichiers</p>
          <p className="mt-1 text-2xl font-bold">{files.length}</p>
          <p className="mt-0.5 text-xs text-ink/50">
            <Link href="/fichiers" className="text-sobs-700 underline underline-offset-2">
              gérer les dépôts
            </Link>
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- comptes */}
      <section>
        <h2 className="mb-1 text-lg font-semibold">Comptes</h2>
        <p className="mb-3 text-sm text-ink/55">
          Création, renommage, changement de rôle et réinitialisation de mot de passe. Plus besoin de
          passer par la ligne de commande.
        </p>
        <UsersPanel initial={accounts} me={user.username} />
      </section>

      {/* -------------------------------------------------- avancement détaillé */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Avancement par section</h2>
        <div className="card divide-y divide-[#f0efe9]">
          {parSection.map((section) => (
            <div key={section.sectionId} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
              <Link
                href={`/formulaire/${section.sectionId}`}
                className="min-w-0 flex-1 truncate text-sobs-700 underline underline-offset-2"
              >
                {section.number} · {section.title}
              </Link>
              <span className="text-ink/60">
                {section.answered}/{section.total}
              </span>
              {section.priorityTotal > 0 && (
                <span className="text-xs text-ink/45">
                  {section.priorityAnswered}/{section.priorityTotal} prioritaires
                </span>
              )}
              {section.flagged > 0 && (
                <span className="text-xs text-amber-700">{section.flagged} à revoir</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- suivi */}
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
            <ul className="card max-h-80 divide-y divide-[#f0efe9] overflow-y-auto">
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

      {/* ------------------------------------------------------------ réponses */}
      <section>
        <h2 className="mb-1 text-lg font-semibold">Toutes les réponses</h2>
        <p className="mb-3 text-sm text-ink/55">
          {questions.length} questions. « Corriger » ouvre la question dans le formulaire : la
          modification y est enregistrée automatiquement, quel que soit l'auteur d'origine.
        </p>
        <AdminAnswers rows={rows} />
      </section>
    </div>
  );
}
