import {
  EvaluacionesListView,
  type FilaEvaluacion,
} from "@/components/dashboard/evaluaciones/EvaluacionesListView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    categoria?: string;
    tipo?: string;
    jugador?: string;
    temporada?: string;
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
    .select("club_id")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) redirect("/login");

  const sp = await searchParams;
  const categoria = sp.categoria?.trim() || "";
  const tipoId = sp.tipo?.trim() || "";
  const jugadorId = sp.jugador?.trim() || "";
  const temporada = sp.temporada?.trim() || "";

  let query = supabase
    .from("evaluaciones")
    .select(
      `
      id,
      jugador_id,
      fecha,
      temporada,
      puntaje_promedio,
      evaluador_id,
      jugadores (nombre, apellido, categoria, foto_url),
      tipos_evaluacion (nombre)
    `
    )
    .eq("club_id", profile.club_id)
    .order("fecha", { ascending: false })
    .limit(800);

  if (tipoId) query = query.eq("tipo_evaluacion_id", tipoId);
  if (jugadorId) query = query.eq("jugador_id", jugadorId);
  if (temporada) query = query.eq("temporada", temporada);

  const { data: rawRows } = await query;

  type JugadorJoin = {
    nombre: string;
    apellido: string;
    categoria: string;
    foto_url: string | null;
  };

  const rowsRaw = (rawRows ?? []).map((r) => {
    const j = r.jugadores as JugadorJoin | JugadorJoin[] | null | undefined;
    const jug: JugadorJoin | null =
      j == null ? null : Array.isArray(j) ? j[0] ?? null : j;
    const t = r.tipos_evaluacion as { nombre: string } | null | { nombre: string }[] | undefined;
    const tipo = t == null ? null : Array.isArray(t) ? t[0] ?? null : t;
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

  const filas: FilaEvaluacion[] = categoria
    ? rowsRaw.filter((r) => r.jugador?.categoria === categoria)
    : rowsRaw;

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
      ? evaluadorMap.get(f.evaluador_id) ?? null
      : null,
  }));

  const { data: cats } = await supabase
    .from("categorias")
    .select("nombre")
    .eq("club_id", profile.club_id)
    .eq("activo", true)
    .order("orden");

  const categorias = [...new Set((cats ?? []).map((c) => c.nombre))].sort();

  const { data: tipos } = await supabase
    .from("tipos_evaluacion")
    .select("id, nombre")
    .eq("club_id", profile.club_id)
    .eq("activo", true)
    .order("orden");

  const { data: jugadoresRows } = await supabase
    .from("jugadores")
    .select("id, nombre, apellido")
    .eq("club_id", profile.club_id)
    .eq("activo", true)
    .order("apellido")
    .limit(400);

  const jugadores = (jugadoresRows ?? []).map((j) => ({
    id: j.id,
    label: `${j.apellido}, ${j.nombre}`,
  }));

  const { data: tempRows } = await supabase
    .from("evaluaciones")
    .select("temporada")
    .eq("club_id", profile.club_id)
    .not("temporada", "is", null)
    .limit(500);

  const temporadas = [
    ...new Set(
      (tempRows ?? [])
        .map((t) => t.temporada)
        .filter((t): t is string => Boolean(t?.trim()))
    ),
  ].sort();

  return (
    <EvaluacionesListView
      filas={filasConEvaluador}
      categorias={categorias}
      tipos={tipos ?? []}
      temporadas={temporadas}
      jugadores={jugadores}
    />
  );
}
