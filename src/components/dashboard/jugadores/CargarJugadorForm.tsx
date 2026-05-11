"use client";

import { Toast } from "@/components/ui/Toast";
import type { Sede } from "@/types/database";
import { useCategorias } from "@/hooks/useCategorias";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearJugador } from "@/app/dashboard/jugadores/actions";
import { Loader2, Save, Upload } from "lucide-react";

interface CargarJugadorFormProps {
  clubId: string;
  sedes: Pick<Sede, "id" | "nombre">[];
  onSuccess?: () => void;
}

export function CargarJugadorForm({ clubId, sedes, onSuccess }: CargarJugadorFormProps) {
  const router = useRouter();
  const { categorias, isLoading } = useCategorias(clubId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await crearJugador(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (onSuccess) {
      onSuccess();
      return;
    }
    setToast(true);
    form.reset();
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{ backgroundColor: "#fde8e8", color: "#c0392b" }}
          >
            {error}
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Datos personales</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label htmlFor="dni" className="block text-sm font-medium text-slate-700 mb-1">DNI *</label>
              <input id="dni" name="dni" type="text" required className="w-full px-0 py-1 border-0 bg-transparent focus:ring-0 outline-none" />
            </div>
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label htmlFor="apellido" className="block text-sm font-medium text-slate-700 mb-1">Apellido *</label>
              <input id="apellido" name="apellido" type="text" required className="w-full px-0 py-1 border-0 bg-transparent focus:ring-0 outline-none" />
            </div>
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input id="nombre" name="nombre" type="text" required className="w-full px-0 py-1 border-0 bg-transparent focus:ring-0 outline-none" />
            </div>
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label htmlFor="sexo" className="block text-sm font-medium text-slate-700 mb-1">Sexo *</label>
              <select id="sexo" name="sexo" required className="w-full px-0 py-1 border-0 bg-transparent focus:ring-0 outline-none">
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label htmlFor="foto" className="block text-sm font-medium text-slate-700 mb-1">Foto de perfil</label>
              <input
                id="foto"
                name="foto"
                type="file"
                accept="image/*"
                className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:text-white file:cursor-pointer"
                style={{ ["file:backgroundColor" as string]: "var(--color-primary)" }}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Club y categoría</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label htmlFor="categoria" className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
              <select id="categoria" name="categoria" required className="w-full px-0 py-1 border-0 bg-transparent focus:ring-0 outline-none">
                <option value="">Seleccionar</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {isLoading && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  Cargando categorías...
                </p>
              )}
            </div>
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label htmlFor="sede_id" className="block text-sm font-medium text-slate-700 mb-1">Sede *</label>
              <select id="sede_id" name="sede_id" required className="w-full px-0 py-1 border-0 bg-transparent focus:ring-0 outline-none">
                <option value="">Seleccionar</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              {sedes.length === 0 && (
                <p className="text-amber-600 text-xs mt-1">Cargá sedes en Administración → Cargar sedes.</p>
              )}
            </div>
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label htmlFor="numero_camiseta" className="block text-sm font-medium text-slate-700 mb-1">Nº camiseta</label>
              <input id="numero_camiseta" name="numero_camiseta" type="number" min={1} max={99} className="w-full px-0 py-1 border-0 bg-transparent focus:ring-0 outline-none" />
            </div>
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-slate-700 mb-1">Fecha de nacimiento</label>
              <input id="fecha_nacimiento" name="fecha_nacimiento" type="date" className="w-full px-0 py-1 border-0 bg-transparent focus:ring-0 outline-none" />
            </div>
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label htmlFor="numero_carnet" className="block text-sm font-medium text-slate-700 mb-1">Nº carnet</label>
              <input id="numero_carnet" name="numero_carnet" type="text" className="w-full px-0 py-1 border-0 bg-transparent focus:ring-0 outline-none" />
            </div>
            <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 focus-within:ring-2 focus-within:ring-offset-1" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
              <label htmlFor="fecha_vencimiento_carnet" className="block text-sm font-medium text-slate-700 mb-1">Vencimiento carnet</label>
              <input id="fecha_vencimiento_carnet" name="fecha_vencimiento_carnet" type="date" className="w-full px-0 py-1 border-0 bg-transparent focus:ring-0 outline-none" />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={loading || sedes.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 hover:brightness-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          style={{ backgroundColor: "var(--color-primary)" }}
          aria-label={loading ? "Guardando jugador" : "Guardar jugador"}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Guardando...
            </>
          ) : (
            <>
              {sedes.length > 0 ? <Save className="h-4 w-4" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
              Guardar jugador
            </>
          )}
        </button>
      </form>

      <Toast
        message="Jugador cargado correctamente."
        visible={toast}
        onClose={() => setToast(false)}
      />
    </>
  );
}
