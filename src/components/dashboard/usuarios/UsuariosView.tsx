"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ProfileRow = {
  id: string;
  rol: string;
  nombre_completo: string;
  categorias_asignadas: string[];
  permisos: string[];
  activo: boolean;
  email: string;
};

interface UsuariosViewProps {
  profiles: ProfileRow[];
  clubId: string;
  categorias: string[];
  permisosOpciones: string[];
}

export function UsuariosView({
  profiles: initialProfiles,
  clubId,
  categorias,
  permisosOpciones,
}: UsuariosViewProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => setProfiles(initialProfiles), [initialProfiles]);

  async function handleToggleActivo(p: ProfileRow) {
    setUpdatingId(p.id);
    setError(null);
    const next = !p.activo;
    setProfiles((prev) => prev.map((x) => (x.id === p.id ? { ...x, activo: next } : x)));
    const res = await fetch(`/api/users/update/${encodeURIComponent(p.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: next }),
    });
    setUpdatingId(null);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al actualizar");
      setProfiles((prev) => prev.map((x) => (x.id === p.id ? { ...x, activo: !next } : x)));
      return;
    }
    router.refresh();
  }

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const nombre_completo = formData.get("nombre_completo") as string;
    const categoriasAsignadas = form.getAll("categoria") as string[];
    const permisos = form.getAll("permiso") as string[];

    const res = await fetch("/api/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password: password || undefined,
        nombre_completo: nombre_completo.trim(),
        categorias_asignadas: categoriasAsignadas,
        permisos,
        club_id: clubId,
      }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear usuario");
      return;
    }
    setShowModal(false);
    form.reset();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{error}</div>
      )}

      {clubId && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Nuevo usuario
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="text-left py-2 px-4">Usuario</th>
              <th className="text-left py-2 px-4">Rol</th>
              <th className="text-left py-2 px-4">Categorías</th>
              <th className="text-left py-2 px-4">Permisos</th>
              <th className="text-center py-2 px-4 w-24">Activo</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="py-2 px-4">
                  <p className="font-medium text-slate-800">{p.nombre_completo || p.email}</p>
                  <p className="text-xs text-slate-500">{p.email || "—"}</p>
                </td>
                <td className="py-2 px-4 capitalize">{p.rol}</td>
                <td className="py-2 px-4 text-xs">
                  {(p.categorias_asignadas ?? []).length ? (p.categorias_asignadas ?? []).join(", ") : "—"}
                </td>
                <td className="py-2 px-4 text-xs">
                  {(p.permisos ?? []).length ? (p.permisos ?? []).join(", ") : "—"}
                </td>
                <td className="py-2 px-4 text-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.activo}
                    disabled={updatingId === p.id}
                    onClick={() => handleToggleActivo(p)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                      p.activo ? "" : ""
                    }`}
                    style={{
                      backgroundColor: p.activo ? "var(--color-primary)" : "#cbd5e1",
                    }}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition translate-x-1 ${
                        p.activo ? "translate-x-5" : "translate-x-1"
                      }`}
                      style={{ marginTop: 2 }}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !saving && setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Nuevo usuario (profesor)</h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 rounded text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input name="email" type="email" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="profesor@club.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña *</label>
                <input name="password" type="password" required minLength={6} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
                <input name="nombre_completo" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categorías asignadas</label>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((c) => (
                    <label key={c} className="inline-flex items-center gap-1.5 text-sm">
                      <input type="checkbox" name="categoria" value={c} className="rounded border-slate-300" />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Permisos</label>
                <div className="flex flex-wrap gap-2">
                  {permisosOpciones.map((perm) => (
                    <label key={perm} className="inline-flex items-center gap-1.5 text-sm">
                      <input type="checkbox" name="permiso" value={perm} className="rounded border-slate-300" />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ backgroundColor: "var(--color-primary)" }}>
                  {saving ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
