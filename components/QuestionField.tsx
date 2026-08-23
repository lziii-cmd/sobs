'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Question } from '@/data/questions';

type Props = {
  question: Question;
  initialValue: string;
  initialFlagged: boolean;
  initialUpdatedAt: string | null;
};

type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 800;
const draftKey = (id: string) => `sobs:draft:${id}`;

const MULTI_SEPARATOR = ' ; ';

function heure(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function QuestionField({
  question,
  initialValue,
  initialFlagged,
  initialUpdatedAt,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [flagged, setFlagged] = useState(initialFlagged);
  const [state, setState] = useState<SaveState>('idle');
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(initialValue);

  const save = useCallback(
    async (next: string, nextFlagged?: boolean) => {
      setState('saving');
      try {
        const response = await fetch('/api/answers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: question.id, value: next, flagged: nextFlagged }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setState('error');
          setErrorMessage(data.error ?? 'Enregistrement impossible.');
          return;
        }

        lastSaved.current = next;
        window.localStorage.removeItem(draftKey(question.id));
        if (data.updatedAt) setUpdatedAt(data.updatedAt);
        setErrorMessage(null);
        setState('saved');
      } catch {
        setState('error');
        setErrorMessage('Pas de réseau — ta saisie est conservée sur cet appareil et repartira toute seule.');
      }
    },
    [question.id],
  );

  const schedule = useCallback(
    (next: string) => {
      window.localStorage.setItem(draftKey(question.id), next);
      setState('pending');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(next), DEBOUNCE_MS);
    },
    [question.id, save],
  );

  // Brouillon local non enregistré (onglet fermé, réseau coupé) : on le récupère.
  useEffect(() => {
    const draft = window.localStorage.getItem(draftKey(question.id));
    if (draft !== null && draft !== initialValue) {
      setValue(draft);
      void save(draft);
    }
    // Volontairement au montage uniquement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nouvelle tentative dès que le réseau revient.
  useEffect(() => {
    const retry = () => {
      const draft = window.localStorage.getItem(draftKey(question.id));
      if (draft !== null) void save(draft);
    };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [question.id, save]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function update(next: string) {
    setValue(next);
    schedule(next);
  }

  async function toggleFlag() {
    const next = !flagged;
    setFlagged(next);
    await save(value, next);
  }

  const selected = question.type === 'multi' ? value.split(';').map((v) => v.trim()).filter(Boolean) : [];

  return (
    <article id={question.id} className="card scroll-mt-24 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-[0.95rem] font-semibold leading-snug">
          <span className="mr-1.5 text-sobs-600">{question.id}.</span>
          {question.label}
          {question.priority && (
            <span className="ml-2 whitespace-nowrap rounded-full bg-sobs-100 px-2 py-0.5 align-middle text-[0.65rem] font-bold uppercase tracking-wide text-sobs-700">
              prioritaire
            </span>
          )}
        </h3>

        <button
          type="button"
          onClick={toggleFlag}
          title="Marquer pour y revenir plus tard"
          className={`shrink-0 rounded-md border px-2 py-1 text-xs ${
            flagged
              ? 'border-amber-300 bg-amber-50 font-semibold text-amber-800'
              : 'border-[#e0ded7] text-ink/50 hover:border-amber-300 hover:text-amber-700'
          }`}
        >
          {flagged ? '★ à revoir' : '☆ à revoir'}
        </button>
      </div>

      {question.help && <p className="mt-1.5 text-sm text-ink/55">{question.help}</p>}

      {/* Renvoi du document source : le chapitre de l'étude que la réponse alimente. */}
      {question.chapter && (
        <p className="mt-1 text-xs text-ink/40">→ {question.chapter}</p>
      )}

      <div className="mt-3">
        {question.type === 'short' && (
          <input className="field" value={value} onChange={(e) => update(e.target.value)} />
        )}

        {question.type === 'long' && (
          <textarea
            className="field min-h-28"
            rows={4}
            value={value}
            onChange={(e) => update(e.target.value)}
          />
        )}

        {question.type === 'choice' && (
          <div className="space-y-1.5">
            {question.options?.map((option) => (
              <label key={option} className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="radio"
                  name={question.id}
                  className="mt-0.5"
                  checked={value === option}
                  onChange={() => update(option)}
                />
                <span>{option}</span>
              </label>
            ))}
            {value !== '' && (
              <button
                type="button"
                onClick={() => update('')}
                className="text-xs text-ink/45 underline underline-offset-2 hover:text-ink/70"
              >
                effacer ma réponse
              </button>
            )}
          </div>
        )}

        {question.type === 'multi' && (
          <div className="space-y-1.5">
            {question.options?.map((option) => (
              <label key={option} className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={selected.includes(option)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selected, option]
                      : selected.filter((v) => v !== option);
                    const ordered = question.options?.filter((o) => next.includes(o)) ?? next;
                    update(ordered.join(MULTI_SEPARATOR));
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 text-xs">
        {state === 'pending' && <span className="text-ink/40">Modification en cours…</span>}
        {state === 'saving' && <span className="text-ink/40">Enregistrement…</span>}
        {state === 'saved' && <span className="text-sobs-600">✓ Enregistré</span>}
        {state === 'error' && <span className="font-medium text-red-700">⚠ {errorMessage}</span>}
        {state !== 'error' && updatedAt && (
          <span className="text-ink/35">dernière modification : {heure(updatedAt)}</span>
        )}
      </div>
    </article>
  );
}
