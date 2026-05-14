import { HistorialView } from "@/components/dashboard/historial/HistorialView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{
    usuario?: string;
    accion?: string;
    entidad?: string;
    desde?: string;
    hasta?: string;
    page?: string;
  }>;
}

export default async function HistorialPage({ searchParams }: PageProps) {
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
  if (profile.rol !== "admin" && profile.rol !== "superadmin") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const PAGE_SIZE = 50;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (currentPage - 1) * PAGE_SIZE;

  let query = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .eq("club_id", profile.club_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (params.usuario) query = query.eq("usuario_id", params.usuario);
  if (params.accion) query = query.eq("accion", params.accion);
  if (params.entidad) query = query.eq("entidad", params.entidad);
  if (params.desde) query = query.gte("created_at", params.desde);
  if (params.hasta) query = query.lte("created_at", params.hasta + "T23:59:59");

  const { data: registros, count } = await query;

  // Usuarios únicos para el filtro
  const { data: usuariosData } = await supabase
    .from("audit_log")
    .select("usuario_id, usuario_nombre")
    .eq("club_id", profile.club_id)
    .not("usuario_id", "is", null);

  const usuariosMap = new Map<string, string>();
  (usuariosData ?? []).forEach((r) => {
    if (r.usuario_id && r.usuario_nombre) {
      usuariosMap.set(r.usuario_id, r.usuario_nombre);
    }
  });
  const usuarios = Array.from(usuariosMap.entries()).map(([id, nombre]) => ({ id, nombre }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Historial de actividad</h1>
      <HistorialView
        registros={(registros ?? []) as any[]}
        total={count ?? 0}
        pageSize={PAGE_SIZE}
        currentPage={currentPage}
        usuarios={usuarios}
        filtros={{
          usuario: params.usuario ?? "",
          accion: params.accion ?? "",
          entidad: params.entidad ?? "",
          desde: params.desde ?? "",
          hasta: params.hasta ?? "",
        }}
      />
    </div>
  );
}
