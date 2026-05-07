import { DashboardPrincipal } from "@/components/dashboard/DashboardPrincipal";
import { getJugadoresConCuotaImpaga } from "@/lib/cuotas/jugadores-con-deuda";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, club_id, permisos")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) redirect("/login");

  const clubId = profile.club_id;
  const hoy = new Date().toISOString().slice(0, 10);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  const finMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0);
  const diasEnMes = finMes.getDate();
  const hoyDia = new Date().getDate();

  const [{ count: jugadoresActivos }, { count: presentesHoy }, { data: asistenciasMes }] =
    await Promise.all([
      supabase
        .from("jugadores")
        .select("id", { count: "exact", head: true })
        .eq("club_id", clubId)
        .eq("activo", true),
      supabase
        .from("asistencias")
        .select("id", { count: "exact", head: true })
        .eq("club_id", clubId)
        .eq("fecha", hoy)
        .eq("presente", true),
      supabase
        .from("asistencias")
        .select("jugador_id")
        .eq("club_id", clubId)
        .eq("presente", true)
        .gte("fecha", inicioMes.toISOString().slice(0, 10))
        .lte("fecha", hoy),
    ]);

  const totalPresentesMes = asistenciasMes?.length ?? 0;
  const jugadoresNum = jugadoresActivos ?? 0;
  const pctAsistenciaMes =
    jugadoresNum > 0 && hoyDia > 0
      ? Math.round((totalPresentesMes / (jugadoresNum * hoyDia)) * 100)
      : 0;

  const { data: jugadoresConAsistencia } = await supabase
    .from("jugadores")
    .select("id, nombre, apellido, categoria, dni")
    .eq("club_id", clubId)
    .eq("activo", true);

  const jugadoresConBajaAsistencia: Array<{
    id: string;
    nombre: string;
    apellido: string;
    categoria: string;
    dni: string;
    pct: number;
  }> = [];
  if (jugadoresConAsistencia && asistenciasMes) {
    const presentesPorJugador = asistenciasMes.reduce<Record<string, number>>((acc, a) => {
      acc[a.jugador_id] = (acc[a.jugador_id] || 0) + 1;
      return acc;
    }, {});
    for (const j of jugadoresConAsistencia) {
      const presentes = presentesPorJugador[j.id] ?? 0;
      const pct = hoyDia > 0 ? Math.round((presentes / hoyDia) * 100) : 0;
      if (pct < 70) jugadoresConBajaAsistencia.push({ ...j, pct });
    }
    jugadoresConBajaAsistencia.sort((a, b) => a.pct - b.pct);
  }

  const cuotasImpagasSet = await getJugadoresConCuotaImpaga(supabase, clubId);
  const stats = {
    jugadoresActivos: jugadoresNum,
    presentesHoy: presentesHoy ?? 0,
    pctAsistenciaMes: Math.min(100, pctAsistenciaMes),
    alertasBajaAsistencia: jugadoresConBajaAsistencia.length,
    cuotasImpagas: cuotasImpagasSet.size,
  };

  return (
    <DashboardPrincipal
      stats={stats}
      jugadoresBajaAsistencia={jugadoresConBajaAsistencia}
      rol={profile.rol as "admin" | "profesor"}
    />
  );
}
