import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardMenuItems } from "@/lib/dashboard-menu";
import { diasHastaCumpleanios } from "@/lib/fecha";
import { esAdminOAuditor } from "@/lib/permisos";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Rol } from "@/types/database";

const SIMULATION_ROLES_IN_DASHBOARD: Rol[] = ["profesor", "secretaria"];

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
      profile.rol !== "secretaria" &&
      profile.rol !== "canchero")
  ) {
    redirect("/login");
  }

  if (profile.rol === "canchero") {
    redirect("/canchero");
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

  const cookieStore = await cookies();
  const simulatedRoleCookie = cookieStore.get("simulated_role")?.value as Rol | undefined;
  const isPrivileged = esAdminOAuditor(profile.rol);
  const effectiveRol: Rol =
    isPrivileged &&
    simulatedRoleCookie &&
    SIMULATION_ROLES_IN_DASHBOARD.includes(simulatedRoleCookie)
      ? simulatedRoleCookie
      : profile.rol;

  const menuItems = getDashboardMenuItems(effectiveRol, effectiveRol === profile.rol ? (profile.permisos ?? []) : []);
  const userName = profile.nombre_completo?.trim() || user.email || "";

  const { data: jugadoresNac } = await supabase
    .from("jugadores")
    .select("fecha_nacimiento")
    .eq("club_id", profile.club_id)
    .eq("activo", true)
    .not("fecha_nacimiento", "is", null);

  const hoyLayout = new Date();
  const cumpleaniosCount = (jugadoresNac ?? []).filter(
    (j) => j.fecha_nacimiento && diasHastaCumpleanios(j.fecha_nacimiento, hoyLayout) <= 14
  ).length;

  return (
    <DashboardShell
      club={club}
      user={{ id: user.id, email: user.email ?? undefined }}
      userName={userName}
      userPhotoUrl={profile.foto_url ?? null}
      rol={effectiveRol}
      menuItems={menuItems}
      cumpleaniosCount={cumpleaniosCount}
    >
      {children}
    </DashboardShell>
  );
}
