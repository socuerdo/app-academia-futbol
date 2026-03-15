import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">
        Gestión de Asistencias
      </h1>
      <p className="text-slate-600 mb-8 text-center">
        Sistema para escuelas de fútbol. Iniciá sesión o registrá tu club.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition"
        >
          Registrar club
        </Link>
      </div>
    </main>
  );
}
