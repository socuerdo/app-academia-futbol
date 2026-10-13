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
  const [localPeriodo, setLocalPeriodo] = useState(periodoSel);
  const [localSede, setLocalSede] = useState(sedeSel);
  const [localCategoria, setLocalCategoria] = useState(categoriaSel);
  const [filtroSexo, setFiltroSexo] = useState<"" | "M" | "F">("");

  const filasVisibles = filtroSexo ? filas.filter((f) => f.sexo === filtroSexo) : filas;
  const { paged, page, pageSize, setPage, setPageSize, total } = usePagination(filasVisibles);

  const hayFiltrosActivos = sedeSel !== "" || categoriaSel !== "" || periodoSel !== periodoActual();

  function aplicarFiltros(periodo: string, sede: string, categoria: string) {
    const p = new URLSearchParams();
    if (periodo) p.set("periodo", periodo);
    if (sede) p.set("sede", sede);
    if (categoria) p.set("categoria", categoria);
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
      <p className="text-sm text-slate-600">
        Jugadores con la cuota de {formatPeriodo(periodoSel)} sin pagar. La columna
        &quot;Atraso&quot; cuenta los últimos {ventanaMeses} meses.
      </p>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Período</label>
            <select
              value={localPeriodo}
              onChange={(e) => {
                setLocalPeriodo(e.target.value);
                aplicarFiltros(e.target.value, localSede, localCategoria);
              }}
              className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg"
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
              onChange={(e) => {
                setLocalSede(e.target.value);
                aplicarFiltros(localPeriodo, e.target.value, localCategoria);
              }}
              className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg"
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
              onChange={(e) => {
                setLocalCategoria(e.target.value);
                aplicarFiltros(localPeriodo, localSede, e.target.value);
              }}
              className="w-full min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg"
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
          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={quitarFiltros}
              className="px-4 min-h-[44px] rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Quitar filtros
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm items-center">
        <span className="text-sm text-slate-600 font-medium mr-1">Filtrar por sexo:</span>
        <button
          type="button"
          onClick={() => setFiltroSexo("")}
          className={`px-4 min-h-[44px] rounded-full font-medium transition-colors ${filtroSexo === "" ? "bg-red-700 text-white" : "bg-red-100 text-red-800 hover:bg-red-200"}`}
        >
          Todos: {filas.length}
        </button>
        <button
          type="button"
          onClick={() => setFiltroSexo(filtroSexo === "M" ? "" : "M")}
          className={`px-4 min-h-[44px] rounded-full font-medium transition-colors ${filtroSexo === "M" ? "bg-blue-700 text-white" : "bg-blue-100 text-blue-900 hover:bg-blue-200"}`}
        >
          Masculino: {filas.filter((f) => f.sexo === "M").length}
        </button>
        <button
          type="button"
          onClick={() => setFiltroSexo(filtroSexo === "F" ? "" : "F")}
          className={`px-4 min-h-[44px] rounded-full font-medium transition-colors ${filtroSexo === "F" ? "bg-pink-700 text-white" : "bg-pink-100 text-pink-800 hover:bg-pink-200"}`}
        >
          Femenino: {filas.filter((f) => f.sexo === "F").length}
        </button>
      </div>

      {filasVisibles.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden overflow-x-auto">
          {/* Celular: una fila por jugador, sin scroll horizontal */}
          <ul className="md:hidden divide-y divide-slate-100">
            {paged.map((f) => (
              <li key={f.jugador_id} className="flex items-center gap-3 px-4 py-3 min-h-[64px]">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 truncate">
                    {f.apellido}, {f.nombre}
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    {f.categoria} · {f.sede_nombre}
                  </p>
                  <p className="text-xs text-slate-600">
                    Último pago: {f.ultimo_pago ? formatPeriodo(f.ultimo_pago) : "sin pagos"}
                  </p>
                </div>
                <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${severidadClass(f.meses_atraso)}`}>
                  {f.meses_atraso} {f.meses_atraso === 1 ? "mes" : "meses"}
                </span>
              </li>
            ))}
            <li className="px-4 py-2 bg-slate-50 text-sm font-semibold text-slate-700">
              Total: {filasVisibles.length}
            </li>
          </ul>

          <table className="hidden md:table w-full text-sm">
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
                  Total: {filasVisibles.length}
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
          {filas.length === 0 ? (
            <>
              <p className="text-emerald-800 font-medium">¡Todos al día!</p>
              <p className="text-emerald-700 text-sm mt-1">No hay jugadores con la cuota de {formatPeriodo(periodoSel)} pendiente.</p>
            </>
          ) : (
            <p className="text-emerald-800 font-medium">No hay jugadores {filtroSexo === "M" ? "masculinos" : "femeninos"} con deuda.</p>
          )}
        </div>
      )}
    </div>
  );
}
