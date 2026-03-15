import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FormCrearClub } from "./FormCrearClub";

export default async function NuevoClubPage() {
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

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-4">
        <Link
          href="/superadmin/clubes"
          className="text-slate-600 hover:text-slate-900 font-medium"
        >
          ← Volver a clubes
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-slate-800">Crear club manualmente</h1>
      <p className="text-slate-600 text-sm">
        Se creará el club, el usuario administrador y se enviará un email de bienvenida al admin.
      </p>

      <FormCrearClub />
    </div>
  );
}
