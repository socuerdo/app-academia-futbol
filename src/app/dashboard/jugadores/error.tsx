"use client";

import { useEffect } from "react";

export default function JugadoresError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-semibold text-red-800 mb-2">Error en jugadores</h2>
      <p className="text-red-700 text-sm mb-4">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
        style={{ backgroundColor: "var(--color-primary, #c0392b)" }}
      >
        Reintentar
      </button>
    </div>
  );
}
