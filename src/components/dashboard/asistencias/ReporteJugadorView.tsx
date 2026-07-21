"use client";

import { exportJugadorPDF, getJugadorPDFFile } from "@/lib/export-jugador-pdf";
import { formatFecha } from "@/lib/fecha";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Jugador = {
  id: string;
  apellido: string;
  nombre: string;
  dni: string;
  categoria: string;
  foto_url: string | null;
  sede: { nombre: string } | null;
};

type DetalleRow = { fecha: string; presente: boolean; observacion: string | null };

interface ReporteJugadorViewProps {
  jugador: Jugador | null;
  presencias: number;
  ausencias: number;
  porcentaje: number;
  detalle: DetalleRow[];
}

export function ReporteJugadorView({
  jugador,
  presencias,
  ausencias,
  porcentaje,
  detalle,
}: ReporteJugadorViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/dashboard/asistencias?tab=jugador&q=${encodeURIComponent(q)}`);
  };

  const heatmapData = useMemo(() => {
    const map = new Map<string, boolean>();
    detalle.forEach((d) => map.set(d.fecha, d.presente));
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    const cells: { date: string; presente: boolean | null }[] = [];
    const d = new Date(start);
    while (d <= end) {
      const key = d.toISOString().slice(0, 10);
      cells.push({ date: key, presente: map.get(key) ?? null });
      d.setDate(d.getDate() + 1);
    }
    return cells;
  }, [detalle]);

  const weeks = useMemo(() => {
    const w: { date: string; presente: boolean | null }[][] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      w.push(heatmapData.slice(i, i + 7));
    }
    return w;
  }, [heatmapData]);

  if (!jugador) {
    return (
      <div className="space-y-4 max-w-xl">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Apellido o DNI"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 outline-none"
            style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
          />
          <button type="submit" className="px-4 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: "var(--color-primary)" }}>
            Buscar
          </button>
        </form>
        <p className="text-slate-500 text-sm">Ingresá apellido o DNI para ver el reporte.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Otro jugador: apellido o DNI"
          className="flex-1 max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
        <button type="submit" className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300">Buscar</button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row gap-6 items-start">
        <div className="shrink-0">
          {jugador.foto_url ? (
            <img src={jugador.foto_url} alt="" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {(jugador.apellido[0] || "").toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-800">{jugador.apellido}, {jugador.nombre}</h2>
          <p className="text-slate-600 text-sm">DNI {jugador.dni} · {jugador.categoria} · {jugador.sede?.nombre ?? "-"}</p>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="px-3 py-2 rounded-lg bg-slate-100">
              <span className="text-slate-500 text-xs">Presencias</span>
              <p className="font-semibold text-slate-800">{presencias}</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-slate-100">
              <span className="text-slate-500 text-xs">Ausencias</span>
              <p className="font-semibold text-slate-800">{ausencias}</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-slate-100">
              <span className="text-slate-500 text-xs">% Asistencia</span>
              <p className="font-semibold text-slate-800">{porcentaje}%</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              type="button"
              onClick={() => exportJugadorPDF(jugador.apellido, jugador.nombre, jugador.categoria, jugador.sede?.nombre ?? "-", presencias, ausencias, porcentaje, detalle)}
              className="px-4 py-2 rounded-lg text-white font-medium text-sm"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Exportar PDF
            </button>
            <WhatsAppShareButton
              getFile={() =>
                getJugadorPDFFile(jugador.apellido, jugador.nombre, jugador.categoria, jugador.sede?.nombre ?? "-", presencias, ausencias, porcentaje, detalle)
              }
              mensaje={`Reporte de asistencia - ${jugador.apellido}, ${jugador.nombre}`}
            />
          </div>
        </div>
      </div>

      {weeks.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Últimos 3 meses (calendario)</h3>
          <p className="text-xs text-slate-500 mb-2">Verde = presente · Rojo = ausente · Gris = sin registro</p>
          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-0.5">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex gap-0.5">
                  {week.map((cell, ci) => (
                    <div
                      key={cell.date}
                      className="w-3 h-3 rounded-sm shrink-0"
                      title={`${cell.date}: ${cell.presente === null ? "sin registro" : cell.presente ? "presente" : "ausente"}`}
                      style={{
                        backgroundColor:
                          cell.presente === null ? "#e2e8f0" : cell.presente ? "#22c55e" : "#ef4444",
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {detalle.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-800 px-4 py-3 border-b border-slate-100">Detalle por fecha</h3>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-left py-2 px-4">Fecha</th>
                  <th className="text-left py-2 px-4">Presente</th>
                  <th className="text-left py-2 px-4">Observación</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((d, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-2 px-4">{formatFecha(d.fecha)}</td>
                    <td className="py-2 px-4">{d.presente ? "Sí" : "No"}</td>
                    <td className="py-2 px-4 text-slate-500">{d.observacion || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
