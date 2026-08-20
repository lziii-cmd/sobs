import { test } from 'node:test';
import assert from 'node:assert/strict';
import { V1_ABANDONNEES, V1_TO_V2, valeurPourV2 } from '../data/migration-v1';
import { questionById, questions } from '../data/questions';

test('la table de correspondance couvre les 85 questions du formulaire v1', () => {
  const traitees = new Set([...Object.keys(V1_TO_V2), ...Object.keys(V1_ABANDONNEES)]);
  for (let n = 1; n <= 85; n += 1) {
    assert.ok(traitees.has(`Q${n}`), `Q${n} : ni reprise ni explicitement abandonnée`);
  }
  assert.equal(traitees.size, 85);
});

test('aucune question v1 n’est à la fois reprise et abandonnée', () => {
  for (const id of Object.keys(V1_TO_V2)) {
    assert.ok(!(id in V1_ABANDONNEES), `${id} figure dans les deux tables`);
  }
});

test('chaque cible pointe vers une question qui existe vraiment en v2', () => {
  for (const [avant, apres] of Object.entries(V1_TO_V2)) {
    assert.ok(questionById(apres), `${avant} → ${apres} : cible inexistante`);
  }
});

test('deux questions v1 ne peuvent pas atterrir sur la même question v2', () => {
  const cibles = Object.values(V1_TO_V2);
  const doublons = cibles.filter((c, i) => cibles.indexOf(c) !== i);
  assert.deepEqual(doublons, [], `cibles en double : ${doublons.join(', ')}`);
});

test('chaque abandon est motivé', () => {
  for (const [id, raison] of Object.entries(V1_ABANDONNEES)) {
    assert.ok(raison.trim().length > 20, `${id} : raison trop vague`);
  }
});

test('les identifiants v1 restent dans la plage Q1–Q85', () => {
  for (const id of [...Object.keys(V1_TO_V2), ...Object.keys(V1_ABANDONNEES)]) {
    const n = Number(id.slice(1));
    assert.ok(n >= 1 && n <= 85, `${id} hors plage v1`);
  }
});

test('une réponse à choix est réalignée sur l’option v2 malgré l’apostrophe', () => {
  // Q8 en v2 : « Ton école impose-t-elle un plan type ou une trame ? »
  const question = questionById('Q8')!;
  assert.equal(question.type, 'choice');

  const optionV2 = 'Oui, mais je ne l’ai pas sous la main'.replace(/’/g, "'");
  assert.ok(question.options!.includes(optionV2), 'option attendue absente du v2');

  // La valeur enregistrée en v1 utilisait l'apostrophe typographique.
  assert.equal(valeurPourV2('Q8', 'Oui, mais je ne l’ai pas sous la main'), optionV2);
});

test('une réponse en texte libre est reprise telle quelle', () => {
  const valeur = 'Jacques Hervé Badiane, commercial CHR';
  assert.equal(valeurPourV2('Q16', valeur), valeur);
});

test('une réponse à choix sans équivalent n’est pas écrasée', () => {
  assert.equal(valeurPourV2('Q8', 'une réponse hors liste'), 'une réponse hors liste');
});

test('les réponses réellement enregistrées aujourd’hui trouvent toutes une place', () => {
  // Identifiants relevés en base au moment du passage à la v2.
  const enBase = [
    'Q8', 'Q9', 'Q12', 'Q13', 'Q20', 'Q22', 'Q23', 'Q24', 'Q25', 'Q26', 'Q27',
    'Q28', 'Q29', 'Q30', 'Q31', 'Q32', 'Q33', 'Q34', 'Q35', 'Q36', 'Q37', 'Q38',
    'Q39', 'Q40', 'Q41', 'Q42', 'Q43', 'Q44', 'Q46', 'Q47', 'Q48', 'Q50', 'Q51',
    'Q53', 'Q54', 'Q55', 'Q57',
  ];

  const reprises = enBase.filter((id) => id in V1_TO_V2);
  const abandonnees = enBase.filter((id) => id in V1_ABANDONNEES);

  assert.equal(reprises.length, 33);
  assert.deepEqual(abandonnees, ['Q53', 'Q54', 'Q55', 'Q57']);
  assert.equal(reprises.length + abandonnees.length, enBase.length);
});

test('la correspondance ne laisse aucune question v2 orpheline de type', () => {
  // Garde-fou : les cibles doivent rester cohérentes si le v2 évolue.
  for (const apres of Object.values(V1_TO_V2)) {
    const question = questions.find((q) => q.id === apres)!;
    assert.ok(question.label.trim().length > 10, `${apres} : intitulé suspect`);
  }
});
