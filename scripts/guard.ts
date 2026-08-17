/**
 * Garde-fou des scripts de test.
 *
 * `smoke` et `test:http` écrivent et effacent des lignes. Tant que la base est
 * locale, c'est sans conséquence. Sur la base de production, ce serait la perte
 * des réponses déjà saisies : on refuse, sauf demande explicite.
 */
export function assertBaseDeTest(): void {
  const url = process.env.DATABASE_URL ?? '';
  const estLocale = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/i.test(url);

  if (estLocale || process.env.ALLOW_DESTRUCTIVE === '1') return;

  console.error(
    [
      '',
      'Ce script écrit et efface des lignes : il est bloqué sur une base distante.',
      `Base visée : ${url.replace(/:[^:@/]+@/, ':***@')}`,
      '',
      'Si la base est vide et que tu veux vraiment le lancer :',
      '  $env:ALLOW_DESTRUCTIVE="1"; npm run smoke',
      '',
    ].join('\n'),
  );
  process.exit(1);
}
