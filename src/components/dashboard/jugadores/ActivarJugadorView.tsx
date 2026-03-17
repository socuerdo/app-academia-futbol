"use client";

import { toggleActivoJugador } from "@/app/dashboard/jugadores/actions";
import type { Sede } from "@/types/database";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type JugadorRow = {
  id: string;
  dni: string;
  apellido: string;
  nombre: string;
  categoria: string;
  activo: boolean;
  sede?: { id: string; nombre: string } | null;
};

interface ActivarJugadorViewProps {
  initialJugadores: JugadorRow[];
  sedes: Pick<Sede, "id" | "nombre">[];
  categorias: string[];
}

export function ActivarJugadorView({
  initialJugadores,
  sedes,
  categorias,
}: ActivarJugadorViewProps) {
  const router = useRouter();
  const [jugadores, setJugadores] = useState<JugadorRow[]>(initialJugadores);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");
  const [filtroSede, setFiltroSede] = useState<string>("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    setJugadores(initialJugadores);
  }, [initialJugadores]);

  const filtered = useMemo(() => {
    return jugadores.filter((j) => {
      if (filtroCategoria && j.categoria !== filtroCategoria) return false;
      if (filtroSede && j.sede?.id !== filtroSede) return false;
      return true;
    });
  }, [jugadores, filtroCategoria, filtroSede]);

  async function handleToggle(j: JugadorRow) {
    const next = !j.activo;
    setJugadores((prev) =>
      prev.map((x) => (x.id === j.id ? { ...x, activo: next } : x))
    );
    setUpdating(j.id);
    const result = await toggleActivoJugador(j.id, next);
    setUpdating(null);
    if (result.error) {
      setJugadores((prev) =>
        prev.map((x) => (x.id === j.id ? { ...x, activo: !next } : x))
      );
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <div className="w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
            style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="w-full">
          <label className="block text-sm font-medium text-slate-700 mb-1">Sede</label>
          <select
            value={filtroSede}
            onChange={(e) => setFiltroSede(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
            style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
          >
            <option value="">Todas</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="text-left py-2 px-4">Apellido</th>
              <th className="text-left py-2 px-4">Nombre</th>
              <th className="text-left py-2 px-4">Categoría</th>
              <th className="text-left py-2 px-4">Sede</th>
              <th className="text-center py-2 px-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((j) => (
              <tr key={j.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="py-2 px-4">{j.apellido}</td>
                <td className="py-2 px-4">{j.nombre}</td>
                <td className="py-2 px-4">{j.categoria}</td>
                <td className="py-2 px-4">{j.sede?.nombre ?? "-"}</td>
                <td className="py-2 px-4 text-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={j.activo}
                    disabled={updating === j.id}
                    onClick={() => handleToggle(j)}
                    className={`
                      relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                      transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50
                      ${j.activo ? "" : ""}
                    `}
                    style={{
                      backgroundColor: j.activo ? "var(--color-primary)" : "#cbd5e1",
                      ["--tw-ring-color" as string]: "var(--color-primary)",
                    }}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                        transition duration-200
                        ${j.activo ? "translate-x-5" : "translate-x-1"}
                      `}
                      style={{ marginTop: 2 }}
                    />
                  </button>
                  <span className="ml-2 text-slate-600">
                    {j.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="text-slate-500 text-sm">No hay jugadores con los filtros seleccionados.</p>
      )}
    </div>
  );
}
