import {
  EvaluacionesListView,
  type FilaEvaluacion,
} from "@/components/dashboard/evaluaciones/EvaluacionesListView";
import { NuevaEvaluacionView } from "@/components/dashboard/evaluaciones/NuevaEvaluacionView";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/pagination";
import { PERMISO, tienePermiso, esAdminOAuditor } from "@/lib/permisos";
import { createClient } from "@/lib/supabase/server";
import type { TipoEvaluacion } from "@/types/database";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    categoria?: string;
    tipo?: string;
    jugador?: string;
    temporada?: string;
    page?: string;
    pp?: string;
  }>;
}

export default async function EvaluacionesPage({ searchParams }: PageProps) {
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

  const isAdmin = esAdminOAuditor(profile.rol);
  const isProfesor = profile.rol === "profesor";
  const canCrear =
    isAdmin ||
    (isProfesor && tienePermiso(profile.permisos, PERMISO.EVALUACIONES_CREAR));

  const sp = await searchParams;
  const tab = sp.tab ?? "lista";

  // Proteger tab "nueva" si no tiene permiso
  if (tab === "nueva" && !canCrear) {
    redirect("/dashboard/evaluaciones");
  }

  let content: React.ReactNode;

  // ── Tab: nueva ────────────────────────────────────────────────────────────
  if (tab === "nueva") {
    const { data: tipos } = await supabase
      .from("tipos_evaluacion")
      .select("id, club_id, nombre, descripcion, orden, activo")
      .eq("club_id", profile.club_id)
      .eq("activo", true)
      .order("orden");

    content = (
      <NuevaEvaluacionView
        clubId={profile.club_id}
        tipos={(tipos ?? []) as TipoEvaluacion[]}
      />
    );

  // ── Tab: lista (default) ──────────────────────────────────────────────────
  } else {
    const categoria = sp.categoria?.trim() || "";
    const tipoId = sp.tipo?.trim() || "";
    const jugadorId = sp.jugador?.trim() || "";
    const temporada = sp.temporada?.trim() || "";

    const pageRaw = Number(sp.page ?? "1");
    const ppRaw = Number(sp.pp ?? String(DEFAULT_PAGE_SIZE));
    const page =
      Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
    const pageSize = PAGE_SIZE_OPTIONS.includes(ppRaw)
      ? ppRaw
      : DEFAULT_PAGE_SIZE;

    let jugadorIdsEnCategoria: string[] | null = null;
    if (categoria) {
      const { data: jugs } = await supabase
        .from("jugadores")
        .select("id")
        .eq("club_id", profile.club_id)
        .eq("categoria", categoria);
      jugadorIdsEnCategoria = (jugs ?? []).map((j) => j.id);
    }

    const noHayFilasPorCategoria =
      jugadorIdsEnCategoria !== null && jugadorIdsEnCategoria.length === 0;

    let query = supabase
      .from("evaluaciones")
      .select(
        `id, jugador_id, fecha, temporada, puntaje_promedio, evaluador_id,
         jugadores (nombre, apellido, categoria, foto_url),
         tipos_evaluacion (nombre)`,
        { count: "exact" }
      )
      .eq("club_id", profile.club_id)
      .order("fecha", { ascending: false });

    if (tipoId) query = query.eq("tipo_evaluacion_id", tipoId);
    if (jugadorId) query = query.eq("jugador_id", jugadorId);
    if (temporada) query = query.eq("temporada", temporada);
    if (jugadorIdsEnCategoria !== null && jugadorIdsEnCategoria.length > 0) {
      query = query.in("jugador_id", jugadorIdsEnCategoria);
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data: rawRows, count } = noHayFilasPorCategoria
      ? { data: [], count: 0 }
      : await query;
    const total = count ?? 0;

    type JugadorJoin = {
      nombre: string;
      apellido: string;
      categoria: string;
      foto_url: string | null;
    };

    const filas: FilaEvaluacion[] = (rawRows ?? []).map((r) => {
      const j = r.jugadores as JugadorJoin | JugadorJoin[] | null | undefined;
      const jug = j == null ? null : Array.isArray(j) ? (j[0] ?? null) : j;
      const t = r.tipos_evaluacion as
        | { nombre: string }
        | { nombre: string }[]
        | null
        | undefined;
      const tipo = t == null ? null : Array.isArray(t) ? (t[0] ?? null) : t;
      return {
        id: r.id,
        jugador_id: r.jugador_id,
        fecha: r.fecha,
        temporada: r.temporada,
        puntaje_promedio: r.puntaje_promedio,
        evaluador_id: r.evaluador_id,
        evaluador_nombre: null,
        jugador: jug
          ? {
              nombre: jug.nombre,
              apellido: jug.apellido,
              categoria: jug.categoria,
              foto_url: jug.foto_url,
            }
          : null,
        tipo_nombre: tipo?.nombre ?? null,
      };
    });

    const evaluadorIds = [
      ...new Set(filas.map((f) => f.evaluador_id).filter(Boolean)),
    ] as string[];
    let evaluadorMap = new Map<string, string>();
    if (evaluadorIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, nombre_completo")
        .in("id", evaluadorIds);
      evaluadorMap = new Map(
        (profs ?? []).map((p) => [p.id, p.nombre_completo?.trim() || "—"])
      );
    }

    const filasConEvaluador: FilaEvaluacion[] = filas.map((f) => ({
      ...f,
      evaluador_nombre: f.evaluador_id
        ? (evaluadorMap.get(f.evaluador_id) ?? null)
        : null,
    }));

    const [catsResult, tiposResult, jugsResult, tempResult] = await Promise.all([
      supabase
        .from("categorias")
        .select("nombre")
        .eq("club_id", profile.club_id)
        .eq("activo", true)
        .order("orden"),
      supabase
        .from("tipos_evaluacion")
        .select("id, nombre")
        .eq("club_id", profile.club_id)
        .eq("activo", true)
        .order("orden"),
      supabase
        .from("jugadores")
        .select("id, nombre, apellido")
        .eq("club_id", profile.club_id)
        .eq("activo", true)
        .order("apellido")
        .limit(400),
      supabase
        .from("evaluaciones")
        .select("temporada")
        .eq("club_id", profile.club_id)
        .not("temporada", "is", null)
        .limit(500),
    ]);

    const categorias = [
      ...new Set((catsResult.data ?? []).map((c) => c.nombre)),
    ].sort();
    const jugadores = (jugsResult.data ?? []).map((j) => ({
      id: j.id,
      label: `${j.apellido}, ${j.nombre}`,
    }));
    const temporadas = [
      ...new Set(
        (tempResult.data ?? [])
          .map((t) => t.temporada)
          .filter((t): t is string => Boolean(t?.trim()))
      ),
    ].sort();

    content = (
      <EvaluacionesListView
        filas={filasConEvaluador}
        categorias={categorias}
        tipos={tiposResult.data ?? []}
        temporadas={temporadas}
        jugadores={jugadores}
        total={total}
        page={page}
        pageSize={pageSize}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Evaluaciones</h1>
        {canCrear && (
          <Link
            href="/dashboard/evaluaciones?tab=nueva"
            className="inline-flex justify-center px-4 py-2 rounded-lg text-white font-medium text-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            + Nueva evaluación
          </Link>
        )}
      </div>

      {canCrear && (
        <div className="flex gap-0 border-b border-slate-200">
          <Link
            href="/dashboard/evaluaciones"
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === "lista" || tab === undefined || !["lista", "nueva"].includes(tab)
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Lista
          </Link>
          <Link
            href="/dashboard/evaluaciones?tab=nueva"
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === "nueva"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Nueva evaluación
          </Link>
        </div>
      )}

      {content}
    </div>
  );
}
