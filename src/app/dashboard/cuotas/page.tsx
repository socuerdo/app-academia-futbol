import { CobrarCuotasView, type FilaCuota } from "@/components/dashboard/cuotas/CobrarCuotasView";
import { esPeriodoValido, periodoActual, periodosUltimos } from "@/lib/cuotas/periodo";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    periodo?: string;
    sede?: string;
    categoria?: string;
  }>;
}

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

  const puedeCobrar =
    profile.rol === "admin" ||
    profile.rol === "superadmin" ||
    profile.rol === "secretaria";
  if (!puedeCobrar) redirect("/dashboard");

  const sp = await searchParams;
  const periodoSel = sp.periodo && esPeriodoValido(sp.periodo) ? sp.periodo : periodoActual();
  const sedeSel = sp.sede?.trim() || "";
  const categoriaSel = sp.categoria?.trim() || "";

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

  let cuotasByJugador = new Map<string, { estado: "pagado" | "pendiente"; fecha_pago: string | null }>();
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

  return (
    <CobrarCuotasView
      filas={filas}
      sedes={sedes ?? []}
      categorias={(categorias ?? []).map((c) => c.nombre as string)}
      periodoSel={periodoSel}
      sedeSel={sedeSel}
      categoriaSel={categoriaSel}
      periodoOpciones={periodosUltimos(12)}
    />
  );
}
