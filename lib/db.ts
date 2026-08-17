import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';

/**
 * Adaptateur de base de données.
 *
 * En production la base est hébergée sur Neon : on utilise son pilote HTTP, qui
 * convient aux fonctions serverless de Vercel (pas de connexion TCP persistante).
 * En développement, une base Postgres classique (Docker, local) passe par `pg`.
 * Le choix se fait sur l'hôte de la chaîne de connexion, les deux exposent la
 * même fonction en gabarit de chaîne renvoyant directement les lignes.
 */
export type Sql = <T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...params: unknown[]
) => Promise<T[]>;

let cached: Sql | null = null;
let pool: Pool | null = null;

function isNeon(url: string): boolean {
  return /neon\.(tech|build)/i.test(url);
}

function buildQueryText(strings: TemplateStringsArray): string {
  return strings.reduce((text, part, index) => text + part + (index < strings.length - 1 ? `$${index + 1}` : ''), '');
}

export function db(): Sql {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL n'est pas défini. Copie .env.example vers .env.local et renseigne la chaîne de connexion.",
    );
  }

  if (isNeon(url)) {
    const client = neon(url);
    cached = ((strings, ...params) => client(strings, ...params)) as Sql;
  } else {
    pool = pool ?? new Pool({ connectionString: url, max: 3 });
    cached = (async (strings, ...params) => {
      const result = await pool!.query(buildQueryText(strings), params);
      return result.rows;
    }) as Sql;
  }

  return cached;
}

/**
 * Exécute une suite d'instructions brutes (migrations). Réservé aux scripts :
 * ouvre une seule connexion, la referme à la fin.
 */
export async function runStatements(
  url: string,
  statements: string[],
  onDone?: (statement: string) => void,
): Promise<void> {
  if (isNeon(url)) {
    const client = neon(url);
    for (const statement of statements) {
      await client(statement);
      onDone?.(statement);
    }
    return;
  }

  const client = new Pool({ connectionString: url, max: 1 });
  try {
    for (const statement of statements) {
      await client.query(statement);
      onDone?.(statement);
    }
  } finally {
    await client.end();
  }
}
