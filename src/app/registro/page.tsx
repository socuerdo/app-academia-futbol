"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegistroPage() {
  const router = useRouter();
  const [nombreClub, setNombreClub] = useState("");
  const [email, setEmail] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre_club: nombreClub.trim(),
        email: email.trim(),
        password,
        nombre_completo: nombreCompleto.trim() || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al registrar. Intentá de nuevo.");
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "#2c3e50" }}
      >
        <div
          className="w-full max-w-md rounded-xl shadow-xl p-8 text-center"
          style={{
            backgroundColor: "#fff",
            borderTop: "4px solid #27ae60",
          }}
        >
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Registro exitoso
          </h1>
          <p className="text-slate-600 mb-6">
            Revisá tu email para confirmar la cuenta. Después podés iniciar
            sesión.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 text-white rounded-lg font-medium"
            style={{ backgroundColor: "#c0392b" }}
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: "#2c3e50" }}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-xl p-8"
        style={{
          backgroundColor: "#fff",
          borderTop: "4px solid #c0392b",
        }}
      >
        <h1 className="text-2xl font-bold text-slate-800 mb-1">
          Registrar mi club
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Creá la cuenta de administrador para tu escuela de fútbol.
        </p>

        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: "#fde8e8", color: "#c0392b" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="nombre_club"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Nombre del club
            </label>
            <input
              id="nombre_club"
              type="text"
              value={nombreClub}
              onChange={(e) => setNombreClub(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none transition"
              placeholder="Ej: Academia San Martín"
            />
          </div>
          <div>
            <label
              htmlFor="nombre_completo"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Tu nombre completo (opcional)
            </label>
            <input
              id="nombre_completo"
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none transition"
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email del administrador
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none transition"
              placeholder="admin@miclub.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none transition"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label
              htmlFor="confirm_password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none transition"
              placeholder="Repetí la contraseña"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-medium text-white transition disabled:opacity-60"
            style={{ backgroundColor: "#c0392b" }}
          >
            {loading ? "Registrando..." : "Registrar club"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="font-medium underline"
            style={{ color: "#c0392b" }}
          >
            Iniciar sesión
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-500">
          <Link href="/" className="font-medium text-slate-600 hover:underline">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
