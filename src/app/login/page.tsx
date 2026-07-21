"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const inactivo = searchParams.get("inactivo") === "1";
  const suspended = searchParams.get("suspended") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        setError("Email o contraseña incorrectos.");
      } else if (signInError.message.includes("Email not confirmed")) {
        setError("Confirmá tu email antes de iniciar sesión. Revisá tu bandeja de entrada.");
      } else {
        setError(signInError.message);
      }
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundColor: "#2c3e50",
      }}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-xl p-8"
        style={{
          backgroundColor: "#fff",
          borderTop: "4px solid #c0392b",
        }}
      >
        <h1 className="text-2xl font-bold text-slate-800 mb-1">
          Iniciar sesión
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Ingresá con tu email y contraseña del club.
        </p>

        {inactivo && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: "#fde8e8", color: "#c0392b" }}
          >
            Tu cuenta está inactiva. Contactá al administrador.
          </div>
        )}

        {suspended && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: "#fde8e8", color: "#c0392b" }}
          >
            Tu cuenta ha sido suspendida. Contactá al superadministrador.
          </div>
        )}

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
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none transition"
              placeholder="tu@email.com"
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
              autoComplete="current-password"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-medium text-white transition disabled:opacity-60"
            style={{ backgroundColor: "#c0392b" }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Nuevo club?{" "}
          <Link
            href="/registro"
            className="font-medium underline"
            style={{ color: "#c0392b" }}
          >
            Registrate acá
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
