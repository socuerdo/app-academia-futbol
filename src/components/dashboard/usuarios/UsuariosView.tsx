"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { ImportarUsuariosView } from "./ImportarUsuariosView";

type ProfileRow = {
  id: string;
  rol: string;
  nombre_completo: string;
  categorias_asignadas: string[];
  permisos: string[];
  activo: boolean;
  email: string;
};

type PermisoOpcion = { value: string; label: string };

interface UsuariosViewProps {
  profiles: ProfileRow[];
  clubId: string;
  categorias: string[];
  permisosOpciones: PermisoOpcion[];
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
  const [confirmToggle, setConfirmToggle] = useState<ProfileRow | null>(null);
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement | null>(null);
  const [nuevoRol, setNuevoRol] = useState<"profesor" | "secretaria">("profesor");

  // Estado para el modal de edición
  const [editingProfile, setEditingProfile] = useState<ProfileRow | null>(null);
  const [editCategorias, setEditCategorias] = useState<string[]>([]);
  const [editPermisos, setEditPermisos] = useState<string[]>([]);
  const [editCatDropdownOpen, setEditCatDropdownOpen] = useState(false);
  const editCatDropdownRef = useRef<HTMLDivElement | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [showImportar, setShowImportar] = useState(false);

  useEffect(() => setProfiles(initialProfiles), [initialProfiles]);

  const permisoLabelByValue = useMemo(() => {
    const m = new Map<string, string>();
    permisosOpciones.forEach((p) => m.set(p.value, p.label));
    return m;
  }, [permisosOpciones]);

