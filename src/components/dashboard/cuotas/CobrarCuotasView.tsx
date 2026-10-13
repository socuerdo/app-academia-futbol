"use client";

import { setEstadoCuota } from "@/app/dashboard/cuotas/actions";
import { HistorialCuotasModal } from "@/components/dashboard/cuotas/HistorialCuotasModal";
import { Pagination } from "@/components/ui/Pagination";
import { SwitchVisual } from "@/components/ui/SwitchVisual";
import { usePagination } from "@/hooks/usePagination";
import { formatPeriodo, periodoActual } from "@/lib/cuotas/periodo";
import { History } from "lucide-react";
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
  isAdmin: boolean;
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
  isAdmin,
}: CobrarCuotasViewProps) {
  const router = useRouter();
  const [filas, setFilas] = useState<FilaCuota[]>(initialFilas);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [historialFila, setHistorialFila] = useState<FilaCuota | null>(null);

  // Estado local de filtros (no navegan hasta que se presione Buscar)
  const [localPeriodo, setLocalPeriodo] = useState(periodoSel);
  const [localSede, setLocalSede] = useState(sedeSel);
  const [localCategoria, setLocalCategoria] = useState(categoriaSel);

  const hayFiltrosActivos = sedeSel !== "" || categoriaSel !== "" || periodoSel !== periodoActual();
  const periodoBloqueado = !isAdmin && periodoSel < periodoActual();

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
        <div role="alert" className="p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">{error}</div>
      )}

      {periodoBloqueado && (
        <div className="p-3 rounded-lg text-sm bg-amber-50 border border-amber-200 text-amber-800">
          Este período ya cerró y no se pueden modificar cuotas. Contactá a un administrador si necesitás corregir algo.
        </div>
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
        {/* Celular: una fila por jugador, con el interruptor de pago a la derecha */}
        <ul className="md:hidden divide-y divide-slate-100">
          {paged.map((f) => {
            const pagado = f.estado === "pagado";
            return (
              <li key={f.jugador_id} className="flex items-center gap-1 pl-4 pr-2 py-2 min-h-[64px]">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 truncate">
                    {f.apellido}, {f.nombre}
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    {f.categoria} · {f.sede_nombre}
                    {pagado && f.fecha_pago ? ` · Pagó el ${fechaCorta(f.fecha_pago)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pagado}
                  aria-label={`${f.apellido}, ${f.nombre}: cuota ${pagado ? "pagada" : "pendiente"}`}
                  disabled={updatingId === f.jugador_id || periodoBloqueado}
                  onClick={() => toggleEstado(f)}
                  className="flex w-[4.75rem] shrink-0 flex-col items-center gap-1 rounded-lg py-1.5 min-h-[48px] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  <SwitchVisual checked={pagado} />
                  <span className={`text-sm font-semibold ${pagado ? "text-emerald-700" : "text-amber-700"}`}>
                    {pagado ? "Pagada" : "Pendiente"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setHistorialFila(f)}
                  className="shrink-0 p-3 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  aria-label={`Ver historial de ${f.apellido} ${f.nombre}`}
                >
                  <History className="h-5 w-5" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>

        <table className="hidden md:table w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="text-left py-2 px-4">Apellido</th>
              <th className="text-left py-2 px-4">Nombre</th>
              <th className="text-left py-2 px-4">Categoría</th>
              <th className="text-left py-2 px-4">Sede</th>
              <th className="text-left py-2 px-4">Pago</th>
              <th className="text-center py-2 px-4 w-28">Estado</th>
              <th className="py-2 px-4 w-10" />
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
                      aria-label={`${f.apellido}, ${f.nombre}: cuota ${pagado ? "pagada" : "pendiente"}`}
                      disabled={updatingId === f.jugador_id || periodoBloqueado}
                      onClick={() => toggleEstado(f)}
                      className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      title={pagado ? "Marcar como pendiente" : "Marcar como pagada"}
                    >
                      <SwitchVisual checked={pagado} />
                      <span className={`text-sm font-medium ${pagado ? "text-emerald-700" : "text-amber-700"}`}>
                        {pagado ? "Pagada" : "Pendiente"}
                      </span>
                    </button>
                  </td>
                  <td className="py-2 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setHistorialFila(f)}
                      className="p-2.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      title="Ver historial de cuotas"
                      aria-label={`Ver historial de ${f.apellido} ${f.nombre}`}
                    >
                      <History className="h-5 w-5" aria-hidden />
                    </button>
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

      {historialFila && (
        <HistorialCuotasModal
          jugadorId={historialFila.jugador_id}
          jugadorNombre={`${historialFila.apellido}, ${historialFila.nombre}`}
          onClose={() => setHistorialFila(null)}
        />
      )}
    </div>
  );
}
