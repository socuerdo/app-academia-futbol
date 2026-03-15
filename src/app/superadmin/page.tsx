import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SuperadminPage() {
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

  const [
    { count: totalClubes },
    { count: clubesActivos },
    { count: totalJugadores },
    { count: totalUsuarios },
  ] = await Promise.all([
    supabase.from("clubs").select("id", { count: "exact", head: true }),
    supabase.from("clubs").select("id", { count: "exact", head: true }).eq("activo", true),
    supabase.from("jugadores").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).in("rol", ["admin", "profesor"]),
  ]);

  const cards = [
    { label: "Total de clubes", value: totalClubes ?? 0, href: "/superadmin/clubes" },
    { label: "Clubes activos", value: clubesActivos ?? 0, href: "/superadmin/clubes" },
    { label: "Jugadores en el sistema", value: totalJugadores ?? 0 },
    { label: "Total de usuarios", value: totalUsuarios ?? 0, href: "/superadmin/usuarios" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard Superadmin</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            style={{ borderTopWidth: 4, borderTopColor: "#1e293b" }}
          >
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            {c.href ? (
              <Link href={c.href} className="text-2xl font-bold text-slate-800 mt-1 hover:underline">
                {c.value}
              </Link>
            ) : (
              <p className="text-2xl font-bold text-slate-800 mt-1">{c.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link
          href="/superadmin/clubes/nuevo"
          className="inline-flex items-center px-4 py-2 rounded-lg text-white font-medium bg-slate-800 hover:bg-slate-700"
        >
          Crear club manualmente
        </Link>
      </div>
    </div>
  );
}
