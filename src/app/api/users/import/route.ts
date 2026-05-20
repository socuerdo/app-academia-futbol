import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

type UsuarioInput = {
  email: string;
  nombre_completo: string;
  rol: string;
  categorias: string[];
};

export async function POST(request: Request) {
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
      return NextResponse.json(
        { error: "Solo administradores pueden importar usuarios." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { usuarios } = body as { usuarios: UsuarioInput[] };
    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      return NextResponse.json({ error: "Lista de usuarios vacía." }, { status: 400 });
    }

    const clubId = profile.club_id;
    const supabaseAdmin = createAdminClient();

    const resultados: Array<{
      email: string;
      nombre_completo: string;
      rol: string;
      password?: string;
      error?: string;
    }> = [];

    for (const u of usuarios) {
      const email = String(u.email ?? "").trim().toLowerCase();
      const nombre_completo = String(u.nombre_completo ?? "").trim();
      const rolNuevo: "profesor" | "secretaria" =
        String(u.rol ?? "").trim().toLowerCase() === "secretaria"
          ? "secretaria"
          : "profesor";
      const categorias: string[] = Array.isArray(u.categorias) ? u.categorias : [];

      if (!email) {
        resultados.push({ email: "(vacío)", nombre_completo, rol: rolNuevo, error: "Email vacío" });
        continue;
      }

      const password = generatePassword();

      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: nombre_completo || email },
        });

      if (userError || !userData.user) {
        const msg = userError?.message?.includes("already been registered")
          ? "Email ya registrado"
          : (userError?.message ?? "Error al crear usuario");
        resultados.push({ email, nombre_completo, rol: rolNuevo, error: msg });
        continue;
      }

      const isSecretaria = rolNuevo === "secretaria";
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          club_id: clubId,
          rol: rolNuevo,
          nombre_completo: nombre_completo || email,
          categorias_asignadas: isSecretaria ? [] : categorias,
          permisos: [],
        })
        .eq("id", userData.user.id);

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
        resultados.push({ email, nombre_completo, rol: rolNuevo, error: "Error al asignar perfil" });
        continue;
      }

      resultados.push({ email, nombre_completo, rol: rolNuevo, password });
    }

    return NextResponse.json({ resultados });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
