"use client";

import { badgePromedioClass } from "@/lib/evaluaciones/escala";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

export type FilaEvaluacion = {
  id: string;
  jugador_id: string;
  fecha: string;
  temporada: string | null;
  puntaje_promedio: number | null;
  evaluador_id: string | null;
  evaluador_nombre: string | null;
  jugador: {
    nombre: string;
    apellido: string;
    categoria: string;
    foto_url: string | null;
  } | null;
  tipo_nombre: string | null;
};

interface EvaluacionesListViewProps {
  filas: FilaEvaluacion[];
  categorias: string[];
  tipos: { id: string; nombre: string }[];
  temporadas: string[];
  jugadores: { id: string; label: string }[];
}

export function EvaluacionesListView({
  filas,
  categorias,
  tipos,
  temporadas,
  jugadores,
}: EvaluacionesListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const defaults = useMemo(
    () => ({
      categoria: searchParams.get("categoria") ?? "",
      tipo: searchParams.get("tipo") ?? "",
      jugador: searchParams.get("jugador") ?? "",
      temporada: searchParams.get("temporada") ?? "",
    }),
    [searchParams]
  );

  const aplicarFiltros = useCallback(
    (form: FormData) => {
      const p = new URLSearchParams();
      const cat = String(form.get("categoria") ?? "").trim();
      const tipo = String(form.get("tipo") ?? "").trim();
      const jug = String(form.get("jugador") ?? "").trim();
      const temp = String(form.get("temporada") ?? "").trim();
      if (cat) p.set("categoria", cat);
      if (tipo) p.set("tipo", tipo);
      if (jug) p.set("jugador", jug);
      if (temp) p.set("temporada", temp);
      startTransition(() => {
        router.push(
          `/dashboard/evaluaciones${p.toString() ? `?${p.toString()}` : ""}`
        );
      });
    },
    [router]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Evaluaciones</h1>
        <Link
          href="/dashboard/evaluaciones/nueva"
          className="inline-flex justify-center px-4 py-2 rounded-lg text-white font-medium text-sm"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Nueva evaluación
        </Link>
      </div>

      <form
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          aplicarFiltros(new FormData(e.currentTarget));
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Categoría</span>
          <select
            name="categoria"
            defaultValue={defaults.categoria}
            className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Tipo</span>
          <select
            name="tipo"
            defaultValue={defaults.tipo}
            className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="">Todos</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Jugador</span>
          <select
            name="jugador"
            defaultValue={defaults.jugador}
            className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="">Todos</option>
            {jugadores.map((j) => (
              <option key={j.id} value={j.id}>
                {j.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Temporada</span>
          <select
            name="temporada"
            defaultValue={defaults.temporada}
            className="px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
          >
            <option value="">Todas</option>
            {temporadas.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            disabled={pending}
            className="w-full px-4 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-60"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Filtrar
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <th className="px-3 py-3 font-medium">Jugador</th>
              <th className="px-3 py-3 font-medium hidden sm:table-cell">
                Categoría
              </th>
              <th className="px-3 py-3 font-medium">Tipo</th>
              <th className="px-3 py-3 font-medium">Fecha</th>
              <th className="px-3 py-3 font-medium">Promedio</th>
              <th className="px-3 py-3 font-medium hidden md:table-cell">
                Evaluador
              </th>
              <th className="px-3 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-slate-500"
                >
                  No hay evaluaciones con estos filtros.
                </td>
              </tr>
            ) : (
              filas.map((row) => {
                const prom = row.puntaje_promedio ?? 0;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80"
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center text-xs text-slate-500">
                          {row.jugador?.foto_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.jugador.foto_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            "?"
                          )}
                        </div>
                        <span className="font-medium text-slate-800">
                          {row.jugador
                            ? `${row.jugador.apellido}, ${row.jugador.nombre}`
                            : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell text-slate-600">
                      {row.jugador?.categoria ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {row.tipo_nombre ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {row.fecha}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${badgePromedioClass(
                          prom
                        )}`}
                      >
                        {prom.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 py-2 hidden md:table-cell text-slate-600 truncate max-w-[140px]">
                      {row.evaluador_nombre ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <Link
                        href={`/dashboard/evaluaciones/${row.id}`}
                        className="text-[var(--color-primary)] font-medium mr-2"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/dashboard/evaluaciones/historial/${row.jugador_id}`}
                        className="text-slate-600 text-xs"
                      >
                        Historial
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
