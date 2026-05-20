import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CancheroSignOut } from "./components/CancheroSignOut";
import { RoleSimulationBanner } from "@/components/ui/RoleSimulationBanner";

export default async function CancheroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, club_id, nombre_completo")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.rol !== "canchero" && profile.rol !== "admin" && profile.rol !== "superadmin")) {
    redirect("/login");
  }

  if (!profile.club_id) {
    redirect("/login");
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("nombre")
    .eq("id", profile.club_id)
    .single();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base sm:text-lg font-bold text-slate-800 truncate">
            {club?.nombre ?? "Club"}
          </span>
          <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            Canchero
          </span>
        </div>
        <CancheroSignOut />
      </header>
      <RoleSimulationBanner />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
