import { CargarAsistenciasView } from "@/components/dashboard/asistencias/CargarAsistenciasView";
import { getJugadoresConCuotaImpaga } from "@/lib/cuotas/jugadores-con-deuda";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ sede?: string; categoria?: string; fecha?: string }>;
}

export default async function CargarAsistenciasPage({ searchParams }: PageProps) {
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

  const { data: sedes } = await supabase
    .from("sedes")
    .select("id, nombre")
    .eq("club_id", profile.club_id)
    .eq("activo", true)
    .order("nombre");

  const params = await searchParams;
  const sedeId = params.sede ?? "";
  const categoria = params.categoria ?? "";
  const fecha = params.fecha ?? new Date().toISOString().slice(0, 10);

  let jugadores: Array<{
    id: string;
    apellido: string;
    nombre: string;
    dni: string;
    categoria: string;
    sede_id: string;
    foto_url: string | null;
  }> = [];
  let asistenciasExistentes: Record<string, { presente: boolean; observacion: string | null }> = {};

  if (sedeId && categoria && fecha) {
    const { data: jugadoresData } = await supabase
      .from("jugadores")
      .select("id, apellido, nombre, dni, categoria, sede_id, foto_url")
      .eq("club_id", profile.club_id)
      .eq("sede_id", sedeId)
      .eq("categoria", categoria)
      .eq("activo", true)
      .order("apellido");
    jugadores = jugadoresData ?? [];

    if (jugadores.length > 0) {
      const ids = jugadores.map((j) => j.id);
      const { data: asis } = await supabase
        .from("asistencias")
        .select("jugador_id, presente, observacion")
        .eq("fecha", fecha)
        .in("jugador_id", ids);
      (asis ?? []).forEach((a) => {
        asistenciasExistentes[a.jugador_id] = {
          presente: a.presente,
          observacion: a.observacion,
        };
      });
    }
  }

  const categorias = await supabase
    .from("jugadores")
    .select("categoria")
    .eq("club_id", profile.club_id)
    .eq("activo", true)
    .then(({ data }) => [...new Set((data ?? []).map((r) => r.categoria).filter(Boolean))].sort());

  const deudaSet = await getJugadoresConCuotaImpaga(supabase, profile.club_id);

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Cargar asistencias</h1>
      <CargarAsistenciasView
        clubId={profile.club_id}
        sedes={sedes ?? []}
        categorias={categorias}
        initialSedeId={sedeId}
        initialCategoria={categoria}
        initialFecha={fecha}
        initialJugadores={jugadores}
        asistenciasExistentes={asistenciasExistentes}
        jugadoresConDeuda={Array.from(deudaSet)}
      />
    </div>
  );
}
