"use client";

import { setEstadoCuota } from "@/app/dashboard/cuotas/actions";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { formatPeriodo, periodoActual } from "@/lib/cuotas/periodo";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type FilaCuota = {
  jugador_id: string;
  apellido: string;
  nombre: string;
  categoria: string;
  sede_nombre: string;
  estado: "pagado" | "pendiente";
  fecha_pago: string | null;
};

interface CobrarCuotasViewProps {
  filas: FilaCuota[];
  sedes: { id: string; nombre: string }[];
  categorias: string[];
  periodoSel: string;
  sedeSel: string;
  categoriaSel: string;
  periodoOpciones: string[];
}

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR");
}

export function CobrarCuotasView({
  filas: initialFilas,
  sedes,
  categorias,
  periodoSel,
  sedeSel,
  categoriaSel,
  periodoOpciones,
}: CobrarCuotasViewProps) {
  const router = useRouter();
  const [filas, setFilas] = useState<FilaCuota[]>(initialFilas);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  // Estado local de filtros (no navegan hasta que se presione Buscar)
  const [localPeriodo, setLocalPeriodo] = useState(periodoSel);
  const [localSede, setLocalSede] = useState(sedeSel);
  const [localCategoria, setLocalCategoria] = useState(categoriaSel);

  const hayFiltrosActivos = sedeSel !== "" || categoriaSel !== "" || periodoSel !== periodoActual();

  const filasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return filas;
    const q = busqueda.toLowerCase();
    return filas.filter(
      (f) =>
        f.apellido.toLowerCase().includes(q) ||
        f.nombre.toLowerCase().includes(q)
    );
  }, [filas, busqueda]);

  const totales = useMemo(() => {
    const pagados = filas.filter((f) => f.estado === "pagado").length;
    return { pagados, pendientes: filas.length - pagados, total: filas.length };
  }, [filas]);

  const { paged, page, pageSize, setPage, setPageSize, total } = usePagination(filasFiltradas);

  function aplicarFiltros() {
    const p = new URLSearchParams();
    if (localPeriodo) p.set("periodo", localPeriodo);
    if (localSede) p.set("sede", localSede);
    if (localCategoria) p.set("categoria", localCategoria);
    p.set("tab", "cobrar");
    router.push(`/dashboard/cuotas?${p.toString()}`);
  }

  function quitarFiltros() {
    setLocalPeriodo(periodoActual());
    setLocalSede("");
    setLocalCategoria("");
    router.push("/dashboard/cuotas?tab=cobrar");
  }

  async function toggleEstado(fila: FilaCuota) {
    const next = fila.estado === "pagado" ? "pendiente" : "pagado";
    const fecha_pago = next === "pagado" ? new Date().toISOString() : null;
    setUpdatingId(fila.jugador_id);
    setError(null);
    setFilas((prev) =>
      prev.map((f) =>
        f.jugador_id === fila.jugador_id ? { ...f, estado: next, fecha_pago } : f
      )
    );
    const res = await setEstadoCuota({
      jugador_id: fila.jugador_id,
      periodo: periodoSel,
      estado: next,
    });
    setUpdatingId(null);
    if (!res.ok) {
      setError(res.error);
      setFilas((prev) =>
        prev.map((f) =>
          f.jugador_id === fila.jugador_id
            ? { ...f, estado: fila.estado, fecha_pago: fila.fecha_pago }
            : f
        )
      );
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{error}</div>
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Período</label>
            <select
              value={localPeriodo}
              onChange={(e) => setLocalPeriodo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              {periodoOpciones.map((p) => (
                <option key={p} value={p}>
                  {formatPeriodo(p)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sede</label>
            <select
              value={localSede}
              onChange={(e) => setLocalSede(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Todas</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
            <select
              value={localCategoria}
              onChange={(e) => setLocalCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={aplicarFiltros}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Buscar
          </button>
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={quitarFiltros}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Quitar filtros
            </button>
          )}
        </div>
      </div>

      <div>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPage(1); }}
          placeholder="Buscar jugador por apellido o nombre..."
          className="w-full max-w-sm px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
        />
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
          {totales.pagados} pagadas
        </span>
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
          {totales.pendientes} pendientes
        </span>
        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          {totales.total} jugadores
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="text-left py-2 px-4">Apellido</th>
              <th className="text-left py-2 px-4">Nombre</th>
              <th className="text-left py-2 px-4">Categoría</th>
              <th className="text-left py-2 px-4">Sede</th>
              <th className="text-left py-2 px-4">Pago</th>
              <th className="text-center py-2 px-4 w-28">Estado</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((f) => {
              const pagado = f.estado === "pagado";
              return (
                <tr key={f.jugador_id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-4">{f.apellido}</td>
                  <td className="py-2 px-4">{f.nombre}</td>
                  <td className="py-2 px-4">{f.categoria}</td>
                  <td className="py-2 px-4">{f.sede_nombre}</td>
                  <td className="py-2 px-4 text-slate-600">
                    {pagado && f.fecha_pago ? fechaCorta(f.fecha_pago) : "—"}
                  </td>
                  <td className="py-2 px-4 text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={pagado}
                      disabled={updatingId === f.jugador_id}
                      onClick={() => toggleEstado(f)}
                      className="relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-colors disabled:opacity-50"
                      style={{ backgroundColor: pagado ? "var(--color-primary)" : "#cbd5e1" }}
                      title={pagado ? "Marcar como pendiente" : "Marcar como pagada"}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${pagado ? "translate-x-5" : "translate-x-1"}`}
                        style={{ marginTop: 2 }}
                      />
                    </button>
                    <span
                      className={`ml-2 text-xs font-medium ${pagado ? "text-emerald-700" : "text-amber-700"}`}
                    >
                      {pagado ? "Pagada" : "Pendiente"}
                    </span>
                  </td>
                </tr>
              );
            })}
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

      {filasFiltradas.length === 0 && (
        <p className="text-slate-500 text-sm">No hay jugadores con los filtros seleccionados.</p>
      )}
    </div>
  );
}
