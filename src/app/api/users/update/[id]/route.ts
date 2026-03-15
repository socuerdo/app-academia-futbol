import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("rol, club_id")
      .eq("id", currentUser.id)
      .single();

    if (profile?.rol !== "admin" && profile?.rol !== "superadmin") {
      return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { activo, categorias_asignadas, permisos } = body;

    const updates: Record<string, unknown> = {};
    if (typeof activo === "boolean") updates.activo = activo;
    if (Array.isArray(categorias_asignadas)) updates.categorias_asignadas = categorias_asignadas;
    if (Array.isArray(permisos)) updates.permisos = permisos;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
    }

    let query = supabase.from("profiles").update(updates).eq("id", id);

    if (profile?.rol === "admin") {
      query = query.eq("club_id", profile.club_id);
    }

    const { error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
