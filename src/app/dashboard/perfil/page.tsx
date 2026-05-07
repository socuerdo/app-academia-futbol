import { PerfilView } from "@/components/dashboard/perfil/PerfilView";
import { createClient } from "@/lib/supabase/server";
import type { Rol } from "@/types/database";
import { redirect } from "next/navigation";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, rol, nombre_completo, telefono, foto_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <PerfilView
        email={user.email ?? ""}
        rol={profile.rol as Rol}
        initialNombre={profile.nombre_completo ?? ""}
        initialTelefono={profile.telefono ?? ""}
        initialFotoUrl={profile.foto_url ?? null}
      />
    </div>
  );
}
