/** Helpers cliente para la foto del jugador (ver /api/jugadores/[id]/foto). */

export async function subirFotoJugador(
  jugadorId: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  const body = new FormData();
  body.append("file", file);
  try {
    const res = await fetch(`/api/jugadores/${jugadorId}/foto`, {
      method: "POST",
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error ?? "No se pudo subir la foto" };
    return { url: data.url as string };
  } catch {
    return { error: "No se pudo subir la foto" };
  }
}

export async function quitarFotoJugador(
  jugadorId: string
): Promise<{ error?: string }> {
  try {
    const res = await fetch(`/api/jugadores/${jugadorId}/foto`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error ?? "No se pudo quitar la foto" };
    return {};
  } catch {
    return { error: "No se pudo quitar la foto" };
  }
}
