/**
 * Upload de logo del club.
 * Usa storage.from('logos').upload(path, file) y guarda la URL pública en clubs.logo_url.
 * Requiere buckets y políticas configurados según supabase/storage.sql (ver STORAGE.md).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("club_id, rol")
      .eq("id", user.id)
      .single();
    if (profile?.rol !== "admin" && profile?.rol !== "superadmin") {
      return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const clubId = formData.get("club_id") as string | null;
    if (!file?.size || !clubId) {
      return NextResponse.json({ error: "Faltan archivo o club_id" }, { status: 400 });
    }

    if (profile.rol === "admin" && profile.club_id !== clubId) {
      return NextResponse.json({ error: "Sin permiso para este club" }, { status: 403 });
    }

    const admin = createAdminClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${clubId}/logo.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("logos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }
    const { data: urlData } = admin.storage.from("logos").getPublicUrl(path);
    // La URL pública se devuelve al cliente; el formulario de configuración la guarda en clubs.logo_url
    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