  useEffect(() => {
    if (!catDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [catDropdownOpen]);

  function toggleCategoria(c: string) {
    setSelectedCategorias((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function closeModal() {
    setShowModal(false);
    setSelectedCategorias([]);
    setCatDropdownOpen(false);
    setNuevoRol("profesor");
  }

  useEffect(() => {
    if (!editCatDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (editCatDropdownRef.current && !editCatDropdownRef.current.contains(e.target as Node)) {
        setEditCatDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editCatDropdownOpen]);

  function openEditModal(p: ProfileRow) {
    setEditingProfile(p);
    setEditCategorias(p.categorias_asignadas ?? []);
    setEditPermisos(p.permisos ?? []);
    setEditCatDropdownOpen(false);
    setError(null);
  }

  function closeEditModal() {
    setEditingProfile(null);
    setEditCategorias([]);
    setEditPermisos([]);
    setEditCatDropdownOpen(false);
  }

  function toggleEditCategoria(c: string) {
    setEditCategorias((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  function toggleEditPermiso(v: string) {
    setEditPermisos((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  async function handleEditSave() {
    if (!editingProfile) return;
    setEditSaving(true);
    setError(null);
    const res = await fetch(`/api/users/update/${encodeURIComponent(editingProfile.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categorias_asignadas: editCategorias, permisos: editPermisos }),
    });
    const data = await res.json().catch(() => ({}));
    setEditSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Error al actualizar");
      return;
    }
    setProfiles((prev) =>
      prev.map((x) =>
        x.id === editingProfile.id
          ? { ...x, categorias_asignadas: editCategorias, permisos: editPermisos }
          : x
      )
    );
    closeEditModal();
    router.refresh();
  }

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
    const email = (formData.get("email") as string | null) ?? "";
    const password = (formData.get("password") as string | null) ?? "";
    const nombre_completo = (formData.get("nombre_completo") as string | null) ?? "";
    const isSecretaria = nuevoRol === "secretaria";
    const categoriasAsignadas = isSecretaria ? [] : selectedCategorias;
    const permisos = isSecretaria ? [] : (formData.getAll("permiso") as string[]);

    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password || undefined,
          nombre_completo: nombre_completo.trim(),
          rol: nuevoRol,
          categorias_asignadas: categoriasAsignadas,
          permisos,
          club_id: clubId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Error ${res.status} al crear usuario`);
        return;
      }
      form.reset();
      closeModal();
      router.refresh();
    } catch (err) {
      console.error("Error creando usuario:", err);
      setError(err instanceof Error ? err.message : "Error de red al crear usuario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{error}</div>
      )}

      {clubId && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => { setShowImportar((v) => !v); }}
            className="px-4 py-2 rounded-lg font-medium text-sm border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Importar CSV
          </button>
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

      {showImportar && (
        <ImportarUsuariosView
          onClose={() => setShowImportar(false)}
          onImportado={() => router.refresh()}
        />
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
              <th className="w-10" />
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
                  {(p.permisos ?? []).length
                    ? (p.permisos ?? [])
                        .map((perm) => permisoLabelByValue.get(perm) ?? perm)
                        .join(", ")
                    : "—"}
                </td>
                <td className="py-2 px-4 text-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.activo}
                    disabled={updatingId === p.id}
                    onClick={() => setConfirmToggle(p)}
                    className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50"
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
                <td className="py-2 px-2">
                  {(p.rol === "profesor" || p.rol === "secretaria") && (
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      aria-label={`Editar ${p.nombre_completo || p.email}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmToggle && (
        <ConfirmDialog
          open
          title={`¿${confirmToggle.activo ? "Desactivar" : "Activar"} usuario?`}
          description={`${confirmToggle.activo ? "Desactivará" : "Activará"} la cuenta de ${confirmToggle.nombre_completo || confirmToggle.email}. Esta acción no se puede deshacer.`}
          confirmLabel={confirmToggle.activo ? "Desactivar" : "Activar"}
          destructive={confirmToggle.activo}
          loading={updatingId === confirmToggle.id}
          onConfirm={() => { handleToggleActivo(confirmToggle); setConfirmToggle(null); }}
          onCancel={() => setConfirmToggle(null)}
        />
      )}

      {editingProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !editSaving && closeEditModal()}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">
                Editar {editingProfile.nombre_completo || editingProfile.email}
              </h2>
              <button type="button" onClick={closeEditModal} className="p-1 rounded text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <div className="p-4 space-y-4">
              {editingProfile.rol === "profesor" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Categorías asignadas</label>
                    {categorias.length === 0 ? (
                      <p className="text-xs text-slate-500">No hay categorías activas.</p>
                    ) : (
                      <div className="relative" ref={editCatDropdownRef}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setEditCatDropdownOpen((o) => !o)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setEditCatDropdownOpen((o) => !o); }
                          }}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-left flex items-center justify-between gap-2 bg-white hover:border-slate-400 cursor-pointer"
                        >
                          <div className="flex flex-wrap gap-1 min-h-[1.25rem]">
                            {editCategorias.length === 0 ? (
                              <span className="text-slate-400">Sin categorías asignadas</span>
                            ) : (
                              editCategorias.map((c) => (
                                <span
                                  key={c}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                  style={{ backgroundColor: "var(--color-primary)" }}
                                >
                                  {c}
                                  <span
                                    onClick={(e) => { e.stopPropagation(); toggleEditCategoria(c); }}
                                    className="hover:opacity-80 cursor-pointer"
                                    aria-label={`Quitar ${c}`}
                                  >×</span>
                                </span>
                              ))
                            )}
                          </div>
                          <svg className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${editCatDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {editCatDropdownOpen && (
                          <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                            {categorias.map((c) => (
                              <label key={c} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editCategorias.includes(c)}
                                  onChange={() => toggleEditCategoria(c)}
                                  className="rounded border-slate-300"
                                />
                                <span className="text-slate-700">{c}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Permisos</label>
                    <div className="flex flex-col gap-2">
                      {permisosOpciones.map((perm) => (
                        <label key={perm.value} className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editPermisos.includes(perm.value)}
                            onChange={() => toggleEditPermiso(perm.value)}
                            className="rounded border-slate-300"
                          />
                          {perm.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeEditModal} disabled={editSaving} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50">Cancelar</button>
                <button type="button" onClick={handleEditSave} disabled={editSaving} className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ backgroundColor: "var(--color-primary)" }}>
                  {editSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !saving && closeModal()}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Nuevo usuario</h2>
              <button type="button" onClick={closeModal} className="p-1 rounded text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de usuario *</label>
                <select
                  value={nuevoRol}
                  onChange={(e) => setNuevoRol(e.target.value as "profesor" | "secretaria")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="profesor">Profesor</option>
                  <option value="secretaria">Secretaría</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input name="email" type="email" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="usuario@club.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña *</label>
                <input name="password" type="password" required minLength={6} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
                <input name="nombre_completo" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Juan Pérez" />
              </div>
              {nuevoRol === "profesor" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categorías asignadas</label>
                {categorias.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No hay categorías activas. Creá una en Configuración → Categorías.
                  </p>
                ) : (
                  <div className="relative" ref={catDropdownRef}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setCatDropdownOpen((o) => !o)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setCatDropdownOpen((o) => !o);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-left flex items-center justify-between gap-2 bg-white hover:border-slate-400 cursor-pointer"
                    >
                      <div className="flex flex-wrap gap-1 min-h-[1.25rem]">
                        {selectedCategorias.length === 0 ? (
                          <span className="text-slate-400">Seleccionar categorías...</span>
                        ) : (
                          selectedCategorias.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: "var(--color-primary)" }}
                            >
                              {c}
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCategoria(c);
                                }}
                                className="hover:opacity-80 cursor-pointer"
                                aria-label={`Quitar ${c}`}
                              >
                                ×
                              </span>
                            </span>
                          ))
                        )}
                      </div>
                      <svg
                        className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${catDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {catDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                        {categorias.map((c) => {
                          const checked = selectedCategorias.includes(c);
                          return (
                            <label
                              key={c}
                              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleCategoria(c)}
                                className="rounded border-slate-300"
                              />
                              <span className="text-slate-700">{c}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}
              {nuevoRol === "profesor" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Permisos</label>
                <div className="flex flex-col gap-2">
                  {permisosOpciones.map((perm) => (
                    <label key={perm.value} className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="permiso"
                        value={perm.value}
                        className="rounded border-slate-300"
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700">Cancelar</button>
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
