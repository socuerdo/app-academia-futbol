"use client";

import { cambiarSedeCategoria } from "@/app/dashboard/jugadores/actions";
import { createClient } from "@/lib/supabase/client";
import type { Sede } from "@/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";

type JugadorConSede = {
  id: string;
  dni: string;
  apellido: string;
  nombre: string;
  categoria: string;
  sede_id: string;
  sede?: { nombre: string } | null;
};

interface CambiarSedeViewProps {
  clubId: string;
  jugadores: JugadorConSede[];
  sedes: Pick<Sede, "id" | "nombre">[];
  categorias: string[];
}

export function CambiarSedeView({
  clubId,
  jugadores: initialJugadores,
  sedes,
  categorias,
}: CambiarSedeViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<JugadorConSede[]>([]);
  const [busquedaHecha, setBusquedaHecha] = useState(false);
  const [seleccionado, setSeleccionado] = useState<JugadorConSede | null>(null);
  const [nuevaSedeId, setNuevaSedeId] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buscar() {
    const q = query.trim();
    if (!q) {
      setResultados([]);
      setBusquedaHecha(true);
      return;
    }
    const supabase = createClient();
    const term = `%${q}%`;
    const { data } = await supabase
      .from("jugadores")
      .select("*, sede:sedes(nombre)")
      .eq("club_id", clubId)
      .eq("activo", true)
      .or(`dni.ilike.${term},apellido.ilike.${term},nombre.ilike.${term}`)
      .order("apellido")
      .limit(30);
    const list = (data ?? []).map((j: any) => ({
      ...j,
      sede: Array.isArray(j.sede) ? j.sede[0] : j.sede,
    }));
    setResultados(list);
    setBusquedaHecha(true);
  }

  function elegir(j: JugadorConSede) {
    setSeleccionado(j);
    setNuevaSedeId(j.sede_id);
    setNuevaCategoria(j.categoria);
    setError(null);
  }

  function abrirConfirmar() {
    if (!seleccionado || !nuevaSedeId || !nuevaCategoria.trim()) return;
    if (nuevaSedeId === seleccionado.sede_id && nuevaCategoria === seleccionado.categoria) {
      setError("No hay cambios para aplicar.");
      return;
    }
    setMostrarConfirmar(true);
  }

  async function confirmar() {
    if (!seleccionado) return;
    setSaving(true);
    setError(null);
    const result = await cambiarSedeCategoria(seleccionado.id, nuevaSedeId, nuevaCategoria.trim());
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMostrarConfirmar(false);
    setSeleccionado(null);
    setNuevaSedeId("");
    setNuevaCategoria("");
    buscar();
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Buscar jugador</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), buscar())}
            placeholder="DNI, apellido o nombre"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
            style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
          />
          <button
            type="button"
            onClick={buscar}
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Buscar
          </button>
        </div>
      </div>

      {busquedaHecha && resultados.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <p className="text-sm text-slate-600 px-4 py-2 bg-slate-50">Seleccioná un jugador</p>
          <ul className="divide-y divide-slate-100">
            {resultados.map((j) => (
              <li key={j.id}>
                <button
                  type="button"
                  onClick={() => elegir(j)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex justify-between items-center ${
                    seleccionado?.id === j.id ? "bg-slate-100" : ""
                  }`}
                >
                  <span className="font-medium">{j.apellido}, {j.nombre}</span>
                  <span className="text-slate-500 text-sm">{j.categoria} · {j.sede?.nombre ?? "-"}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {busquedaHecha && query.trim() && resultados.length === 0 && (
        <p className="text-slate-500">No se encontraron jugadores.</p>
      )}

      {seleccionado && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800">
            Cambiar sede / categoría: {seleccionado.apellido}, {seleccionado.nombre}
          </h2>
          {error && (
            <div className="p-2 rounded text-sm bg-red-50 text-red-700">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nueva categoría *</label>
              <select
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 outline-none"
                style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
              >
                {[...new Set([...categorias, seleccionado.categoria])].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nueva sede *</label>
              <select
                value={nuevaSedeId}
                onChange={(e) => setNuevaSedeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 outline-none"
                style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
              >
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={abrirConfirmar}
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Aplicar cambios
          </button>
        </div>
      )}

      {mostrarConfirmar && seleccionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !saving && setMostrarConfirmar(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Confirmar cambio</h3>
            <p className="text-slate-600 text-sm mb-4">
              ¿Aplicar nueva categoría y sede a {seleccionado.apellido}, {seleccionado.nombre}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMostrarConfirmar(false)}
                disabled={saving}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {saving ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
