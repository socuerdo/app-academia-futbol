import { createAdminClient } from "@/lib/supabase/admin";
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
    const { activo, categorias_asignadas, permisos, password } = body;

    // Cambio de contraseña
    if (typeof password === "string") {
      if (password.length < 6) {
        return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
      }

      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("rol, club_id")
        .eq("id", id)
        .single();

      if (!targetProfile) {
        return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
      }

      if (targetProfile.rol === "superadmin") {
        return NextResponse.json({ error: "No se puede cambiar la contraseña de un superadmin." }, { status: 403 });
      }

      if (profile?.rol === "admin" && targetProfile.club_id !== profile?.club_id) {
        return NextResponse.json({ error: "Sin permiso." }, { status: 403 });
      }

      const admin = createAdminClient();
      const { error: pwError } = await admin.auth.admin.updateUserById(id, { password });
      if (pwError) return NextResponse.json({ error: pwError.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

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
