"use client";

import Papa from "papaparse";
import { useRef, useState } from "react";
import { Download, Upload, X } from "lucide-react";

type FilaUsuario = {
  email: string;
  nombre_completo: string;
  rol: "profesor" | "secretaria";
  categorias: string[];
};

type ResultadoImport = {
  email: string;
  nombre_completo: string;
  rol: string;
  password?: string;
  error?: string;
};

const PLANTILLA_CSV =
  "email,nombre_completo,rol,categorias\n" +
  "juan@club.com,Juan García,profesor,Sub-14|Sub-16\n" +
  "ana@club.com,Ana López,secretaria,\n";

interface ImportarUsuariosViewProps {
  onClose: () => void;
  onImportado: () => void;
}

export function ImportarUsuariosView({ onClose, onImportado }: ImportarUsuariosViewProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<FilaUsuario[]>([]);
  const [resultado, setResultado] = useState<ResultadoImport[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function descargarPlantilla() {
    const blob = new Blob([PLANTILLA_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_usuarios.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(file: File) {
    setError(null);
    setResultado(null);
    setFilas([]);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed: FilaUsuario[] = [];
        const errores: string[] = [];
        res.data.forEach((row, i) => {
          const email = (row.email ?? "").trim().toLowerCase();
          const nombre_completo = (row.nombre_completo ?? "").trim();
          const rolRaw = (row.rol ?? "").trim().toLowerCase();
          const rol: "profesor" | "secretaria" =
            rolRaw === "secretaria" ? "secretaria" : "profesor";
          const categoriasRaw = (row.categorias ?? "").trim();
          const categorias = categoriasRaw
            ? categoriasRaw.split("|").map((c) => c.trim()).filter(Boolean)
            : [];

          if (!email) {
            errores.push(`Fila ${i + 2}: email vacío`);
            return;
          }
          if (!nombre_completo) {
            errores.push(`Fila ${i + 2}: nombre_completo vacío`);
            return;
          }
          parsed.push({ email, nombre_completo, rol, categorias });
        });

        if (errores.length) {
          setError(errores.join(" · "));
          return;
        }
        if (!parsed.length) {
          setError("El archivo no tiene filas válidas.");
          return;
        }
        setFilas(parsed);
      },
      error: () => setError("No se pudo leer el archivo."),
    });
  }

  async function handleImportar() {
    if (!filas.length) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/users/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarios: filas }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Error al importar");
      return;
    }
    setResultado(data.resultados);
    setFilas([]);
    onImportado();
  }

  function descargarCredenciales() {
    if (!resultado) return;
    const exitosos = resultado.filter((r) => !r.error);
    const csv =
      "email,nombre_completo,rol,contrasena_temporal\n" +
      exitosos
        .map((r) => `${r.email},"${r.nombre_completo}",${r.rol},${r.password}`)
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "credenciales_usuarios.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const exitosos = resultado?.filter((r) => !r.error).length ?? 0;
  const conError = resultado?.filter((r) => !!r.error).length ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Importar usuarios desde CSV</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!resultado && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={descargarPlantilla}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Descargar plantilla
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Upload className="h-4 w-4" />
              Seleccionar CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>

          <p className="text-xs text-slate-500">
            Columnas: <code className="bg-slate-100 px-1 rounded">email</code>,{" "}
            <code className="bg-slate-100 px-1 rounded">nombre_completo</code>,{" "}
            <code className="bg-slate-100 px-1 rounded">rol</code> (profesor / secretaria),{" "}
            <code className="bg-slate-100 px-1 rounded">categorias</code> (separadas por |).
            La contraseña se genera automáticamente.
          </p>

          {error && (
            <div className="p-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {filas.length > 0 && (
            <>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="text-left py-2 px-4">Email</th>
                      <th className="text-left py-2 px-4">Nombre</th>
                      <th className="text-left py-2 px-4">Rol</th>
                      <th className="text-left py-2 px-4">Categorías</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((f, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-2 px-4">{f.email}</td>
                        <td className="py-2 px-4">{f.nombre_completo}</td>
                        <td className="py-2 px-4 capitalize">{f.rol}</td>
                        <td className="py-2 px-4 text-xs text-slate-500">
                          {f.categorias.join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleImportar}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {loading
                  ? "Creando usuarios..."
                  : `Crear ${filas.length} usuario${filas.length !== 1 ? "s" : ""}`}
              </button>
            </>
          )}
        </>
      )}

      {resultado && (
        <>
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
            <span className="font-medium text-emerald-700">{exitosos} creados</span>
            {conError > 0 && (
              <span className="font-medium text-red-700">{conError} con error</span>
            )}
            {exitosos > 0 && (
              <button
                type="button"
                onClick={descargarCredenciales}
                className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Descargar credenciales
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-left py-2 px-4">Email</th>
                  <th className="text-left py-2 px-4">Nombre</th>
                  <th className="text-left py-2 px-4">Rol</th>
                  <th className="text-left py-2 px-4">Contraseña temporal / Error</th>
                </tr>
              </thead>
              <tbody>
                {resultado.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-t border-slate-100 ${r.error ? "bg-red-50/50" : ""}`}
                  >
                    <td className="py-2 px-4">{r.email}</td>
                    <td className="py-2 px-4">{r.nombre_completo}</td>
                    <td className="py-2 px-4 capitalize">{r.rol}</td>
                    <td className="py-2 px-4">
                      {r.error ? (
                        <span className="text-red-600 text-xs">{r.error}</span>
                      ) : (
                        <code className="text-emerald-700 font-mono text-xs bg-emerald-50 px-1.5 py-0.5 rounded">
                          {r.password}
                        </code>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
          >
            Cerrar
          </button>
        </>
      )}
    </div>
  );
}
