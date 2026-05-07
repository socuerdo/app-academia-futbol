"use client";

import { actualizarClub } from "@/app/dashboard/configuracion/actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Club = {
  id: string;
  nombre: string;
  logo_url: string | null;
  iniciales: string;
  color_primario: string;
  color_sidebar: string;
} | null;

interface ConfiguracionViewProps {
  club: Club;
}

export function ConfiguracionView({ club }: ConfiguracionViewProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState(club?.nombre ?? "");
  const [iniciales, setIniciales] = useState(club?.iniciales ?? "");
  const [colorPrimario, setColorPrimario] = useState(club?.color_primario ?? "#c0392b");
  const [colorSidebar, setColorSidebar] = useState(club?.color_sidebar ?? "#2c3e50");
  const [logoUrl, setLogoUrl] = useState(club?.logo_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (club) {
      setNombre(club.nombre);
      setIniciales(club.iniciales);
      setColorPrimario(club.color_primario);
      setColorSidebar(club.color_sidebar);
      setLogoUrl(club.logo_url ?? "");
    }
  }, [club]);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !club) return;
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("club_id", club.id);
    const res = await fetch("/api/club/upload-logo", { method: "POST", body: formData });
    setUploading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al subir logo");
      return;
    }
    setLogoUrl(data.url);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("nombre", nombre);
    formData.set("iniciales", iniciales);
    formData.set("color_primario", colorPrimario);
    formData.set("color_sidebar", colorSidebar);
    formData.set("logo_url", logoUrl);
    const result = await actualizarClub(formData);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage("Cambios guardados. Recargá la página para ver los colores en el menú.");
    router.refresh();
  }

  if (!club) {
    return <p className="text-slate-600">Seleccioná un club para configurar.</p>;
  }

  return (
    <div className="space-y-6">
      {error && <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{error}</div>}
      {message && <div className="p-3 rounded-lg text-sm bg-emerald-50 text-emerald-800">{message}</div>}

      {/* Preview */}
      <div
        className="rounded-xl border border-slate-200 p-4 flex items-center gap-4"
        style={{ ["--color-primary" as string]: colorPrimario, ["--color-sidebar" as string]: colorSidebar } as React.CSSProperties}
      >
        <div className="shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: colorSidebar }}>
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-full h-full rounded-xl object-contain" />
          ) : (
            iniciales || "CL"
          )}
        </div>
        <div>
          <p className="font-semibold text-slate-800">{nombre || "Nombre del club"}</p>
          <p className="text-sm text-slate-500">Vista previa del sidebar y colores</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <input type="hidden" name="club_id" value={club.id} />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            disabled={uploading}
            className="block w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-medium file:cursor-pointer"
            style={{ ["file:backgroundColor" as string]: "var(--color-primary)", ["file:color" as string]: "white" }}
          />
          {uploading && <p className="text-xs text-slate-500 mt-1">Subiendo...</p>}
          {logoUrl && <p className="text-xs text-slate-500 mt-1">Logo actualizado.</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del club *</label>
          <input
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            placeholder="Ej: Academia San Martín"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Iniciales *</label>
          <input
            name="iniciales"
            value={iniciales}
            onChange={(e) => setIniciales(e.target.value.slice(0, 4).toUpperCase())}
            required
            maxLength={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg max-w-[120px]"
            placeholder="ASM"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Color primario</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={colorPrimario}
                onChange={(e) => setColorPrimario(e.target.value)}
                className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={colorPrimario}
                onChange={(e) => setColorPrimario(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Color sidebar</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={colorSidebar}
                onChange={(e) => setColorSidebar(e.target.value)}
                className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={colorSidebar}
                onChange={(e) => setColorSidebar(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}
