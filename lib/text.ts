/**
 * Le PDF utilise les polices standard (encodage WinAnsi) : tous les caractères
 * français passent, mais quelques signes typographiques doivent être normalisés
 * pour ne pas faire échouer la génération.
 */

const REPLACEMENTS: [RegExp, string][] = [
  [/[‘’‛]/g, "'"],
  [/[“”„]/g, '"'],
  [/[–—]/g, '-'],
  [/…/g, '...'],
  [/ | | /g, ' '],
  [/•/g, '-'],
  [/€/g, 'EUR'],
  [/\r\n?/g, '\n'],
  [/\t/g, '    '],
];

/** Caractères non représentables en WinAnsi (ou ambigus) → remplacés. */
const UNSUPPORTED = /[^\n\x20-\x7E\xA0-\xFFŒœŠšŸŽžƒ]/g;

export function sanitizeForPdf(input: string): string {
  let out = input ?? '';
  for (const [pattern, replacement] of REPLACEMENTS) out = out.replace(pattern, replacement);
  return out.replace(UNSUPPORTED, '?');
}

export type Measure = (text: string, size: number) => number;

/**
 * Découpe un texte en lignes tenant dans `maxWidth`. Les retours à la ligne
 * de l'utilisateur sont conservés, les mots trop longs sont coupés.
 */
export function wrapText(text: string, maxWidth: number, size: number, measure: Measure): string[] {
  const lines: string[] = [];

  for (const paragraph of sanitizeForPdf(text).split('\n')) {
    if (paragraph.trim() === '') {
      lines.push('');
      continue;
    }

    let current = '';
    for (const word of paragraph.split(/ +/)) {
      const candidate = current === '' ? word : `${current} ${word}`;
      if (measure(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current !== '') lines.push(current);

      if (measure(word, size) <= maxWidth) {
        current = word;
        continue;
      }
      // Mot plus large que la colonne : on le coupe caractère par caractère.
      let chunk = '';
      for (const char of word) {
        if (measure(chunk + char, size) > maxWidth && chunk !== '') {
          lines.push(chunk);
          chunk = char;
        } else {
          chunk += char;
        }
      }
      current = chunk;
    }
    lines.push(current);
  }

  return lines;
}

/** Tronque une chaîne pour qu'elle tienne dans une cellule de tableau. */
export function ellipsize(text: string, maxWidth: number, size: number, measure: Measure): string {
  const clean = sanitizeForPdf(text).replace(/\n/g, ' ');
  if (measure(clean, size) <= maxWidth) return clean;
  let out = '';
  for (const char of clean) {
    if (measure(`${out}${char}...`, size) > maxWidth) break;
    out += char;
  }
  return `${out}...`;
}

export function formatDateFr(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Dakar',
  }).format(date);
}
