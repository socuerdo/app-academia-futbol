"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleClubActivo(clubId: string, activo: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (profile?.rol !== "superadmin") return { error: "Solo superadmin puede activar/suspender clubes" };

  const { error } = await supabase.from("clubs").update({ activo }).eq("id", clubId);
  if (error) return { error: error.message };
  revalidatePath("/superadmin");
  revalidatePath("/superadmin/clubes");
  return {};
}
