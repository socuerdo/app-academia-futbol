"use client";

import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { exportReporteExcel, exportReportePDF, getReportePDFFile, type FilaReporte } from "@/lib/export-report";
import { WhatsAppShareButton } from "@/components/ui/WhatsAppShareButton";
import type { Sede } from "@/types/database";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ReportesAsistenciasViewProps {
  sedes: Pick<Sede, "id" | "nombre">[];
  categorias: string[];
  initialSedeId: string;
  initialCategoria: string;
  initialDesde: string;
  initialHasta: string;
  filas: FilaReporte[];
}

function badgeColor(pct: number): string {
  if (pct >= 80) return "bg-emerald-100 text-emerald-800";
  if (pct >= 60) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export function ReportesAsistenciasView({
  sedes,
  categorias,
  initialSedeId,
  initialCategoria,
  initialDesde,
  initialHasta,
  filas,
}: ReportesAsistenciasViewProps) {
  const router = useRouter();
  const [localSede, setLocalSede] = useState(initialSedeId);
  const [localCategoria, setLocalCategoria] = useState(initialCategoria);
  const [localDesde, setLocalDesde] = useState(initialDesde);
  const [localHasta, setLocalHasta] = useState(initialHasta);
  const [filtroSexo, setFiltroSexo] = useState<"" | "M" | "F">("");

  const filasVisibles = filtroSexo ? filas.filter((f) => f.sexo === filtroSexo) : filas;
  const { paged, page, pageSize, setPage, setPageSize, total } = usePagination(filasVisibles);

  const defaultDesde = (() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  })();
  const defaultHasta = new Date().toISOString().slice(0, 10);
  const hayFiltrosActivos =
    initialSedeId !== "" ||
    initialCategoria !== "" ||
    initialDesde !== defaultDesde ||
    initialHasta !== defaultHasta;

  function aplicarFiltros() {
    const p = new URLSearchParams({ tab: "reporte" });
    if (localSede) p.set("sede", localSede);
    if (localCategoria) p.set("categoria", localCategoria);
    if (localDesde) p.set("desde", localDesde);
    if (localHasta) p.set("hasta", localHasta);
    router.push(`/dashboard/asistencias?${p.toString()}`);
  }

  function quitarFiltros() {
    const hoy = new Date();
    const hace30 = new Date(hoy);
    hace30.setDate(hace30.getDate() - 30);
    const desde = hace30.toISOString().slice(0, 10);
    const hasta = hoy.toISOString().slice(0, 10);
    setLocalSede("");
    setLocalCategoria("");
    setLocalDesde(desde);
    setLocalHasta(hasta);
    router.push(`/dashboard/asistencias?tab=reporte`);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
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
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
            <input
              type="date"
              value={localDesde}
              onChange={(e) => setLocalDesde(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
            />
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
            <input
              type="date"
              value={localHasta}
              onChange={(e) => setLocalHasta(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
            />
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
              onClick={() => exportReporteExcel(filasVisibles)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Exportar Excel
            </button>
            <button
              type="button"
              onClick={() => exportReportePDF(filasVisibles)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Exportar PDF
            </button>
            <WhatsAppShareButton getFile={() => getReportePDFFile(filasVisibles)} mensaje="Reporte de asistencias" />
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
              <th className="text-right py-2 px-4">Presencias</th>
              <th className="text-right py-2 px-4">Ausencias</th>
              <th className="text-right py-2 px-4">Total</th>
              <th className="text-right py-2 px-4">%</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((f, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="py-2 px-4">{f.jugador}</td>
                <td className="py-2 px-4">{f.categoria}</td>
                <td className="py-2 px-4">{f.sede}</td>
                <td className="py-2 px-4 text-right">{f.presencias}</td>
                <td className="py-2 px-4 text-right">{f.ausencias}</td>
                <td className="py-2 px-4 text-right">{f.total}</td>
                <td className="py-2 px-4 text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${badgeColor(f.porcentaje)}`}>
                    {f.porcentaje}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {filasVisibles.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-700 text-xs">
                <td colSpan={3} className="py-2 px-4 text-slate-500">Total: {filasVisibles.length}</td>
                <td className="py-2 px-4 text-right">{filasVisibles.reduce((s, f) => s + f.presencias, 0)}</td>
                <td className="py-2 px-4 text-right">{filasVisibles.reduce((s, f) => s + f.ausencias, 0)}</td>
                <td className="py-2 px-4 text-right">{filasVisibles.reduce((s, f) => s + f.total, 0)}</td>
                <td />
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
        <p className="text-slate-500">{filas.length === 0 ? "No hay datos para los filtros seleccionados." : "No hay jugadores con el sexo seleccionado."}</p>
      )}
    </div>
  );
}
