import Link from 'next/link';
import { loadGrid } from '@/lib/queries';
import { computeSynthese } from '@/lib/synthese';

export const dynamic = 'force-dynamic';

export default async function SynthesePage() {
  const grid = await loadGrid();
  const s = computeSynthese(grid);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-bold tracking-tight">Synthèse</h1>
        <p className="mt-2 max-w-3xl text-sm text-ink/65">
          Calculée automatiquement à partir de la{' '}
          <Link href="/grille" className="text-sobs-700 underline underline-offset-2">
            grille de relevé
          </Link>
          . Ces chiffres ne valent que ce que vaut la saisie : la colonne Fiabilité distingue souvenir,
          estimation et donnée vérifiée.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Taux d’équipement</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {s.equipements.map((eq) => (
            <div key={eq.key} className="card p-4">
              <p className="text-sm text-ink/60">{eq.label}</p>
              <p className="mt-1 text-2xl font-bold text-sobs-700">
                {eq.oui}
                <span className="text-base font-normal text-ink/45"> / {s.totalEtablissements}</span>
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sobs-100">
                <div className="h-full rounded-full bg-sobs-500" style={{ width: `${eq.partSurTotal}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-ink/45">{eq.renseignes} ligne(s) renseignée(s)</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">Couverture des visites</h2>
          <div className="card divide-y divide-[#f0efe9]">
            <Row label="Établissements identifiés" value={s.totalEtablissements} />
            <Row label="Établissements visités" value={`${s.visites} (${s.tauxCouverture} %)`} />
            <Row label="Restant à visiter" value={s.restants} />
            <Row label="Lignes de grille renseignées" value={`${s.lignesRenseignees} / ${s.totalEtablissements}`} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Couverture par zone</h2>
          <div className="card divide-y divide-[#f0efe9]">
            {s.zones.map((zone) => (
              <div key={zone.zone} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span>{zone.zone}</span>
                <span className={zone.visites === 0 ? 'font-semibold text-amber-700' : 'text-ink/70'}>
                  {zone.visites} / {zone.identifies} visité(s)
                  {zone.visites === 0 && ' — zone non couverte'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Indicateurs clés</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Références SOBOA en moyenne"
            value={s.moyenneReferences ?? '—'}
            hint="Levier n° 1 : élargir la gamme référencée."
          />
          <Kpi
            label="Volume total estimé"
            value={`${s.volumeTotal} fûts/mois`}
            hint="À comparer aux ~86 fûts du top 10 déclaré."
          />
          <Kpi label="Note de visibilité moyenne" value={`${s.noteMoyenne ?? '—'} / 5`} hint="Synthèse de la mission 2." />
          <Kpi
            label="Sans aucun support"
            value={s.sansAucunSupport}
            hint="Cible du levier n° 3 si ces établissements ont du volume."
          />
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
      <span className="text-ink/70">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-1 text-2xl font-bold text-sobs-700">{value}</p>
      <p className="mt-1.5 text-xs text-ink/45">{hint}</p>
    </div>
  );
}
