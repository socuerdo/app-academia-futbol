import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function getIniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return nombre.slice(0, 2).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      nombre_club,
      email,
      password,
      nombre_completo,
    }: {
      nombre_club?: string;
      email?: string;
      password?: string;
      nombre_completo?: string;
    } = body;

    if (!nombre_club?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Faltan nombre del club, email o contraseña." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .insert({
        nombre: nombre_club.trim(),
        iniciales: getIniciales(nombre_club),
        activo: true,
      })
      .select("id")
      .single();

    if (clubError || !club) {
      console.error("Error creando club:", clubError);
      return NextResponse.json(
        { error: "No se pudo crear el club. Intentá de nuevo." },
        { status: 500 }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: false,
      user_metadata: {
        full_name: nombre_completo?.trim() ?? nombre_club.trim(),
      },
    });

    if (userError || !userData.user) {
      await supabase.from("clubs").delete().eq("id", club.id);
      if (userError?.message?.includes("already registered")) {
        return NextResponse.json(
          { error: "Ese email ya está registrado." },
          { status: 400 }
        );
      }
      console.error("Error creando usuario:", userError);
      return NextResponse.json(
        { error: userError?.message ?? "No se pudo crear el usuario." },
        { status: 400 }
      );
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        club_id: club.id,
        rol: "admin",
        nombre_completo: (nombre_completo?.trim() || nombre_club.trim()) as string,
      })
      .eq("id", userData.user.id);

    if (profileError) {
      console.error("Error actualizando profile:", profileError);
      await supabase.auth.admin.deleteUser(userData.user.id);
      await supabase.from("clubs").delete().eq("id", club.id);
      return NextResponse.json(
        { error: "No se pudo completar el registro." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        "Registro exitoso. Revisá tu email para confirmar la cuenta antes de iniciar sesión.",
      user_id: userData.user.id,
    });
  } catch (e) {
    console.error("Error en registro:", e);
    return NextResponse.json(
      { error: "Error interno. Intentá de nuevo." },
      { status: 500 }
    );
  }
}
