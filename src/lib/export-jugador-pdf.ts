import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

export type FilaAsistencia = { fecha: string; presente: boolean; observacion?: string | null };

function construirJugadorPDF(
  apellido: string,
  nombre: string,
  categoria: string,
  sede: string,
  presencias: number,
  ausencias: number,
  porcentaje: number,
  detalle: FilaAsistencia[]
): jsPDF {
  const doc = new jsPDF({ unit: "pt" });
  doc.setFontSize(16);
  doc.text(`Reporte de asistencia - ${apellido}, ${nombre}`, 14, 20);
  doc.setFontSize(10);
  doc.text(`Categoría: ${categoria}  |  Sede: ${sede}`, 14, 28);
  doc.text(`Presencias: ${presencias}  |  Ausencias: ${ausencias}  |  % Asistencia: ${porcentaje}%`, 14, 34);

  autoTable(doc, {
    startY: 42,
    head: [["Fecha", "Presente", "Observación"]],
    body: detalle.slice(0, 80).map((d) => [
      d.fecha,
      d.presente ? "Sí" : "No",
      d.observacion || "-",
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [44, 62, 80] },
  });

  return doc;
}

function nombreArchivoJugador(apellido: string, nombre: string): string {
  return `asistencia-${apellido}-${nombre}.pdf`.replace(/\s/g, "-");
}

export function exportJugadorPDF(
  apellido: string,
  nombre: string,
  categoria: string,
  sede: string,
  presencias: number,
  ausencias: number,
  porcentaje: number,
  detalle: FilaAsistencia[]
) {
  const doc = construirJugadorPDF(apellido, nombre, categoria, sede, presencias, ausencias, porcentaje, detalle);
  doc.save(nombreArchivoJugador(apellido, nombre));
}

export function getJugadorPDFFile(
  apellido: string,
  nombre: string,
  categoria: string,
  sede: string,
  presencias: number,
  ausencias: number,
  porcentaje: number,
  detalle: FilaAsistencia[]
): File {
  const doc = construirJugadorPDF(apellido, nombre, categoria, sede, presencias, ausencias, porcentaje, detalle);
  return new File([doc.output("blob")], nombreArchivoJugador(apellido, nombre), { type: "application/pdf" });
}
