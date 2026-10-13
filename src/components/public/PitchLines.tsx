/** Líneas de cancha en trazo fino: textura decorativa para las pantallas de entrada. */
export function PitchLines({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 400"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      className={className}
    >
      <rect x="10" y="10" width="580" height="380" rx="4" />
      <line x1="300" y1="10" x2="300" y2="390" />
      <circle cx="300" cy="200" r="64" />
      <circle cx="300" cy="200" r="4" fill="currentColor" />
      <rect x="10" y="110" width="90" height="180" />
      <rect x="10" y="155" width="34" height="90" />
      <rect x="500" y="110" width="90" height="180" />
      <rect x="556" y="155" width="34" height="90" />
      <path d="M100 160a64 64 0 0 1 0 80" />
      <path d="M500 160a64 64 0 0 0 0 80" />
    </svg>
  );
}

/** Rayas verticales tenues, como las de una camiseta. */
export const RAYAS_CAMISETA = {
  backgroundImage:
    "repeating-linear-gradient(90deg, rgba(0,0,0,0.07) 0 56px, transparent 56px 112px)",
} as const;
