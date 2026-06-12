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

const inputCls = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

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
        {sedes.length === 0 && (
          <div className="p-3 rounded-lg text-sm bg-amber-50 border border-amber-200 text-amber-800">
            No hay sedes cargadas. Antes de agregar jugadores, creá al menos una sede en{" "}
            <a href="/dashboard/administracion/sedes" className="font-semibold underline">Administración → Sedes</a>.
          </div>
        )}
        {error && (
          <div className="p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Datos personales</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dni" className={labelCls}>DNI *</label>
              <input id="dni" name="dni" type="text" required className={inputCls} style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }} />
            </div>
            <div>
              <label htmlFor="apellido" className={labelCls}>Apellido *</label>
              <input id="apellido" name="apellido" type="text" required className={inputCls} style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }} />
            </div>
            <div>
              <label htmlFor="nombre" className={labelCls}>Nombre *</label>
              <input id="nombre" name="nombre" type="text" required className={inputCls} style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }} />
            </div>
            <div>
              <label htmlFor="sexo" className={labelCls}>Sexo *</label>
              <select id="sexo" name="sexo" required className={inputCls} style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label htmlFor="telefono" className={labelCls}>Teléfono de contacto</label>
              <input id="telefono" name="telefono" type="tel" className={inputCls} placeholder="Ej: 011 15-1234-5678" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }} />
            </div>
            <div>
              <label htmlFor="telefono_emergencia" className={labelCls}>Teléfono de emergencia</label>
              <input id="telefono_emergencia" name="telefono_emergencia" type="tel" className={inputCls} placeholder="Contacto de emergencia" style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="foto" className={labelCls}>Foto de perfil</label>
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
            <div>
              <label htmlFor="categoria" className={labelCls}>Categoría *</label>
              <select id="categoria" name="categoria" required className={inputCls} style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
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
            <div>
              <label htmlFor="sede_id" className={labelCls}>Sede *</label>
              <select id="sede_id" name="sede_id" required className={inputCls} style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}>
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
              <label htmlFor="numero_camiseta" className={labelCls}>Nº camiseta</label>
              <input id="numero_camiseta" name="numero_camiseta" type="number" min={1} max={99} className={inputCls} style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }} />
            </div>
            <div>
              <label htmlFor="fecha_nacimiento" className={labelCls}>Fecha de nacimiento</label>
              <input id="fecha_nacimiento" name="fecha_nacimiento" type="date" className={inputCls} style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }} />
            </div>
            <div>
              <label htmlFor="fecha_inscripcion" className={labelCls}>Fecha de inscripción *</label>
              <input id="fecha_inscripcion" name="fecha_inscripcion" type="date" required className={inputCls} defaultValue={new Date().toISOString().slice(0, 10)} style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }} />
            </div>
            <div>
              <label htmlFor="numero_carnet" className={labelCls}>Nº carnet</label>
              <input id="numero_carnet" name="numero_carnet" type="text" className={inputCls} style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }} />
            </div>
            <div>
              <label htmlFor="fecha_vencimiento_carnet" className={labelCls}>Vencimiento carnet</label>
              <input id="fecha_vencimiento_carnet" name="fecha_vencimiento_carnet" type="date" className={inputCls} style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }} />
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
