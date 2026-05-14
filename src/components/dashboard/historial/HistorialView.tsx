"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useState } from "react";
import { formatFecha } from "@/lib/fecha";

type RegistroAudit = {
  id: string;
  usuario_id: string | null;
  usuario_nombre: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  entidad_descripcion: string | null;
  cambios: Record<string, unknown> | null;
  created_at: string;
};

const ACCION_LABELS: Record<string, string> = {
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
  importar: "Importar",
  activar: "Activar",
  desactivar: "Desactivar",
  asignar_categoria: "Asignar categoría",
  guardar_asistencias: "Guardar asistencias",
};

const ENTIDAD_LABELS: Record<string, string> = {
  jugador: "Jugador",
  asistencia: "Asistencia",
  evaluacion: "Evaluación",
  cuota: "Cuota",
  importacion: "Importación",
};

const ACCION_COLORS: Record<string, string> = {
  crear: "bg-emerald-100 text-emerald-700",
  editar: "bg-blue-100 text-blue-700",
  eliminar: "bg-red-100 text-red-700",
  importar: "bg-violet-100 text-violet-700",
  activar: "bg-emerald-100 text-emerald-700",
  desactivar: "bg-slate-100 text-slate-600",
  asignar_categoria: "bg-amber-100 text-amber-700",
  guardar_asistencias: "bg-sky-100 text-sky-700",
};

interface Props {
  registros: RegistroAudit[];
  total: number;
  pageSize: number;
  currentPage: number;
  usuarios: { id: string; nombre: string }[];
  filtros: {
    usuario: string;
    accion: string;
    entidad: string;
    desde: string;
    hasta: string;
  };
}

export function HistorialView({
  registros,
  total,
  pageSize,
  currentPage,
  usuarios,
  filtros,
}: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [usuario, setUsuario] = useState(filtros.usuario);
  const [accion, setAccion] = useState(filtros.accion);
  const [entidad, setEntidad] = useState(filtros.entidad);
  const [desde, setDesde] = useState(filtros.desde);
  const [hasta, setHasta] = useState(filtros.hasta);

  const applyFilters = useCallback(
    (overrides: Partial<typeof filtros & { page: number }> = {}) => {
      const p = new URLSearchParams();
      const vals = { usuario, accion, entidad, desde, hasta, ...overrides };
      if (vals.usuario) p.set("usuario", vals.usuario);
      if (vals.accion) p.set("accion", vals.accion);
      if (vals.entidad) p.set("entidad", vals.entidad);
      if (vals.desde) p.set("desde", vals.desde);
      if (vals.hasta) p.set("hasta", vals.hasta);
      const page = "page" in overrides ? overrides.page : 1;
      if (page && page > 1) p.set("page", String(page));
      router.push(`/dashboard/historial?${p.toString()}`);
    },
    [usuario, accion, entidad, desde, hasta, router]
  );

  const totalPages = Math.ceil(total / pageSize);

  function formatHora(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }

  function formatFechaHora(iso: string) {
    const d = new Date(iso);
    return `${formatFecha(d.toISOString().slice(0, 10))} ${formatHora(iso)}`;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Usuario</label>
            <select
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
            >
              <option value="">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Acción</label>
            <select
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
            >
              <option value="">Todas</option>
              {Object.entries(ACCION_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Entidad</label>
            <select
              value={entidad}
              onChange={(e) => setEntidad(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
            >
              <option value="">Todas</option>
              {Object.entries(ENTIDAD_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => applyFilters()}
            className="px-4 py-1.5 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={() => {
              setUsuario("");
              setAccion("");
              setEntidad("");
              setDesde("");
              setHasta("");
              router.push("/dashboard/historial");
            }}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">
            {total} {total === 1 ? "registro" : "registros"}
          </span>
        </div>

        {registros.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No hay registros para los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs">
                  <th className="text-left py-2 px-4 w-44">Fecha y hora</th>
                  <th className="text-left py-2 px-4">Usuario</th>
                  <th className="text-left py-2 px-4 w-36">Acción</th>
                  <th className="text-left py-2 px-4 w-28">Entidad</th>
                  <th className="text-left py-2 px-4">Descripción</th>
                  <th className="text-left py-2 px-4 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr className="border-t border-slate-100 hover:bg-slate-50 cursor-default">
                      <td className="py-2 px-4 text-slate-500 text-xs whitespace-nowrap">
                        {formatFechaHora(r.created_at)}
                      </td>
                      <td className="py-2 px-4 font-medium">{r.usuario_nombre ?? "—"}</td>
                      <td className="py-2 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ACCION_COLORS[r.accion] ?? "bg-slate-100 text-slate-600"}`}
                        >
                          {ACCION_LABELS[r.accion] ?? r.accion}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-slate-600 text-xs">
                        {ENTIDAD_LABELS[r.entidad] ?? r.entidad}
                      </td>
                      <td className="py-2 px-4 text-slate-700">
                        {r.entidad_descripcion ?? "—"}
                      </td>
                      <td className="py-2 px-4">
                        {r.cambios && Object.keys(r.cambios).length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expandedId === r.id ? null : r.id)
                            }
                            className="text-xs text-slate-400 hover:text-slate-600 underline"
                          >
                            {expandedId === r.id ? "Ocultar" : "Detalle"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === r.id && r.cambios && (
                      <tr className="bg-slate-50 border-t border-slate-100">
                        <td colSpan={6} className="px-8 py-3">
                          <div className="text-xs text-slate-600 space-y-1">
                            {Object.entries(r.cambios).map(([campo, val]) => {
                              if (
                                typeof val === "object" &&
                                val !== null &&
                                "anterior" in val &&
                                "nuevo" in val
                              ) {
                                const v = val as { anterior: unknown; nuevo: unknown };
                                return (
                                  <div key={campo}>
                                    <span className="font-medium">{campo}:</span>{" "}
                                    <span className="line-through text-red-500">
                                      {String(v.anterior ?? "—")}
                                    </span>{" "}
                                    →{" "}
                                    <span className="text-emerald-600">
                                      {String(v.nuevo ?? "—")}
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <div key={campo}>
                                  <span className="font-medium">{campo}:</span>{" "}
                                  {JSON.stringify(val)}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => applyFilters({ page: currentPage - 1 })}
                className="px-3 py-1 rounded border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
              >
                ← Anterior
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => applyFilters({ page: currentPage + 1 })}
                className="px-3 py-1 rounded border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
