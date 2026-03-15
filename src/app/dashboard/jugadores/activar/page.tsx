import { ActivarJugadorView } from "@/components/dashboard/jugadores/ActivarJugadorView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ActivarJugadorPage() {
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

  const { data: jugadores } = await supabase
    .from("jugadores")
    .select("id, dni, apellido, nombre, categoria, activo, sede:sedes(id, nombre)")
    .eq("club_id", profile.club_id)
    .order("apellido");

  const { data: sedes } = await supabase
    .from("sedes")
    .select("id, nombre")
    .eq("club_id", profile.club_id)
    .eq("activo", true)
    .order("nombre");

  const categorias = [...new Set((jugadores ?? []).map((j) => j.categoria).filter(Boolean))].sort();

  const list = (jugadores ?? []).map((j) => ({
    ...j,
    sede: Array.isArray(j.sede) ? j.sede[0] : j.sede,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Activar / Desactivar jugadores</h1>
      <ActivarJugadorView
        initialJugadores={list}
        sedes={sedes ?? []}
        categorias={categorias}
      />
    </div>
  );
}
