import { SedesView } from "@/components/dashboard/sedes/SedesView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SedesPage() {
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

  const { data: sedes } = await supabase
    .from("sedes")
    .select("id, nombre, direccion, ciudad, telefono, activo")
    .eq("club_id", profile.club_id)
    .order("nombre");

  const { data: counts } = await supabase
    .from("jugadores")
    .select("sede_id")
    .eq("club_id", profile.club_id);

  const jugadoresPorSede: Record<string, number> = {};
  (counts ?? []).forEach((r) => {
    jugadoresPorSede[r.sede_id] = (jugadoresPorSede[r.sede_id] ?? 0) + 1;
  });

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Sedes</h1>
      <SedesView
        sedes={sedes ?? []}
        jugadoresPorSede={jugadoresPorSede}
      />
    </div>
  );
}
