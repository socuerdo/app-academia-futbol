"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { registrarAccion } from "@/lib/audit";
import { esAdminOAuditor } from "@/lib/permisos";
import { revalidatePath } from "next/cache";

function parseDate(v: FormDataEntryValue | null): string | null {
  if (!v || typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed || null;
}

function parseIntOrNull(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
}

export async function crearJugador(formData: FormData): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, nombre_completo")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) return { error: "Sin club asignado" };

  const clubId = profile.club_id;
  const dni = String(formData.get("dni") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const sexo = String(formData.get("sexo") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const sedeId = String(formData.get("sede_id") ?? "").trim();

  if (!dni || !apellido || !nombre || !sexo || !categoria || !sedeId) {
    return { error: "Completá DNI, apellido, nombre, sexo, categoría y sede." };
  }

  const { data: existente } = await supabase
    .from("jugadores")
    .select("id")
    .eq("club_id", clubId)
    .eq("dni", dni)
    .maybeSingle();
  if (existente) return { error: "Ya existe un jugador con ese DNI en el club." };

  const { data: jugador, error: insertError } = await supabase
    .from("jugadores")
    .insert({
      club_id: clubId,
      sede_id: sedeId,
      dni,
      apellido,
      nombre,
      sexo,
      categoria,
      numero_camiseta: parseIntOrNull(formData.get("numero_camiseta")),
      fecha_nacimiento: parseDate(formData.get("fecha_nacimiento")),
      fecha_inscripcion: parseDate(formData.get("fecha_inscripcion")) ?? new Date().toISOString().slice(0, 10),
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      telefono_emergencia: String(formData.get("telefono_emergencia") ?? "").trim() || null,
      numero_carnet: parseDate(formData.get("numero_carnet")),
      fecha_vencimiento_carnet: parseDate(formData.get("fecha_vencimiento_carnet")),
      activo: true,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") return { error: "Ya existe un jugador con ese DNI en el club." };
    return { error: insertError.message };
  }
  if (!jugador) return { error: "Error al crear el jugador." };

  const file = formData.get("foto") as File | null;
  if (file && file.size > 0) {
    // Storage: bucket "jugadores", path {club_id}/{jugador_id}.ext. Ver supabase/storage.sql y STORAGE.md
    const admin = createAdminClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${clubId}/${jugador.id}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("jugadores")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (!uploadError) {
      const { data: urlData } = admin.storage.from("jugadores").getPublicUrl(path);
      await admin.from("jugadores").update({ foto_url: urlData.publicUrl }).eq("id", jugador.id);
    }
  }

  await registrarAccion(supabase, {
    clubId,
    usuarioId: user.id,
    usuarioNombre: profile.nombre_completo,
    accion: "crear",
    entidad: "jugador",
    entidadId: jugador.id,
    entidadDescripcion: `${apellido}, ${nombre} (DNI ${dni})`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jugadores/cargar");
  return { id: jugador.id };
}

export async function actualizarJugador(
  jugadorId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, nombre_completo")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) return { error: "Sin club asignado" };

  const { data: jugador } = await supabase
    .from("jugadores")
    .select("id, club_id, apellido, nombre, dni, categoria, sexo, sede_id")
    .eq("id", jugadorId)
    .eq("club_id", profile.club_id)
    .single();
  if (!jugador) return { error: "Jugador no encontrado" };

  const apellido = String(formData.get("apellido") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const sexo = String(formData.get("sexo") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const sedeId = String(formData.get("sede_id") ?? "").trim();
  if (!apellido || !nombre || !sexo || !categoria || !sedeId) {
    return { error: "Completá apellido, nombre, sexo, categoría y sede." };
  }

  // El DNI solo se toca si el formulario lo trae; así los formularios que no lo
  // incluyen siguen funcionando igual.
  const dni = formData.has("dni") ? String(formData.get("dni") ?? "").trim() : jugador.dni;
  if (!dni) return { error: "El DNI no puede quedar vacío." };
  if (dni !== jugador.dni) {
    const { data: existente } = await supabase
      .from("jugadores")
      .select("id")
      .eq("club_id", profile.club_id)
      .eq("dni", dni)
      .neq("id", jugadorId)
      .maybeSingle();
    if (existente) return { error: "Ya existe otro jugador con ese DNI en el club." };
  }

  // Solo se actualizan los campos opcionales que el formulario realmente envía:
  // si no vienen, se dejan como están en vez de borrarlos.
  const opcionales: Record<string, unknown> = {};
  if (formData.has("numero_camiseta")) {
    opcionales.numero_camiseta = parseIntOrNull(formData.get("numero_camiseta"));
  }
  if (formData.has("fecha_nacimiento")) {
    opcionales.fecha_nacimiento = parseDate(formData.get("fecha_nacimiento"));
  }
  if (formData.has("fecha_inscripcion")) {
    opcionales.fecha_inscripcion = parseDate(formData.get("fecha_inscripcion"));
  }
  if (formData.has("telefono")) {
    opcionales.telefono = String(formData.get("telefono") ?? "").trim() || null;
  }
  if (formData.has("telefono_emergencia")) {
    opcionales.telefono_emergencia =
      String(formData.get("telefono_emergencia") ?? "").trim() || null;
  }
  if (formData.has("numero_carnet")) {
    opcionales.numero_carnet = parseDate(formData.get("numero_carnet"));
  }
  if (formData.has("fecha_vencimiento_carnet")) {
    opcionales.fecha_vencimiento_carnet = parseDate(
      formData.get("fecha_vencimiento_carnet")
    );
  }

  const { error } = await supabase
    .from("jugadores")
    .update({
      dni,
      apellido,
      nombre,
      sexo,
      categoria,
      sede_id: sedeId,
      ...opcionales,
    })
    .eq("id", jugadorId);

  if (error) {
    if (error.code === "23505") return { error: "Ya existe otro jugador con ese DNI en el club." };
    return { error: error.message };
  }

  const cambios: Record<string, unknown> = {};
  if (jugador.dni !== dni) cambios.dni = { anterior: jugador.dni, nuevo: dni };
  if (jugador.apellido !== apellido) cambios.apellido = { anterior: jugador.apellido, nuevo: apellido };
  if (jugador.nombre !== nombre) cambios.nombre = { anterior: jugador.nombre, nuevo: nombre };
  if (jugador.sexo !== sexo) cambios.sexo = { anterior: jugador.sexo, nuevo: sexo };
  if (jugador.categoria !== categoria) cambios.categoria = { anterior: jugador.categoria, nuevo: categoria };
  if (jugador.sede_id !== sedeId) cambios.sede_id = { anterior: jugador.sede_id, nuevo: sedeId };

  await registrarAccion(supabase, {
    clubId: profile.club_id,
    usuarioId: user.id,
    usuarioNombre: profile.nombre_completo,
    accion: "editar",
    entidad: "jugador",
    entidadId: jugadorId,
    entidadDescripcion: `${apellido}, ${nombre} (DNI ${dni})`,
    cambios: Object.keys(cambios).length ? cambios : undefined,
  });

  revalidatePath("/dashboard/jugadores");
  revalidatePath("/dashboard/jugadores/buscar");
  return {};
}

export async function toggleActivoJugador(jugadorId: string, activo: boolean): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, nombre_completo")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) return { error: "Sin club asignado" };

  const { data: jugador } = await supabase
    .from("jugadores")
    .select("apellido, nombre, dni")
    .eq("id", jugadorId)
    .eq("club_id", profile.club_id)
    .maybeSingle();

  const { error } = await supabase
    .from("jugadores")
    .update({ activo })
    .eq("id", jugadorId)
    .eq("club_id", profile.club_id);

  if (error) return { error: error.message };

  await registrarAccion(supabase, {
    clubId: profile.club_id,
    usuarioId: user.id,
    usuarioNombre: profile.nombre_completo,
    accion: activo ? "activar" : "desactivar",
    entidad: "jugador",
    entidadId: jugadorId,
    entidadDescripcion: jugador ? `${jugador.apellido}, ${jugador.nombre} (DNI ${jugador.dni})` : undefined,
    cambios: { activo: { anterior: !activo, nuevo: activo } },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jugadores/activar");
  return {};
}

export async function eliminarJugador(jugadorId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol, nombre_completo")
    .eq("id", user.id)
    .single();

  if (!profile?.club_id) return { error: "Sin club asignado" };
  if (!esAdminOAuditor(profile.rol)) {
    return { error: "Solo administradores pueden eliminar jugadores" };
  }

  const { data: jugador } = await supabase
    .from("jugadores")
    .select("apellido, nombre, dni")
    .eq("id", jugadorId)
    .eq("club_id", profile.club_id)
    .maybeSingle();

  const { error } = await supabase
    .from("jugadores")
    .delete()
    .eq("id", jugadorId)
    .eq("club_id", profile.club_id);

  if (error) return { error: error.message };

  await registrarAccion(supabase, {
    clubId: profile.club_id,
    usuarioId: user.id,
    usuarioNombre: profile.nombre_completo,
    accion: "eliminar",
    entidad: "jugador",
    entidadId: jugadorId,
    entidadDescripcion: jugador ? `${jugador.apellido}, ${jugador.nombre} (DNI ${jugador.dni})` : undefined,
  });

  revalidatePath("/dashboard/jugadores/buscar");
  return {};
}

export async function cambiarSedeCategoria(
  jugadorId: string,
  sedeId: string,
  categoria: string
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

  const { error } = await supabase
    .from("jugadores")
    .update({ sede_id: sedeId, categoria: categoria.trim() })
    .eq("id", jugadorId)
    .eq("club_id", profile.club_id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/jugadores/cambiar-sede");
  return {};
}
