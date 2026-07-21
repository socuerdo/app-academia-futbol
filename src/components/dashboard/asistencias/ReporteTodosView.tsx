"use client";

import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import {
  exportReporteTodosExcel,
  exportReporteTodosPDF,
  getReporteTodosPDFFile,
  type FilaReporteTodos,
} from "@/lib/export-report";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import type { Sede } from "@/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ReporteTodosViewProps {
  sedes: Pick<Sede, "id" | "nombre">[];
  categorias: string[];
  initialSedeId: string;
  initialCategoria: string;
  initialEstado: string;
  filas: FilaReporteTodos[];
}

function isVencido(fecha: string | null): boolean {
  if (!fecha) return false;
  return new Date(fecha) < new Date();
}

export function ReporteTodosView({
  sedes,
  categorias,
  initialSedeId,
  initialCategoria,
  initialEstado,
  filas,
}: ReporteTodosViewProps) {
  const router = useRouter();
  const [localSede, setLocalSede] = useState(initialSedeId);
  const [localCategoria, setLocalCategoria] = useState(initialCategoria);
  const [localEstado, setLocalEstado] = useState(initialEstado);
  const [filtroSexo, setFiltroSexo] = useState<"" | "M" | "F">("");

  const filasVisibles = filtroSexo ? filas.filter((f) => f.sexo === filtroSexo) : filas;
  const { paged, page, pageSize, setPage, setPageSize, total } = usePagination(filasVisibles);

  const hayFiltrosActivos = initialSedeId !== "" || initialCategoria !== "" || initialEstado !== "";

  function aplicarFiltros() {
    const p = new URLSearchParams({ tab: "todos" });
    if (localSede) p.set("sede", localSede);
    if (localCategoria) p.set("categoria", localCategoria);
    if (localEstado) p.set("estado", localEstado);
    router.push(`/dashboard/asistencias?${p.toString()}`);
  }

  function quitarFiltros() {
    setLocalSede("");
    setLocalCategoria("");
    setLocalEstado("");
    router.push("/dashboard/asistencias?tab=todos");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Sede</label>
            <select
              value={localSede}
              onChange={(e) => setLocalSede(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
            >
              <option value="">Todas</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
            <select
              value={localCategoria}
              onChange={(e) => setLocalCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <select
              value={localEstado}
              onChange={(e) => setLocalEstado(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
            >
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
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

      {filas.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 text-sm items-center">
            <span className="text-xs text-slate-500 font-medium mr-1">Filtrar por sexo:</span>
            <button
              type="button"
              onClick={() => setFiltroSexo("")}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${filtroSexo === "" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              Todos: {filas.length}
            </button>
            <button
              type="button"
              onClick={() => setFiltroSexo(filtroSexo === "M" ? "" : "M")}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${filtroSexo === "M" ? "bg-blue-700 text-white" : "bg-blue-100 text-blue-900 hover:bg-blue-200"}`}
            >
              Masculino: {filas.filter((f) => f.sexo === "M").length}
            </button>
            <button
              type="button"
              onClick={() => setFiltroSexo(filtroSexo === "F" ? "" : "F")}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${filtroSexo === "F" ? "bg-pink-700 text-white" : "bg-pink-100 text-pink-800 hover:bg-pink-200"}`}
            >
              Femenino: {filas.filter((f) => f.sexo === "F").length}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => exportReporteTodosExcel(filasVisibles)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Exportar Excel
            </button>
            <button
              type="button"
              onClick={() => exportReporteTodosPDF(filasVisibles)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Exportar PDF
            </button>
            <WhatsAppShareButton getFile={() => getReporteTodosPDFFile(filasVisibles)} mensaje="Reporte de jugadores" />
          </div>
        </>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="text-left py-2 px-4">Jugador</th>
              <th className="text-left py-2 px-4">Categoría</th>
              <th className="text-left py-2 px-4">Sede</th>
              <th className="text-left py-2 px-4">Estado</th>
              <th className="text-left py-2 px-4">Venc. carnet</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((f, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="py-2 px-4">{f.jugador}</td>
                <td className="py-2 px-4">{f.categoria}</td>
                <td className="py-2 px-4">{f.sede}</td>
                <td className="py-2 px-4">{f.estado}</td>
                <td className="py-2 px-4">
                  {f.vencimiento_carnet ? (
                    <span className={isVencido(f.vencimiento_carnet) ? "text-red-600 font-medium" : "text-slate-700"}>
                      {f.vencimiento_carnet}
                      {isVencido(f.vencimiento_carnet) && (
                        <span className="ml-1 inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Vencido
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {filasVisibles.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 text-slate-500 text-xs">
                <td colSpan={5} className="py-2 px-4">Total: {filasVisibles.length}</td>
              </tr>
            </tfoot>
          )}
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
      {filasVisibles.length === 0 && (
        <p className="text-slate-500">{filas.length === 0 ? "No hay jugadores con los filtros seleccionados." : "No hay jugadores con el sexo seleccionado."}</p>
      )}
    </div>
  );
}
