import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function ClubDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: club } = await supabase
    .from("clubs")
    .select("id, nombre, iniciales, activo, created_at, color_primario, logo_url")
    .eq("id", id)
    .single();

  if (!club) notFound();

  const [
    { count: jugadores },
    { data: usuarios },
    { data: adminProfile },
  ] = await Promise.all([
    supabase.from("jugadores").select("id", { count: "exact", head: true }).eq("club_id", id),
    supabase.from("profiles").select("id, nombre_completo, rol").eq("club_id", id).in("rol", ["admin", "profesor"]),
    supabase.from("profiles").select("id").eq("club_id", id).eq("rol", "admin").limit(1).maybeSingle(),
  ]);

  let adminEmail = "—";
  if (adminProfile?.id) {
    const adminClient = createAdminClient();
    const { data } = await adminClient.auth.admin.getUserById(adminProfile.id);
    adminEmail = data.user?.email ?? "—";
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link
          href="/superadmin/clubes"
          className="text-slate-600 hover:text-slate-900 font-medium"
        >
          ← Volver a clubes
        </Link>
        <Link
          href={`/superadmin/usuarios?club=${id}`}
          className="ml-auto px-4 py-2 rounded-lg text-white text-sm font-medium bg-slate-800 hover:bg-slate-700"
        >
          Gestionar usuarios
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-slate-800">{club.nombre}</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <dt className="text-slate-500 font-medium">Iniciales</dt>
          <dd className="text-slate-800">{club.iniciales}</dd>

          <dt className="text-slate-500 font-medium">Estado</dt>
          <dd>
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                club.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {club.activo ? "Activo" : "Suspendido"}
            </span>
          </dd>

          <dt className="text-slate-500 font-medium">Fecha de registro</dt>
          <dd className="text-slate-800">{new Date(club.created_at).toLocaleDateString("es-AR")}</dd>

          <dt className="text-slate-500 font-medium">Admin principal</dt>
          <dd className="text-slate-800">{adminEmail}</dd>

          <dt className="text-slate-500 font-medium">Jugadores</dt>
          <dd className="text-slate-800">{jugadores ?? 0}</dd>

          <dt className="text-slate-500 font-medium">Usuarios (admin + profesores)</dt>
          <dd className="text-slate-800">{usuarios?.length ?? 0}</dd>
        </dl>

        {usuarios?.length ? (
          <div>
            <h2 className="text-sm font-medium text-slate-600 mb-2">Usuarios del club</h2>
            <ul className="space-y-1 text-sm text-slate-800">
              {usuarios.map((u) => (
                <li key={u.id}>
                  {u.nombre_completo || u.id} — {u.rol}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
