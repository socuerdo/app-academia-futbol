import { UsuariosView } from "@/components/dashboard/usuarios/UsuariosView";
import { PERMISOS_PROFESOR, esAdminOAuditor } from "@/lib/permisos";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function UsuariosPage() {
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
  let query = supabase
    .from("profiles")
    .select("id, rol, nombre_completo, categorias_asignadas, permisos, activo")
    .in("rol", ["admin", "auditor", "profesor", "secretaria"]);

  if (esAdminOAuditor(profile?.rol) && profile?.rol !== "superadmin") {
    query = query.eq("club_id", clubId);
  } else {
    query = query.not("club_id", "is", null);
  }

  const { data: profiles } = await query.order("nombre_completo");

  const admin = createAdminClient();
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 500 });
  const emailById: Record<string, string> = {};
  authUsers?.users?.forEach((u) => {
    emailById[u.id] = u.email ?? "";
  });

  let categorias: string[] = [];
  if (clubId) {
    const { data: cats } = await supabase
      .from("categorias")
      .select("nombre, orden")
      .eq("club_id", clubId)
      .eq("activo", true)
      .order("orden", { ascending: true });
    categorias = (cats ?? []).map((c: { nombre: string }) => c.nombre).filter(Boolean);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Gestión de usuarios</h1>
      <UsuariosView
        profiles={(profiles ?? []).map((p) => ({
          ...p,
          email: emailById[p.id] ?? "",
        }))}
        clubId={clubId ?? ""}
        categorias={categorias}
        permisosOpciones={PERMISOS_PROFESOR}
      />
    </div>
  );
}
