"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const PERIODO_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function setEstadoCuota(input: {
  jugador_id: string;
  periodo: string;
  estado: "pagado" | "pendiente";
  monto?: number | null;
  observacion?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!PERIODO_RE.test(input.periodo)) {
    return { ok: false, error: "Período inválido (formato YYYY-MM)" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) return { ok: false, error: "Sin club" };

  const isAdmin = profile.rol === "admin" || profile.rol === "superadmin";
  const isSecretaria = profile.rol === "secretaria";
  if (!isAdmin && !isSecretaria) {
    return { ok: false, error: "Sin permiso" };
  }

  const { data: jugador } = await supabase
    .from("jugadores")
    .select("id, club_id")
    .eq("id", input.jugador_id)
    .single();
  if (!jugador || jugador.club_id !== profile.club_id) {
    return { ok: false, error: "Jugador no encontrado" };
  }

  const fecha_pago = input.estado === "pagado" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("cuotas")
    .upsert(
      {
        club_id: profile.club_id,
        jugador_id: input.jugador_id,
        periodo: input.periodo,
        estado: input.estado,
        fecha_pago,
        monto: input.monto ?? null,
        observacion: input.observacion ?? null,
        registrado_por: user.id,
      },
      { onConflict: "club_id,jugador_id,periodo" }
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/cuotas");
  revalidatePath("/dashboard/cuotas/morosidad");
  revalidatePath("/dashboard");
  return { ok: true };
}
