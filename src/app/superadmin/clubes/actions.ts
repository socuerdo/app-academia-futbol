"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verifySuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: "No autorizado" };
  const { data: profile } = await supabase.from("profiles").select("rol").eq("id", user.id).single();
  if (profile?.rol !== "superadmin") return { supabase: null, error: "Sin permiso" };
  return { supabase, error: null };
}

export async function toggleClubActivo(clubId: string, activo: boolean): Promise<{ error?: string }> {
  const { supabase, error: authError } = await verifySuperadmin();
  if (authError || !supabase) return { error: authError ?? "Error" };
  const { error } = await supabase.from("clubs").update({ activo }).eq("id", clubId);
  if (error) return { error: error.message };
  revalidatePath("/superadmin");
  revalidatePath("/superadmin/clubes");
  return {};
}

export async function editarClub(
  clubId: string,
  data: { nombre: string; iniciales: string }
): Promise<{ error?: string }> {
  const nombre = data.nombre.trim();
  const iniciales = data.iniciales.trim().toUpperCase();
  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!iniciales) return { error: "Las iniciales son obligatorias." };

  const { supabase, error: authError } = await verifySuperadmin();
  if (authError || !supabase) return { error: authError ?? "Error" };

  const { error } = await supabase.from("clubs").update({ nombre, iniciales }).eq("id", clubId);
  if (error) return { error: error.message };
  revalidatePath("/superadmin/clubes");
  revalidatePath(`/superadmin/clubes/${clubId}`);
  return {};
}
