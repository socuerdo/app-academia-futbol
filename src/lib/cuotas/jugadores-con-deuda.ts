import type { SupabaseClient } from "@supabase/supabase-js";
import { periodoActual } from "@/lib/cuotas/periodo";

/**
 * Devuelve los IDs de jugadores activos del club que NO tienen la cuota del
 * período indicado marcada como pagada (incluye los que no tienen registro).
 */
export async function getJugadoresConCuotaImpaga(
  supabase: SupabaseClient,
  clubId: string,
  periodo: string = periodoActual()
): Promise<Set<string>> {
  const { data: jugadores } = await supabase
    .from("jugadores")
    .select("id")
    .eq("club_id", clubId)
    .eq("activo", true);

  const idsActivos = new Set<string>((jugadores ?? []).map((j) => j.id as string));
  if (idsActivos.size === 0) return new Set();

  const { data: pagados } = await supabase
    .from("cuotas")
    .select("jugador_id")
    .eq("club_id", clubId)
    .eq("periodo", periodo)
    .eq("estado", "pagado");

  const pagadosSet = new Set<string>(
    (pagados ?? []).map((c) => c.jugador_id as string)
  );

  const impagas = new Set<string>();
  idsActivos.forEach((id) => {
    if (!pagadosSet.has(id)) impagas.add(id);
  });
  return impagas;
}
