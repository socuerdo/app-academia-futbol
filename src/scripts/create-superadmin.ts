import { createAdminClient } from "../lib/supabase/admin";

/**
 * Script para crear el usuario superadmin inicial.
 *
 * Uso:
 *   SUPERADMIN_EMAIL="admin@club.com" SUPERADMIN_PASSWORD="clave123" npx ts-node src/scripts/create-superadmin.ts
 *
 * Requisitos:
 * - Tener configuradas en el entorno:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 * - Ejecutar solo una vez para crear el primer superadmin.
 */

async function main() {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Faltan SUPERADMIN_EMAIL o SUPERADMIN_PASSWORD en las variables de entorno.\n" +
        'Ejemplo de uso:\n' +
        'SUPERADMIN_EMAIL="admin@club.com" SUPERADMIN_PASSWORD="clave123" npx ts-node src/scripts/create-superadmin.ts'
    );
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("La contraseña debe tener al menos 6 caracteres.");
    process.exit(1);
  }

  const supabaseAdmin = createAdminClient();

  console.log(`Creando/actualizando superadmin con email: ${email}`);

  // Verificar si ya existe un usuario con ese email
  const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  if (listError) {
    console.error("Error listando usuarios:", listError);
    process.exit(1);
  }

  const existing = existingUsers.users.find((u) => u.email?.toLowerCase() === email);

  let userId: string;

  if (existing) {
    console.log("Ya existe un usuario con ese email. Usando ese usuario como superadmin.");
    userId = existing.id;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Superadmin" },
    });

    if (error || !data.user) {
      console.error("No se pudo crear el usuario superadmin:", error?.message ?? "Error desconocido");
      process.exit(1);
    }

    userId = data.user.id;
    console.log("Usuario superadmin creado con id:", userId);
  }

  // Actualizar el perfil a rol = 'superadmin' y club_id = null
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      rol: "superadmin",
      club_id: null,
      nombre_completo: "Superadmin",
    })
    .eq("id", userId);

  if (profileError) {
    console.error("Error actualizando profile del superadmin:", profileError.message);
    process.exit(1);
  }

  console.log("Perfil actualizado a rol 'superadmin' con club_id = null.");
  console.log("Listo. Podés iniciar sesión con ese email y contraseña.");
}

main().catch((err) => {
  console.error("Error inesperado en el script:", err);
  process.exit(1);
});

