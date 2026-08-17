'use client';

import { useMemo, useRef, useState } from 'react';
import { establishments } from '@/data/establishments';
import { gridColumns } from '@/data/grid-columns';
import type { GridData } from '@/lib/synthese';

type CellState = 'idle' | 'saving' | 'saved' | 'error';
type Filter = 'tous' | 'visites' | 'restants' | 'vides';

const DEBOUNCE_MS = 700;

export default function GrilleTable({ initial }: { initial: GridData }) {
  const [data, setData] = useState<GridData>(initial);
  const [states, setStates] = useState<Record<string, CellState>>({});
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('tous');
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const rows = useMemo(() => {
    return establishments.filter((e) => {
      const filled = Object.values(data[e.num] ?? {}).some((v) => (v ?? '').trim() !== '');
      if (filter === 'visites') return e.visite;
      if (filter === 'restants') return !e.visite;
      if (filter === 'vides') return !filled;
      return true;
    });
  }, [data, filter]);

  const filledCount = establishments.filter((e) =>
    Object.values(data[e.num] ?? {}).some((v) => (v ?? '').trim() !== ''),
  ).length;

  async function save(num: number, key: string, value: string) {
    const cellKey = `${num}:${key}`;
    setStates((s) => ({ ...s, [cellKey]: 'saving' }));
    try {
      const response = await fetch('/api/grid', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num, key, value }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStates((s) => ({ ...s, [cellKey]: 'error' }));
        setError(payload.error ?? 'Enregistrement impossible.');
        return;
      }
      setStates((s) => ({ ...s, [cellKey]: 'saved' }));
      setError(null);
    } catch {
      setStates((s) => ({ ...s, [cellKey]: 'error' }));
      setError('Pas de réseau — la cellule n’a pas été enregistrée.');
    }
  }

  function change(num: number, key: string, value: string, immediate: boolean) {
    setData((d) => ({ ...d, [num]: { ...(d[num] ?? {}), [key]: value } }));
    const cellKey = `${num}:${key}`;
    if (timers.current[cellKey]) clearTimeout(timers.current[cellKey]);
    if (immediate) {
      void save(num, key, value);
    } else {
      timers.current[cellKey] = setTimeout(() => void save(num, key, value), DEBOUNCE_MS);
    }
  }

  function cellClass(cellKey: string): string {
    const state = states[cellKey];
    if (state === 'saved') return 'ring-1 ring-sobs-500';
    if (state === 'saving') return 'ring-1 ring-sobs-200';
    if (state === 'error') return 'ring-2 ring-red-500';
    return '';
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['tous', `Tous (${establishments.length})`],
            ['visites', 'Déjà visités'],
            ['restants', 'Restant à visiter'],
            ['vides', 'Lignes vides'],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-md px-2.5 py-1 text-xs ${
              filter === key
                ? 'bg-sobs-600 font-semibold text-white'
                : 'bg-white text-ink/60 ring-1 ring-[#e7e5de] hover:ring-sobs-500'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-ink/50">
          {filledCount} ligne(s) renseignée(s) sur {establishments.length}
        </span>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-[#e7e5de] bg-white">
        <table className="min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-sobs-50 text-left">
              <th className="sticky left-0 z-10 bg-sobs-50 px-2 py-2 text-xs font-semibold">N°</th>
              <th className="sticky left-9 z-10 min-w-56 bg-sobs-50 px-2 py-2 text-xs font-semibold">
                Établissement
              </th>
              <th className="px-2 py-2 text-xs font-semibold">Zone</th>
              <th className="px-2 py-2 text-xs font-semibold">Visité</th>
              {gridColumns.map((col) => (
                <th
                  key={col.key}
                  title={col.hint ?? col.label}
                  className={`px-2 py-2 text-xs font-semibold ${col.priority ? 'text-sobs-700' : ''}`}
                  style={{ minWidth: col.width }}
                >
                  {col.label}
                  {col.priority && ' ●'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const row = data[e.num] ?? {};
              return (
                <tr key={e.num} className="border-t border-[#f0efe9] align-top">
                  <td className="sticky left-0 z-10 bg-white px-2 py-1.5 text-xs text-ink/50">{e.num}</td>
                  <td className="sticky left-9 z-10 min-w-56 bg-white px-2 py-1.5 font-medium">
                    {e.nom}
                    <span className="ml-1 text-xs font-normal text-ink/40">{e.type}</span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-xs text-ink/60">{e.zone}</td>
                  <td className="px-2 py-1.5 text-xs">
                    {e.visite ? (
                      <span className="text-sobs-700">Oui</span>
                    ) : (
                      <span className="text-amber-700">Non</span>
                    )}
                  </td>

                  {gridColumns.map((col) => {
                    const cellKey = `${e.num}:${col.key}`;
                    const value = row[col.key] ?? '';
                    const common = `field !px-1.5 !py-1 !text-sm ${cellClass(cellKey)}`;

                    if (col.type === 'on' || col.type === 'choice') {
                      const options = col.type === 'on' ? ['O', 'N'] : (col.options ?? []);
                      return (
                        <td key={col.key} className="px-1.5 py-1">
                          <select
                            aria-label={`${col.label} — ${e.nom}`}
                            className={common}
                            value={value}
                            onChange={(ev) => change(e.num, col.key, ev.target.value, true)}
                          >
                            <option value="">—</option>
                            {options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    }

                    return (
                      <td key={col.key} className="px-1.5 py-1">
                        <input
                          aria-label={`${col.label} — ${e.nom}`}
                          className={common}
                          inputMode={col.type === 'number' ? 'numeric' : undefined}
                          value={value}
                          onChange={(ev) => change(e.num, col.key, ev.target.value, false)}
                          onBlur={(ev) => change(e.num, col.key, ev.target.value, true)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink/50">
        Chaque cellule est enregistrée dès que tu la quittes. Laisse vide ce que tu ne sais pas, et
        renseigne la colonne Fiabilité : une case vide signalée comme « à vérifier sur place » n’a pas
        le même sens qu’un oubli.
      </p>
    </div>
  );
}
