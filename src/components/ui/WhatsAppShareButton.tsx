"use client";

import { compartirPorWhatsApp } from "@/lib/whatsapp-share";
import { useState } from "react";

interface WhatsAppShareButtonProps {
  getFile: () => File;
  mensaje?: string;
  className?: string;
}

const DEFAULT_CLASS =
  "px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center gap-1.5";

export function WhatsAppShareButton({ getFile, mensaje, className }: WhatsAppShareButtonProps) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setEnviando(true);
    setError(null);
    try {
      await compartirPorWhatsApp(getFile(), mensaje);
    } catch {
      setError("No se pudo compartir. Se descargó el PDF para adjuntarlo a mano.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="inline-flex flex-col">
      <button type="button" onClick={handleClick} disabled={enviando} className={className ?? DEFAULT_CLASS}>
        {enviando ? "Preparando…" : "Compartir por WhatsApp"}
      </button>
      {error && <span className="text-xs text-red-600 mt-1">{error}</span>}
    </div>
  );
}
