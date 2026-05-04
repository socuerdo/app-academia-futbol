import { NuevaEvaluacionView } from "@/components/dashboard/evaluaciones/NuevaEvaluacionView";
import { createClient } from "@/lib/supabase/server";
import type { TipoEvaluacion } from "@/types/database";
import { redirect } from "next/navigation";

export default async function NuevaEvaluacionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol")
    .eq("id", user.id)
    .single();

  if (
    !profile?.club_id ||
    (profile.rol !== "admin" &&
      profile.rol !== "profesor" &&
      profile.rol !== "superadmin")
  ) {
    redirect("/dashboard/evaluaciones");
  }

  const { data: tipos } = await supabase
    .from("tipos_evaluacion")
    .select("id, club_id, nombre, descripcion, orden, activo")
    .eq("club_id", profile.club_id)
    .eq("activo", true)
    .order("orden");

  return (
    <NuevaEvaluacionView
      clubId={profile.club_id}
      tipos={(tipos ?? []) as TipoEvaluacion[]}
    />
  );
}
