import { ReporteTodosView } from "@/components/dashboard/asistencias/ReporteTodosView";
import { PERMISO, tienePermiso } from "@/lib/permisos";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ sede?: string; categoria?: string; estado?: string }>;
}

export default async function ReporteTodosPage({ searchParams }: PageProps) {
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
  const sedeId = params.sede ?? "";
  const categoria = params.categoria ?? "";
  const estado = params.estado ?? "";

  let query = supabase
    .from("jugadores")
    .select("id, apellido, nombre, dni, categoria, activo, fecha_vencimiento_carnet, sede:sedes(id, nombre)")
    .eq("club_id", profile.club_id)
    .order("apellido");

  if (sedeId) query = query.eq("sede_id", sedeId);
  if (categoria) query = query.eq("categoria", categoria);
  if (estado === "activo") query = query.eq("activo", true);
  if (estado === "inactivo") query = query.eq("activo", false);

  const { data: jugadoresData } = await query;

  const jugadores = (jugadoresData ?? []).map((j: any) => ({
    ...j,
    sede: Array.isArray(j.sede) ? j.sede[0] : j.sede,
  }));

  const filas = jugadores.map((j: any) => ({
    jugador: `${j.apellido}, ${j.nombre}`,
    categoria: j.categoria,
    sede: j.sede?.nombre ?? "-",
    estado: j.activo ? "Activo" : "Inactivo",
    vencimiento_carnet: j.fecha_vencimiento_carnet,
  }));

  const { data: sedes } = await supabase
    .from("sedes")
    .select("id, nombre")
    .eq("club_id", profile.club_id)
    .eq("activo", true)
    .order("nombre");

  const { data: catData } = await supabase
    .from("jugadores")
    .select("categoria")
    .eq("club_id", profile.club_id);
  const categorias = [...new Set((catData ?? []).map((r: any) => r.categoria).filter(Boolean))].sort();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Reporte todos los jugadores</h1>
      <ReporteTodosView
        sedes={sedes ?? []}
        categorias={categorias}
        initialSedeId={sedeId}
        initialCategoria={categoria}
        initialEstado={estado}
        filas={filas}
      />
    </div>
  );
}
