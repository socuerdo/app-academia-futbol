import { BuscarJugadorView } from "@/components/dashboard/jugadores/BuscarJugadorView";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ dni?: string; q?: string }>;
}

export default async function BuscarJugadorPage({ searchParams }: PageProps) {
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

  const params = await searchParams;
  const dniParam = params.dni ?? params.q ?? "";

  let inicial: Awaited<ReturnType<typeof fetchJugadores>> = { jugadores: [], sedes: [] };
  if (dniParam.trim()) {
    inicial = await fetchJugadores(profile.club_id, dniParam.trim(), supabase);
  } else {
    const { data: sedes } = await supabase
      .from("sedes")
      .select("id, nombre")
      .eq("club_id", profile.club_id)
      .eq("activo", true)
      .order("nombre");
    inicial = { jugadores: [], sedes: sedes ?? [] };
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Buscar / Editar jugador</h1>
      <BuscarJugadorView
        clubId={profile.club_id}
        initialJugadores={inicial.jugadores}
        initialQuery={dniParam}
        sedes={inicial.sedes}
        rol={profile.rol}
      />
    </div>
  );
}

async function fetchJugadores(
  clubId: string,
  query: string,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const q = `%${query}%`;
  const { data: jugadores } = await supabase
    .from("jugadores")
    .select("*, sede:sedes(nombre)")
    .eq("club_id", clubId)
    .or(`dni.ilike.${q},apellido.ilike.${q},nombre.ilike.${q}`)
    .order("apellido")
    .limit(50);

  const { data: sedes } = await supabase
    .from("sedes")
    .select("id, nombre")
    .eq("club_id", clubId)
    .eq("activo", true)
    .order("nombre");

  return {
    jugadores: (jugadores ?? []).map((j) => ({
      ...j,
      sede: Array.isArray(j.sede) ? j.sede[0] : j.sede,
    })),
    sedes: sedes ?? [],
  };
}
