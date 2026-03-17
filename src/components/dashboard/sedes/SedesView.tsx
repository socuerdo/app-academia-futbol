"use client";

import { actualizarSede, crearSede, eliminarSede } from "@/app/dashboard/sedes/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Sede = {
  id: string;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
  telefono: string | null;
  activo: boolean;
};

interface SedesViewProps {
  sedes: Sede[];
  jugadoresPorSede: Record<string, number>;
}

export function SedesView({ sedes: initialSedes, jugadoresPorSede }: SedesViewProps) {
  const router = useRouter();
  const [sedes, setSedes] = useState(initialSedes);
  useEffect(() => setSedes(initialSedes), [initialSedes]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await crearSede(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowForm(false);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  async function handleUpdate(sedeId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await actualizarSede(sedeId, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(sedeId: string) {
    setError(null);
    setDeletingId(sedeId);
    const result = await eliminarSede(sedeId);
    setDeletingId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSedes((prev) => prev.filter((s) => s.id !== sedeId));
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{error}</div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Lista de sedes</h2>
        {!editingId && (
          <button
            type="button"
            onClick={() => setShowForm((prev) => !prev)}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {showForm ? "Cancelar" : "Agregar sede"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <h3 className="font-medium text-slate-800">Nueva sede</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input name="nombre" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Ej: Sede Centro" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
              <input name="direccion" className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Calle y número" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
              <input name="ciudad" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input name="telefono" type="tel" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white font-medium text-sm"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm border border-slate-300 text-slate-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {sedes.map((sede) => (
              <li key={sede.id} className="p-4">
                {editingId === sede.id ? (
                  <form
                    onSubmit={(e) => handleUpdate(sede.id, e)}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label>
                        <input name="nombre" defaultValue={sede.nombre} required className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Dirección</label>
                        <input name="direccion" defaultValue={sede.direccion ?? ""} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Ciudad</label>
                        <input name="ciudad" defaultValue={sede.ciudad ?? ""} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
                        <input name="telefono" defaultValue={sede.telefono ?? ""} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-1.5 rounded text-sm text-white font-medium" style={{ backgroundColor: "var(--color-primary)" }}>
                        Guardar
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded text-sm border border-slate-300 text-slate-700">
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-800">{sede.nombre}</p>
                      <p className="text-sm text-slate-500">
                        {[sede.direccion, sede.ciudad].filter(Boolean).join(" · ") || "Sin dirección"}
                        {sede.telefono && ` · ${sede.telefono}`}
                      </p>
                      {jugadoresPorSede[sede.id] != null && (
                        <p className="text-xs text-slate-400 mt-1">{jugadoresPorSede[sede.id]} jugador(es)</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(sede.id)}
                        className="text-sm font-medium hover:underline"
                        style={{ color: "var(--color-primary)" }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sede.id)}
                        disabled={deletingId === sede.id || (jugadoresPorSede[sede.id] ?? 0) > 0}
                        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === sede.id ? "..." : "Eliminar"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {sedes.length === 0 && !showForm && (
            <p className="p-6 text-slate-500 text-center">No hay sedes. Agregá una para comenzar.</p>
          )}
        </div>
      )}
    </div>
  );
}
