"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { CANCHAS, HORARIOS_ESCUELA } from "@/lib/canchas";
import type { TurnoEscuela } from "@/lib/canchas";
import { crearTurnoEscuela, eliminarTurnoEscuela } from "../actions";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

interface EscuelaTabProps {
  fecha: string;
  turnosEscuela: TurnoEscuela[];
  onFechaChange: (f: string) => void;
  onGuardado: (turno: TurnoEscuela, isNew: boolean) => void;
  onEliminado: (id: string) => void;
}

const DIAS_SEMANA = [1, 2, 3, 4, 5]; // lunes a viernes

function isWeekday(dateStr: string): boolean {
  const d = new Date(dateStr + "T12:00:00");
  return DIAS_SEMANA.includes(d.getDay());
}

type FormState = {
  hora: string;
  cancha: string;
  equipo_clase: string;
  tipo: string;
  profesor: string;
};

const FORM_INICIAL: FormState = {
  hora: "15:30",
  cancha: "C1",
  equipo_clase: "",
  tipo: "",
  profesor: "",
};

export function EscuelaTab({ fecha, turnosEscuela, onFechaChange, onGuardado, onEliminado }: EscuelaTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function handleFechaChange(f: string) {
    if (!isWeekday(f)) return;
    onFechaChange(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await crearTurnoEscuela({
      fecha,
      hora: form.hora,
      cancha: form.cancha,
      equipo_clase: form.equipo_clase.trim() || null,
      tipo: form.tipo.trim() || null,
      profesor: form.profesor.trim() || null,
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data) {
      onGuardado(res.data, true);
      setForm(FORM_INICIAL);
      setShowForm(false);
    }
  }

  async function handleEliminar(id: string) {
    setDeletingId(id);
    setError(null);
    const res = await eliminarTurnoEscuela(id);
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Fecha (lun–vie)</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => handleFechaChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          />
          {!isWeekday(fecha) && (
            <span className="text-xs text-orange-600">Seleccioná un día hábil</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setShowForm(true); setError(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: "#16a34a" }}
        >
          <Plus className="h-4 w-4" />
          Agregar clase
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <h3 className="font-semibold text-slate-800">Nueva clase</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Hora</label>
              <select
                value={form.hora}
                onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {HORARIOS_ESCUELA.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cancha</label>
              <select
                value={form.cancha}
                onChange={(e) => setForm((f) => ({ ...f, cancha: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {CANCHAS.map((c) => (
                  <option key={c.id} value={c.id}>{c.label} — {c.tipo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Clase / Grupo</label>
              <input
                type="text"
                value={form.equipo_clase}
                onChange={(e) => setForm((f) => ({ ...f, equipo_clase: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Ej: Sub-12"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
              <input
                type="text"
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Ej: Entrenamiento"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Profesor</label>
              <input
                type="text"
                value={form.profesor}
                onChange={(e) => setForm((f) => ({ ...f, profesor: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Nombre del profesor"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(FORM_INICIAL); }}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-50"
              style={{ backgroundColor: "#16a34a" }}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {turnosEscuela.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-400 text-sm">No hay clases cargadas para este día.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {turnosEscuela.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-semibold text-slate-800">{t.hora}</span>
                      <span className="font-bold text-slate-800">{t.cancha}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Escuela</span>
                    </div>
                    <p className="text-sm text-slate-700">{t.equipo_clase ?? "—"}</p>
                    <div className="flex gap-3 mt-0.5 text-xs text-slate-500">
                      {t.tipo && <span>{t.tipo}</span>}
                      {t.profesor && <span>{t.profesor}</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmId(t.id)}
                    disabled={deletingId === t.id}
                    className="shrink-0 p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
                  <th className="text-left py-2 px-4">Clase</th>
                  <th className="text-left py-2 px-4">Tipo</th>
                  <th className="text-left py-2 px-4">Profesor</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {turnosEscuela.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-4 font-mono">{t.hora}</td>
                    <td className="py-2 px-4 font-semibold">{t.cancha}</td>
                    <td className="py-2 px-4">{t.equipo_clase ?? "—"}</td>
                    <td className="py-2 px-4">{t.tipo ?? "—"}</td>
                    <td className="py-2 px-4">{t.profesor ?? "—"}</td>
                    <td className="py-2 px-2">
                      <button
                        type="button"
                        onClick={() => setConfirmId(t.id)}
                        disabled={deletingId === t.id}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
