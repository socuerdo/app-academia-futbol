import { CambiarSedeView } from "@/components/dashboard/jugadores/CambiarSedeView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CambiarSedePage() {
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
    .select("id, nombre")
    .eq("club_id", profile.club_id)
    .eq("activo", true)
    .order("nombre");

  const { data: jugadores } = await supabase
    .from("jugadores")
    .select("id, dni, apellido, nombre, categoria, sede_id, sede:sedes(nombre)")
    .eq("club_id", profile.club_id)
    .eq("activo", true)
    .order("apellido");

  const categorias = [...new Set((jugadores ?? []).map((j) => j.categoria).filter(Boolean))].sort();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Cambiar sede / categoría</h1>
      <CambiarSedeView
        clubId={profile.club_id}
        jugadores={(jugadores ?? []).map((j) => ({
          ...j,
          sede: Array.isArray(j.sede) ? j.sede[0] : j.sede,
        }))}
        sedes={sedes ?? []}
        categorias={categorias}
      />
    </div>
  );
}
