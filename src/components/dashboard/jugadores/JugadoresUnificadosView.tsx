"use client";

import {
  actualizarJugador,
  eliminarJugador,
  toggleActivoJugador,
} from "@/app/dashboard/jugadores/actions";
import { PERMISO, tienePermiso } from "@/lib/permisos";
import { CargarJugadorForm } from "@/components/dashboard/jugadores/CargarJugadorForm";
import { ImportarJugadoresView } from "@/components/dashboard/jugadores/ImportarJugadoresView";
import { Pagination } from "@/components/ui/Pagination";
import { useCategorias } from "@/hooks/useCategorias";
import { usePagination } from "@/hooks/usePagination";
import type { Sede } from "@/types/database";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type JugadorRow = {
  id: string;
  club_id: string;
  sede_id: string;
  dni: string;
  apellido: string;
  nombre: string;
  sexo: string;
  categoria: string;
  numero_camiseta?: number | null;
  fecha_nacimiento?: string | null;
  numero_carnet?: string | null;
  fecha_vencimiento_carnet?: string | null;
  foto_url?: string | null;
  activo: boolean;
  sede?: { id: string; nombre: string } | null;
};

interface JugadoresUnificadosViewProps {
  clubId: string;
  initialJugadores: JugadorRow[];
  sedes: Pick<Sede, "id" | "nombre">[];
  rol: string;
  permisos?: string[];
  jugadoresConDeuda: string[];
  sedeIdPorNombre: Record<string, string>;
}

