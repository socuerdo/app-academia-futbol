"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { TurnoAlquiler } from "@/lib/canchas";
import { eliminarTurnoAlquiler } from "../actions";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

interface HorariosTabProps {
  fecha: string;
  turnosAlquiler: TurnoAlquiler[];
  onFechaChange: (f: string) => void;
  onEditar: (turno: TurnoAlquiler) => void;
  onEliminado: (id: string) => void;
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

export function HorariosTab({ fecha, turnosAlquiler, onFechaChange, onEditar, onEliminado }: HorariosTabProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleEliminar(id: string) {
    setDeletingId(id);
    setError(null);
    const res = await eliminarTurnoAlquiler(id);
    setDeletingId(null);
    setConfirmId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    onEliminado(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => onFechaChange(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{error}</div>
      )}

      {turnosAlquiler.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-400 text-sm">No hay reservas para este día.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left py-2 px-4">Hora</th>
                <th className="text-left py-2 px-4">Cancha</th>
                <th className="text-left py-2 px-4">Equipo 1</th>
                <th className="text-left py-2 px-4">Equipo 2</th>
                <th className="text-right py-2 px-4">Efectivo</th>
                <th className="text-right py-2 px-4">Transferencia</th>
                <th className="text-left py-2 px-4">Notas</th>
                <th className="text-left py-2 px-4">Estado</th>
                <th className="w-16" />
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
                  <td className="py-2 px-4 text-slate-500 max-w-[140px] truncate">{t.notas ?? "—"}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_STYLES[t.estado] ?? ESTADO_STYLES.pendiente}`}>
                      {ESTADO_LABEL[t.estado] ?? t.estado}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditar(t)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(t.id)}
                        disabled={deletingId === t.id}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmId && (
        <ConfirmDeleteDialog
          loading={deletingId === confirmId}
          onConfirm={() => handleEliminar(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}
