'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { StoredFile } from '@/lib/queries';
import { MAX_FILE_BYTES as MAX_BYTES, MAX_IMAGE_SIDE } from '@/lib/constants';

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} Mo`;
}

function humanDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Les photos de téléphone dépassent la limite d'envoi : on les réduit avant l'upload. */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= MAX_BYTES) return file;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.82),
  );
  if (!blob || blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}

export default function FilesPanel({ files, username, role }: { files: StoredFile[]; username: string; role: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);
    setError(null);

    try {
      for (const [index, raw] of Array.from(fileList).entries()) {
        setProgress(`Envoi de ${raw.name} (${index + 1}/${fileList.length})…`);
        const file = await compressImage(raw);

        if (file.size > MAX_BYTES) {
          setError(
            `« ${file.name} » fait ${humanSize(file.size)} : la limite est de 4 Mo. Compresse-le ou envoie-le en plusieurs morceaux.`,
          );
          continue;
        }

        const form = new FormData();
        form.append('file', file);
        form.append('note', note);

        const response = await fetch('/api/files', { method: 'POST', body: form });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(payload.error ?? "L'envoi a échoué.");
          break;
        }
      }
      setNote('');
      if (input.current) input.current.value = '';
      router.refresh();
    } catch {
      setError("L'envoi a échoué. Vérifie ta connexion et réessaie.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function remove(file: StoredFile) {
    if (!window.confirm(`Supprimer définitivement « ${file.filename} » ?`)) return;
    setBusy(true);
    const response = await fetch(`/api/files/${file.id}`, { method: 'DELETE' });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? 'Suppression impossible.');
    } else {
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="font-semibold">Déposer un fichier</h2>
        <p className="mt-1 text-sm text-ink/60">
          PDF, Word, Excel, photos. Maximum 4 Mo par fichier — les photos sont réduites
          automatiquement avant l’envoi.
        </p>

        <input
          className="field mt-3"
          placeholder="Une note pour accompagner le dépôt (facultatif)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <input
          ref={input}
          type="file"
          multiple
          disabled={busy}
          onChange={(e) => void upload(e.target.files)}
          className="mt-3 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-sobs-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-sobs-700"
        />

        {progress && <p className="mt-2 text-sm text-ink/60">{progress}</p>}
        {error && (
          <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold">
          Fichiers disponibles <span className="font-normal text-ink/45">({files.length})</span>
        </h2>

        {files.length === 0 ? (
          <p className="card p-5 text-sm text-ink/55">
            Aucun fichier pour l’instant. Dépose ici les photos de visite, l’organigramme, ou tout
            document utile au rapport.
          </p>
        ) : (
          <ul className="card divide-y divide-[#f0efe9]">
            {files.map((file) => (
              <li key={file.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <a
                    href={`/api/files/${file.id}`}
                    className="block truncate font-medium text-sobs-700 underline underline-offset-2"
                  >
                    {file.filename}
                  </a>
                  <p className="mt-0.5 text-xs text-ink/45">
                    {humanSize(file.size_bytes)} · déposé par {file.uploaded_by} le{' '}
                    {humanDate(file.created_at)}
                  </p>
                  {file.note && <p className="mt-1 text-sm text-ink/65">{file.note}</p>}
                </div>

                {(role === 'admin' || file.uploaded_by === username) && (
                  <button
                    onClick={() => void remove(file)}
                    disabled={busy}
                    className="btn btn-secondary !py-1 !text-xs"
                  >
                    Supprimer
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
