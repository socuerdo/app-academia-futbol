import { CategoriasView } from "@/components/dashboard/configuracion/CategoriasView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function CategoriasPage() {
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

  if (!profile || (profile.rol !== "admin" && profile.rol !== "superadmin")) {
    redirect("/login");
  }

  const clubId = profile.club_id;
  if (!clubId) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Categorías</h1>
        <p className="text-slate-600">No hay club asignado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Categorías</h1>
      <p className="text-slate-600 text-sm mb-4">
        Gestioná las categorías del club, su orden y su estado activo/inactivo.
      </p>
      <CategoriasView clubId={clubId} />
    </div>
  );
}

