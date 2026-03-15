import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

export type FilaAsistencia = { fecha: string; presente: boolean; observacion?: string | null };

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

  doc.save(`asistencia-${apellido}-${nombre}.pdf`.replace(/\s/g, "-"));
}
