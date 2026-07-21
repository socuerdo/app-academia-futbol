import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import ExcelJS from "exceljs";

export type FilaReporte = {
  jugador: string;
  categoria: string;
  sede: string;
  sexo: string;
  presencias: number;
  ausencias: number;
  total: number;
  porcentaje: number;
};

function descargarExcel(buffer: ArrayBuffer, nombreArchivo: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo.endsWith(".xlsx") ? nombreArchivo : `${nombreArchivo}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportReporteExcel(filas: FilaReporte[], nombreArchivo = "reporte-asistencias") {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Reporte");
  ws.columns = [
    { header: "Jugador", key: "jugador", width: 28 },
    { header: "Categoría", key: "categoria", width: 12 },
    { header: "Sede", key: "sede", width: 18 },
    { header: "Presencias", key: "presencias", width: 12 },
    { header: "Ausencias", key: "ausencias", width: 12 },
    { header: "Total", key: "total", width: 10 },
    { header: "% Asistencia", key: "pct", width: 14 },
  ];
  ws.addRows(
    filas.map((f) => ({
      jugador: f.jugador,
      categoria: f.categoria,
      sede: f.sede,
      presencias: f.presencias,
      ausencias: f.ausencias,
      total: f.total,
      pct: f.porcentaje,
    }))
  );
  const buffer = await wb.xlsx.writeBuffer();
  descargarExcel(buffer as ArrayBuffer, nombreArchivo);
}

function construirReportePDF(filas: FilaReporte[], titulo: string): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
  doc.setFontSize(14);
  doc.text(titulo, 14, 15);
  autoTable(doc, {
    startY: 22,
    head: [["Jugador", "Categoría", "Sede", "Presencias", "Ausencias", "Total", "%"]],
    body: filas.map((f) => [
      f.jugador,
      f.categoria,
      f.sede,
      String(f.presencias),
      String(f.ausencias),
      String(f.total),
      `${f.porcentaje}%`,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [44, 62, 80] },
  });
  return doc;
}

export function exportReportePDF(filas: FilaReporte[], titulo = "Reporte de asistencias") {
  construirReportePDF(filas, titulo).save("reporte-asistencias.pdf");
}

export function getReportePDFFile(filas: FilaReporte[], titulo = "Reporte de asistencias"): File {
  const doc = construirReportePDF(filas, titulo);
  return new File([doc.output("blob")], "reporte-asistencias.pdf", { type: "application/pdf" });
}

export type FilaReporteTodos = {
  jugador: string;
  categoria: string;
  sede: string;
  sexo: string;
  estado: string;
  vencimiento_carnet: string | null;
};

export async function exportReporteTodosExcel(
  filas: FilaReporteTodos[],
  nombreArchivo = "reporte-todos-jugadores"
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Jugadores");
  ws.columns = [
    { header: "Jugador", key: "jugador", width: 28 },
    { header: "Categoría", key: "categoria", width: 12 },
    { header: "Sede", key: "sede", width: 18 },
    { header: "Estado", key: "estado", width: 10 },
    { header: "Venc. carnet", key: "vencimiento_carnet", width: 14 },
  ];
  ws.addRows(
    filas.map((f) => ({
      jugador: f.jugador,
      categoria: f.categoria,
      sede: f.sede,
      estado: f.estado,
      vencimiento_carnet: f.vencimiento_carnet ?? "-",
    }))
  );
  const buffer = await wb.xlsx.writeBuffer();
  descargarExcel(buffer as ArrayBuffer, nombreArchivo);
}

function construirReporteTodosPDF(filas: FilaReporteTodos[], titulo: string): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
  doc.setFontSize(14);
  doc.text(titulo, 14, 15);
  autoTable(doc, {
    startY: 22,
    head: [["Jugador", "Categoría", "Sede", "Estado", "Venc. carnet"]],
    body: filas.map((f) => [
      f.jugador,
      f.categoria,
      f.sede,
      f.estado,
      f.vencimiento_carnet ?? "-",
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [44, 62, 80] },
  });
  return doc;
}

export function exportReporteTodosPDF(filas: FilaReporteTodos[], titulo = "Reporte todos los jugadores") {
  construirReporteTodosPDF(filas, titulo).save("reporte-todos-jugadores.pdf");
}

export function getReporteTodosPDFFile(filas: FilaReporteTodos[], titulo = "Reporte todos los jugadores"): File {
  const doc = construirReporteTodosPDF(filas, titulo);
  return new File([doc.output("blob")], "reporte-todos-jugadores.pdf", { type: "application/pdf" });
}
