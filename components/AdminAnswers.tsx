'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

export type AdminAnswerRow = {
  id: string;
  sectionId: string;
  sectionNumber: string;
  sectionTitle: string;
  label: string;
  priority: boolean;
  value: string;
  flagged: boolean;
  updatedAt: string | null;
  updatedBy: string;
};

type Filtre = 'toutes' | 'repondues' | 'vides' | 'prioritaires-vides' | 'a-revoir';

const FILTRES: { key: Filtre; label: string }[] = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'repondues', label: 'Répondues' },
  { key: 'vides', label: 'Sans réponse' },
  { key: 'prioritaires-vides', label: 'Prioritaires sans réponse' },
  { key: 'a-revoir', label: 'À revoir' },
];

/** La recherche doit trouver « etablissement » quand la question dit « établissement ». */
function sansAccent(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function humanDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminAnswers({ rows }: { rows: AdminAnswerRow[] }) {
  const [filtre, setFiltre] = useState<Filtre>('toutes');
  const [recherche, setRecherche] = useState('');

  const visibles = useMemo(() => {
    const terme = sansAccent(recherche.trim());

    return rows.filter((row) => {
      const repondue = row.value.trim() !== '';

      if (filtre === 'repondues' && !repondue) return false;
      if (filtre === 'vides' && repondue) return false;
      if (filtre === 'prioritaires-vides' && (repondue || !row.priority)) return false;
      if (filtre === 'a-revoir' && !row.flagged) return false;

      if (terme === '') return true;
      return sansAccent(`${row.id} ${row.label} ${row.value}`).includes(terme);
    });
  }, [rows, filtre, recherche]);

  // Regroupement par section, dans l'ordre d'origine.
  const parSection = useMemo(() => {
    const groupes: { id: string; number: string; title: string; rows: AdminAnswerRow[] }[] = [];
    for (const row of visibles) {
      let groupe = groupes.find((g) => g.id === row.sectionId);
      if (!groupe) {
        groupe = { id: row.sectionId, number: row.sectionNumber, title: row.sectionTitle, rows: [] };
        groupes.push(groupe);
      }
      groupe.rows.push(row);
    }
    return groupes;
  }, [visibles]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTRES.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFiltre(f.key)}
            className={`rounded-md px-2.5 py-1.5 text-xs ${
              filtre === f.key
                ? 'bg-sobs-600 font-semibold text-white'
                : 'bg-white text-ink/60 ring-1 ring-[#e7e5de] hover:ring-sobs-500'
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          className="field ml-auto max-w-xs !py-1.5 !text-sm"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Chercher dans les questions et les réponses…"
        />
      </div>

      <p className="text-sm text-ink/50">
        {visibles.length} question(s) affichée(s) sur {rows.length}
      </p>

      {parSection.length === 0 ? (
        <p className="card p-4 text-sm text-ink/55">Rien ne correspond à cette recherche.</p>
      ) : (
        <div className="space-y-6">
          {parSection.map((section) => (
            <div key={section.id}>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink/45">
                {section.number} · {section.title}{' '}
                <span className="font-normal normal-case">({section.rows.length})</span>
              </h3>
              <div className="card divide-y divide-[#f0efe9]">
                {section.rows.map((row) => (
                  <div key={row.id} className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="font-medium">
                        <span className="mr-1.5 text-sobs-600">{row.id}.</span>
                        {row.label}
                        {row.priority && (
                          <span className="ml-2 whitespace-nowrap rounded-full bg-sobs-100 px-2 py-0.5 align-middle text-[0.6rem] font-bold uppercase tracking-wide text-sobs-700">
                            prioritaire
                          </span>
                        )}
                        {row.flagged && (
                          <span className="ml-2 whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 align-middle text-[0.6rem] font-bold uppercase tracking-wide text-amber-800">
                            à revoir
                          </span>
                        )}
                      </p>
                      <Link
                        href={`/formulaire/${row.sectionId}#${row.id}`}
                        className="shrink-0 text-xs text-sobs-700 underline underline-offset-2"
                      >
                        Corriger
                      </Link>
                    </div>

                    {row.value.trim() !== '' ? (
                      <>
                        <p className="mt-1 whitespace-pre-wrap text-ink/75">{row.value}</p>
                        {row.updatedAt && (
                          <p className="mt-1 text-xs text-ink/35">
                            {humanDate(row.updatedAt)}
                            {row.updatedBy && ` · ${row.updatedBy}`}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-1 italic text-ink/35">Sans réponse</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
