"use client";

import type { Rol } from "@/types/database";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const rolLabels: Record<Rol, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  profesor: "Profesor",
};

interface PerfilViewProps {
  email: string;
  rol: Rol;
  initialNombre: string;
  initialTelefono: string;
  initialFotoUrl: string | null;
}

function getInitials(name: string, email: string): string {
  const base = name?.trim() || email.split("@")[0] || "?";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function PerfilView({
  email,
  rol,
  initialNombre,
  initialTelefono,
  initialFotoUrl,
}: PerfilViewProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [fotoUrl, setFotoUrl] = useState<string | null>(initialFotoUrl);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoMsg, setFotoMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [nombre, setNombre] = useState(initialNombre);
  const [telefono, setTelefono] = useState(initialTelefono);
  const [savingDatos, setSavingDatos] = useState(false);
  const [datosMsg, setDatosMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function handleUploadFoto(file: File) {
    setFotoMsg(null);
    setUploadingFoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/upload-avatar", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFotoMsg({ kind: "err", text: data.error ?? "No se pudo subir la foto" });
        return;
      }
      setFotoUrl(data.url);
      setFotoMsg({ kind: "ok", text: "Foto actualizada" });
      router.refresh();
    } catch (e) {
      setFotoMsg({
        kind: "err",
        text: e instanceof Error ? e.message : "Error de red",
      });
    } finally {
      setUploadingFoto(false);
    }
  }

  async function handleRemoveFoto() {
    setFotoMsg(null);
    setUploadingFoto(true);
    try {
      const res = await fetch("/api/profile/upload-avatar", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFotoMsg({ kind: "err", text: data.error ?? "No se pudo quitar la foto" });
        return;
      }
      setFotoUrl(null);
      setFotoMsg({ kind: "ok", text: "Foto eliminada" });
      router.refresh();
    } finally {
      setUploadingFoto(false);
    }
  }

  async function handleSaveDatos(e: React.FormEvent) {
    e.preventDefault();
    setDatosMsg(null);
    if (!nombre.trim()) {
      setDatosMsg({ kind: "err", text: "El nombre no puede quedar vacío" });
      return;
    }
    setSavingDatos(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_completo: nombre.trim(),
          telefono: telefono.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDatosMsg({ kind: "err", text: data.error ?? "No se pudo guardar" });
        return;
      }
      setDatosMsg({ kind: "ok", text: "Datos actualizados" });
      router.refresh();
    } catch (e) {
      setDatosMsg({
        kind: "err",
        text: e instanceof Error ? e.message : "Error de red",
      });
    } finally {
      setSavingDatos(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd.length < 6) {
      setPwdMsg({ kind: "err", text: "La nueva contraseña debe tener al menos 6 caracteres" });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ kind: "err", text: "La confirmación no coincide" });
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwdMsg({ kind: "err", text: data.error ?? "No se pudo cambiar" });
        return;
      }
      setPwdMsg({ kind: "ok", text: "Contraseña actualizada" });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (e) {
      setPwdMsg({
        kind: "err",
        text: e instanceof Error ? e.message : "Error de red",
      });
    } finally {
      setSavingPwd(false);
    }
  }

  const initials = getInitials(nombre, email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mi perfil</h1>
        <p className="text-sm text-slate-500">
          Personalizá tu información y la foto que se muestra en la app.
        </p>
      </div>

      {/* Foto */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Foto de perfil</h2>
        <div className="flex items-center gap-4">
          <div
            className="h-20 w-20 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-base font-semibold text-slate-700 border border-slate-300"
          >
            {fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoUrl} alt="Tu avatar" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUploadFoto(f);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingFoto}
                className="px-3 py-1.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {uploadingFoto ? "Subiendo..." : fotoUrl ? "Cambiar foto" : "Subir foto"}
              </button>
              {fotoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveFoto}
                  disabled={uploadingFoto}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm disabled:opacity-50"
                >
                  Quitar
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">JPG, PNG o WebP. Máx. 5 MB.</p>
            {fotoMsg && (
              <p
                className={`text-xs ${fotoMsg.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}
              >
                {fotoMsg.text}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Datos personales */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Datos personales</h2>
        <form onSubmit={handleSaveDatos} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre completo *
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Teléfono
              </label>
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: +54 11 1234 5678"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                value={email}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
              <input
                value={rolLabels[rol]}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingDatos}
              className="px-4 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {savingDatos ? "Guardando..." : "Guardar cambios"}
            </button>
            {datosMsg && (
              <p
                className={`text-xs ${datosMsg.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}
              >
                {datosMsg.text}
              </p>
            )}
          </div>
        </form>
      </section>

      {/* Cambiar contraseña */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Cambiar contraseña</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña actual *
              </label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nueva contraseña *
              </label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirmar nueva *
              </label>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingPwd}
              className="px-4 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {savingPwd ? "Cambiando..." : "Cambiar contraseña"}
            </button>
            {pwdMsg && (
              <p
                className={`text-xs ${pwdMsg.kind === "ok" ? "text-emerald-600" : "text-red-600"}`}
              >
                {pwdMsg.text}
              </p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
