"use client";

import { getHistorialCuotas, type HistorialJugador } from "@/app/dashboard/cuotas/actions";
import { formatPeriodo } from "@/lib/cuotas/periodo";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface HistorialCuotasModalProps {
  jugadorId: string;
  jugadorNombre: string;
  onClose: () => void;
}

function fechaCorta(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR");
}

function formatInscripcion(fecha: string | null): string {
  if (!fecha) return "No registrada";
  const [y, m, d] = fecha.split("-");
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${Number(d)} de ${meses[Number(m) - 1]} de ${y}`;
}

export function HistorialCuotasModal({ jugadorId, jugadorNombre, onClose }: HistorialCuotasModalProps) {
  const [data, setData] = useState<HistorialJugador | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getHistorialCuotas(jugadorId).then((res) => {
      if (res.ok) setData(res.data);
      else setError(res.error);
    });
  }, [jugadorId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pagadas = data?.historial.filter((h) => h.estado === "pagado").length ?? 0;
  const pendientes = (data?.historial.length ?? 0) - pagadas;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Historial de cuotas de ${jugadorNombre}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90dvh] sm:max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Historial de cuotas</h2>
            <p className="text-sm text-slate-500 mt-0.5">{jugadorNombre}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {!data && !error && (
            <div className="flex items-center justify-center py-10 text-slate-400 text-sm gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              Cargando...
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {data && (
            <>
              {/* Info del jugador */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500 mb-0.5">Categoría</p>
                  <p className="font-medium text-slate-800">{data.categoria}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500 mb-0.5">Sede</p>
                  <p className="font-medium text-slate-800">{data.sede_nombre}</p>
                </div>
                <div className="col-span-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                  <p className="text-xs text-blue-600 mb-0.5">Fecha de inscripción</p>
                  <p className="font-medium text-blue-900">{formatInscripcion(data.fecha_inscripcion)}</p>
                </div>
              </div>

              {/* Resumen */}
              {data.historial.length > 0 && (
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                    {data.historial.length} períodos registrados
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                    {pagadas} pagadas
                  </span>
                  {pendientes > 0 && (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
                      {pendientes} pendientes
                    </span>
                  )}
                </div>
              )}

              {/* Tabla de historial */}
              {data.historial.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-slate-500 text-sm">Sin cuotas registradas todavía.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="text-left py-2 px-3">Período</th>
                        <th className="text-left py-2 px-3">Estado</th>
                        <th className="text-left py-2 px-3">Fecha de pago</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.historial.map((h) => (
                        <tr key={h.periodo} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-800">{formatPeriodo(h.periodo)}</td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                              h.estado === "pagado"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {h.estado === "pagado" ? "Pagada" : "Pendiente"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{fechaCorta(h.fecha_pago)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
