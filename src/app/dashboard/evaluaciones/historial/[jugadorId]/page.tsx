import { badgePromedioClass } from "@/lib/evaluaciones/escala";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ jugadorId: string }>;
};

function fechaCorta(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR");
}

export default async function HistorialEvaluacionesPage({ params }: PageProps) {
  const { jugadorId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) redirect("/login");

  const { data: jugador } = await supabase
    .from("jugadores")
    .select("id, nombre, apellido, categoria")
    .eq("id", jugadorId)
    .eq("club_id", profile.club_id)
    .single();

  if (!jugador) notFound();

  const { data: rows } = await supabase
    .from("evaluaciones")
    .select(
      `
      id,
      fecha,
      temporada,
      puntaje_promedio,
      evaluador_id,
      tipos_evaluacion (nombre)
    `
    )
    .eq("club_id", profile.club_id)
    .eq("jugador_id", jugadorId)
    .order("fecha", { ascending: false })
    .limit(500);

  const filas = (rows ?? []).map((r) => {
    const t = r.tipos_evaluacion as { nombre: string } | { nombre: string }[] | null | undefined;
    const tipo = t == null ? null : Array.isArray(t) ? t[0] ?? null : t;
    return {
      id: r.id,
      fecha: r.fecha as string,
      temporada: r.temporada as string | null,
      puntaje_promedio: r.puntaje_promedio as number | null,
      evaluador_id: r.evaluador_id as string | null,
      tipo_nombre: tipo?.nombre ?? null,
    };
  });

  const evaluadorIds = [...new Set(filas.map((f) => f.evaluador_id).filter(Boolean))] as string[];
  const evaluadorMap = new Map<string, string>();
  if (evaluadorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, nombre_completo")
      .in("id", evaluadorIds);
    (profs ?? []).forEach((p) => {
      evaluadorMap.set(p.id, p.nombre_completo?.trim() || "—");
    });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Historial de evaluaciones
          </h1>
          <p className="text-sm text-slate-500">
            {jugador.apellido}, {jugador.nombre}
            {jugador.categoria ? ` · ${jugador.categoria}` : ""}
          </p>
        </div>
        <Link
          href="/dashboard/evaluaciones"
          className="text-sm text-slate-600 hover:underline"
        >
          ← Volver al listado
        </Link>
      </div>

      {filas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl mb-3">
            ◷
          </div>
          <h2 className="text-lg font-semibold text-slate-800">
            Sin evaluaciones todavía
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-5">
            Este jugador aún no tiene evaluaciones cargadas.
          </p>
          <Link
            href="/dashboard/evaluaciones"
            className="inline-flex justify-center px-4 py-2 rounded-lg text-white font-medium text-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Volver al listado
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-3 py-2">Fecha</th>
                <th className="text-left px-3 py-2">Tipo</th>
                <th className="text-left px-3 py-2 hidden sm:table-cell">
                  Temporada
                </th>
                <th className="text-left px-3 py-2">Promedio</th>
                <th className="text-left px-3 py-2 hidden md:table-cell">
                  Evaluador
                </th>
                <th className="text-right px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((row) => {
                const prom =
                  typeof row.puntaje_promedio === "number"
                    ? row.puntaje_promedio
                    : 0;
                return (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fechaCorta(row.fecha)}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {row.tipo_nombre ?? "—"}
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell text-slate-600">
                      {row.temporada ?? "—"}
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
                    <td className="px-3 py-2 hidden md:table-cell text-slate-600 truncate max-w-[160px]">
                      {row.evaluador_id
                        ? evaluadorMap.get(row.evaluador_id) ?? "—"
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <Link
                        href={`/dashboard/evaluaciones/${row.id}`}
                        className="text-[var(--color-primary)] font-medium"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
