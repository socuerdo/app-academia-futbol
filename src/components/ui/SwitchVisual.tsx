/**
 * Interruptor solo visual. El control accesible (role="switch", etiqueta y
 * zona de toque) es el botón que lo contiene. El estado apagado lleva borde y
 * perilla oscuros para distinguirse del encendido al aire libre.
 */
export function SwitchVisual({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 transition-colors duration-200 ${
        checked ? "border-transparent" : "border-slate-500 bg-slate-200"
      }`}
      style={checked ? { backgroundColor: "var(--color-primary)" } : undefined}
    >
      <span
        className={`pointer-events-none mt-0.5 inline-block h-5 w-5 rounded-full shadow transition duration-200 ${
          checked ? "translate-x-[22px] bg-white" : "translate-x-[2px] bg-slate-500"
        }`}
      />
    </span>
  );
}
