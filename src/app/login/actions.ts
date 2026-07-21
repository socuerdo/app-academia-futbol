"use server";

import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null; redirectTo: string | null };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "") || "/dashboard";

  if (!email || !password) {
    return { error: "Completá email y contraseña.", redirectTo: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { error: "Email o contraseña incorrectos.", redirectTo: null };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        error: "Confirmá tu email antes de iniciar sesión. Revisá tu bandeja de entrada.",
        redirectTo: null,
      };
    }
    return { error: error.message, redirectTo: null };
  }

  // No usar redirect() del servidor: el router de Next 16 no siempre aplica
  // el redirect embebido en la respuesta del action (visto en grabaciones de
  // Jam — el POST devuelve x-action-redirect pero el cliente vuelve a pedir
  // /login en vez de navegar). Devolvemos el destino y navegamos a mano.
  return { error: null, redirectTo };
}
