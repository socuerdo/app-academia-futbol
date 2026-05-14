"use client";

import {
  importarJugadoresBatch,
  asignarCategoriaBatch,
  type FilaImportacion,
  type JugadorImportado,
} from "@/app/dashboard/jugadores/importar/actions";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import type { Sede } from "@/types/database";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ExcelJS from "exceljs";

const PLANTILLA_CSV =
  "dni,apellido,nombre,sexo,categoria,sede,numero_camiseta,fecha_nacimiento,fecha_inscripcion,numero_carnet,fecha_vencimiento_carnet\n" +
  "12345678,García,Juan,M,Sub-14,Sede Centro,10,2010-05-01,2026-05-14,,,\n";

interface ImportarJugadoresViewProps {
  clubId: string;
  sedes: Pick<Sede, "id" | "nombre">[];
  sedeIdPorNombre: Record<string, string>;
  categorias: string[];
}

function parseNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function parseStr(v: unknown): string {
  return String(v ?? "").trim();
}

function parseDate(v: unknown): string | null {
  const s = parseStr(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function ImportarJugadoresView({
  sedes,
  sedeIdPorNombre,
  categorias,
}: ImportarJugadoresViewProps) {
  const router = useRouter();
  const [filas, setFilas] = useState<FilaImportacion[]>([]);
  const [resultado, setResultado] = useState<{
    importados: number;
    duplicados: number;
    errores: string[];
    jugadoresImportados: JugadorImportado[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paso 2: asignación de categoría
  const [paso2Jugadores, setPaso2Jugadores] = useState<JugadorImportado[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [categoriaAsignar, setCategoriaAsignar] = useState("");
  const [asignando, setAsignando] = useState(false);
  const [toastAsignacion, setToastAsignacion] = useState<string | null>(null);

  const { paged, page, pageSize, setPage, setPageSize, total } =
    usePagination(filas);

  function descargarPlantilla() {
    const blob = new Blob(["﻿" + PLANTILLA_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-jugadores.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function normalizarFilas(raw: Record<string, unknown>[]): FilaImportacion[] {
    return raw
      .map((r) => ({
        dni: parseStr(r.dni ?? r.DNI),
        apellido: parseStr(r.apellido),
        nombre: parseStr(r.nombre),
        sexo: parseStr(r.sexo ?? "M"),
        categoria: parseStr(r.categoria) || undefined,
        sede_nombre: parseStr(r.sede) || undefined,
        sede_id: undefined,
        numero_camiseta: parseNum(r.numero_camiseta),
        fecha_nacimiento: parseDate(r.fecha_nacimiento),
        fecha_inscripcion: parseDate(r.fecha_inscripcion) || null,
        numero_carnet: parseStr(r.numero_carnet) || null,
        fecha_vencimiento_carnet: parseDate(r.fecha_vencimiento_carnet) || null,
      }))
      .map((f) => ({
        ...f,
        sede_id: f.sede_nombre ? sedeIdPorNombre[f.sede_nombre] : undefined,
      }));
  }

  async function handleFile(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setResultado(null);
    setPaso2Jugadores([]);
    const file = files[0];
    const name = file.name.toLowerCase();

    if (name.endsWith(".csv")) {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete(res) {
          const data = (res.data as Record<string, unknown>[]) || [];
          setFilas(normalizarFilas(data));
        },
      });
      return;
    }

    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      const buf = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buf);
      const sheet = wb.worksheets[0];
      if (!sheet) {
        setError("El archivo no tiene hojas.");
        return;
      }
      const rows: Record<string, unknown>[] = [];
      const header: string[] = [];
      sheet.eachRow((row, rowNumber) => {
        const values = row.values as unknown[];
        if (rowNumber === 1) {
          values.forEach((v, i) => {
            if (i) header[i] = String(v ?? "").trim();
          });
          return;
        }
        const obj: Record<string, unknown> = {};
        values.forEach((v, i) => {
          if (i && header[i]) obj[header[i]] = v;
        });
        if (Object.keys(obj).length) rows.push(obj);
      });
      setFilas(normalizarFilas(rows));
      return;
    }

    setError("Formato no soportado. Usá CSV o Excel (.xlsx).");
  }

  async function handleConfirmar() {
    if (filas.length === 0) return;
    setError(null);
    setLoading(true);
    const res = await importarJugadoresBatch(filas, sedeIdPorNombre);
    setResultado(res);
    setLoading(false);
    if (res.importados > 0 || res.duplicados > 0) {
      setFilas([]);
      router.refresh();
    }
    // Abrir paso 2 con los jugadores sin categoría o con "Sin categoría"
    if (res.importados > 0) {
      setPaso2Jugadores(res.jugadoresImportados);
      setSelectedIds(new Set(res.jugadoresImportados.map((j) => j.id)));
    }
  }

  function toggleSeleccion(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    if (selectedIds.size === paso2Jugadores.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paso2Jugadores.map((j) => j.id)));
    }
  }

  async function handleAsignarCategoria() {
    if (selectedIds.size === 0 || !categoriaAsignar) return;
    setAsignando(true);
    const res = await asignarCategoriaBatch(Array.from(selectedIds), categoriaAsignar);
    setAsignando(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setToastAsignacion(`Categoría "${categoriaAsignar}" asignada a ${res.asignados} jugadores.`);
    setPaso2Jugadores((prev) => prev.filter((j) => !selectedIds.has(j.id)));
    setSelectedIds(new Set());
    setCategoriaAsignar("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{error}</div>
      )}

      {toastAsignacion && (
        <div className="p-3 rounded-lg text-sm bg-emerald-50 text-emerald-700 flex items-center justify-between">
          <span>{toastAsignacion}</span>
          <button
            type="button"
            onClick={() => setToastAsignacion(null)}
            className="ml-4 text-emerald-600 hover:text-emerald-800 font-medium"
          >
            ✕
          </button>
        </div>
      )}

      {/* Paso 1: subir archivo */}
      {paso2Jugadores.length === 0 && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <p className="text-sm text-slate-600">
              <strong>Paso 1:</strong> Descargá la plantilla, completá los datos y subí el archivo.
              La columna <code className="bg-slate-100 px-1 rounded">categoria</code> es opcional — si la dejás vacía, podés asignarla en masa en el paso 2.
              La columna <code className="bg-slate-100 px-1 rounded">fecha_inscripcion</code> también es opcional (por defecto se usa la fecha de hoy).
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={descargarPlantilla}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50"
              >
                Descargar plantilla CSV
              </button>
              <label
                className="px-4 py-2 rounded-lg text-white font-medium text-sm cursor-pointer"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="sr-only"
                  onChange={(e) => handleFile(e.target.files)}
                />
                Subir CSV o Excel
              </label>
            </div>
          </div>

          {sedes.length === 0 && (
            <p className="text-amber-600 text-sm">
              Creá al menos una sede en Sedes antes de importar.
            </p>
          )}

          {filas.length > 0 && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <h3 className="px-4 py-3 text-sm font-semibold text-slate-800 border-b border-slate-100">
                  Vista previa ({filas.length} filas)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="text-left py-2 px-4">DNI</th>
                        <th className="text-left py-2 px-4">Apellido</th>
                        <th className="text-left py-2 px-4">Nombre</th>
                        <th className="text-left py-2 px-4">Categoría</th>
                        <th className="text-left py-2 px-4">Sede</th>
                        <th className="text-left py-2 px-4">F. Inscripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((f, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="py-2 px-4">{f.dni}</td>
                          <td className="py-2 px-4">{f.apellido}</td>
                          <td className="py-2 px-4">{f.nombre}</td>
                          <td className="py-2 px-4">
                            {f.categoria || (
                              <span className="text-amber-600 text-xs">Sin categoría</span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {f.sede_nombre ?? (f.sede_id ? "—" : "⚠ Sin sede")}
                          </td>
                          <td className="py-2 px-4 text-slate-500 text-xs">
                            {f.fecha_inscripcion || "Hoy"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  total={total}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="filas"
                />
              </div>

              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={loading || sedes.length === 0}
                  className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {loading ? "Importando..." : "Confirmar importación"}
                </button>
                <button
                  type="button"
                  onClick={() => setFilas([])}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
                >
                  Limpiar
                </button>
              </div>
            </>
          )}
        </>
      )}

      {resultado && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="font-semibold text-slate-800">Resultado de importación</h3>
          <p className="text-slate-700">
            <strong>{resultado.importados}</strong> importados ·{" "}
            <strong>{resultado.duplicados}</strong> duplicados omitidos
          </p>
          {resultado.errores.length > 0 && (
            <ul className="text-sm text-red-700 list-disc list-inside">
              {resultado.errores.slice(0, 10).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {resultado.errores.length > 10 && (
                <li>... y {resultado.errores.length - 10} más</li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Paso 2: asignación masiva de categoría */}
      {paso2Jugadores.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800">
              Paso 2: Asignar categoría (opcional)
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {paso2Jugadores.length} jugadores importados. Podés asignarles una categoría ahora o
              hacerlo más tarde desde el perfil de cada jugador.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-100">
              <input
                type="checkbox"
                id="seleccionar-todos"
                checked={selectedIds.size === paso2Jugadores.length && paso2Jugadores.length > 0}
                onChange={toggleTodos}
                className="w-4 h-4 accent-[var(--color-primary)]"
              />
              <label htmlFor="seleccionar-todos" className="text-sm text-slate-600 cursor-pointer">
                Seleccionar todos ({paso2Jugadores.length})
              </label>
            </div>
            <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {paso2Jugadores.map((j) => (
                <li key={j.id} className="flex items-center gap-3 px-4 py-2">
                  <input
                    type="checkbox"
                    id={`j-${j.id}`}
                    checked={selectedIds.has(j.id)}
                    onChange={() => toggleSeleccion(j.id)}
                    className="w-4 h-4 accent-[var(--color-primary)]"
                  />
                  <label htmlFor={`j-${j.id}`} className="text-sm cursor-pointer">
                    <span className="font-medium">{j.apellido}, {j.nombre}</span>
                    <span className="text-slate-400 ml-2 text-xs">DNI {j.dni}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Categoría a asignar</label>
              <select
                value={categoriaAsignar}
                onChange={(e) => setCategoriaAsignar(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">Seleccionar...</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleAsignarCategoria}
              disabled={asignando || selectedIds.size === 0 || !categoriaAsignar}
              className="px-4 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {asignando
                ? "Asignando..."
                : `Asignar a ${selectedIds.size} jugador${selectedIds.size !== 1 ? "es" : ""}`}
            </button>
            <button
              type="button"
              onClick={() => setPaso2Jugadores([])}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
            >
              Omitir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
