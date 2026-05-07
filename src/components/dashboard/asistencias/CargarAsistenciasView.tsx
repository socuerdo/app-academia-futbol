"use client";

import { guardarAsistenciasBatch } from "@/app/dashboard/asistencias/actions";
import type { Sede } from "@/types/database";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Toast } from "@/components/ui/Toast";
import { Loader2, Save, Upload } from "lucide-react";

type JugadorRow = {
  id: string;
  apellido: string;
  nombre: string;
  dni: string;
  categoria: string;
  sede_id: string;
  foto_url: string | null;
};

type AsistenciaState = { presente: boolean; observacion: string };

interface CargarAsistenciasViewProps {
  clubId: string;
  sedes: Pick<Sede, "id" | "nombre">[];
  categorias: string[];
  initialSedeId: string;
  initialCategoria: string;
  initialFecha: string;
  initialJugadores: JugadorRow[];
  asistenciasExistentes: Record<string, { presente: boolean; observacion: string | null }>;
  jugadoresConDeuda?: string[];
}

export function CargarAsistenciasView({
  sedes,
  categorias,
  initialSedeId,
  initialCategoria,
  initialFecha,
  initialJugadores,
  asistenciasExistentes,
  jugadoresConDeuda = [],
}: CargarAsistenciasViewProps) {
  const deudaSet = new Set(jugadoresConDeuda);
  const router = useRouter();
  const [sedeId, setSedeId] = useState(initialSedeId);
  const [categoria, setCategoria] = useState(initialCategoria);
  const [fecha, setFecha] = useState(initialFecha);
  const [jugadores, setJugadores] = useState<JugadorRow[]>(initialJugadores);
  const [asistencias, setAsistencias] = useState<Record<string, AsistenciaState>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    setJugadores(initialJugadores);
    const next: Record<string, AsistenciaState> = {};
    initialJugadores.forEach((j) => {
      const ex = asistenciasExistentes[j.id];
      next[j.id] = {
        presente: ex?.presente ?? true,
        observacion: ex?.observacion ?? "",
      };
    });
    setAsistencias(next);
  }, [initialJugadores, asistenciasExistentes]);

  const updateQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (sedeId) p.set("sede", sedeId);
    if (categoria) p.set("categoria", categoria);
    if (fecha) p.set("fecha", fecha);
    router.replace(`/dashboard/asistencias/cargar?${p.toString()}`, { scroll: false });
  }, [sedeId, categoria, fecha, router]);

  useEffect(() => {
    updateQuery();
  }, [sedeId, categoria, fecha]);

  const setPresente = (jugadorId: string, presente: boolean) => {
    setAsistencias((prev) => ({
      ...prev,
      [jugadorId]: { ...prev[jugadorId], presente },
    }));
  };

  const setObservacion = (jugadorId: string, observacion: string) => {
    setAsistencias((prev) => ({
      ...prev,
      [jugadorId]: { ...prev[jugadorId], observacion },
    }));
  };

  const marcarTodos = (presente: boolean) => {
    setAsistencias((prev) => {
      const next = { ...prev };
      jugadores.forEach((j) => {
        next[j.id] = { ...next[j.id], presente };
      });
      return next;
    });
  };

  const handleGuardar = async () => {
    if (jugadores.length === 0) return;
    setError(null);
    setSaving(true);
    const rows = jugadores.map((j) => ({
      jugador_id: j.id,
      presente: asistencias[j.id]?.presente ?? true,
      observacion: asistencias[j.id]?.observacion || null,
    }));
    const result = await guardarAsistenciasBatch(fecha, sedeId, categoria, rows);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setToast(true);
    router.refresh();
  };

  return (
    <>
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Filtros de carga</h2>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sede</label>
              <select
                value={sedeId}
                onChange={(e) => setSedeId(e.target.value)}
                className="px-0 py-1 border-0 bg-transparent focus:ring-0 outline-none min-w-[180px]"
              >
                <option value="">Seleccionar</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="px-0 py-1 border-0 bg-transparent focus:ring-0 outline-none min-w-[140px]"
              >
                <option value="">Seleccionar</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="px-0 py-1 border-0 bg-transparent focus:ring-0 outline-none"
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{error}</div>
        )}

        {jugadores.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => marcarTodos(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white hover:brightness-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                style={{ backgroundColor: "var(--color-primary)" }}
                aria-label="Marcar todos presentes"
              >
                <Upload className="h-4 w-4" aria-hidden />
                Marcar todos presentes
              </button>
              <button
                type="button"
                onClick={() => marcarTodos(false)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                aria-label="Marcar todos ausentes"
              >
                Marcar todos ausentes
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="text-left py-2 px-4 w-12">Foto</th>
                      <th className="text-left py-2 px-4">Jugador</th>
                      <th className="text-center py-2 px-4 w-28">Presente</th>
                      <th className="text-left py-2 px-4">Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jugadores.map((j) => (
                      <tr key={j.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-4">
                          {j.foto_url ? (
                            <img src={j.foto_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: "var(--color-primary)" }}
                            >
                              {(j.apellido[0] || "").toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-4">
                          <span className="font-medium">{j.apellido}, {j.nombre}</span>
                          {deudaSet.has(j.id) && (
                            <span
                              title="Cuota del mes pendiente"
                              className="ml-2 inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 align-middle"
                            >
                              Cuota
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={asistencias[j.id]?.presente ?? true}
                            aria-label={`Marcar ${j.apellido}, ${j.nombre} como ${
                              asistencias[j.id]?.presente ?? true ? "ausente" : "presente"
                            }`}
                            onClick={() => setPresente(j.id, !(asistencias[j.id]?.presente ?? true))}
                            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                            style={{
                              backgroundColor: asistencias[j.id]?.presente !== false ? "var(--color-primary)" : "#cbd5e1",
                              ["--tw-ring-color" as string]: "var(--color-primary)",
                            }}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                                asistencias[j.id]?.presente !== false ? "translate-x-5" : "translate-x-1"
                              }`}
                              style={{ marginTop: 2 }}
                            />
                          </button>
                        </td>
                        <td className="py-2 px-4">
                          <input
                            type="text"
                            value={asistencias[j.id]?.observacion ?? ""}
                            onChange={(e) => setObservacion(j.id, e.target.value)}
                            placeholder="Opcional"
                            className="w-full max-w-xs px-2 py-1.5 border border-slate-200 rounded text-slate-700 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 hover:brightness-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              style={{ backgroundColor: "var(--color-primary)" }}
              aria-label={saving ? "Guardando asistencias" : "Guardar asistencias"}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden />
                  Guardar asistencias
                </>
              )}
            </button>
          </>
        )}

        {sedeId && categoria && jugadores.length === 0 && (
          <p className="text-slate-500">No hay jugadores activos en esa sede y categoría.</p>
        )}
      </div>

      <Toast message="Asistencias guardadas." visible={toast} onClose={() => setToast(false)} />
    </>
  );
}
