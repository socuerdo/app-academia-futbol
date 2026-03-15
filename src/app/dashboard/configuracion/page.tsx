import { ConfiguracionView } from "@/components/dashboard/configuracion/ConfiguracionView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ConfiguracionPage() {
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
  if (!profile?.club_id && profile?.rol !== "superadmin") redirect("/login");

  const clubId = profile?.club_id;
  let club = null;
  if (clubId) {
    const { data } = await supabase
      .from("clubs")
      .select("id, nombre, logo_url, iniciales, color_primario, color_sidebar")
      .eq("id", clubId)
      .single();
    club = data;
  }

  if (!club && profile.rol === "admin") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Configuración</h1>
        <p className="text-slate-600">No hay club asignado.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Configuración del club</h1>
      <ConfiguracionView club={club} />
    </div>
  );
}
