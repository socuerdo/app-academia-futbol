import { CobrarCuotasView, type FilaCuota } from "@/components/dashboard/cuotas/CobrarCuotasView";
import { MorosidadView, type FilaMorosidad } from "@/components/dashboard/cuotas/MorosidadView";
import {
  esPeriodoValido,
  periodoActual,
  periodosUltimos,
} from "@/lib/cuotas/periodo";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    periodo?: string;
    sede?: string;
    categoria?: string;
  }>;
}

const VENTANA_MESES = 6;

export default async function CuotasPage({ searchParams }: PageProps) {
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

  const canCobrar =
    profile.rol === "admin" ||
    profile.rol === "superadmin" ||
    profile.rol === "secretaria";
  const canVer =
    canCobrar || profile.rol === "profesor";

  if (!canVer) redirect("/dashboard");

  const sp = await searchParams;
  const defaultTab = canCobrar ? "cobrar" : "morosidad";
  const tab = sp.tab ?? defaultTab;

  // Profesor solo puede ver morosidad
  if (tab === "cobrar" && !canCobrar) {
    redirect("/dashboard/cuotas?tab=morosidad");
  }

  const periodoSel =
    sp.periodo && esPeriodoValido(sp.periodo) ? sp.periodo : periodoActual();
  const sedeSel = sp.sede?.trim() || "";
  const categoriaSel = sp.categoria?.trim() || "";

  // Datos compartidos
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
        .select("id, apellido, nombre, sexo, categoria, sede_id, fecha_inscripcion, sede:sedes(nombre)")
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

  const sedesData = sedes ?? [];
  const categoriasData = (categorias ?? []).map((c) => c.nombre as string);
  const periodoOpciones = periodosUltimos(12);

  let content: React.ReactNode;

  // ── Tab: cobrar ───────────────────────────────────────────────────────────
  if (tab === "cobrar") {
    let cuotasByJugador = new Map<
      string,
      { estado: "pagado" | "pendiente"; fecha_pago: string | null }
    >();
    if (jugadorIds.length > 0) {
      const { data: cuotas } = await supabase
        .from("cuotas")
        .select("jugador_id, estado, fecha_pago")
        .eq("club_id", profile.club_id)
        .eq("periodo", periodoSel)
        .in("jugador_id", jugadorIds);
      cuotasByJugador = new Map(
        (cuotas ?? []).map((c) => [
          c.jugador_id as string,
          {
            estado: c.estado as "pagado" | "pendiente",
            fecha_pago: c.fecha_pago as string | null,
          },
        ])
      );
    }

    const filas: FilaCuota[] = jugadoresFiltrados.map((j) => {
      const sede = Array.isArray(j.sede) ? j.sede[0] : j.sede;
      const c = cuotasByJugador.get(j.id);
      return {
        jugador_id: j.id,
        apellido: j.apellido as string,
        nombre: j.nombre as string,
        categoria: j.categoria as string,
        sede_nombre: (sede?.nombre as string | undefined) ?? "—",
        estado: c?.estado ?? "pendiente",
        fecha_pago: c?.fecha_pago ?? null,
      };
    });

    content = (
      <CobrarCuotasView
        key={`${periodoSel}-${sedeSel}-${categoriaSel}`}
        filas={filas}
        sedes={sedesData}
        categorias={categoriasData}
        periodoSel={periodoSel}
        sedeSel={sedeSel}
        categoriaSel={categoriaSel}
        periodoOpciones={periodoOpciones}
      />
    );

  // ── Tab: morosidad ────────────────────────────────────────────────────────
  } else {
    const ventana = periodosUltimos(VENTANA_MESES, periodoSel);

    let cuotasMap = new Map<
      string,
      Map<string, { estado: string; fecha_pago: string | null }>
    >();
    let ultimoPagoMap = new Map<string, string>();

    if (jugadorIds.length > 0) {
      const [{ data: cuotas }, { data: ultimos }] = await Promise.all([
        supabase
          .from("cuotas")
          .select("jugador_id, periodo, estado, fecha_pago")
          .eq("club_id", profile.club_id)
          .in("jugador_id", jugadorIds)
          .in("periodo", ventana),
        supabase
          .from("cuotas")
          .select("jugador_id, periodo")
          .eq("club_id", profile.club_id)
          .eq("estado", "pagado")
          .in("jugador_id", jugadorIds)
          .order("periodo", { ascending: false }),
      ]);

      (cuotas ?? []).forEach((c) => {
        const jId = c.jugador_id as string;
        if (!cuotasMap.has(jId)) cuotasMap.set(jId, new Map());
        cuotasMap.get(jId)!.set(c.periodo as string, {
          estado: c.estado as string,
          fecha_pago: c.fecha_pago as string | null,
        });
      });

      (ultimos ?? []).forEach((u) => {
        const jId = u.jugador_id as string;
        if (!ultimoPagoMap.has(jId)) ultimoPagoMap.set(jId, u.periodo as string);
      });
    }

    const filas: FilaMorosidad[] = jugadoresFiltrados
      .map((j) => {
        const sede = Array.isArray(j.sede) ? j.sede[0] : j.sede;
        const cuotasJugador = cuotasMap.get(j.id);
        const inscripcionMes = (j.fecha_inscripcion as string | null)?.slice(0, 7) ?? null;
        const periodoActualPagado =
          cuotasJugador?.get(periodoSel)?.estado === "pagado";
        const ventanaValida = inscripcionMes
          ? ventana.filter((p) => p >= inscripcionMes)
          : ventana;
        const mesesAtraso = ventanaValida.filter(
          (p) => cuotasJugador?.get(p)?.estado !== "pagado"
        ).length;
        return {
          jugador_id: j.id,
          apellido: j.apellido as string,
          nombre: j.nombre as string,
          sexo: (j.sexo as string | undefined) ?? "",
          categoria: j.categoria as string,
          sede_nombre: (sede?.nombre as string | undefined) ?? "—",
          periodo_pagado: periodoActualPagado,
          meses_atraso: mesesAtraso,
          ultimo_pago: ultimoPagoMap.get(j.id) ?? null,
          inscripcion_mes: inscripcionMes,
        };
      })
      .filter((f) => {
        if (f.periodo_pagado) return false;
        if (f.inscripcion_mes && periodoSel < f.inscripcion_mes) return false;
        return true;
      })
      .sort((a, b) => b.meses_atraso - a.meses_atraso);

    content = (
      <MorosidadView
        key={`${periodoSel}-${sedeSel}-${categoriaSel}`}
        filas={filas}
        sedes={sedesData}
        categorias={categoriasData}
        periodoSel={periodoSel}
        sedeSel={sedeSel}
        categoriaSel={categoriaSel}
        periodoOpciones={periodoOpciones}
        ventanaMeses={VENTANA_MESES}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Cuotas</h1>

      {/* Tab bar: solo si el usuario puede cobrar (secretaria/admin) */}
      {canCobrar && (
        <div className="flex gap-0 border-b border-slate-200">
          <Link
            href="/dashboard/cuotas"
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === "cobrar"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Cobrar cuotas
          </Link>
          <Link
            href="/dashboard/cuotas?tab=morosidad"
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === "morosidad"
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Morosidad
          </Link>
        </div>
      )}

      {content}
    </div>
  );
}
