"use client";

import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { formatPeriodo, periodoActual } from "@/lib/cuotas/periodo";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type FilaMorosidad = {
  jugador_id: string;
  apellido: string;
  nombre: string;
  sexo: string;
  categoria: string;
  sede_nombre: string;
  periodo_pagado: boolean;
  meses_atraso: number;
  ultimo_pago: string | null;
  inscripcion_mes?: string | null;
};

interface MorosidadViewProps {
  filas: FilaMorosidad[];
  sedes: { id: string; nombre: string }[];
  categorias: string[];
  periodoSel: string;
  sedeSel: string;
  categoriaSel: string;
  periodoOpciones: string[];
  ventanaMeses: number;
}

function severidadClass(meses: number): string {
  if (meses >= 3) return "bg-red-100 text-red-800";
  if (meses >= 2) return "bg-amber-100 text-amber-800";
  return "bg-yellow-100 text-yellow-800";
}

export function MorosidadView({
  filas,
  sedes,
  categorias,
  periodoSel,
  sedeSel,
  categoriaSel,
  periodoOpciones,
  ventanaMeses,
}: MorosidadViewProps) {
  const router = useRouter();
  const { paged, page, pageSize, setPage, setPageSize, total } = usePagination(filas);

  const [localPeriodo, setLocalPeriodo] = useState(periodoSel);
  const [localSede, setLocalSede] = useState(sedeSel);
  const [localCategoria, setLocalCategoria] = useState(categoriaSel);

  const hayFiltrosActivos = sedeSel !== "" || categoriaSel !== "" || periodoSel !== periodoActual();

  function aplicarFiltros() {
    const p = new URLSearchParams();
    if (localPeriodo) p.set("periodo", localPeriodo);
    if (localSede) p.set("sede", localSede);
    if (localCategoria) p.set("categoria", localCategoria);
    p.set("tab", "morosidad");
    router.push(`/dashboard/cuotas?${p.toString()}`);
  }

  function quitarFiltros() {
    setLocalPeriodo(periodoActual());
    setLocalSede("");
    setLocalCategoria("");
    router.push("/dashboard/cuotas?tab=morosidad");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Jugadores con la cuota de {formatPeriodo(periodoSel)} sin pagar. La columna
        &quot;Atraso&quot; cuenta los últimos {ventanaMeses} meses.
      </p>

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

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium">
          {filas.length} jugadores con deuda
        </span>
        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-medium">
          Masculino: {filas.filter((f) => f.sexo === "M").length}
        </span>
        <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-800 font-medium">
          Femenino: {filas.filter((f) => f.sexo === "F").length}
        </span>
      </div>

      {filas.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left py-2 px-4">Apellido</th>
                <th className="text-left py-2 px-4">Nombre</th>
                <th className="text-left py-2 px-4">Categoría</th>
                <th className="text-left py-2 px-4">Sede</th>
                <th className="text-right py-2 px-4">Atraso</th>
                <th className="text-left py-2 px-4">Último pago</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((f) => (
                <tr key={f.jugador_id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-4">{f.apellido}</td>
                  <td className="py-2 px-4">{f.nombre}</td>
                  <td className="py-2 px-4">{f.categoria}</td>
                  <td className="py-2 px-4">{f.sede_nombre}</td>
                  <td className="py-2 px-4 text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${severidadClass(f.meses_atraso)}`}>
                      {f.meses_atraso} {f.meses_atraso === 1 ? "mes" : "meses"}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-slate-600">
                    {f.ultimo_pago ? formatPeriodo(f.ultimo_pago) : "Sin pagos"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-700 text-xs">
                <td colSpan={6} className="py-2 px-4">
                  Total: {filas.length} · Masculino: {filas.filter((f) => f.sexo === "M").length} · Femenino: {filas.filter((f) => f.sexo === "F").length}
                </td>
              </tr>
            </tfoot>
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
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-emerald-700 font-medium">¡Todos al día!</p>
          <p className="text-emerald-600 text-sm mt-1">No hay jugadores con la cuota de {formatPeriodo(periodoSel)} pendiente.</p>
        </div>
      )}
    </div>
  );
}
