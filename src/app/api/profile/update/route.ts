import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = await request.json();
    const nombre_completo = typeof body.nombre_completo === "string"
      ? body.nombre_completo.trim()
      : null;
    const telefonoRaw = typeof body.telefono === "string" ? body.telefono.trim() : null;

    if (nombre_completo !== null && nombre_completo.length === 0) {
      return NextResponse.json(
        { error: "El nombre no puede quedar vacío" },
        { status: 400 }
      );
    }

    const update: { nombre_completo?: string; telefono?: string | null } = {};
    if (nombre_completo !== null) update.nombre_completo = nombre_completo;
    if (telefonoRaw !== null) update.telefono = telefonoRaw || null;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error actualizando perfil:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
