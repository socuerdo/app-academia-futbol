import { DownloadEvaluacionPDFButton } from "@/components/dashboard/evaluaciones/DownloadEvaluacionPDFButton";
import { EliminarEvaluacionButton } from "@/components/dashboard/evaluaciones/EliminarEvaluacionButton";
import { RadarEvaluacionChart } from "@/components/dashboard/evaluaciones/RadarEvaluacionChart";
import { badgePromedioClass, ESCALA_EVALUACION } from "@/lib/evaluaciones/escala";
import type { EvaluacionPDFData } from "@/lib/export-evaluacion-pdf";
import { PERMISO, tienePermiso } from "@/lib/permisos";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

type DimRow = {
  key: "fisico" | "tecnico" | "tactico" | "social" | "emocional";
  value: number;
  comment: string | null;
};

function toNivel(n: number | null): number {
  if (typeof n !== "number" || Number.isNaN(n)) return 1;
  if (n < 1) return 1;
  if (n > 5) return 5;
  return Math.round(n);
}

function fechaCorta(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR");
}

export default async function EvaluacionDetallePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol, permisos")
    .eq("id", user.id)
    .single();

  if (!profile?.club_id) redirect("/login");

  const isAdmin = profile.rol === "admin" || profile.rol === "superadmin";
  const puedeDescargarPDF =
    isAdmin || tienePermiso(profile.permisos, PERMISO.EVALUACIONES_DESCARGAR);
  const tienePermisoEditar = tienePermiso(profile.permisos, PERMISO.EVALUACIONES_EDITAR);

  const { data: row } = await supabase
    .from("evaluaciones")
    .select(
      `
      id,
      fecha,
      temporada,
      evaluador_id,
      puntaje_fisico,
      puntaje_tecnico,
      puntaje_tactico,
      puntaje_social,
      puntaje_emocional,
      puntaje_promedio,
      comentario_fisico,
      comentario_tecnico,
      comentario_tactico,
      comentario_social,
      comentario_emocional,
      observaciones_generales,
      jugadores (id, nombre, apellido, categoria, foto_url),
      tipos_evaluacion (id, nombre)
    `
    )
    .eq("id", id)
    .eq("club_id", profile.club_id)
    .single();

  if (!row) notFound();

  const puedeEditar =
    isAdmin || (row.evaluador_id === user.id && tienePermisoEditar);

  const jRaw = row.jugadores as
    | { id: string; nombre: string; apellido: string; categoria: string; foto_url: string | null }
    | { id: string; nombre: string; apellido: string; categoria: string; foto_url: string | null }[]
    | null
    | undefined;
  const jugador = jRaw == null ? null : Array.isArray(jRaw) ? jRaw[0] ?? null : jRaw;

  const tRaw = row.tipos_evaluacion as
    | { id: string; nombre: string }
    | { id: string; nombre: string }[]
    | null
    | undefined;
  const tipo = tRaw == null ? null : Array.isArray(tRaw) ? tRaw[0] ?? null : tRaw;

  let evaluadorNombre: string | null = null;
  if (row.evaluador_id) {
    const { data: evaluador } = await supabase
      .from("profiles")
      .select("nombre_completo")
      .eq("id", row.evaluador_id)
      .single();
    evaluadorNombre = evaluador?.nombre_completo?.trim() || null;
  }

  const fisico = toNivel(row.puntaje_fisico);
  const tecnico = toNivel(row.puntaje_tecnico);
  const tactico = toNivel(row.puntaje_tactico);
  const social = toNivel(row.puntaje_social);
  const emocional = toNivel(row.puntaje_emocional);
  const promedio =
    typeof row.puntaje_promedio === "number"
      ? row.puntaje_promedio
      : (fisico + tecnico + tactico + social + emocional) / 5;

  const dimensiones: DimRow[] = [
    { key: "fisico", value: fisico, comment: row.comentario_fisico },
    { key: "tecnico", value: tecnico, comment: row.comentario_tecnico },
    { key: "tactico", value: tactico, comment: row.comentario_tactico },
    { key: "social", value: social, comment: row.comentario_social },
    { key: "emocional", value: emocional, comment: row.comentario_emocional },
  ];

  const pdfData: EvaluacionPDFData = {
    jugadorApellido: jugador?.apellido ?? "—",
    jugadorNombre: jugador?.nombre ?? "—",
    jugadorCategoria: jugador?.categoria ?? "—",
    fecha: row.fecha,
    temporada: row.temporada ?? null,
    tipoNombre: tipo?.nombre ?? null,
    evaluadorNombre,
    promedio,
    niveles: { fisico, tecnico, tactico, social, emocional },
    comentarios: {
      fisico: row.comentario_fisico,
      tecnico: row.comentario_tecnico,
      tactico: row.comentario_tactico,
      social: row.comentario_social,
      emocional: row.comentario_emocional,
    },
    observacionesGenerales: row.observaciones_generales,
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Resumen de evaluación</h1>
          <p className="text-sm text-slate-500">Detalle completo de la evaluación seleccionada.</p>
        </div>
        <div className="flex items-center gap-3">
          {puedeEditar && (
            <Link
              href={`/dashboard/evaluaciones/${row.id}/editar`}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Editar
            </Link>
          )}
          {isAdmin && (
            <EliminarEvaluacionButton
              id={row.id}
              redirectTo="/dashboard/evaluaciones"
            />
          )}
          {puedeDescargarPDF && <DownloadEvaluacionPDFButton data={pdfData} />}
          <Link href="/dashboard/evaluaciones" className="text-sm text-slate-600 hover:underline">
            ← Volver al listado
          </Link>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex items-center gap-3">
            <div className="h-14 w-14 rounded-full overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center text-sm text-slate-500">
              {jugador?.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={jugador.foto_url} alt="" className="h-full w-full object-cover" />
              ) : (
                "?"
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                {jugador ? `${jugador.apellido}, ${jugador.nombre}` : "Jugador no disponible"}
              </p>
              <p className="text-sm text-slate-600">{jugador?.categoria ?? "—"}</p>
            </div>
          </div>
          <div className="md:text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Promedio general</p>
            <span
              className={`inline-flex mt-1 px-2.5 py-1 rounded-full text-sm font-semibold border ${badgePromedioClass(
                promedio
              )}`}
            >
              {promedio.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-slate-500">Tipo</p>
            <p className="font-medium text-slate-800">{tipo?.nombre ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-500">Fecha</p>
            <p className="font-medium text-slate-800">{fechaCorta(row.fecha)}</p>
          </div>
          <div>
            <p className="text-slate-500">Temporada</p>
            <p className="font-medium text-slate-800">{row.temporada ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-500">Evaluador</p>
            <p className="font-medium text-slate-800">{evaluadorNombre ?? "—"}</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Perfil de rendimiento</h2>
        <RadarEvaluacionChart
          fisico={fisico}
          tecnico={tecnico}
          tactico={tactico}
          social={social}
          emocional={emocional}
        />
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Dimensiones evaluadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dimensiones.map((dim) => {
            const meta = ESCALA_EVALUACION[dim.key];
            const nivelData = meta.niveles[dim.value as 1 | 2 | 3 | 4 | 5];
            return (
              <article key={dim.key} className="rounded-lg border border-slate-200 p-4">
                <p className="font-medium text-slate-800">
                  <span className="mr-1">{meta.icono}</span>
                  {meta.nombre}
                </p>
                <p className="text-sm text-slate-600 mt-1">Nivel {dim.value}</p>
                <p className="text-sm text-slate-700 mt-1">{nivelData.etapa}</p>
                <p className="text-sm text-slate-600 mt-1">{nivelData.descripcion}</p>
                {dim.comment ? (
                  <p className="text-sm text-slate-700 mt-3 border-t border-slate-100 pt-3">
                    {dim.comment}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      {row.observaciones_generales ? (
        <section className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Observaciones generales</h2>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{row.observaciones_generales}</p>
        </section>
      ) : null}
    </div>
  );
}
