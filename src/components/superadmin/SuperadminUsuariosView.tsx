"use client";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { KeyRound, Pencil } from "lucide-react";

export type UserRow = {
  id: string;
  nombre_completo: string;
  email: string;
  rol: string;
  club_id: string | null;
  club_nombre: string;
  activo: boolean;
};

export type ClubOption = { id: string; nombre: string };

const ROL_LABELS: Record<string, string> = {
  admin: "Admin",
  profesor: "Profesor",
  secretaria: "Secretaría",
  canchero: "Canchero",
};

const ROL_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  profesor: "bg-blue-100 text-blue-800",
  secretaria: "bg-amber-100 text-amber-800",
  canchero: "bg-emerald-100 text-emerald-800",
};

const ROLES_CREABLES = ["admin", "profesor", "secretaria", "canchero"] as const;

interface Props {
  users: UserRow[];
  clubs: ClubOption[];
  initialClubFilter?: string;
}

export function SuperadminUsuariosView({ users: initialUsers, clubs, initialClubFilter = "" }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);

  // Filtros
  const [filtroClub, setFiltroClub] = useState(initialClubFilter);
  const [filtroRol, setFiltroRol] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Toggle activo
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<UserRow | null>(null);

  // Modal crear
  const [showCrear, setShowCrear] = useState(false);
  const [crearSaving, setCrearSaving] = useState(false);
  const [crearError, setCrearError] = useState<string | null>(null);
  const [crearRol, setCrearRol] = useState<string>("profesor");
  const [crearClubId, setCrearClubId] = useState("");

  // Modal editar
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editRol, setEditRol] = useState("");
  const [editClubId, setEditClubId] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal contraseña
  const [changingPw, setChangingPw] = useState<UserRow | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const clubById = useMemo(() => Object.fromEntries(clubs.map((c) => [c.id, c.nombre])), [clubs]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (filtroClub && u.club_id !== filtroClub) return false;
      if (filtroRol && u.rol !== filtroRol) return false;
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        if (!u.nombre_completo.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [users, filtroClub, filtroRol, busqueda]);

  // ── Toggle activo ──────────────────────────────────────────────────────────
  async function handleToggleActivo(u: UserRow) {
    setUpdatingId(u.id);
    const next = !u.activo;
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, activo: next } : x));
    const res = await fetch(`/api/users/update/${encodeURIComponent(u.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: next }),
    });
    setUpdatingId(null);
    if (!res.ok) setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, activo: !next } : x));
    router.refresh();
  }

  // ── Crear usuario ──────────────────────────────────────────────────────────
  async function handleCrear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCrearError(null);
    setCrearSaving(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const res = await fetch("/api/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: (fd.get("email") as string).trim(),
        password: fd.get("password") as string,
        nombre_completo: (fd.get("nombre_completo") as string).trim(),
        rol: crearRol,
        club_id: crearClubId,
        categorias_asignadas: [],
        permisos: [],
      }),
    });
    const data = await res.json().catch(() => ({}));
    setCrearSaving(false);
    if (!res.ok) { setCrearError(data.error ?? "Error al crear usuario"); return; }
    setShowCrear(false);
    setCrearRol("profesor");
    setCrearClubId("");
    form.reset();
    const newUser: UserRow = {
      id: data.user.id,
      nombre_completo: data.user.nombre_completo,
      email: data.user.email,
      rol: data.user.rol,
      club_id: data.user.club_id,
      club_nombre: clubById[data.user.club_id] ?? "—",
      activo: true,
    };
    setUsers((prev) => [newUser, ...prev]);
    router.refresh();
  }

  // ── Editar usuario ─────────────────────────────────────────────────────────
  function openEdit(u: UserRow) {
    setEditingUser(u);
    setEditNombre(u.nombre_completo);
    setEditRol(u.rol);
    setEditClubId(u.club_id ?? "");
    setEditError(null);
  }

  async function handleEditSave() {
    if (!editingUser) return;
    setEditSaving(true);
    setEditError(null);
    const res = await fetch(`/api/users/update/${encodeURIComponent(editingUser.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre_completo: editNombre,
        rol: editRol,
        club_id: editClubId || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setEditSaving(false);
    if (!res.ok) { setEditError(data.error ?? "Error al actualizar"); return; }
    setUsers((prev) => prev.map((u) =>
      u.id === editingUser.id
        ? { ...u, nombre_completo: editNombre.trim(), rol: editRol, club_id: editClubId || null, club_nombre: clubById[editClubId] ?? "—" }
        : u
    ));
    setEditingUser(null);
    router.refresh();
  }

  // ── Cambiar contraseña ─────────────────────────────────────────────────────
  async function handleChangePassword() {
    if (!changingPw) return;
    if (pwValue.length < 6) { setPwError("La contraseña debe tener al menos 6 caracteres."); return; }
    setPwSaving(true);
    setPwError(null);
    const res = await fetch(`/api/users/update/${encodeURIComponent(changingPw.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwValue }),
    });
    const data = await res.json().catch(() => ({}));
    setPwSaving(false);
    if (!res.ok) { setPwError(data.error ?? "Error al cambiar contraseña"); return; }
    setPwSuccess(true);
    setTimeout(() => { setChangingPw(null); setPwValue(""); setPwSuccess(false); }, 1500);
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-56"
        />
        <select
          value={filtroClub}
          onChange={(e) => setFiltroClub(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">Todos los clubes</option>
          {clubs.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">Todos los roles</option>
          {ROLES_CREABLES.map((r) => <option key={r} value={r}>{ROL_LABELS[r]}</option>)}
        </select>
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => { setShowCrear(true); setCrearError(null); setCrearRol("profesor"); setCrearClubId(""); }}
            className="px-4 py-2 rounded-lg text-white font-medium text-sm bg-slate-800 hover:bg-slate-700"
          >
            Nuevo usuario
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500">{filtered.length} usuarios</p>

      {/* Tabla */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left py-2 px-4">Usuario</th>
                <th className="text-left py-2 px-4">Rol</th>
                <th className="text-left py-2 px-4">Club</th>
                <th className="text-center py-2 px-4 w-20">Activo</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No se encontraron usuarios.</td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-4">
                    <p className="font-medium text-slate-800">{u.nombre_completo || "—"}</p>
                    <p className="text-xs text-slate-500">{u.email || "—"}</p>
                  </td>
                  <td className="py-2 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROL_COLORS[u.rol] ?? "bg-slate-100 text-slate-700"}`}>
                      {ROL_LABELS[u.rol] ?? u.rol}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-sm text-slate-600">{u.club_nombre || "—"}</td>
                  <td className="py-2 px-4 text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={u.activo}
                      disabled={updatingId === u.id}
                      onClick={() => setConfirmToggle(u)}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50"
                      style={{ backgroundColor: u.activo ? "#1e293b" : "#cbd5e1" }}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${u.activo ? "translate-x-5" : "translate-x-0"}`}
                        style={{ marginTop: 2 }}
                      />
                    </button>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Editar usuario"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChangingPw(u); setPwValue(""); setPwError(null); setPwSuccess(false); }}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Cambiar contraseña"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm toggle */}
      {confirmToggle && (
        <ConfirmDialog
          open
          title={`¿${confirmToggle.activo ? "Desactivar" : "Activar"} usuario?`}
          description={`${confirmToggle.activo ? "Desactivará" : "Activará"} la cuenta de ${confirmToggle.nombre_completo || confirmToggle.email}.`}
          confirmLabel={confirmToggle.activo ? "Desactivar" : "Activar"}
          destructive={confirmToggle.activo}
          loading={updatingId === confirmToggle.id}
          onConfirm={() => { handleToggleActivo(confirmToggle); setConfirmToggle(null); }}
          onCancel={() => setConfirmToggle(null)}
        />
      )}

      {/* Modal crear */}
      {showCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !crearSaving && setShowCrear(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Nuevo usuario</h2>
              <button type="button" onClick={() => setShowCrear(false)} className="p-1 rounded text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <form onSubmit={handleCrear} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Club *</label>
                <select
                  value={crearClubId}
                  onChange={(e) => setCrearClubId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">Seleccionar club...</option>
                  {clubs.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol *</label>
                <select
                  value={crearRol}
                  onChange={(e) => setCrearRol(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  {ROLES_CREABLES.map((r) => <option key={r} value={r}>{ROL_LABELS[r]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input name="email" type="email" required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="usuario@club.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña *</label>
                <input name="password" type="password" required minLength={6} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
                <input name="nombre_completo" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Juan Pérez" />
              </div>
              {crearError && <p className="text-sm text-red-600">{crearError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowCrear(false)} disabled={crearSaving} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={crearSaving || !crearClubId} className="px-4 py-2 rounded-lg text-white font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50">
                  {crearSaving ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !editSaving && setEditingUser(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Editar usuario</h2>
              <button type="button" onClick={() => setEditingUser(null)} className="p-1 rounded text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-500">{editingUser.email}</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select
                  value={editRol}
                  onChange={(e) => setEditRol(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  {ROLES_CREABLES.map((r) => <option key={r} value={r}>{ROL_LABELS[r]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Club</label>
                <select
                  value={editClubId}
                  onChange={(e) => setEditClubId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">Sin club</option>
                  {clubs.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditingUser(null)} disabled={editSaving} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50">Cancelar</button>
                <button type="button" onClick={handleEditSave} disabled={editSaving} className="px-4 py-2 rounded-lg text-white font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50">
                  {editSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal contraseña */}
      {changingPw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !pwSaving && setChangingPw(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800">Cambiar contraseña</h2>
              <button type="button" onClick={() => setChangingPw(null)} className="p-1 rounded text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-600">{changingPw.nombre_completo || changingPw.email}</p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nueva contraseña *</label>
                <input
                  type="password"
                  value={pwValue}
                  onChange={(e) => setPwValue(e.target.value)}
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  autoFocus
                />
              </div>
              {pwError && <p className="text-sm text-red-600">{pwError}</p>}
              {pwSuccess && <p className="text-sm text-green-600 font-medium">Contraseña actualizada correctamente.</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setChangingPw(null)} disabled={pwSaving} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50">Cancelar</button>
                <button type="button" onClick={handleChangePassword} disabled={pwSaving || pwValue.length < 6} className="px-4 py-2 rounded-lg text-white font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50">
                  {pwSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
