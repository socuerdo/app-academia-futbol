/**
 * WhatsApp no ofrece una forma pública de recibir un archivo ya adjunto en un
 * chat sin intervención manual (eso solo lo permite la WhatsApp Business API).
 * En celular usamos el selector nativo de compartir para que el usuario elija
 * el contacto/grupo; en desktop, donde el navegador no puede adjuntar
 * archivos a una app externa, descargamos el PDF y abrimos WhatsApp Web para
 * que lo adjunten a mano.
 */
export async function compartirPorWhatsApp(file: File, mensaje?: string): Promise<void> {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const puedeCompartirArchivo =
    nav?.share !== undefined && nav.canShare?.({ files: [file] });

  if (puedeCompartirArchivo) {
    try {
      await nav!.share({ files: [file], title: file.name, text: mensaje });
      return;
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      // Si el share nativo falla por otra razón, caemos al fallback de descarga.
    }
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
  window.open("https://web.whatsapp.com/", "_blank", "noopener,noreferrer");
}
