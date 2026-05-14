import { JugadoresUnificadosView } from "@/components/dashboard/jugadores/JugadoresUnificadosView";
import { getJugadoresConCuotaImpaga } from "@/lib/cuotas/jugadores-con-deuda";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function JugadoresPage() {
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

  const [jugadoresResult, sedesResult, jugadoresConDeudaSet] = await Promise.all([
    supabase
      .from("jugadores")
      .select(
        "id, club_id, sede_id, dni, apellido, nombre, sexo, categoria, numero_camiseta, fecha_nacimiento, numero_carnet, fecha_vencimiento_carnet, foto_url, activo, sede:sedes(id, nombre)"
      )
      .eq("club_id", profile.club_id)
      .order("apellido"),
    supabase
      .from("sedes")
      .select("id, nombre")
      .eq("club_id", profile.club_id)
      .eq("activo", true)
      .order("nombre"),
    getJugadoresConCuotaImpaga(supabase, profile.club_id),
  ]);

  const jugadores = (jugadoresResult.data ?? []).map((j) => ({
    ...j,
    sede: Array.isArray(j.sede) ? j.sede[0] : j.sede,
  }));

  const sedes = sedesResult.data ?? [];
  const sedeIdPorNombre: Record<string, string> = {};
  sedes.forEach((s) => {
    sedeIdPorNombre[s.nombre] = s.id;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Jugadores</h1>
      <JugadoresUnificadosView
        clubId={profile.club_id}
        initialJugadores={jugadores}
        sedes={sedes}
        rol={profile.rol}
        permisos={profile.permisos ?? []}
        jugadoresConDeuda={Array.from(jugadoresConDeudaSet)}
        sedeIdPorNombre={sedeIdPorNombre}
      />
    </div>
  );
}
