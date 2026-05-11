import { CargarAsistenciasView } from "@/components/dashboard/asistencias/CargarAsistenciasView";
import { ReporteJugadorView } from "@/components/dashboard/asistencias/ReporteJugadorView";
import { ReportesAsistenciasView } from "@/components/dashboard/asistencias/ReportesAsistenciasView";
import { ReporteTodosView } from "@/components/dashboard/asistencias/ReporteTodosView";
import { getJugadoresConCuotaImpaga } from "@/lib/cuotas/jugadores-con-deuda";
import { PERMISO, tienePermiso } from "@/lib/permisos";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    sede?: string;
    categoria?: string;
    fecha?: string;
    desde?: string;
    hasta?: string;
    q?: string;
    estado?: string;
  }>;
}

export default async function AsistenciasPage({ searchParams }: PageProps) {
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
  const isSecretaria = profile.rol === "secretaria";
  const canDescargar =
    isAdmin ||
    isSecretaria ||
    tienePermiso(profile.permisos ?? [], PERMISO.ASISTENCIAS_DESCARGAR);

  const params = await searchParams;
  const tab = params.tab ?? "cargar";

  if (!canDescargar && tab !== "cargar") {
    redirect("/dashboard/asistencias");
  }

  // Datos compartidos entre tabs
  const [sedesResult, catResult] = await Promise.all([
    supabase
      .from("sedes")
      .select("id, nombre")
      .eq("club_id", profile.club_id)
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("jugadores")
      .select("categoria")
      .eq("club_id", profile.club_id)
      .eq("activo", true),
  ]);
  const sedes = sedesResult.data ?? [];
  const categorias = [
    ...new Set((catResult.data ?? []).map((r) => r.categoria).filter(Boolean)),
  ].sort();

  const tabs = [
    { id: "cargar", label: "Cargar asistencias" },
    ...(canDescargar
      ? [
          { id: "reporte", label: "Reporte general" },
          { id: "jugador", label: "Por jugador" },
          { id: "todos", label: "Listado" },
        ]
      : []),
  ];

  let content: React.ReactNode;

  // ── Tab: cargar ──────────────────────────────────────────────────────────
  if (tab === "cargar") {
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
    let asistenciasExistentes: Record<
      string,
      { presente: boolean; observacion: string | null }
    > = {};

    if (sedeId && categoria && fecha) {
      const { data: jData } = await supabase
        .from("jugadores")
        .select("id, apellido, nombre, dni, categoria, sede_id, foto_url")
        .eq("club_id", profile.club_id)
        .eq("sede_id", sedeId)
        .eq("categoria", categoria)
        .eq("activo", true)
        .order("apellido");
      jugadores = jData ?? [];

      if (jugadores.length > 0) {
        const { data: asis } = await supabase
          .from("asistencias")
          .select("jugador_id, presente, observacion")
          .eq("fecha", fecha)
          .in(
            "jugador_id",
            jugadores.map((j) => j.id)
          );
        (asis ?? []).forEach((a) => {
          asistenciasExistentes[a.jugador_id] = {
            presente: a.presente,
            observacion: a.observacion,
          };
        });
      }
    }

    const deudaSet = await getJugadoresConCuotaImpaga(supabase, profile.club_id);

    content = (
      <CargarAsistenciasView
        clubId={profile.club_id}
        sedes={sedes}
        categorias={categorias}
        initialSedeId={sedeId}
        initialCategoria={categoria}
        initialFecha={fecha}
        initialJugadores={jugadores}
        asistenciasExistentes={asistenciasExistentes}
        jugadoresConDeuda={Array.from(deudaSet)}
      />
    );

  // ── Tab: reporte ─────────────────────────────────────────────────────────
  } else if (tab === "reporte") {
    const sedeId = params.sede ?? "";
    const categoria = params.categoria ?? "";
    const hoy = new Date();
    const hace30 = new Date(hoy);
    hace30.setDate(hace30.getDate() - 30);
    const desde = params.desde ?? hace30.toISOString().slice(0, 10);
    const hasta = params.hasta ?? hoy.toISOString().slice(0, 10);

    const { data: jugadoresData } = await supabase
      .from("jugadores")
      .select("id, apellido, nombre, sexo, categoria, fecha_inscripcion, sede:sedes(id, nombre)")
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
    let filas: Array<{
      jugador: string;
      categoria: string;
      sede: string;
      sexo: string;
      presencias: number;
      ausencias: number;
      total: number;
      porcentaje: number;
    }> = [];

    if (ids.length > 0 && desde && hasta) {
      const { data: asis } = await supabase
        .from("asistencias")
        .select("jugador_id, fecha, presente")
        .in("jugador_id", ids)
        .gte("fecha", desde)
        .lte("fecha", hasta);

      const inscripcionPorJugador: Record<string, string | null> = {};
      jugadores.forEach((j: any) => { inscripcionPorJugador[j.id] = j.fecha_inscripcion ?? null; });

      const porJugador: Record<string, { p: number; a: number }> = {};
      ids.forEach((id) => (porJugador[id] = { p: 0, a: 0 }));
      (asis ?? []).forEach((a) => {
        const fi = inscripcionPorJugador[a.jugador_id];
        if (fi && a.fecha < fi) return;
        if (a.presente) porJugador[a.jugador_id].p++;
        else porJugador[a.jugador_id].a++;
      });

      filas = jugadores.map((j: any) => {
        const { p, a } = porJugador[j.id];
        const total = p + a;
        return {
          jugador: `${j.apellido}, ${j.nombre}`,
          categoria: j.categoria,
          sede: j.sede?.nombre ?? "-",
          sexo: j.sexo ?? "",
          presencias: p,
          ausencias: a,
          total,
          porcentaje: total > 0 ? Math.round((p / total) * 100) : 0,
        };
      });
      filas.sort((a, b) => b.porcentaje - a.porcentaje);
    }

    content = (
      <ReportesAsistenciasView
        sedes={sedes}
        categorias={categorias}
        initialSedeId={sedeId}
        initialCategoria={categoria}
        initialDesde={desde}
        initialHasta={hasta}
        filas={filas}
      />
    );

  // ── Tab: jugador ─────────────────────────────────────────────────────────
  } else if (tab === "jugador") {
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
    let detalle: Array<{ fecha: string; presente: boolean; observacion: string | null }> =
      [];
    let presencias = 0;
    let ausencias = 0;

    if (query) {
      const term = `%${query}%`;
      const { data: list } = await supabase
        .from("jugadores")
        .select("id, apellido, nombre, dni, categoria, foto_url, fecha_inscripcion, sede:sedes(nombre)")
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
        const fechaDesde = first.fecha_inscripcion && first.fecha_inscripcion > hace90.toISOString().slice(0, 10)
          ? first.fecha_inscripcion
          : hace90.toISOString().slice(0, 10);
        const { data: asis } = await supabase
          .from("asistencias")
          .select("fecha, presente, observacion")
          .eq("jugador_id", jugador.id)
          .gte("fecha", fechaDesde)
          .lte("fecha", new Date().toISOString().slice(0, 10))
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

    const porcentaje =
      detalle.length > 0 ? Math.round((presencias / detalle.length) * 100) : 0;

    content = (
      <ReporteJugadorView
        jugador={jugador}
        presencias={presencias}
        ausencias={ausencias}
        porcentaje={porcentaje}
        detalle={detalle}
      />
    );

  // ── Tab: todos ───────────────────────────────────────────────────────────
  } else {
    const sedeId = params.sede ?? "";
    const categoria = params.categoria ?? "";
    const estado = params.estado ?? "";

    let query = supabase
      .from("jugadores")
      .select(
        "id, apellido, nombre, sexo, dni, categoria, activo, fecha_vencimiento_carnet, sede:sedes(id, nombre)"
      )
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
      sexo: j.sexo ?? "",
      estado: j.activo ? "Activo" : "Inactivo",
      vencimiento_carnet: j.fecha_vencimiento_carnet,
    }));

    content = (
      <ReporteTodosView
        sedes={sedes}
        categorias={categorias}
        initialSedeId={sedeId}
        initialCategoria={categoria}
        initialEstado={estado}
        filas={filas}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Asistencias</h1>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-slate-200 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/asistencias?tab=${t.id}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.id
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {content}
    </div>
  );
}
