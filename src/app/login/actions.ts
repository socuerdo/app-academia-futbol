"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type LoginState = { error: string | null };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "") || "/dashboard";

  if (!email || !password) {
    return { error: "Completá email y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { error: "Email o contraseña incorrectos." };
    }
    if (error.message.includes("Email not confirmed")) {
      return { error: "Confirmá tu email antes de iniciar sesión. Revisá tu bandeja de entrada." };
    }
    return { error: error.message };
  }

  redirect(redirectTo);
}
