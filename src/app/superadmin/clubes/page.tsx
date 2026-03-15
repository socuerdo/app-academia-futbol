import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClubesTable } from "./ClubesTable";

export type ClubRow = {
  id: string;
  nombre: string;
  adminPrincipal: string;
  jugadores: number;
  usuarios: number;
  fechaRegistro: string;
  activo: boolean;
};

export default async function SuperadminClubesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (profile?.rol !== "superadmin") redirect("/dashboard");

  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, nombre, activo, created_at")
    .order("created_at", { ascending: false });

  if (!clubs?.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-slate-800">Clubes</h1>
        <p className="text-slate-600">No hay clubes registrados.</p>
        <Link
          href="/superadmin/clubes/nuevo"
          className="inline-flex items-center px-4 py-2 rounded-lg text-white font-medium bg-slate-800 hover:bg-slate-700"
        >
          Crear club
        </Link>
      </div>
    );
  }

  const adminIds = new Set<string>();
  const countsByClub: Record<string, { jugadores: number; usuarios: number; adminId: string | null }> = {};

  for (const club of clubs) {
    const [jugadoresRes, profilesRes] = await Promise.all([
      supabase.from("jugadores").select("id", { count: "exact", head: true }).eq("club_id", club.id),
      supabase
        .from("profiles")
        .select("id")
        .eq("club_id", club.id)
        .in("rol", ["admin", "profesor"]),
    ]);
    const adminProfile = await supabase
      .from("profiles")
      .select("id")
      .eq("club_id", club.id)
      .eq("rol", "admin")
      .limit(1)
      .maybeSingle();

    countsByClub[club.id] = {
      jugadores: jugadoresRes.count ?? 0,
      usuarios: (profilesRes.data?.length ?? 0),
      adminId: adminProfile.data?.id ?? null,
    };
    if (adminProfile.data?.id) adminIds.add(adminProfile.data.id);
  }

  const adminClient = createAdminClient();
  const emailById: Record<string, string> = {};
  await Promise.all(
    Array.from(adminIds).map(async (id) => {
      const { data } = await adminClient.auth.admin.getUserById(id);
      emailById[id] = data.user?.email ?? "—";
    })
  );

  const rows: ClubRow[] = clubs.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    adminPrincipal: countsByClub[c.id]?.adminId ? emailById[countsByClub[c.id].adminId!] ?? "—" : "—",
    jugadores: countsByClub[c.id]?.jugadores ?? 0,
    usuarios: countsByClub[c.id]?.usuarios ?? 0,
    fechaRegistro: new Date(c.created_at).toLocaleDateString("es-AR"),
    activo: !!c.activo,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-800">Clubes</h1>
        <Link
          href="/superadmin/clubes/nuevo"
          className="inline-flex items-center px-4 py-2 rounded-lg text-white font-medium bg-slate-800 hover:bg-slate-700"
        >
          Nuevo club
        </Link>
      </div>
      <ClubesTable rows={rows} />
    </div>
  );
}
