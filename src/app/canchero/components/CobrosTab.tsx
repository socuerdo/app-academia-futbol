"use client";

import type { TurnoAlquiler } from "@/lib/canchas";

interface CobrosTabProps {
  fecha: string;
  turnosAlquiler: TurnoAlquiler[];
  onFechaChange: (f: string) => void;
}

const ESTADO_STYLES: Record<string, string> = {
  pagado: "bg-green-100 text-green-700",
  parcial: "bg-orange-100 text-orange-700",
  pendiente: "bg-slate-100 text-slate-600",
};

const ESTADO_LABEL: Record<string, string> = {
  pagado: "Pagado",
  parcial: "Parcial",
  pendiente: "Pendiente",
};

export function CobrosTab({ fecha, turnosAlquiler, onFechaChange }: CobrosTabProps) {
  const totalEfectivo = turnosAlquiler.reduce((s, t) => s + (t.efectivo ?? 0), 0);
  const totalTransferencia = turnosAlquiler.reduce((s, t) => s + (t.transferencia ?? 0), 0);
  const pendientesCount = turnosAlquiler.filter((t) => t.estado === "pendiente").length;
  const granTotal = totalEfectivo + totalTransferencia;

  function exportarCSV() {
    const headers = ["Hora", "Cancha", "Equipo 1", "Equipo 2", "Efectivo", "Transferencia", "Estado", "Notas"];
    const rows = turnosAlquiler.map((t) => [
      t.hora,
      t.cancha,
      t.equipo1 ?? "",
      t.equipo2 ?? "",
      t.efectivo?.toString() ?? "0",
      t.transferencia?.toString() ?? "0",
      t.estado,
      t.notas ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cobros-${fecha}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => onFechaChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          />
        </div>
        <button
          type="button"
          onClick={exportarCSV}
          className="w-full sm:w-auto px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      {turnosAlquiler.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-400 text-sm">No hay cobros para este día.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {turnosAlquiler.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-800">{t.hora}</span>
                    <span className="font-bold text-slate-800">{t.cancha}</span>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_STYLES[t.estado] ?? ESTADO_STYLES.pendiente}`}>
                    {ESTADO_LABEL[t.estado] ?? t.estado}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{t.equipo1 ?? "—"} vs {t.equipo2 ?? "—"}</p>
                <div className="flex gap-4 mt-1 text-xs text-slate-500">
                  <span>Efectivo: {t.efectivo != null ? `$${t.efectivo.toLocaleString("es-AR")}` : "—"}</span>
                  <span>Transf: {t.transferencia != null ? `$${t.transferencia.toLocaleString("es-AR")}` : "—"}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block rounded-xl border border-slate-200 bg-white overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-left py-2 px-4">Hora</th>
                  <th className="text-left py-2 px-4">Cancha</th>
                  <th className="text-left py-2 px-4">Equipo 1</th>
                  <th className="text-left py-2 px-4">Equipo 2</th>
                  <th className="text-right py-2 px-4">Efectivo</th>
                  <th className="text-right py-2 px-4">Transferencia</th>
                  <th className="text-left py-2 px-4">Estado</th>
                </tr>
              </thead>
              <tbody>
                {turnosAlquiler.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-4 font-mono">{t.hora}</td>
                    <td className="py-2 px-4 font-semibold">{t.cancha}</td>
                    <td className="py-2 px-4">{t.equipo1 ?? "—"}</td>
                    <td className="py-2 px-4">{t.equipo2 ?? "—"}</td>
                    <td className="py-2 px-4 text-right">
                      {t.efectivo != null ? `$${t.efectivo.toLocaleString("es-AR")}` : "—"}
                    </td>
                    <td className="py-2 px-4 text-right">
                      {t.transferencia != null ? `$${t.transferencia.toLocaleString("es-AR")}` : "—"}
                    </td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_STYLES[t.estado] ?? ESTADO_STYLES.pendiente}`}>
                        {ESTADO_LABEL[t.estado] ?? t.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">Efectivo total</p>
          <p className="text-xl font-bold text-emerald-700">${totalEfectivo.toLocaleString("es-AR")}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Transferencia total</p>
          <p className="text-xl font-bold text-violet-700">${totalTransferencia.toLocaleString("es-AR")}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Pendientes</p>
          <p className="text-xl font-bold text-orange-600">{pendientesCount}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Gran total</p>
          <p className="text-xl font-bold text-slate-800">${granTotal.toLocaleString("es-AR")}</p>
        </div>
      </div>
    </div>
  );
}
