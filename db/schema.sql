-- Schéma de la base SOBS. Idempotent : peut être rejoué sans risque.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'contributor')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Une ligne par question du formulaire (Q1 … Q85).
CREATE TABLE IF NOT EXISTS answers (
  question_id TEXT PRIMARY KEY,
  value       TEXT NOT NULL DEFAULT '',
  flagged     BOOLEAN NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by  TEXT NOT NULL DEFAULT ''
);

-- Historique : chaque modification conserve la valeur précédente.
CREATE TABLE IF NOT EXISTS answer_revisions (
  id          SERIAL PRIMARY KEY,
  question_id TEXT NOT NULL,
  value       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS answer_revisions_question_idx
  ON answer_revisions (question_id, created_at DESC);

-- Grille de relevé : une ligne par établissement, colonnes de saisie en JSON.
CREATE TABLE IF NOT EXISTS grid_rows (
  num        INTEGER PRIMARY KEY,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL DEFAULT ''
);

-- Fichiers échangés, stockés en base (contenu encodé en base64).
CREATE TABLE IF NOT EXISTS files (
  id           SERIAL PRIMARY KEY,
  filename     TEXT NOT NULL,
  mime         TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes   INTEGER NOT NULL,
  data_base64  TEXT NOT NULL,
  note         TEXT NOT NULL DEFAULT '',
  uploaded_by  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS files_created_idx ON files (created_at DESC);
