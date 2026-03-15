"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function actualizarClub(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id && profile?.rol !== "superadmin") return { error: "Sin club asignado" };

  const clubId = (formData.get("club_id") as string) || profile?.club_id;
  if (!clubId) return { error: "Faltan club_id" };

  if (profile.rol === "admin" && profile.club_id !== clubId) {
    return { error: "Sin permiso para editar este club" };
  }

  const nombre = String(formData.get("nombre") ?? "").trim();
  const iniciales = String(formData.get("iniciales") ?? "").trim().toUpperCase().slice(0, 4);
  const color_primario = String(formData.get("color_primario") ?? "#c0392b").trim();
  const color_sidebar = String(formData.get("color_sidebar") ?? "#2c3e50").trim();
  const logo_url = (formData.get("logo_url") as string) || undefined;

  if (!nombre || !iniciales) return { error: "Nombre e iniciales son obligatorios." };

  const updates: Record<string, unknown> = {
    nombre,
    iniciales,
    color_primario,
    color_sidebar,
  };
  if (logo_url !== undefined) updates.logo_url = logo_url || null;

  const { error } = await supabase.from("clubs").update(updates).eq("id", clubId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/configuracion");
  return {};
}
