"use client";

import Link from "next/link";
import { useTransition } from "react";
import type { ClubRow } from "./page";
import { toggleClubActivo } from "./actions";

export function ClubesTable({ rows }: { rows: ClubRow[] }) {
  const [pending, startTransition] = useTransition();

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleClubActivo(id, !current);
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Admin principal</th>
              <th className="px-4 py-3">Jugadores</th>
              <th className="px-4 py-3">Usuarios</th>
              <th className="px-4 py-3">Fecha registro</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">{r.nombre}</td>
                <td className="px-4 py-3 text-slate-600">{r.adminPrincipal}</td>
                <td className="px-4 py-3 text-slate-600">{r.jugadores}</td>
                <td className="px-4 py-3 text-slate-600">{r.usuarios}</td>
                <td className="px-4 py-3 text-slate-600">{r.fechaRegistro}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {r.activo ? "Activo" : "Suspendido"}
                  </span>
                </td>
                <td className="px-4 py-3 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleToggle(r.id, r.activo)}
                    className="text-slate-600 hover:text-slate-900 disabled:opacity-50"
                    title={r.activo ? "Suspender club" : "Activar club"}
                  >
                    {r.activo ? "Suspender" : "Activar"}
                  </button>
                  <Link
                    href={`/superadmin/clubes/${r.id}`}
                    className="text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Ver detalles
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
