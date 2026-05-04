"use client";

import { crearEvaluacion } from "@/app/dashboard/evaluaciones/actions";
import { Toast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import {
  DIMENSION_KEYS,
  ESCALA_EVALUACION,
  getEtapaDescripcion,
  promedioCincoDimensiones,
  type DimensionKey,
} from "@/lib/evaluaciones/escala";
import type { Evaluacion, Jugador, TipoEvaluacion } from "@/types/database";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

type JugadorConSede = Jugador & { sede?: { nombre: string } | null };

interface NuevaEvaluacionViewProps {
  clubId: string;
  tipos: TipoEvaluacion[];
  mode?: "create" | "edit";
  evaluacionInicial?: Evaluacion | null;
  jugadorInicial?: JugadorConSede | null;
}

export function NuevaEvaluacionView({
  clubId,
  tipos,
  mode = "create",
  evaluacionInicial,
  jugadorInicial,
}: NuevaEvaluacionViewProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(mode === "edit" ? 2 : 1);
  const [query, setQuery] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<JugadorConSede[]>([]);
  const [jugadorSel, setJugadorSel] = useState<JugadorConSede | null>(
    jugadorInicial ?? null
  );
  const [tipoId, setTipoId] = useState(
    evaluacionInicial?.tipo_evaluacion_id ?? tipos[0]?.id ?? ""
  );
  const [fecha, setFecha] = useState(
    evaluacionInicial?.fecha?.slice(0, 10) ??
      new Date().toISOString().slice(0, 10)
  );
  const [temporada, setTemporada] = useState(
    evaluacionInicial?.temporada ?? ""
  );

  const [scores, setScores] = useState<Record<DimensionKey, number>>(() => {
    const e = evaluacionInicial;
    if (!e) {
      return {
        fisico: 3,
        tecnico: 3,
        tactico: 3,
        social: 3,
        emocional: 3,
      };
    }
    return {
      fisico: e.puntaje_fisico ?? 3,
      tecnico: e.puntaje_tecnico ?? 3,
      tactico: e.puntaje_tactico ?? 3,
      social: e.puntaje_social ?? 3,
      emocional: e.puntaje_emocional ?? 3,
    };
  });

  const [comentarios, setComentarios] = useState<Record<DimensionKey, string>>(
    () => ({
      fisico: evaluacionInicial?.comentario_fisico ?? "",
      tecnico: evaluacionInicial?.comentario_tecnico ?? "",
      tactico: evaluacionInicial?.comentario_tactico ?? "",
      social: evaluacionInicial?.comentario_social ?? "",
      emocional: evaluacionInicial?.comentario_emocional ?? "",
    })
  );

  const [observaciones, setObservaciones] = useState(
    evaluacionInicial?.observaciones_generales ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const buscar = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const supabase = createClient();
    const term = `%${q}%`;
    const { data } = await supabase
      .from("jugadores")
      .select("*, sede:sedes(nombre)")
      .eq("club_id", clubId)
      .eq("activo", true)
      .or(`dni.ilike.${term},apellido.ilike.${term},nombre.ilike.${term}`)
      .order("apellido")
      .limit(40);
    const list = (data ?? []).map((j: JugadorConSede & { sede?: unknown }) => ({
      ...j,
      sede: Array.isArray(j.sede) ? j.sede[0] : j.sede,
    })) as JugadorConSede[];
    setResultados(list);
    setBuscando(false);
  }, [clubId, query]);

  const preview = useMemo(
    () =>
      promedioCincoDimensiones(
        scores.fisico,
        scores.tecnico,
        scores.tactico,
        scores.social,
        scores.emocional
      ),
    [scores]
  );

  async function handleGuardar() {
    if (!jugadorSel) {
      setError("Seleccioná un jugador.");
      return;
    }
    if (!tipoId) {
      setError("Seleccioná un tipo de evaluación.");
      return;
    }
    setError(null);
    setSaving(true);

    const payload = {
      jugador_id: jugadorSel.id,
      tipo_evaluacion_id: tipoId,
      fecha,
      temporada: temporada.trim() || null,
      puntaje_fisico: scores.fisico,
      puntaje_tecnico: scores.tecnico,
      puntaje_tactico: scores.tactico,
      puntaje_social: scores.social,
      puntaje_emocional: scores.emocional,
      comentario_fisico: comentarios.fisico.trim() || null,
      comentario_tecnico: comentarios.tecnico.trim() || null,
      comentario_tactico: comentarios.tactico.trim() || null,
      comentario_social: comentarios.social.trim() || null,
      comentario_emocional: comentarios.emocional.trim() || null,
      observaciones_generales: observaciones.trim() || null,
    };

    if (mode === "edit" && evaluacionInicial) {
      const { actualizarEvaluacion } = await import(
        "@/app/dashboard/evaluaciones/actions"
      );
      const r = await actualizarEvaluacion(evaluacionInicial.id, payload);
      setSaving(false);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push(`/dashboard/evaluaciones/${evaluacionInicial.id}`);
      return;
    }

    const r = await crearEvaluacion(payload);
    setSaving(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setToastMsg("Evaluación guardada. Podés compartir el enlace con la familia.");
    setToast(true);
    router.push(`/dashboard/evaluaciones/${r.id}?nuevo=1&token=${encodeURIComponent(r.token_publico)}`);
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-800">
          {mode === "edit" ? "Editar evaluación" : "Nueva evaluación"}
        </h1>
        <Link
          href="/dashboard/evaluaciones"
          className="text-sm text-slate-600 hover:underline"
        >
          ← Volver al listado
        </Link>
      </div>

      {mode === "create" && step === 1 && (
        <div className="space-y-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-600">
            Paso 1 de 2 — Elegí jugador, tipo y temporada.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void buscar();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Buscar por DNI, apellido o nombre"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {buscando ? "Buscando…" : "Buscar"}
            </button>
          </form>

          <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto border border-slate-100 rounded-lg">
            {resultados.map((j) => (
              <li key={j.id}>
                <button
                  type="button"
                  onClick={() => {
                    setJugadorSel(j);
                  }}
                  className={`w-full text-left px-3 py-2 flex gap-3 hover:bg-slate-50 ${
                    jugadorSel?.id === j.id ? "bg-slate-100" : ""
                  }`}
                >
                  <div className="h-11 w-11 rounded-full overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center text-xs">
                    {j.foto_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={j.foto_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "?"
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">
                      {j.apellido}, {j.nombre}
                    </div>
                    <div className="text-xs text-slate-500">
                      {j.categoria}
                      {j.sede?.nombre ? ` · ${j.sede.nombre}` : ""}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <label className="block text-sm">
            <span className="text-slate-600">Tipo de evaluación</span>
            <select
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
              value={tipoId}
              onChange={(e) => setTipoId(e.target.value)}
            >
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-slate-600">Fecha</span>
              <input
                type="date"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Temporada (opcional)</span>
              <input
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                value={temporada}
                onChange={(e) => setTemporada(e.target.value)}
                placeholder="Ej: 2025"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={!jugadorSel}
            onClick={() => setStep(2)}
            className="w-full sm:w-auto px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Continuar al formulario
          </button>
        </div>
      )}

      {(step === 2 || mode === "edit") && (
        <div className="space-y-6">
          {mode === "create" && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-slate-600 hover:underline"
            >
              ← Volver al paso 1
            </button>
          )}

          {jugadorSel && (
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
              <div className="h-14 w-14 rounded-full overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
                {jugadorSel.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={jugadorSel.foto_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "?"
                )}
              </div>
              <div>
                <div className="font-semibold text-slate-800">
                  {jugadorSel.apellido}, {jugadorSel.nombre}
                </div>
                <div className="text-sm text-slate-500">
                  {jugadorSel.categoria}
                </div>
              </div>
            </div>
          )}

          {mode === "edit" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <label className="block text-sm">
                <span className="text-slate-600">Tipo</span>
                <select
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={tipoId}
                  onChange={(e) => setTipoId(e.target.value)}
                >
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-slate-600">Fecha</span>
                <input
                  type="date"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-slate-600">Temporada</span>
                <input
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                  value={temporada}
                  onChange={(e) => setTemporada(e.target.value)}
                />
              </label>
            </div>
          )}

          <div className="sticky top-0 z-10 py-2 bg-slate-50/95 backdrop-blur border border-slate-200 rounded-lg px-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-700">
              Promedio en tiempo real
            </span>
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: "var(--color-primary)" }}
            >
              {preview.toFixed(2)}
            </span>
          </div>

          <div className="space-y-8">
            {DIMENSION_KEYS.map((dim) => {
              const meta = ESCALA_EVALUACION[dim];
              const nivel = scores[dim];
              const desc = getEtapaDescripcion(dim, nivel);
              return (
                <section
                  key={dim}
                  className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl" aria-hidden>
                      {meta.icono}
                    </span>
                    <h2 className="text-lg font-semibold text-slate-800">
                      {meta.nombre}
                    </h2>
                  </div>
                  <label className="block text-sm text-slate-600 mb-1">
                    Nivel {nivel}
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    className="w-full accent-[var(--color-primary)]"
                    value={nivel}
                    onChange={(e) =>
                      setScores((s) => ({
                        ...s,
                        [dim]: Number(e.target.value),
                      }))
                    }
                  />
                  {desc && (
                    <p className="mt-3 text-sm text-slate-700">
                      <span className="font-semibold text-slate-800">
                        {desc.etapa}:{" "}
                      </span>
                      {desc.descripcion}
                    </p>
                  )}
                  <label className="block mt-3 text-sm text-slate-600">
                    Comentario (opcional)
                    <textarea
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg min-h-[72px]"
                      value={comentarios[dim]}
                      onChange={(e) =>
                        setComentarios((c) => ({
                          ...c,
                          [dim]: e.target.value,
                        }))
                      }
                      placeholder={`Notas sobre ${meta.nombre.toLowerCase()}…`}
                    />
                  </label>
                </section>
              );
            })}
          </div>

          <label className="block bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-sm font-medium text-slate-700">
              Observaciones generales (opcional)
            </span>
            <textarea
              className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg min-h-[100px]"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => void handleGuardar()}
              disabled={saving || !jugadorSel}
              className="px-6 py-3 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {saving ? "Guardando…" : "Guardar evaluación"}
            </button>
          </div>
        </div>
      )}

      <Toast message={toastMsg} visible={toast} onClose={() => setToast(false)} />
    </div>
  );
}
