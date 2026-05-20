"use client";

import { useState, useEffect } from "react";
import { CANCHAS, HORARIOS_ALQUILER } from "@/lib/canchas";
import type { TurnoAlquiler } from "@/lib/canchas";
import { crearTurnoAlquiler, actualizarTurnoAlquiler } from "../actions";

interface NuevaReservaModalProps {
  fecha: string;
  turno: TurnoAlquiler | null;
  onGuardado: (turno: TurnoAlquiler, isNew: boolean) => void;
  onClose: () => void;
}

type FormState = {
  fecha: string;
  hora: string;
  cancha: string;
  equipo1: string;
  equipo2: string;
  efectivo: string;
  transferencia: string;
  estado: "pendiente" | "parcial" | "pagado";
  notas: string;
};

export function NuevaReservaModal({ fecha, turno, onGuardado, onClose }: NuevaReservaModalProps) {
  const isEditing = turno !== null;

  const [form, setForm] = useState<FormState>({
    fecha: turno?.fecha ?? fecha,
    hora: turno?.hora ?? "08:00",
    cancha: turno?.cancha ?? "C1",
    equipo1: turno?.equipo1 ?? "",
    equipo2: turno?.equipo2 ?? "",
    efectivo: turno?.efectivo?.toString() ?? "",
    transferencia: turno?.transferencia?.toString() ?? "",
    estado: turno?.estado ?? "pendiente",
    notas: turno?.notas ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      fecha: turno?.fecha ?? fecha,
      hora: turno?.hora ?? "08:00",
      cancha: turno?.cancha ?? "C1",
      equipo1: turno?.equipo1 ?? "",
      equipo2: turno?.equipo2 ?? "",
      efectivo: turno?.efectivo?.toString() ?? "",
      transferencia: turno?.transferencia?.toString() ?? "",
      estado: turno?.estado ?? "pendiente",
      notas: turno?.notas ?? "",
    });
    setError(null);
  }, [turno, fecha]);

  function set(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      fecha: form.fecha,
      hora: form.hora,
      cancha: form.cancha,
      equipo1: form.equipo1.trim() || null,
      equipo2: form.equipo2.trim() || null,
      efectivo: form.efectivo !== "" ? parseFloat(form.efectivo) : null,
      transferencia: form.transferencia !== "" ? parseFloat(form.transferencia) : null,
      estado: form.estado,
      notas: form.notas.trim() || null,
    };

    if (isEditing && turno) {
      const res = await actualizarTurnoAlquiler(turno.id, payload);
      setSaving(false);
      if (res.error) { setError(res.error); return; }
      if (res.data) onGuardado(res.data, false);
    } else {
      const res = await crearTurnoAlquiler(payload);
      setSaving(false);
      if (res.error) { setError(res.error); return; }
      if (res.data) onGuardado(res.data, true);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">
            {isEditing ? "Editar reserva" : "Nueva reserva"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => set("fecha", e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hora *</label>
              <select
                value={form.hora}
                onChange={(e) => set("hora", e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {HORARIOS_ALQUILER.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cancha *</label>
            <select
              value={form.cancha}
              onChange={(e) => set("cancha", e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              {CANCHAS.map((c) => (
                <option key={c.id} value={c.id}>{c.label} — {c.tipo}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Equipo 1</label>
              <input
                type="text"
                value={form.equipo1}
                onChange={(e) => set("equipo1", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Nombre del equipo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Equipo 2</label>
              <input
                type="text"
                value={form.equipo2}
                onChange={(e) => set("equipo2", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Nombre del equipo"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Efectivo ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.efectivo}
                onChange={(e) => set("efectivo", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Transferencia ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.transferencia}
                onChange={(e) => set("transferencia", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado *</label>
            <select
              value={form.estado}
              onChange={(e) => set("estado", e.target.value as FormState["estado"])}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => set("notas", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
              placeholder="Observaciones opcionales"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-50 transition-colors"
              style={{ backgroundColor: "#16a34a" }}
            >
              {saving ? "Guardando..." : isEditing ? "Actualizar" : "Crear reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
