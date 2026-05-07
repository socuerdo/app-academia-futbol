import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import {
  DIMENSION_KEYS,
  ESCALA_EVALUACION,
  type DimensionKey,
} from "@/lib/evaluaciones/escala";

const PRIMARY: [number, number, number] = [192, 57, 43];
const SLATE_800: [number, number, number] = [30, 41, 59];
const SLATE_600: [number, number, number] = [71, 85, 105];
const SLATE_300: [number, number, number] = [203, 213, 225];

export type EvaluacionPDFData = {
  jugadorApellido: string;
  jugadorNombre: string;
  jugadorCategoria: string;
  fecha: string;
  temporada: string | null;
  tipoNombre: string | null;
  evaluadorNombre: string | null;
  promedio: number;
  niveles: Record<DimensionKey, number>;
  comentarios: Record<DimensionKey, string | null>;
  observacionesGenerales: string | null;
};

function fechaCorta(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR");
}

function drawPolygon(
  doc: jsPDF,
  pts: [number, number][],
  style: "S" | "FD"
) {
  if (pts.length < 2) return;
  const [x0, y0] = pts[0];
  const deltas: [number, number][] = [];
  for (let i = 1; i < pts.length; i++) {
    deltas.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
  }
  doc.lines(deltas, x0, y0, [1, 1], style, true);
}

function drawRadar(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  niveles: Record<DimensionKey, number>
) {
  const N = DIMENSION_KEYS.length;
  const step = (2 * Math.PI) / N;
  const start = -Math.PI / 2;

  doc.setDrawColor(...SLATE_300);
  doc.setLineWidth(0.4);
  for (let lvl = 1; lvl <= 5; lvl++) {
    const lr = (r * lvl) / 5;
    const ring: [number, number][] = [];
    for (let i = 0; i < N; i++) {
      const a = start + i * step;
      ring.push([cx + lr * Math.cos(a), cy + lr * Math.sin(a)]);
    }
    drawPolygon(doc, ring, "S");
  }

  for (let i = 0; i < N; i++) {
    const a = start + i * step;
    doc.line(cx, cy, cx + r * Math.cos(a), cy + r * Math.sin(a));
  }

  const value: [number, number][] = DIMENSION_KEYS.map((key, i) => {
    const v = Math.max(0, Math.min(5, niveles[key] ?? 0));
    const lr = (r * v) / 5;
    const a = start + i * step;
    return [cx + lr * Math.cos(a), cy + lr * Math.sin(a)];
  });

  doc.setDrawColor(...PRIMARY);
  doc.setFillColor(...PRIMARY);
  doc.setLineWidth(1.1);

  type GStateCtor = new (opts: { opacity?: number; "stroke-opacity"?: number }) => unknown;
  const docWithGS = doc as unknown as {
    GState?: GStateCtor;
    setGState?: (s: unknown) => void;
  };
  if (docWithGS.GState && docWithGS.setGState) {
    docWithGS.setGState(new docWithGS.GState({ opacity: 0.35 }));
    drawPolygon(doc, value, "FD");
    docWithGS.setGState(new docWithGS.GState({ opacity: 1 }));
  } else {
    drawPolygon(doc, value, "FD");
  }
  drawPolygon(doc, value, "S");

  doc.setTextColor(...SLATE_600);
  doc.setFontSize(9);
  DIMENSION_KEYS.forEach((key, i) => {
    const a = start + i * step;
    const lx = cx + (r + 14) * Math.cos(a);
    const ly = cy + (r + 14) * Math.sin(a) + 2;
    const cosA = Math.cos(a);
    const align: "left" | "center" | "right" =
      Math.abs(cosA) < 0.2 ? "center" : cosA > 0 ? "left" : "right";
    doc.text(ESCALA_EVALUACION[key].nombre, lx, ly, { align });
  });
}

export function exportEvaluacionPDF(data: EvaluacionPDFData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setTextColor(...SLATE_800);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Reporte de Evaluación", margin, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...SLATE_600);
  doc.text(
    `Generado el ${new Date().toLocaleDateString("es-AR")}`,
    pageWidth - margin,
    50,
    { align: "right" }
  );

  doc.setDrawColor(...SLATE_300);
  doc.setLineWidth(0.6);
  doc.line(margin, 60, pageWidth - margin, 60);

  doc.setTextColor(...SLATE_800);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    `${data.jugadorApellido}, ${data.jugadorNombre}`,
    margin,
    82
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_600);
  doc.text(`Categoría: ${data.jugadorCategoria}`, margin, 98);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_800);
  const promedioLabel = `Promedio: ${data.promedio.toFixed(2)} / 5`;
  doc.text(promedioLabel, pageWidth - margin, 82, { align: "right" });

  const meta: [string, string][] = [
    ["Tipo", data.tipoNombre ?? "—"],
    ["Fecha", fechaCorta(data.fecha)],
    ["Temporada", data.temporada ?? "—"],
    ["Evaluador", data.evaluadorNombre ?? "—"],
  ];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_600);
  const colWidth = (pageWidth - margin * 2) / meta.length;
  meta.forEach(([label, value], i) => {
    const x = margin + i * colWidth;
    doc.setTextColor(...SLATE_600);
    doc.text(label.toUpperCase(), x, 122);
    doc.setTextColor(...SLATE_800);
    doc.setFont("helvetica", "bold");
    doc.text(value, x, 136);
    doc.setFont("helvetica", "normal");
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...SLATE_800);
  doc.text("Perfil de rendimiento", margin, 165);

  const radarCenterY = 250;
  const radarRadius = 65;
  drawRadar(doc, pageWidth / 2, radarCenterY, radarRadius, data.niveles);

  const tableStart = radarCenterY + radarRadius + 40;

  autoTable(doc, {
    startY: tableStart,
    margin: { left: margin, right: margin },
    head: [["Dimensión", "Nivel", "Etapa", "Descripción", "Comentario"]],
    body: DIMENSION_KEYS.map((key) => {
      const meta = ESCALA_EVALUACION[key];
      const nivel = Math.max(1, Math.min(5, data.niveles[key] || 1)) as
        | 1
        | 2
        | 3
        | 4
        | 5;
      const niv = meta.niveles[nivel];
      return [
        meta.nombre,
        String(nivel),
        niv.etapa,
        niv.descripcion,
        data.comentarios[key]?.trim() || "—",
      ];
    }),
    styles: { fontSize: 9, cellPadding: 6, valign: "top" },
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: "bold" },
      1: { cellWidth: 38, halign: "center" },
      2: { cellWidth: 90 },
      3: { cellWidth: 130 },
    },
  });

  if (data.observacionesGenerales?.trim()) {
    type AutoTableDoc = jsPDF & { lastAutoTable?: { finalY?: number } };
    const lastY = (doc as AutoTableDoc).lastAutoTable?.finalY ?? tableStart;
    let y = lastY + 24;
    if (y > 740) {
      doc.addPage();
      y = 60;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...SLATE_800);
    doc.text("Observaciones generales", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...SLATE_600);
    const text = doc.splitTextToSize(
      data.observacionesGenerales.trim(),
      pageWidth - margin * 2
    );
    doc.text(text, margin, y);
  }

  const fileName = `evaluacion-${data.jugadorApellido}-${data.jugadorNombre}-${data.fecha}.pdf`
    .replace(/\s+/g, "-")
    .toLowerCase();
  doc.save(fileName);
}
