"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type CrearClubInput = {
  nombre: string;
  iniciales: string;
  adminEmail: string;
  adminPassword: string;
  adminNombre: string;
};

export async function crearClubManual(data: CrearClubInput): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .single();
  if (profile?.rol !== "superadmin") return { error: "Solo superadmin puede crear clubes" };

  const nombre = data.nombre?.trim();
  const iniciales = (data.iniciales?.trim() || "").toUpperCase().slice(0, 10);
  const adminEmail = data.adminEmail?.trim().toLowerCase();
  const adminPassword = data.adminPassword;
  const adminNombre = data.adminNombre?.trim() || adminEmail;

  if (!nombre) return { error: "El nombre del club es obligatorio." };
  if (!iniciales) return { error: "Las iniciales del club son obligatorias." };
  if (!adminEmail) return { error: "El email del admin es obligatorio." };
  if (!adminPassword || adminPassword.length < 6)
    return { error: "La contraseña debe tener al menos 6 caracteres." };

  const adminClient = createAdminClient();

  const { data: newClub, error: clubError } = await adminClient
    .from("clubs")
    .insert({ nombre, iniciales })
    .select("id")
    .single();

  if (clubError || !newClub) {
    return { error: clubError?.message ?? "No se pudo crear el club." };
  }

  const { data: userData, error: userError } =
    await adminClient.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: false,
      user_metadata: { full_name: adminNombre },
    });

  if (userError || !userData.user) {
    if (userError?.message?.includes("already been registered")) {
      await adminClient.from("clubs").delete().eq("id", newClub.id);
      return { error: "Ese email ya está registrado." };
    }
    await adminClient.from("clubs").delete().eq("id", newClub.id);
    return { error: userError?.message ?? "No se pudo crear el usuario admin." };
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      club_id: newClub.id,
      rol: "admin",
      nombre_completo: adminNombre,
    })
    .eq("id", userData.user.id);

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userData.user.id);
    await adminClient.from("clubs").delete().eq("id", newClub.id);
    return { error: "No se pudo asignar el perfil del admin." };
  }

  revalidatePath("/superadmin");
  revalidatePath("/superadmin/clubes");
  redirect("/superadmin/clubes");
}
