import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { SuperadminUsuariosView, type UserRow, type ClubOption } from "@/components/superadmin/SuperadminUsuariosView";

export default async function SuperadminUsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ club?: string }>;
}) {
  const { club: initialClubFilter = "" } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (profile?.rol !== "superadmin") redirect("/dashboard");

  const adminClient = createAdminClient();

  const [
    { data: profiles },
    { data: clubs },
    { data: authData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nombre_completo, rol, club_id, activo")
      .neq("rol", "superadmin")
      .order("nombre_completo"),
    supabase
      .from("clubs")
      .select("id, nombre")
      .order("nombre"),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailById = Object.fromEntries(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  const clubNombreById = Object.fromEntries(
    (clubs ?? []).map((c) => [c.id, c.nombre])
  );

  const users: UserRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    nombre_completo: p.nombre_completo ?? "",
    email: emailById[p.id] ?? "",
    rol: p.rol,
    club_id: p.club_id ?? null,
    club_nombre: p.club_id ? (clubNombreById[p.club_id] ?? "—") : "—",
    activo: p.activo ?? true,
  }));

  const clubOptions: ClubOption[] = (clubs ?? []).map((c) => ({ id: c.id, nombre: c.nombre }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
      <SuperadminUsuariosView
        users={users}
        clubs={clubOptions}
        initialClubFilter={initialClubFilter}
      />
    </div>
  );
}
