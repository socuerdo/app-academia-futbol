"use client";

import { actualizarJugador, eliminarJugador } from "@/app/dashboard/jugadores/actions";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { createClient } from "@/lib/supabase/client";
import type { Jugador } from "@/types/database";
import type { Sede } from "@/types/database";
import { useCategorias } from "@/hooks/useCategorias";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type JugadorConSede = Jugador & { sede?: { nombre: string } | null };

interface BuscarJugadorViewProps {
  clubId: string;
  initialJugadores: JugadorConSede[];
  initialQuery: string;
  sedes: Pick<Sede, "id" | "nombre">[];
  rol: string;
  jugadoresConDeuda?: string[];
}

export function BuscarJugadorView({
  clubId,
  initialJugadores,
  initialQuery,
  sedes,
  rol,
  jugadoresConDeuda = [],
}: BuscarJugadorViewProps) {
  const deudaSet = new Set(jugadoresConDeuda);
  const router = useRouter();
  const { categorias } = useCategorias(clubId);
  const [query, setQuery] = useState(initialQuery);
  const [jugadores, setJugadores] = useState<JugadorConSede[]>(initialJugadores);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<JugadorConSede | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const esAdmin = rol === "admin" || rol === "superadmin";

  const { paged, page, pageSize, setPage, setPageSize, total } =
    usePagination(jugadores);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setJugadores([]);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const term = `%${q.trim()}%`;
    const { data } = await supabase
      .from("jugadores")
      .select("*, sede:sedes(nombre)")
      .eq("club_id", clubId)
      .or(`dni.ilike.${q.trim()},apellido.ilike.${term},nombre.ilike.${term}`)
      .order("apellido")
      .limit(200);
    const list = (data ?? []).map((j: any) => ({
      ...j,
      sede: Array.isArray(j.sede) ? j.sede[0] : j.sede,
    }));
    setJugadores(list);
    setLoading(false);
  }, [clubId]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.replace(`/dashboard/jugadores/buscar?q=${encodeURIComponent(query.trim())}`, { scroll: false });
    search(query.trim());
  };

  function openEditing(j: JugadorConSede) {
    setEditing(j);
    setConfirmDelete(false);
    setError(null);
  }

  async function handleEliminar() {
    if (!editing) return;
    setDeleting(true);
    const result = await eliminarJugador(editing.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      setConfirmDelete(false);
      return;
    }
    setEditing(null);
    setConfirmDelete(false);
    setJugadores((prev) => prev.filter((j) => j.id !== editing.id));
    router.refresh();
  }

  async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await actualizarJugador(editing.id, formData);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(null);
    search(query.trim());
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="DNI, apellido o nombre"
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
          style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-white font-medium"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Buscar
        </button>
      </form>

      {loading && <p className="text-slate-500 text-sm">Buscando...</p>}

      {!loading && jugadores.length === 0 && query.trim() && (
        <p className="text-slate-500">No se encontraron jugadores.</p>
      )}

      {!loading && jugadores.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left py-2 px-4 w-14">Foto</th>
                <th className="text-left py-2 px-4">Apellido</th>
                <th className="text-left py-2 px-4">Nombre</th>
                <th className="text-left py-2 px-4">DNI</th>
                <th className="text-left py-2 px-4">Categoría</th>
                <th className="text-left py-2 px-4">Sede</th>
                <th className="text-right py-2 px-4">Acción</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((j) => (
                <tr key={j.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-4">
                    {j.foto_url ? (
                      <img
                        src={j.foto_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        {(j.apellido[0] || "").toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    <span className="inline-flex items-center gap-1.5">
                      {j.apellido}
                      {deudaSet.has(j.id) && (
                        <span
                          title="Cuota del mes pendiente"
                          className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700"
                        >
                          Cuota
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-2 px-4">{j.nombre}</td>
                  <td className="py-2 px-4">{j.dni}</td>
                  <td className="py-2 px-4">{j.categoria}</td>
                  <td className="py-2 px-4">{j.sede?.nombre ?? "-"}</td>
                  <td className="py-2 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEditing(j)}
                      className="font-medium hover:underline"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > 0 && (
            <Pagination
              total={total}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              itemLabel="jugadores"
            />
          )}
        </div>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !saving && setEditing(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Editar jugador</h2>
              <button
                type="button"
                onClick={() => !saving && setEditing(null)}
                className="p-1 rounded text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-4 space-y-4">
              {error && (
                <div className="p-2 rounded text-sm bg-red-50 text-red-700">{error}</div>
              )}
              <input type="hidden" name="id" value={editing.id} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Apellido *</label>
                  <input name="apellido" defaultValue={editing.apellido} required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                  <input name="nombre" defaultValue={editing.nombre} required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sexo *</label>
                  <select name="sexo" defaultValue={editing.sexo} required className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
                  <select name="categoria" defaultValue={editing.categoria} required className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    {categorias.map((c) => (
                      <option key={c.id} value={c.nombre}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sede *</label>
                  <select name="sede_id" defaultValue={editing.sede_id} required className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                    {sedes.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nº camiseta</label>
                  <input name="numero_camiseta" type="number" min={1} max={99} defaultValue={editing.numero_camiseta ?? ""} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">F. nacimiento</label>
                  <input name="fecha_nacimiento" type="date" defaultValue={editing.fecha_nacimiento ?? ""} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nº carnet</label>
                  <input name="numero_carnet" type="text" defaultValue={editing.numero_carnet ?? ""} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Venc. carnet</label>
                  <input name="fecha_vencimiento_carnet" type="date" defaultValue={editing.fecha_vencimiento_carnet ?? ""} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                </div>
              </div>
              {confirmDelete ? (
                <div className="pt-2 rounded-lg bg-red-50 border border-red-200 p-3 space-y-2">
                  <p className="text-sm text-red-700 font-medium">
                    ¿Eliminar a {editing.apellido}, {editing.nombre}? Esta acción no se puede deshacer y eliminará también sus asistencias y evaluaciones.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleEliminar}
                      disabled={deleting}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                      {deleting ? "Eliminando..." : "Confirmar eliminación"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center pt-2">
                  {esAdmin ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="px-3 py-2 rounded-lg text-red-600 text-sm hover:bg-red-50"
                    >
                      Eliminar jugador
                    </button>
                  ) : (
                    <span />
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
