import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "No autorizado. Iniciá sesión." },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("rol, club_id")
      .eq("id", currentUser.id)
      .single();

    const rol = profile?.rol;
    const userClubId = profile?.club_id;

    if (rol !== "admin" && rol !== "superadmin") {
      return NextResponse.json(
        { error: "Solo administradores pueden crear usuarios." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      email,
      password,
      nombre_completo,
      rol: rolNuevo,
      categorias_asignadas,
      permisos,
      club_id,
    }: {
      email?: string;
      password?: string;
      nombre_completo?: string;
      rol?: string;
      categorias_asignadas?: string[];
      permisos?: string[];
      club_id?: string;
    } = body;

    const rolFinal: "profesor" | "secretaria" =
      rolNuevo === "secretaria" ? "secretaria" : "profesor";

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "Faltan email o contraseña." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const targetClubId = club_id?.trim() || null;
    if (!targetClubId) {
      return NextResponse.json(
        { error: "Faltan club_id." },
        { status: 400 }
      );
    }

    if (rol === "admin" && userClubId !== targetClubId) {
      return NextResponse.json(
        { error: "Solo podés crear usuarios de tu club." },
        { status: 403 }
      );
    }

    const supabaseAdmin = createAdminClient();

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: nombre_completo?.trim() ?? email.trim(),
        },
      });

    if (userError || !userData.user) {
      if (userError?.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: "Ese email ya está registrado." },
          { status: 400 }
        );
      }
      console.error("Error creando usuario profesor:", userError);
      return NextResponse.json(
        { error: userError?.message ?? "No se pudo crear el usuario." },
        { status: 400 }
      );
    }

    const isSecretaria = rolFinal === "secretaria";
    const { error: profileError } = await supabaseAdmin.from("profiles").update({
      club_id: targetClubId,
      rol: rolFinal,
      nombre_completo: (nombre_completo?.trim() || email.trim()) as string,
      categorias_asignadas: isSecretaria
        ? []
        : Array.isArray(categorias_asignadas)
          ? categorias_asignadas
          : [],
      permisos: isSecretaria
        ? []
        : Array.isArray(permisos)
          ? permisos
          : [],
    }).eq("id", userData.user.id);

    if (profileError) {
      console.error("Error actualizando profile del profesor:", profileError);
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json(
        { error: "No se pudo asignar el perfil del profesor." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        id: userData.user.id,
        email: userData.user.email,
        nombre_completo: nombre_completo?.trim() || userData.user.email,
        rol: rolFinal,
        club_id: targetClubId,
        categorias_asignadas: isSecretaria ? [] : (categorias_asignadas ?? []),
        permisos: isSecretaria ? [] : (permisos ?? []),
      },
    });
  } catch (e) {
    console.error("Error en creación de usuario:", e);
    return NextResponse.json(
      { error: "Error interno. Intentá de nuevo." },
      { status: 500 }
    );
  }
}
