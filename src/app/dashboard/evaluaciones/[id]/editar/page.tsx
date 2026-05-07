import { NuevaEvaluacionView } from "@/components/dashboard/evaluaciones/NuevaEvaluacionView";
import { PERMISO, tienePermiso } from "@/lib/permisos";
import { createClient } from "@/lib/supabase/server";
import type { Evaluacion, Jugador, TipoEvaluacion } from "@/types/database";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditarEvaluacionPage({ params }: PageProps) {
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

  const { data: row } = await supabase
    .from("evaluaciones")
    .select("*")
    .eq("id", id)
    .eq("club_id", profile.club_id)
    .single();
  if (!row) notFound();

  const evaluacion = row as Evaluacion;

  const isAdmin = profile.rol === "admin" || profile.rol === "superadmin";
  const tienePermisoEditar = tienePermiso(profile.permisos, PERMISO.EVALUACIONES_EDITAR);
  const puedeEditar =
    isAdmin || (evaluacion.evaluador_id === user.id && tienePermisoEditar);
  if (!puedeEditar) {
    redirect(`/dashboard/evaluaciones/${id}`);
  }

  const { data: jugador } = await supabase
    .from("jugadores")
    .select("*, sede:sedes(nombre)")
    .eq("id", evaluacion.jugador_id)
    .single();

  const { data: tipos } = await supabase
    .from("tipos_evaluacion")
    .select("id, club_id, nombre, descripcion, orden, activo")
    .eq("club_id", profile.club_id)
    .order("orden");

  const tiposActivos = ((tipos ?? []) as TipoEvaluacion[]).filter(
    (t) => t.activo || t.id === evaluacion.tipo_evaluacion_id
  );

  const jugadorRaw = jugador as
    | (Jugador & { sede?: { nombre: string } | { nombre: string }[] | null })
    | null;
  const jugadorNorm = jugadorRaw
    ? {
        ...jugadorRaw,
        sede: Array.isArray(jugadorRaw.sede)
          ? jugadorRaw.sede[0] ?? null
          : jugadorRaw.sede ?? null,
      }
    : null;

  return (
    <NuevaEvaluacionView
      clubId={profile.club_id}
      tipos={tiposActivos}
      mode="edit"
      evaluacionInicial={evaluacion}
      jugadorInicial={jugadorNorm}
    />
  );
}
