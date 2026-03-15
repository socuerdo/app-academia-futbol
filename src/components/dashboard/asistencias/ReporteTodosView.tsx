"use client";

import {
  exportReporteTodosExcel,
  exportReporteTodosPDF,
  type FilaReporteTodos,
} from "@/lib/export-report";
import type { Sede } from "@/types/database";
import { useRouter } from "next/navigation";

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

  const updateFilters = (sede: string, cat: string, estado: string) => {
    const p = new URLSearchParams();
    if (sede) p.set("sede", sede);
    if (cat) p.set("categoria", cat);
    if (estado) p.set("estado", estado);
    router.push(`/dashboard/asistencias/reporte-todos?${p.toString()}`);
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
          const estado = (form.querySelector('[name="estado"]') as HTMLSelectElement)?.value ?? "";
          updateFilters(sede, cat, estado);
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
          <select name="estado" defaultValue={initialEstado} className="px-3 py-2 border border-slate-300 rounded-lg min-w-[120px]">
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg text-white font-medium" style={{ backgroundColor: "var(--color-primary)" }}>
          Filtrar
        </button>
      </form>

      {filas.length > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportReporteTodosExcel(filas)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Exportar Excel
          </button>
          <button
            type="button"
            onClick={() => exportReporteTodosPDF(filas)}
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
              <th className="text-left py-2 px-4">Estado</th>
              <th className="text-left py-2 px-4">Venc. carnet</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
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
        </table>
      </div>
      {filas.length === 0 && (
        <p className="text-slate-500">No hay jugadores con los filtros seleccionados.</p>
      )}
    </div>
  );
}
