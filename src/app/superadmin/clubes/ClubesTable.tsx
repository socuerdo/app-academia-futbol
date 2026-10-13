"use client";

import Link from "next/link";
import { useState, useTransition, useMemo } from "react";
import { Pencil } from "lucide-react";
import type { ClubRow } from "./page";
import { toggleClubActivo, editarClub } from "./actions";

export function ClubesTable({ rows: initialRows }: { rows: ClubRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [pending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");

  // Edit modal state
  const [editingClub, setEditingClub] = useState<ClubRow | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editIniciales, setEditIniciales] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!busqueda.trim()) return rows;
    const q = busqueda.toLowerCase();
    return rows.filter((r) => r.nombre.toLowerCase().includes(q) || r.adminPrincipal.toLowerCase().includes(q));
  }, [rows, busqueda]);

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      setRows((prev) => prev.map((r) => r.id === id ? { ...r, activo: !current } : r));
      const result = await toggleClubActivo(id, !current);
      if (result.error) setRows((prev) => prev.map((r) => r.id === id ? { ...r, activo: current } : r));
    });
  }

  function openEdit(club: ClubRow) {
    setEditingClub(club);
    setEditNombre(club.nombre);
    setEditIniciales(club.nombre.slice(0, 3).toUpperCase());
    setEditError(null);
  }

  async function handleEditSave() {
    if (!editingClub) return;
    setEditSaving(true);
    setEditError(null);
    const result = await editarClub(editingClub.id, { nombre: editNombre, iniciales: editIniciales });
    setEditSaving(false);
    if (result.error) { setEditError(result.error); return; }
    setRows((prev) => prev.map((r) => r.id === editingClub.id ? { ...r, nombre: editNombre.trim() } : r));
    setEditingClub(null);
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar club o admin..."
        className="w-full max-w-xs min-h-[44px] px-3 py-2 border border-slate-300 rounded-lg text-base md:text-sm"
      />

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Celular: una tarjeta por club con sus datos y acciones */}
        <ul className="md:hidden divide-y divide-slate-100">
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-slate-500">No se encontraron clubes.</li>
          )}
          {filtered.map((r) => (
            <li key={r.id} className="space-y-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-slate-800">{r.nombre}</p>
                <span
                  className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {r.activo ? "Activo" : "Suspendido"}
                </span>
              </div>
              <p className="text-xs text-slate-600">Admin: {r.adminPrincipal}</p>
              <p className="text-xs text-slate-600">
                {r.jugadores} jugadores · {r.usuarios} usuarios · Registro {r.fechaRegistro}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/superadmin/clubes/${r.id}`}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Ver
                </Link>
                <Link
                  href={`/superadmin/usuarios?club=${r.id}`}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Usuarios
                </Link>
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                  Editar
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleToggle(r.id, r.activo)}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {r.activo ? "Suspender" : "Activar"}
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="hidden md:block overflow-x-auto">
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500 text-sm">
                    No se encontraron clubes.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{r.adminPrincipal}</td>
                  <td className="px-4 py-3 text-slate-600">{r.jugadores}</td>
                  <td className="px-4 py-3 text-slate-600">{r.usuarios}</td>
                  <td className="px-4 py-3 text-slate-600">{r.fechaRegistro}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.activo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {r.activo ? "Activo" : "Suspendido"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleToggle(r.id, r.activo)}
                        className="text-slate-600 hover:text-slate-900 disabled:opacity-50 text-sm"
                      >
                        {r.activo ? "Suspender" : "Activar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="p-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Editar club"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/superadmin/clubes/${r.id}`}
                        className="text-slate-600 hover:text-slate-900 font-medium text-sm"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/superadmin/usuarios?club=${r.id}`}
                        className="text-slate-600 hover:text-slate-900 text-sm"
                      >
                        Usuarios
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingClub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !editSaving && setEditingClub(null)}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Editar club</h2>
              <button type="button" onClick={() => setEditingClub(null)} className="p-1 rounded text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Iniciales *</label>
                <input
                  type="text"
                  value={editIniciales}
                  onChange={(e) => setEditIniciales(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase"
                />
              </div>
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditingClub(null)} disabled={editSaving} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50">Cancelar</button>
                <button type="button" onClick={handleEditSave} disabled={editSaving || !editNombre.trim()} className="px-4 py-2 rounded-lg text-white font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50">
                  {editSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
