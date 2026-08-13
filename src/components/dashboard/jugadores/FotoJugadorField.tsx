"use client";

import { useEffect, useRef, useState } from "react";

interface FotoJugadorFieldProps {
  fotoUrl: string | null;
  inicial: string;
  file: File | null;
  quitar: boolean;
  onFileChange: (file: File | null) => void;
  onQuitarChange: (quitar: boolean) => void;
  disabled?: boolean;
}

export function FotoJugadorField({
  fotoUrl,
  inicial,
  file,
  quitar,
  onFileChange,
  onQuitarChange,
  disabled = false,
}: FotoJugadorFieldProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const mostrada = preview ?? (quitar ? null : fotoUrl);
  const tieneAlgo = Boolean(preview || (fotoUrl && !quitar));

  return (
    <div className="flex items-center gap-4">
      {mostrada ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mostrada}
          alt="Foto del jugador"
          className="w-16 h-16 rounded-full object-cover border border-slate-200"
        />
      ) : (
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
          aria-hidden
        >
          {inicial.toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0 space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          Foto del jugador
        </label>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onFileChange(f);
            if (f) onQuitarChange(false);
          }}
          className="block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:text-sm file:font-medium file:text-slate-700 file:cursor-pointer disabled:opacity-50"
        />
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-400">JPG o PNG, hasta 5 MB.</p>
          {tieneAlgo && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                if (inputRef.current) inputRef.current.value = "";
                onFileChange(null);
                onQuitarChange(Boolean(fotoUrl));
              }}
              className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
            >
              Quitar foto
            </button>
          )}
          {quitar && !preview && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onQuitarChange(false)}
              className="text-xs font-medium text-slate-600 hover:underline disabled:opacity-50"
            >
              Deshacer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
