import Link from "next/link";
import { PitchLines, RAYAS_CAMISETA } from "./PitchLines";

/**
 * Marco de las pantallas de acceso (login y registro): panel rojo de camiseta
 * con la marca y una consigna, y el formulario sobre blanco. En celular el
 * panel se reduce a una franja con el nombre de la app.
 */
export function AuthShell({
  claim,
  children,
}: {
  claim: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col lg:grid lg:grid-cols-[5fr_6fr]">
      <aside
        className="relative isolate flex flex-col justify-between overflow-hidden bg-[#c0392b] px-6 py-6 text-white lg:min-h-screen lg:px-12 lg:py-12"
        style={RAYAS_CAMISETA}
      >
        <PitchLines className="pointer-events-none absolute -bottom-10 -right-24 -z-10 w-[34rem] text-white/20 lg:-right-40 lg:bottom-16 lg:w-[52rem]" />
        <Link
          href="/"
          className="font-display text-2xl font-extrabold uppercase italic tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          App Club Deportivo
        </Link>
        <p className="hidden font-display text-7xl font-extrabold uppercase italic leading-[0.88] tracking-tight lg:block xl:text-8xl">
          {claim}
        </p>
      </aside>
      <section className="flex flex-1 items-start justify-center bg-white px-6 py-10 lg:items-center lg:px-16">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
