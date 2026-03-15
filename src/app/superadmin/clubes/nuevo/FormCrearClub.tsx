"use client";

import { useActionState } from "react";
import { crearClubManual } from "./actions";

const initialState = { error: null as string | null };

export function FormCrearClub() {
  const [state, formAction, isPending] = useActionState<{ error: string | null }, FormData>(
    async (_, formData) => {
      const res = await crearClubManual({
        nombre: (formData.get("nombre") as string) ?? "",
        iniciales: (formData.get("iniciales") as string) ?? "",
        adminEmail: (formData.get("adminEmail") as string) ?? "",
        adminPassword: (formData.get("adminPassword") as string) ?? "",
        adminNombre: (formData.get("adminNombre") as string) ?? "",
      });
      return { error: res.error ?? null };
    },
    initialState
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1">
          Nombre del club *
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Ej. Club Deportivo Norte"
        />
      </div>

      <div>
        <label htmlFor="iniciales" className="block text-sm font-medium text-slate-700 mb-1">
          Iniciales del club *
        </label>
        <input
          id="iniciales"
          name="iniciales"
          type="text"
          required
          maxLength={10}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 uppercase focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Ej. CDN"
        />
      </div>

      <hr className="border-slate-200" />
      <p className="text-sm font-medium text-slate-700">Administrador del club</p>

      <div>
        <label htmlFor="adminEmail" className="block text-sm font-medium text-slate-700 mb-1">
          Email del admin *
        </label>
        <input
          id="adminEmail"
          name="adminEmail"
          type="email"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="admin@club.com"
        />
      </div>

      <div>
        <label htmlFor="adminPassword" className="block text-sm font-medium text-slate-700 mb-1">
          Contraseña *
        </label>
        <input
          id="adminPassword"
          name="adminPassword"
          type="password"
          required
          minLength={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <div>
        <label htmlFor="adminNombre" className="block text-sm font-medium text-slate-700 mb-1">
          Nombre completo del admin
        </label>
        <input
          id="adminNombre"
          name="adminNombre"
          type="text"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Juan Pérez"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg text-white font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? "Creando…" : "Crear club y admin"}
        </button>
        <Link
          href="/superadmin/clubes"
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