export function JugadoresUnificadosView({
  clubId,
  initialJugadores,
  sedes,
  rol,
  permisos = [],
  jugadoresConDeuda,
  sedeIdPorNombre,
}: JugadoresUnificadosViewProps) {
  const router = useRouter();
  const { categorias } = useCategorias(clubId);
  const deudaSet = new Set(jugadoresConDeuda);
  const esAdmin =
    rol === "admin" ||
    rol === "superadmin" ||
    rol === "secretaria" ||
    tienePermiso(permisos, PERMISO.JUGADORES_EDITAR);

  const [jugadores, setJugadores] = useState<JugadorRow[]>(initialJugadores);
  const [query, setQuery] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroSede, setFiltroSede] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("activos");

  const [editingJugador, setEditingJugador] = useState<JugadorRow | null>(null);
  const [showNuevo, setShowNuevo] = useState(false);
  const [showImportar, setShowImportar] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    setJugadores(initialJugadores);
  }, [initialJugadores]);

  const categoriasUnicas = useMemo(
    () => [...new Set(jugadores.map((j) => j.categoria).filter(Boolean))].sort(),
    [jugadores]
  );

  const filtered = useMemo(() => {
    return jugadores.filter((j) => {
      if (filtroEstado === "activos" && !j.activo) return false;
      if (filtroEstado === "inactivos" && j.activo) return false;
      if (filtroCategoria && j.categoria !== filtroCategoria) return false;
      if (filtroSede && j.sede?.id !== filtroSede) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          j.dni.toLowerCase().includes(q) ||
          j.apellido.toLowerCase().includes(q) ||
          j.nombre.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [jugadores, query, filtroCategoria, filtroSede, filtroEstado]);

  const { paged, page, pageSize, setPage, setPageSize, total } =
    usePagination(filtered);

  useEffect(() => {
    setPage(1);
  }, [query, filtroCategoria, filtroSede, filtroEstado, setPage]);

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

  function openEditing(j: JugadorRow) {
    setEditingJugador(j);
    setConfirmDelete(false);
    setError(null);
  }

  async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingJugador) return;
    setError(null);
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const result = await actualizarJugador(editingJugador.id, formData);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const nuevoSedeId = formData.get("sede_id") as string;
    const nuevaSede = sedes.find((s) => s.id === nuevoSedeId);
    setJugadores((prev) =>
      prev.map((x) =>
        x.id === editingJugador.id
          ? {
              ...x,
              apellido: formData.get("apellido") as string,
              nombre: formData.get("nombre") as string,
              sexo: formData.get("sexo") as string,
              categoria: formData.get("categoria") as string,
              sede_id: nuevoSedeId,
              sede: nuevaSede ? { id: nuevaSede.id, nombre: nuevaSede.nombre } : x.sede,
              numero_camiseta: formData.get("numero_camiseta")
                ? Number(formData.get("numero_camiseta"))
                : null,
              fecha_nacimiento: (formData.get("fecha_nacimiento") as string) || null,
              numero_carnet: (formData.get("numero_carnet") as string) || null,
              fecha_vencimiento_carnet:
                (formData.get("fecha_vencimiento_carnet") as string) || null,
            }
          : x
      )
    );
    setEditingJugador(null);
    router.refresh();
  }

  async function handleEliminar() {
    if (!editingJugador) return;
    setDeleting(true);
    const result = await eliminarJugador(editingJugador.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      setConfirmDelete(false);
      return;
    }
    setJugadores((prev) => prev.filter((j) => j.id !== editingJugador.id));
    setEditingJugador(null);
    setConfirmDelete(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Barra de filtros y acciones */}
      <div className="flex flex-wrap gap-3 items-end">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por DNI, apellido o nombre..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
          style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
        />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 outline-none text-sm"
          style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
        >
          <option value="">Todas las categorías</option>
          {categoriasUnicas.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filtroSede}
          onChange={(e) => setFiltroSede(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 outline-none text-sm"
          style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
        >
          <option value="">Todas las sedes</option>
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 outline-none text-sm"
          style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
        >
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
          <option value="todos">Todos</option>
        </select>
        {esAdmin && (
          <>
            <button
              type="button"
              onClick={() => setShowImportar(true)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Importar
            </button>
            <button
              type="button"
              onClick={() => setShowNuevo(true)}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              + Nuevo jugador
            </button>
          </>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="text-left py-2 px-4 w-14">Foto</th>
              <th className="text-left py-2 px-4">Apellido</th>
              <th className="text-left py-2 px-4">Nombre</th>
              <th className="text-left py-2 px-4">DNI</th>
              <th className="text-left py-2 px-4">Categoría</th>
              <th className="text-left py-2 px-4">Sede</th>
              {esAdmin && <th className="text-center py-2 px-4">Estado</th>}
              {esAdmin && <th className="text-right py-2 px-4">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr>
                <td
                  colSpan={esAdmin ? 8 : 6}
                  className="py-10 text-center text-slate-500"
                >
                  No hay jugadores con los filtros seleccionados.
                </td>
              </tr>
            )}
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
                      <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                        Cuota
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-2 px-4">{j.nombre}</td>
                <td className="py-2 px-4">{j.dni}</td>
                <td className="py-2 px-4">{j.categoria}</td>
                <td className="py-2 px-4">{j.sede?.nombre ?? "-"}</td>
                {esAdmin && (
                  <td className="py-2 px-4 text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={j.activo}
                      disabled={updating === j.id}
                      onClick={() => handleToggle(j)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50"
                      style={{
                        backgroundColor: j.activo ? "var(--color-primary)" : "#cbd5e1",
                      }}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                          j.activo ? "translate-x-5" : "translate-x-1"
                        }`}
                        style={{ marginTop: 2 }}
                      />
                    </button>
                  </td>
                )}
                {esAdmin && (
                  <td className="py-2 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEditing(j)}
                      className="font-medium hover:underline text-sm"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Editar
                    </button>
                  </td>
                )}
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

      {/* Modal: Editar jugador */}
      {editingJugador && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !saving && setEditingJugador(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Editar jugador</h2>
              <button
                type="button"
                onClick={() => !saving && setEditingJugador(null)}
                className="p-1 rounded text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-4 space-y-4">
              {error && (
                <div className="p-2 rounded text-sm bg-red-50 text-red-700">{error}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    name="apellido"
                    defaultValue={editingJugador.apellido}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    name="nombre"
                    defaultValue={editingJugador.nombre}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sexo *
                  </label>
                  <select
                    name="sexo"
                    defaultValue={editingJugador.sexo}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    name="categoria"
                    defaultValue={editingJugador.categoria}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.nombre}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sede *
                  </label>
                  <select
                    name="sede_id"
                    defaultValue={editingJugador.sede_id}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {sedes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nº camiseta
                  </label>
                  <input
                    name="numero_camiseta"
                    type="number"
                    min={1}
                    max={99}
                    defaultValue={editingJugador.numero_camiseta ?? ""}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    F. nacimiento
                  </label>
                  <input
                    name="fecha_nacimiento"
                    type="date"
                    defaultValue={editingJugador.fecha_nacimiento ?? ""}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nº carnet
                  </label>
                  <input
                    name="numero_carnet"
                    type="text"
                    defaultValue={editingJugador.numero_carnet ?? ""}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Venc. carnet
                  </label>
                  <input
                    name="fecha_vencimiento_carnet"
                    type="date"
                    defaultValue={editingJugador.fecha_vencimiento_carnet ?? ""}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {confirmDelete ? (
                <div className="pt-2 rounded-lg bg-red-50 border border-red-200 p-3 space-y-2">
                  <p className="text-sm text-red-700 font-medium">
                    ¿Eliminar a {editingJugador.apellido}, {editingJugador.nombre}? Esta
                    acción no se puede deshacer y eliminará también sus asistencias y
                    evaluaciones.
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
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-3 py-2 rounded-lg text-red-600 text-sm hover:bg-red-50"
                  >
                    Eliminar jugador
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingJugador(null)}
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

      {/* Modal: Nuevo jugador */}
      {showNuevo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowNuevo(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Nuevo jugador</h2>
              <button
                type="button"
                onClick={() => setShowNuevo(false)}
                className="p-1 rounded text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <CargarJugadorForm
                clubId={clubId}
                sedes={sedes}
                onSuccess={() => {
                  setShowNuevo(false);
                  router.refresh();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Importar jugadores */}
      {showImportar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowImportar(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Importar jugadores</h2>
              <button
                type="button"
                onClick={() => setShowImportar(false)}
                className="p-1 rounded text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <ImportarJugadoresView
                clubId={clubId}
                sedes={sedes}
                sedeIdPorNombre={sedeIdPorNombre}
                categorias={categorias.map((c) => c.nombre)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
