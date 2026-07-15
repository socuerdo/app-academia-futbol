"use server";

import { createClient } from "@/lib/supabase/server";
import { periodoActual } from "@/lib/cuotas/periodo";
import { revalidatePath } from "next/cache";

export type HistorialEntry = {
  periodo: string;
  estado: "pagado" | "pendiente";
  fecha_pago: string | null;
  monto: number | null;
};

export type HistorialJugador = {
  apellido: string;
  nombre: string;
  categoria: string;
  sede_nombre: string;
  fecha_inscripcion: string | null;
  historial: HistorialEntry[];
};

export async function getHistorialCuotas(
  jugador_id: string
): Promise<{ ok: true; data: HistorialJugador } | { ok: false; error: string }> {
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

  if (!["admin", "superadmin", "secretaria"].includes(profile.rol)) {
    return { ok: false, error: "Sin permiso" };
  }

  const [{ data: jugador }, { data: cuotas }] = await Promise.all([
    supabase
      .from("jugadores")
      .select("id, apellido, nombre, categoria, fecha_inscripcion, club_id, sede:sedes(nombre)")
      .eq("id", jugador_id)
      .single(),
    supabase
      .from("cuotas")
      .select("periodo, estado, fecha_pago, monto")
      .eq("jugador_id", jugador_id)
      .eq("club_id", profile.club_id)
      .order("periodo", { ascending: false }),
  ]);

  if (!jugador || jugador.club_id !== profile.club_id) {
    return { ok: false, error: "Jugador no encontrado" };
  }

  const sede = Array.isArray(jugador.sede) ? jugador.sede[0] : jugador.sede;

  return {
    ok: true,
    data: {
      apellido: jugador.apellido as string,
      nombre: jugador.nombre as string,
      categoria: jugador.categoria as string,
      sede_nombre: (sede?.nombre as string | undefined) ?? "—",
      fecha_inscripcion: (jugador.fecha_inscripcion as string | null) ?? null,
      historial: (cuotas ?? []).map((c) => ({
        periodo: c.periodo as string,
        estado: c.estado as "pagado" | "pendiente",
        fecha_pago: c.fecha_pago as string | null,
        monto: c.monto as number | null,
      })),
    },
  };
}

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

  if (!isAdmin && input.periodo < periodoActual()) {
    return {
      ok: false,
      error: "No se pueden modificar cuotas de períodos pasados. Contactá a un administrador.",
    };
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
