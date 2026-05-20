import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CancheroDashboard } from "./CancheroDashboard";
import type { TurnoAlquiler, TurnoEscuela } from "@/lib/canchas";

export default async function CancheroPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol")
    .eq("id", user.id)
    .single();

  if (!profile?.club_id) redirect("/login");
  if (profile.rol !== "canchero" && profile.rol !== "admin" && profile.rol !== "superadmin") {
    redirect("/login");
  }

  const hoy = new Date().toISOString().slice(0, 10);

  const [alquilerResult, escuelaResult] = await Promise.all([
    supabase
      .from("turnos_alquiler")
      .select("*")
      .eq("club_id", profile.club_id)
      .eq("fecha", hoy)
      .order("hora")
      .order("cancha"),
    supabase
      .from("turnos_escuela")
      .select("*")
      .eq("club_id", profile.club_id)
      .eq("fecha", hoy)
      .order("hora")
      .order("cancha"),
  ]);

  const turnosAlquilerHoy = (alquilerResult.data ?? []) as TurnoAlquiler[];
  const turnosEscuelaHoy = (escuelaResult.data ?? []) as TurnoEscuela[];

  return (
    <CancheroDashboard
      initialFecha={hoy}
      initialTurnosAlquiler={turnosAlquilerHoy}
      initialTurnosEscuela={turnosEscuelaHoy}
    />
  );
}
