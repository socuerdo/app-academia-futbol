"use client";

import {
  exportEvaluacionPDF,
  type EvaluacionPDFData,
} from "@/lib/export-evaluacion-pdf";
import { useState } from "react";

interface Props {
  data: EvaluacionPDFData;
}

export function DownloadEvaluacionPDFButton({ data }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      exportEvaluacionPDF(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="px-3 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      {loading ? "Generando..." : "Descargar PDF"}
    </button>
  );
}
