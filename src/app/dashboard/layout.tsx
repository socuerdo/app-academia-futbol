import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardMenuItems } from "@/lib/dashboard-menu";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, rol, club_id, nombre_completo, permisos, foto_url")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    (profile.rol !== "admin" &&
      profile.rol !== "profesor" &&
      profile.rol !== "superadmin" &&
      profile.rol !== "secretaria")
  ) {
    redirect("/login");
  }

  if (!profile.club_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <p className="text-slate-600">No hay club asignado. Contactá al administrador.</p>
      </div>
    );
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, nombre, logo_url, color_primario, color_sidebar, iniciales, activo")
    .eq("id", profile.club_id)
    .single();

  if (!club || !club.activo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <p className="text-slate-600">Club no encontrado o inactivo.</p>
      </div>
    );
  }

  const menuItems = getDashboardMenuItems(profile.rol, profile.permisos ?? []);
  const userName = profile.nombre_completo?.trim() || user.email || "";

  return (
    <DashboardShell
      club={club}
      user={{ id: user.id, email: user.email ?? undefined }}
      userName={userName}
      userPhotoUrl={profile.foto_url ?? null}
      rol={profile.rol}
      menuItems={menuItems}
    >
      {children}
    </DashboardShell>
  );
}
