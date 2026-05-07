import {
  MorosidadView,
  type FilaMorosidad,
} from "@/components/dashboard/cuotas/MorosidadView";
import {
  esPeriodoValido,
  periodoActual,
  periodosUltimos,
} from "@/lib/cuotas/periodo";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    periodo?: string;
    sede?: string;
    categoria?: string;
  }>;
}

const VENTANA_MESES = 6;

export default async function MorosidadPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) redirect("/login");

  const puedeVer =
    profile.rol === "admin" ||
    profile.rol === "superadmin" ||
    profile.rol === "secretaria" ||
    profile.rol === "profesor";
  if (!puedeVer) redirect("/dashboard");

  const sp = await searchParams;
  const periodoSel = sp.periodo && esPeriodoValido(sp.periodo) ? sp.periodo : periodoActual();
  const sedeSel = sp.sede?.trim() || "";
  const categoriaSel = sp.categoria?.trim() || "";

  const ventana = periodosUltimos(VENTANA_MESES, periodoSel);

  const [{ data: sedes }, { data: categorias }, { data: jugadoresRows }] =
    await Promise.all([
      supabase
        .from("sedes")
        .select("id, nombre")
        .eq("club_id", profile.club_id)
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("categorias")
        .select("nombre")
        .eq("club_id", profile.club_id)
        .eq("activo", true)
        .order("orden"),
      supabase
        .from("jugadores")
        .select("id, apellido, nombre, categoria, sede_id, sede:sedes(nombre)")
        .eq("club_id", profile.club_id)
        .eq("activo", true)
        .order("apellido"),
    ]);

  const jugadoresFiltrados = (jugadoresRows ?? []).filter((j) => {
    if (sedeSel && j.sede_id !== sedeSel) return false;
    if (categoriaSel && j.categoria !== categoriaSel) return false;
    return true;
  });
  const jugadorIds = jugadoresFiltrados.map((j) => j.id);

  let cuotasMap = new Map<string, Map<string, { estado: string; fecha_pago: string | null }>>();
  if (jugadorIds.length > 0) {
    const { data: cuotas } = await supabase
      .from("cuotas")
      .select("jugador_id, periodo, estado, fecha_pago")
      .eq("club_id", profile.club_id)
      .in("jugador_id", jugadorIds)
      .in("periodo", ventana);
    (cuotas ?? []).forEach((c) => {
      const jId = c.jugador_id as string;
      if (!cuotasMap.has(jId)) cuotasMap.set(jId, new Map());
      cuotasMap.get(jId)!.set(c.periodo as string, {
        estado: c.estado as string,
        fecha_pago: c.fecha_pago as string | null,
      });
    });
  }

  // Último pago histórico por jugador (para mostrarlo aunque sea fuera de la ventana)
  let ultimoPagoMap = new Map<string, string>();
  if (jugadorIds.length > 0) {
    const { data: ultimos } = await supabase
      .from("cuotas")
      .select("jugador_id, periodo")
      .eq("club_id", profile.club_id)
      .eq("estado", "pagado")
      .in("jugador_id", jugadorIds)
      .order("periodo", { ascending: false });
    (ultimos ?? []).forEach((u) => {
      const jId = u.jugador_id as string;
      if (!ultimoPagoMap.has(jId)) ultimoPagoMap.set(jId, u.periodo as string);
    });
  }

  const filas: FilaMorosidad[] = jugadoresFiltrados
    .map((j) => {
      const sede = Array.isArray(j.sede) ? j.sede[0] : j.sede;
      const cuotasJugador = cuotasMap.get(j.id);
      const periodoActualPagado =
        cuotasJugador?.get(periodoSel)?.estado === "pagado";
      const mesesAtraso = ventana.filter((p) => {
        return cuotasJugador?.get(p)?.estado !== "pagado";
      }).length;
      return {
        jugador_id: j.id,
        apellido: j.apellido as string,
        nombre: j.nombre as string,
        categoria: j.categoria as string,
        sede_nombre: (sede?.nombre as string | undefined) ?? "—",
        periodo_pagado: periodoActualPagado,
        meses_atraso: mesesAtraso,
        ultimo_pago: ultimoPagoMap.get(j.id) ?? null,
      };
    })
    .filter((f) => !f.periodo_pagado)
    .sort((a, b) => b.meses_atraso - a.meses_atraso);

  return (
    <MorosidadView
      filas={filas}
      sedes={sedes ?? []}
      categorias={(categorias ?? []).map((c) => c.nombre as string)}
      periodoSel={periodoSel}
      sedeSel={sedeSel}
      categoriaSel={categoriaSel}
      periodoOpciones={periodosUltimos(12)}
      ventanaMeses={VENTANA_MESES}
    />
  );
}
