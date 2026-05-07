import { ReporteJugadorView } from "@/components/dashboard/asistencias/ReporteJugadorView";
import { PERMISO, tienePermiso } from "@/lib/permisos";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ReporteJugadorPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id, rol, permisos")
    .eq("id", user.id)
    .single();
  if (!profile?.club_id) redirect("/login");

  const isAdmin = profile.rol === "admin" || profile.rol === "superadmin";
  if (!isAdmin && !tienePermiso(profile.permisos, PERMISO.ASISTENCIAS_DESCARGAR)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = (params.q ?? "").trim();

  let jugador: {
    id: string;
    apellido: string;
    nombre: string;
    dni: string;
    categoria: string;
    foto_url: string | null;
    sede: { nombre: string } | null;
  } | null = null;
  let detalle: Array<{ fecha: string; presente: boolean; observacion: string | null }> = [];
  let presencias = 0;
  let ausencias = 0;

  if (query) {
    const term = `%${query}%`;
    const { data: list } = await supabase
      .from("jugadores")
      .select("id, apellido, nombre, dni, categoria, foto_url, sede:sedes(nombre)")
      .eq("club_id", profile.club_id)
      .eq("activo", true)
      .or(`dni.ilike.${term},apellido.ilike.${term},nombre.ilike.${term}`)
      .limit(1);
    const first = list?.[0];
    if (first) {
      jugador = {
        ...first,
        sede: Array.isArray(first.sede) ? first.sede[0] : first.sede,
      };
      const hace90 = new Date();
      hace90.setDate(hace90.getDate() - 90);
      const desde = hace90.toISOString().slice(0, 10);
      const hasta = new Date().toISOString().slice(0, 10);
      const { data: asis } = await supabase
        .from("asistencias")
        .select("fecha, presente, observacion")
        .eq("jugador_id", jugador.id)
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .order("fecha", { ascending: false });
      detalle = (asis ?? []).map((a) => ({
        fecha: a.fecha,
        presente: a.presente,
        observacion: a.observacion,
      }));
      presencias = detalle.filter((d) => d.presente).length;
      ausencias = detalle.filter((d) => !d.presente).length;
    }
  }

  const porcentaje = detalle.length > 0 ? Math.round((presencias / detalle.length) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Reporte por jugador</h1>
      <ReporteJugadorView
        jugador={jugador}
        presencias={presencias}
        ausencias={ausencias}
        porcentaje={porcentaje}
        detalle={detalle}
      />
    </div>
  );
}
