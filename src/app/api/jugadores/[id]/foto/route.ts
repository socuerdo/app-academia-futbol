import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PERMISO, esAdminOAuditor, tienePermiso } from "@/lib/permisos";
import { NextResponse } from "next/server";

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * La foto se sube por API route y no por server action porque los server
 * actions de Next tienen un límite de body de 1MB y las fotos sacadas con el
 * celular lo superan. Mismo criterio que /api/profile/upload-avatar.
 */
async function autorizar(jugadorId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado", status: 401 as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol, permisos")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) return { error: "Sin club asignado", status: 403 as const };

  const puedeEditar =
    esAdminOAuditor(profile.rol) ||
    profile.rol === "secretaria" ||
    tienePermiso(profile.permisos, PERMISO.JUGADORES_EDITAR);
  if (!puedeEditar) return { error: "Sin permiso para editar jugadores", status: 403 as const };

  const { data: jugador } = await supabase
    .from("jugadores")
    .select("id, club_id, foto_url")
    .eq("id", jugadorId)
    .eq("club_id", profile.club_id)
    .maybeSingle();
  if (!jugador) return { error: "Jugador no encontrado", status: 404 as const };

  return { clubId: profile.club_id as string, jugador };
}

/** Extrae el path dentro del bucket a partir de la URL pública guardada. */
function pathDesdeUrl(url: string | null): string | null {
  if (!url) return null;
  const marca = "/jugadores/";
  const i = url.indexOf(marca);
  if (i === -1) return null;
  return url.slice(i + marca.length).split("?")[0];
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await autorizar(id);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file?.size) {
      return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo debe ser una imagen" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "La imagen no puede superar 5 MB" }, { status: 400 });
    }

    const admin = createAdminClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    // Bucket "jugadores", path {club_id}/{jugador_id}.ext — ver supabase/storage.sql
    const path = `${auth.clubId}/${id}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("jugadores")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data: urlData } = admin.storage.from("jugadores").getPublicUrl(path);
    // El path es estable, así que le agregamos versión para que el navegador
    // no siga mostrando la foto anterior desde caché.
    const url = `${urlData.publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await admin
      .from("jugadores")
      .update({ foto_url: url })
      .eq("id", id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (e) {
    console.error("Error subiendo foto de jugador:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await autorizar(id);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const admin = createAdminClient();
    const path = pathDesdeUrl(auth.jugador.foto_url);
    if (path) {
      await admin.storage.from("jugadores").remove([path]);
    }

    const { error } = await admin
      .from("jugadores")
      .update({ foto_url: null })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error quitando foto de jugador:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
