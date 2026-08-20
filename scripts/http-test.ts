import './env';
import assert from 'node:assert/strict';
import { db } from '../lib/db';
import { hashPassword } from '../lib/auth';
import { assertBaseDeTest } from './guard';

/**
 * Test HTTP de bout en bout : lance les vraies routes du site.
 * Prérequis : le serveur tourne (npm run dev) sur BASE_URL.
 *   npm run test:http
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

function ok(label: string) {
  console.log(`  ✓ ${label}`);
}

async function login(username: string, password: string): Promise<string | null> {
  const response = await fetch(`${BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    redirect: 'manual',
  });
  if (!response.ok) return null;
  const raw = response.headers.getSetCookie?.() ?? [];
  const cookie = raw.find((c) => c.startsWith('sobs_session='));
  return cookie ? cookie.split(';')[0] : null;
}

async function main() {
  assertBaseDeTest();
  const sql = db();

  // Comptes de test dédiés, supprimés à la fin.
  for (const [username, role] of [
    ['http-admin', 'admin'],
    ['http-nourah', 'contributor'],
  ] as const) {
    const hash = await hashPassword('test-http-1234');
    await sql`
      INSERT INTO users (username, password_hash, role) VALUES (${username}, ${hash}, ${role})
      ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
    `;
  }

  // --- Accès refusé sans session -------------------------------------------
  const anonymous = await fetch(`${BASE}/`, { redirect: 'manual' });
  assert.ok(
    anonymous.status === 307 || anonymous.status === 302,
    `page protégée : attendu une redirection, reçu ${anonymous.status}`,
  );
  assert.ok((anonymous.headers.get('location') ?? '').includes('/login'));
  ok('page protégée : visiteur non connecté redirigé vers /login');

  const anonymousApi = await fetch(`${BASE}/api/files`);
  assert.equal(anonymousApi.status, 401);
  ok('API protégée : 401 sans session');

  assert.equal(await login('http-nourah', 'mauvais-mot-de-passe'), null);
  ok('mauvais mot de passe refusé');

  // --- Session contributrice ------------------------------------------------
  const cookie = await login('http-nourah', 'test-http-1234');
  assert.ok(cookie, 'connexion contributrice impossible');
  ok('connexion réussie, cookie de session délivré');

  const home = await fetch(`${BASE}/`, { headers: { cookie: cookie! } });
  const homeHtml = await home.text();
  assert.equal(home.status, 200);
  assert.ok(homeHtml.includes('Formulaire de collecte'), 'accueil non rendu');
  ok('accueil accessible une fois connectée');

  // --- Enregistrement d'une réponse ----------------------------------------
  // Q130 en v2 : « Dans combien des 35 établissements as-tu vu Heineken ? ».
  const QUESTION = 'Q130';
  const value = `Réponse de test — l’Océanium, « Gazelle » ${Date.now()}`;
  const save = await fetch(`${BASE}/api/answers`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookie! },
    body: JSON.stringify({ questionId: QUESTION, value }),
  });
  assert.equal(save.status, 200);
  ok('réponse enregistrée par l’API');

  const section = await fetch(`${BASE}/formulaire/concurrence`, { headers: { cookie: cookie! } });
  const sectionHtml = await section.text();
  assert.ok(sectionHtml.includes(QUESTION), `la question ${QUESTION} devrait être affichée`);
  assert.ok(
    sectionHtml.includes(value.replace(/’/g, '’').slice(0, 30)),
    'la réponse enregistrée devrait être rechargée dans la page',
  );
  ok('réponse relue depuis la page après rechargement');

  const badQuestion = await fetch(`${BASE}/api/answers`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookie! },
    body: JSON.stringify({ questionId: 'Q999', value: 'x' }),
  });
  assert.equal(badQuestion.status, 400);
  ok('question inconnue rejetée');

  // --- Grille ---------------------------------------------------------------
  const cell = await fetch(`${BASE}/api/grid`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookie! },
    body: JSON.stringify({ num: 20, key: 'enseigne', value: 'O' }),
  });
  assert.equal(cell.status, 200);

  const badValue = await fetch(`${BASE}/api/grid`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookie! },
    body: JSON.stringify({ num: 20, key: 'enseigne', value: 'peut-être' }),
  });
  assert.equal(badValue.status, 400);

  const badColumn = await fetch(`${BASE}/api/grid`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookie! },
    body: JSON.stringify({ num: 20, key: 'colonne-inventee', value: 'O' }),
  });
  assert.equal(badColumn.status, 400);
  ok('grille : valeur valide acceptée, valeur et colonne invalides rejetées');

  const synthese = await fetch(`${BASE}/synthese`, { headers: { cookie: cookie! } });
  assert.ok((await synthese.text()).includes('Taux d’équipement'));
  ok('synthèse recalculée et affichée');

  // --- Fichiers -------------------------------------------------------------
  const form = new FormData();
  form.append('file', new File([new Uint8Array([1, 2, 3, 4, 5])], 'essai.bin'), 'essai.bin');
  form.append('note', 'fichier de test');
  const upload = await fetch(`${BASE}/api/files`, {
    method: 'POST',
    headers: { cookie: cookie! },
    body: form,
  });
  assert.equal(upload.status, 200);
  const uploaded = (await upload.json()).file as { id: number };
  ok('fichier envoyé');

  const download = await fetch(`${BASE}/api/files/${uploaded.id}`, { headers: { cookie: cookie! } });
  assert.equal(download.status, 200);
  const bytes = new Uint8Array(await download.arrayBuffer());
  assert.deepEqual([...bytes], [1, 2, 3, 4, 5], 'le fichier téléchargé doit être identique');
  ok('fichier retéléchargé octet pour octet');

  // --- Export PDF : réservé à l'admin --------------------------------------
  const refused = await fetch(`${BASE}/api/export/pdf`, { headers: { cookie: cookie! } });
  assert.equal(refused.status, 403);
  ok('export PDF refusé au compte contributrice');

  const adminCookie = await login('http-admin', 'test-http-1234');
  assert.ok(adminCookie);
  const pdf = await fetch(`${BASE}/api/export/pdf`, { headers: { cookie: adminCookie! } });
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get('content-type'), 'application/pdf');
  const pdfBytes = new Uint8Array(await pdf.arrayBuffer());
  assert.ok(pdfBytes.length > 5000, `PDF trop petit : ${pdfBytes.length} octets`);
  assert.equal(new TextDecoder().decode(pdfBytes.slice(0, 5)), '%PDF-');
  ok(`export PDF admin : ${Math.round(pdfBytes.length / 1024)} Ko`);

  const adminPage = await fetch(`${BASE}/admin`, { headers: { cookie: adminCookie! } });
  assert.equal(adminPage.status, 200);
  const contributorOnAdmin = await fetch(`${BASE}/admin`, { headers: { cookie: cookie! } });
  assert.equal(contributorOnAdmin.status, 404);
  ok('page admin visible par l’admin, introuvable pour la contributrice');

  // --- Back-office : gestion des comptes -----------------------------------
  const adminJson = (path: string, init: RequestInit = {}) =>
    fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        cookie: adminCookie!,
      },
    });

  const usersRefused = await fetch(`${BASE}/api/admin/users`, { headers: { cookie: cookie! } });
  assert.equal(usersRefused.status, 403);
  ok('gestion des comptes refusée à la contributrice');

  const usersList = await adminJson('/api/admin/users');
  assert.equal(usersList.status, 200);
  const listed = (await usersList.json()).accounts as { username: string; role: string }[];
  assert.ok(listed.some((a) => a.username === 'http-nourah' && a.role === 'contributor'));
  ok(`liste des comptes lue (${listed.length} compte(s))`);

  const faible = await adminJson('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({ username: 'http-temp', password: 'court', role: 'contributor' }),
  });
  assert.equal(faible.status, 400);

  const mauvaisNom = await adminJson('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({ username: 'nom invalide', password: 'motdepasse-1234', role: 'contributor' }),
  });
  assert.equal(mauvaisNom.status, 400);
  ok('mot de passe trop court et identifiant invalide rejetés');

  const cree = await adminJson('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({ username: 'http-temp', password: 'motdepasse-1234', role: 'contributor' }),
  });
  assert.equal(cree.status, 200);
  assert.equal((await cree.json()).created, true);
  assert.ok(await login('http-temp', 'motdepasse-1234'), 'le compte créé doit pouvoir se connecter');
  ok('compte créé depuis le back-office, connexion vérifiée');

  const reinit = await adminJson('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({ username: 'http-temp', password: 'nouveau-motdepasse', role: 'contributor' }),
  });
  assert.equal((await reinit.json()).created, false);
  assert.equal(await login('http-temp', 'motdepasse-1234'), null, 'ancien mot de passe encore valide');
  assert.ok(await login('http-temp', 'nouveau-motdepasse'));
  ok('mot de passe réinitialisé, l’ancien ne fonctionne plus');

  const promu = await adminJson('/api/admin/users', {
    method: 'PATCH',
    body: JSON.stringify({ username: 'http-temp', role: 'admin' }),
  });
  assert.equal(promu.status, 200);

  const renomme = await adminJson('/api/admin/users', {
    method: 'PATCH',
    body: JSON.stringify({ username: 'http-temp', newUsername: 'http-temp2' }),
  });
  assert.equal(renomme.status, 200);
  assert.ok(await login('http-temp2', 'nouveau-motdepasse'), 'le compte renommé doit pouvoir se connecter');
  assert.equal(await login('http-temp', 'nouveau-motdepasse'), null, 'ancien identifiant encore actif');
  ok('rôle changé puis compte renommé');

  const collision = await adminJson('/api/admin/users', {
    method: 'PATCH',
    body: JSON.stringify({ username: 'http-temp2', newUsername: 'http-nourah' }),
  });
  assert.equal(collision.status, 409);
  ok('renommage vers un identifiant déjà pris refusé');

  const suicide = await adminJson('/api/admin/users?username=http-admin', { method: 'DELETE' });
  assert.equal(suicide.status, 409);
  ok('suppression de son propre compte refusée');

  const supprime = await adminJson('/api/admin/users?username=http-temp2', { method: 'DELETE' });
  assert.equal(supprime.status, 200);
  assert.equal(await login('http-temp2', 'nouveau-motdepasse'), null);
  ok('compte supprimé, connexion impossible ensuite');

  // --- Déconnexion ----------------------------------------------------------
  const logout = await fetch(`${BASE}/api/logout`, { method: 'POST', headers: { cookie: cookie! } });
  assert.equal(logout.status, 200);
  ok('déconnexion');

  // Nettoyage.
  await fetch(`${BASE}/api/files/${uploaded.id}`, { method: 'DELETE', headers: { cookie: adminCookie! } });
  await sql`DELETE FROM answers WHERE question_id = ${QUESTION}`;
  await sql`DELETE FROM answer_revisions WHERE question_id = ${QUESTION}`;
  await sql`DELETE FROM grid_rows WHERE num = 20`;
  await sql`DELETE FROM users WHERE username IN ('http-admin', 'http-nourah', 'http-temp', 'http-temp2')`;

  console.log('\nTous les tests HTTP passent.');
  process.exit(0);
}

main().catch((error) => {
  console.error('\nÉchec du test HTTP :');
  console.error(error);
  process.exit(1);
});
