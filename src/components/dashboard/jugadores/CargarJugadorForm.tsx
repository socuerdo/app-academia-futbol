"use client";

import { Toast } from "@/components/ui/Toast";
import type { Sede } from "@/types/database";
import { useCategorias } from "@/hooks/useCategorias";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearJugador } from "@/app/dashboard/jugadores/actions";

interface CargarJugadorFormProps {
  clubId: string;
  sedes: Pick<Sede, "id" | "nombre">[];
}

export function CargarJugadorForm({ clubId, sedes }: CargarJugadorFormProps) {
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
    setToast(true);
    form.reset();
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {error && (
          <div
            className="p-3 rounded-lg text-sm"
            style={{ backgroundColor: "#fde8e8", color: "#c0392b" }}
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Datos personales</h2>
            <div>
              <label htmlFor="dni" className="block text-sm font-medium text-slate-700 mb-1">
                DNI *
              </label>
              <input
                id="dni"
                name="dni"
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
                style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
              />
            </div>
            <div>
              <label htmlFor="apellido" className="block text-sm font-medium text-slate-700 mb-1">
                Apellido *
              </label>
              <input
                id="apellido"
                name="apellido"
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">
                Nombre *
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label htmlFor="sexo" className="block text-sm font-medium text-slate-700 mb-1">
                Sexo *
              </label>
              <select
                id="sexo"
                name="sexo"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
              >
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label htmlFor="foto" className="block text-sm font-medium text-slate-700 mb-1">
                Foto de perfil
              </label>
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

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Club y categoría</h2>
            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-slate-700 mb-1">
                Categoría *
              </label>
              <select
                id="categoria"
                name="categoria"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
              >
                <option value="">Seleccionar</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {isLoading && (
                <p className="text-xs text-slate-400 mt-1">Cargando categorías...</p>
              )}
            </div>
            <div>
              <label htmlFor="sede_id" className="block text-sm font-medium text-slate-700 mb-1">
                Sede *
              </label>
              <select
                id="sede_id"
                name="sede_id"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
              >
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
            <div>
              <label htmlFor="numero_camiseta" className="block text-sm font-medium text-slate-700 mb-1">
                Nº camiseta
              </label>
              <input
                id="numero_camiseta"
                name="numero_camiseta"
                type="number"
                min={1}
                max={99}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label htmlFor="fecha_nacimiento" className="block text-sm font-medium text-slate-700 mb-1">
                Fecha de nacimiento
              </label>
              <input
                id="fecha_nacimiento"
                name="fecha_nacimiento"
                type="date"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label htmlFor="numero_carnet" className="block text-sm font-medium text-slate-700 mb-1">
                Nº carnet
              </label>
              <input
                id="numero_carnet"
                name="numero_carnet"
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label htmlFor="fecha_vencimiento_carnet" className="block text-sm font-medium text-slate-700 mb-1">
                Vencimiento carnet
              </label>
              <input
                id="fecha_vencimiento_carnet"
                name="fecha_vencimiento_carnet"
                type="date"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || sedes.length === 0}
          className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {loading ? "Guardando..." : "Guardar jugador"}
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
