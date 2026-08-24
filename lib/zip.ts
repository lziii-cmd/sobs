/**
 * Écriture d'archives ZIP, sans dépendance.
 *
 * Un fichier `.xlsx` est une archive ZIP de documents XML. Plutôt que d'ajouter
 * une bibliothèque de tableur — la plus courante tire un `uuid` porteur d'un avis
 * de sécurité et un arbre de dépendances hors de proportion avec un seul export —
 * on écrit ici les quelque quatre-vingts lignes du format qui nous servent.
 *
 * Seule la méthode « deflate » est produite. Pas de chiffrement, pas de Zip64 :
 * les grilles font quelques dizaines de kilo-octets.
 */

import { deflateRawSync } from 'zlib';

export type ZipEntry = {
  /** Chemin dans l'archive, séparé par des barres obliques. */
  name: string;
  content: string | Buffer;
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * Horodatage MS-DOS. Une date fixe rend l'archive reproductible : deux exports
 * du même contenu donnent deux fichiers identiques, ce qui simplifie les tests.
 */
const DOS_TIME = 0; // 00:00:00
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1; // 1er janvier 2026

export function createZip(entries: ZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf-8');
    const raw = Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content, 'utf-8');
    const deflated = deflateRawSync(raw);
    const crc = crc32(raw);

    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0); // signature
    local.writeUInt16LE(20, 4); // version minimale
    local.writeUInt16LE(0, 6); // indicateurs
    local.writeUInt16LE(8, 8); // méthode : deflate
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(deflated.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // pas de champ « extra »
    name.copy(local, 30);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version d'écriture
    central.writeUInt16LE(20, 6); // version minimale
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(deflated.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // commentaire
    central.writeUInt16LE(0, 34); // disque
    central.writeUInt16LE(0, 36); // attributs internes
    central.writeUInt32LE(0, 38); // attributs externes
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);

    locals.push(local, deflated);
    centrals.push(central);
    offset += local.length + deflated.length;
  }

  const centralBlock = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4); // disque courant
  end.writeUInt16LE(0, 6); // disque du répertoire central
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBlock.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20); // pas de commentaire d'archive

  return Buffer.concat([...locals, centralBlock, end]);
}
