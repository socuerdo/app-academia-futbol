"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function crearSede(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) return { error: "Sin club asignado" };

  const nombre = String(formData.get("nombre") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim() || null;
  const ciudad = String(formData.get("ciudad") ?? "").trim() || null;
  const telefono = String(formData.get("telefono") ?? "").trim() || null;

  if (!nombre) return { error: "El nombre es obligatorio." };

  const { error } = await supabase.from("sedes").insert({
    club_id: profile.club_id,
    nombre,
    direccion,
    ciudad,
    telefono,
    activo: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/sedes");
  revalidatePath("/dashboard/jugadores/cargar");
  revalidatePath("/dashboard/asistencias/cargar");
  return {};
}

export async function actualizarSede(
  sedeId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) return { error: "Sin club asignado" };

  const nombre = String(formData.get("nombre") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim() || null;
  const ciudad = String(formData.get("ciudad") ?? "").trim() || null;
  const telefono = String(formData.get("telefono") ?? "").trim() || null;

  if (!nombre) return { error: "El nombre es obligatorio." };

  const { error } = await supabase
    .from("sedes")
    .update({ nombre, direccion, ciudad, telefono })
    .eq("id", sedeId)
    .eq("club_id", profile.club_id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/sedes");
  return {};
}

export async function eliminarSede(sedeId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) return { error: "Sin club asignado" };

  const { count } = await supabase
    .from("jugadores")
    .select("id", { count: "exact", head: true })
    .eq("sede_id", sedeId);

  if (count && count > 0) {
    return { error: `No se puede eliminar: hay ${count} jugador(es) asignado(s) a esta sede.` };
  }

  const { error } = await supabase
    .from("sedes")
    .delete()
    .eq("id", sedeId)
    .eq("club_id", profile.club_id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/sedes");
  return {};
}
