import { ImportarJugadoresView } from "@/components/dashboard/jugadores/ImportarJugadoresView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ImportarJugadoresPage() {
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

  const sedeIdPorNombre: Record<string, string> = {};
  (sedes ?? []).forEach((s) => {
    sedeIdPorNombre[s.nombre] = s.id;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Importar jugadores</h1>
      <ImportarJugadoresView
        clubId={profile.club_id}
        sedes={sedes ?? []}
        sedeIdPorNombre={sedeIdPorNombre}
      />
    </div>
  );
}
