import Link from "next/link";
import { PitchLines, RAYAS_CAMISETA } from "@/components/public/PitchLines";

const MODULOS = ["Asistencias", "Cuotas", "Evaluaciones", "Jugadores"];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#c0392b] text-white">
      <div
        className="relative isolate flex flex-1 flex-col justify-center overflow-hidden px-6 py-16 sm:px-12 lg:px-20"
        style={RAYAS_CAMISETA}
      >
        <PitchLines className="pointer-events-none absolute -right-32 top-1/2 -z-10 w-[44rem] -translate-y-1/2 text-white/20 lg:-right-16 lg:w-[64rem]" />

        <h1 className="font-display text-[clamp(4rem,17vw,11rem)] font-extrabold uppercase italic leading-[0.84] tracking-tight">
          <span className="hero-line block" style={{ "--i": 0 } as React.CSSProperties}>
            App
          </span>
          <span className="hero-line block" style={{ "--i": 1 } as React.CSSProperties}>
            Club
          </span>
          <span className="hero-line block" style={{ "--i": 2 } as React.CSSProperties}>
            Deportivo
          </span>
        </h1>

        <p className="mt-8 max-w-md text-lg font-medium text-white/95 sm:text-xl">
          Asistencias, cuotas y evaluaciones de tu escuela de fútbol, en un solo lugar.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex min-h-[52px] items-center rounded-lg bg-white px-8 text-base font-semibold text-[#c0392b] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#c0392b]"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="inline-flex min-h-[52px] items-center rounded-lg border-2 border-white px-8 text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#c0392b]"
          >
            Registrar club
          </Link>
        </div>
      </div>

      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-[#2c3e50] px-6 py-4 font-display text-sm font-bold uppercase italic tracking-wide text-white sm:gap-x-5 sm:px-12 sm:text-xl sm:tracking-wider lg:px-20">
        {MODULOS.map((m, i) => (
          <li key={m} className="flex items-center gap-3 sm:gap-5">
            {i > 0 && (
              <span aria-hidden className="text-white/50">
                /
              </span>
            )}
            {m}
          </li>
        ))}
      </ul>
    </main>
  );
}
