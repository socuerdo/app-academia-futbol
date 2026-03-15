"use client";

import { exportReporteExcel, exportReportePDF, type FilaReporte } from "@/lib/export-report";
import type { Sede } from "@/types/database";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

  useEffect(() => {
    const p = new URLSearchParams();
    if (initialSedeId) p.set("sede", initialSedeId);
    if (initialCategoria) p.set("categoria", initialCategoria);
    if (initialDesde) p.set("desde", initialDesde);
    if (initialHasta) p.set("hasta", initialHasta);
    const q = p.toString();
    if (q) router.replace(`/dashboard/asistencias/reportes?${q}`, { scroll: false });
  }, []);

  const updateFilters = (sede: string, cat: string, desde: string, hasta: string) => {
    const p = new URLSearchParams();
    if (sede) p.set("sede", sede);
    if (cat) p.set("categoria", cat);
    if (desde) p.set("desde", desde);
    if (hasta) p.set("hasta", hasta);
    router.push(`/dashboard/asistencias/reportes?${p.toString()}`);
  };

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap gap-4 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const sede = (form.querySelector('[name="sede"]') as HTMLSelectElement)?.value ?? "";
          const cat = (form.querySelector('[name="categoria"]') as HTMLSelectElement)?.value ?? "";
          const desde = (form.querySelector('[name="desde"]') as HTMLInputElement)?.value ?? "";
          const hasta = (form.querySelector('[name="hasta"]') as HTMLInputElement)?.value ?? "";
          updateFilters(sede, cat, desde, hasta);
        }}
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sede</label>
          <select name="sede" defaultValue={initialSedeId} className="px-3 py-2 border border-slate-300 rounded-lg min-w-[140px]">
            <option value="">Todas</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
          <select name="categoria" defaultValue={initialCategoria} className="px-3 py-2 border border-slate-300 rounded-lg min-w-[120px]">
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
          <input name="desde" type="date" defaultValue={initialDesde} className="px-3 py-2 border border-slate-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
          <input name="hasta" type="date" defaultValue={initialHasta} className="px-3 py-2 border border-slate-300 rounded-lg" />
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: "var(--color-primary)" }}>
          Filtrar
        </button>
      </form>

      {filas.length > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportReporteExcel(filas)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Exportar Excel
          </button>
          <button
            type="button"
            onClick={() => exportReportePDF(filas)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Exportar PDF
          </button>
        </div>
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
            {filas.map((f, i) => (
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
        </table>
      </div>
      {filas.length === 0 && (initialSedeId || initialCategoria || initialDesde) && (
        <p className="text-slate-500">No hay datos para los filtros seleccionados.</p>
      )}
    </div>
  );
}
