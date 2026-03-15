import { ReportesAsistenciasView } from "@/components/dashboard/asistencias/ReportesAsistenciasView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ sede?: string; categoria?: string; desde?: string; hasta?: string }>;
}

export default async function ReportesAsistenciasPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) redirect("/login");

  const params = await searchParams;
  const sedeId = params.sede ?? "";
  const categoria = params.categoria ?? "";
  const hoy = new Date();
  const hace30 = new Date(hoy);
  hace30.setDate(hace30.getDate() - 30);
  const desde = params.desde ?? hace30.toISOString().slice(0, 10);
  const hasta = params.hasta ?? hoy.toISOString().slice(0, 10);

  const { data: sedes } = await supabase
    .from("sedes")
    .select("id, nombre")
    .eq("club_id", profile.club_id)
    .eq("activo", true)
    .order("nombre");

  const { data: jugadoresData } = await supabase
    .from("jugadores")
    .select("id, apellido, nombre, categoria, sede:sedes(id, nombre)")
    .eq("club_id", profile.club_id)
    .eq("activo", true)
    .order("apellido");

  let jugadores = (jugadoresData ?? []).map((j: any) => ({
    ...j,
    sede: Array.isArray(j.sede) ? j.sede[0] : j.sede,
  }));

  if (sedeId) jugadores = jugadores.filter((j: any) => j.sede?.id === sedeId);
  if (categoria) jugadores = jugadores.filter((j: any) => j.categoria === categoria);

  const ids = jugadores.map((j: any) => j.id);
  let filas: Array<{ jugador: string; categoria: string; sede: string; presencias: number; ausencias: number; total: number; porcentaje: number }> = [];

  if (ids.length > 0 && desde && hasta) {
    const { data: asis } = await supabase
      .from("asistencias")
      .select("jugador_id, presente")
      .in("jugador_id", ids)
      .gte("fecha", desde)
      .lte("fecha", hasta);

    const porJugador: Record<string, { p: number; a: number }> = {};
    ids.forEach((id) => (porJugador[id] = { p: 0, a: 0 }));
    (asis ?? []).forEach((a) => {
      if (a.presente) porJugador[a.jugador_id].p++;
      else porJugador[a.jugador_id].a++;
    });

    filas = jugadores.map((j: any) => {
      const { p, a } = porJugador[j.id];
      const total = p + a;
      const porcentaje = total > 0 ? Math.round((p / total) * 100) : 0;
      return {
        jugador: `${j.apellido}, ${j.nombre}`,
        categoria: j.categoria,
        sede: j.sede?.nombre ?? "-",
        presencias: p,
        ausencias: a,
        total,
        porcentaje,
      };
    });
    filas.sort((a, b) => b.porcentaje - a.porcentaje);
  }

  const categorias = [...new Set((jugadoresData ?? []).map((r: any) => r.categoria).filter(Boolean))].sort();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Reportes de asistencias</h1>
      <ReportesAsistenciasView
        sedes={sedes ?? []}
        categorias={categorias}
        initialSedeId={sedeId}
        initialCategoria={categoria}
        initialDesde={desde}
        initialHasta={hasta}
        filas={filas}
      />
    </div>
  );
}
