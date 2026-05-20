"use server";

import { createClient } from "@/lib/supabase/server";
import type { TurnoAlquiler, TurnoEscuela } from "@/lib/canchas";

async function getProfileAndClub() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) throw new Error("Sin club asignado");
  if (profile.rol !== "canchero" && profile.rol !== "admin" && profile.rol !== "superadmin") {
    throw new Error("Sin permiso");
  }
  return { supabase, clubId: profile.club_id as string };
}

export async function fetchTurnosAlquiler(fecha: string): Promise<TurnoAlquiler[]> {
  const { supabase, clubId } = await getProfileAndClub();
  const { data, error } = await supabase
    .from("turnos_alquiler")
    .select("*")
    .eq("club_id", clubId)
    .eq("fecha", fecha)
    .order("hora")
    .order("cancha");
  if (error) throw new Error(error.message);
  return (data ?? []) as TurnoAlquiler[];
}

export async function fetchTurnosEscuela(fecha: string): Promise<TurnoEscuela[]> {
  const { supabase, clubId } = await getProfileAndClub();
  const { data, error } = await supabase
    .from("turnos_escuela")
    .select("*")
    .eq("club_id", clubId)
    .eq("fecha", fecha)
    .order("hora")
    .order("cancha");
  if (error) throw new Error(error.message);
  return (data ?? []) as TurnoEscuela[];
}

export async function crearTurnoAlquiler(
  data: Omit<TurnoAlquiler, "id" | "club_id" | "created_at">
): Promise<{ data?: TurnoAlquiler; error?: string }> {
  try {
    const { supabase, clubId } = await getProfileAndClub();
    const { data: row, error } = await supabase
      .from("turnos_alquiler")
      .insert({ ...data, club_id: clubId })
      .select()
      .single();
    if (error) return { error: error.message };
    return { data: row as TurnoAlquiler };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function actualizarTurnoAlquiler(
  id: string,
  data: Partial<Omit<TurnoAlquiler, "id" | "club_id" | "created_at">>
): Promise<{ data?: TurnoAlquiler; error?: string }> {
  try {
    const { supabase, clubId } = await getProfileAndClub();
    const { data: row, error } = await supabase
      .from("turnos_alquiler")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("club_id", clubId)
      .select()
      .single();
    if (error) return { error: error.message };
    return { data: row as TurnoAlquiler };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function eliminarTurnoAlquiler(id: string): Promise<{ error?: string }> {
  try {
    const { supabase, clubId } = await getProfileAndClub();
    const { error } = await supabase
      .from("turnos_alquiler")
      .delete()
      .eq("id", id)
      .eq("club_id", clubId);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function crearTurnoEscuela(
  data: Omit<TurnoEscuela, "id" | "club_id" | "created_at">
): Promise<{ data?: TurnoEscuela; error?: string }> {
  try {
    const { supabase, clubId } = await getProfileAndClub();
    const { data: row, error } = await supabase
      .from("turnos_escuela")
      .insert({ ...data, club_id: clubId })
      .select()
      .single();
    if (error) return { error: error.message };
    return { data: row as TurnoEscuela };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function actualizarTurnoEscuela(
  id: string,
  data: Partial<Omit<TurnoEscuela, "id" | "club_id" | "created_at">>
): Promise<{ data?: TurnoEscuela; error?: string }> {
  try {
    const { supabase, clubId } = await getProfileAndClub();
    const { data: row, error } = await supabase
      .from("turnos_escuela")
      .update(data)
      .eq("id", id)
      .eq("club_id", clubId)
      .select()
      .single();
    if (error) return { error: error.message };
    return { data: row as TurnoEscuela };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido" };
  }
}

export async function eliminarTurnoEscuela(id: string): Promise<{ error?: string }> {
  try {
    const { supabase, clubId } = await getProfileAndClub();
    const { error } = await supabase
      .from("turnos_escuela")
      .delete()
      .eq("id", id)
      .eq("club_id", clubId);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error desconocido" };
  }
}
