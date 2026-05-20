"use client";

import { CANCHAS } from "@/lib/canchas";
import type { TurnoAlquiler, TurnoEscuela } from "@/lib/canchas";

interface VistaHoyTabProps {
  turnosAlquiler: TurnoAlquiler[];
  turnosEscuela: TurnoEscuela[];
  now: Date;
}

function getCurrentSlot(now: Date): string {
  const h = now.getHours().toString().padStart(2, "0");
  return `${h}:00`;
}

function getEscuelaSlot(now: Date): string {
  const totalMin = now.getHours() * 60 + now.getMinutes();
  const slots = [570, 600, 630, 660, 690, 720, 750, 780, 810, 840, 870, 900, 930, 960, 990, 1020, 1050, 1080, 1110, 1140, 1170, 1200];
  for (let i = slots.length - 1; i >= 0; i--) {
    if (totalMin >= slots[i]) {
      const h = Math.floor(slots[i] / 60).toString().padStart(2, "0");
      const m = (slots[i] % 60).toString().padStart(2, "0");
      return `${h}:${m}`;
    }
  }
  return `${now.getHours().toString().padStart(2, "0")}:00`;
}

export function VistaHoyTab({ turnosAlquiler, turnosEscuela, now }: VistaHoyTabProps) {
  const currentAlquilerSlot = getCurrentSlot(now);
  const currentEscuelaSlot = getEscuelaSlot(now);

  const totalEfectivo = turnosAlquiler.reduce((s, t) => s + (t.efectivo ?? 0), 0);
  const totalTransferencia = turnosAlquiler.reduce((s, t) => s + (t.transferencia ?? 0), 0);

  const canchasEnUsoAlquiler = turnosAlquiler.filter((t) => t.hora === currentAlquilerSlot);
  const canchasEnUsoEscuela = turnosEscuela.filter((t) => t.hora === currentEscuelaSlot);
  const canchasEnUso = new Set([
    ...canchasEnUsoAlquiler.map((t) => t.cancha),
    ...canchasEnUsoEscuela.map((t) => t.cancha),
  ]).size;

  const stats = [
    { label: "Canchas en uso ahora", value: canchasEnUso, color: "text-green-700", bg: "bg-green-50" },
    { label: "Reservas del día", value: turnosAlquiler.length, color: "text-blue-700", bg: "bg-blue-50" },
    { label: "Efectivo del día", value: `$${totalEfectivo.toLocaleString("es-AR")}`, color: "text-emerald-700", bg: "bg-emerald-50" },
    { label: "Transferencia del día", value: `$${totalTransferencia.toLocaleString("es-AR")}`, color: "text-violet-700", bg: "bg-violet-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.bg}`}>
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CANCHAS.map((cancha) => {
          const alquiler = turnosAlquiler.find(
            (t) => t.cancha === cancha.id && t.hora === currentAlquilerSlot
          );
          const escuela = turnosEscuela.find(
            (t) => t.cancha === cancha.id && t.hora === currentEscuelaSlot
          );

          let borderColor = "#e2e8f0";
          let badgeColor = "bg-slate-100 text-slate-500";
          let badgeText = "Libre";
          let contenido: React.ReactNode = null;

          if (alquiler) {
            borderColor = "#16a34a";
            badgeColor = "bg-green-100 text-green-700";
            badgeText = "Ocupada";
            contenido = (
              <div className="mt-2 space-y-0.5">
                {alquiler.equipo1 && (
                  <p className="text-xs font-medium text-slate-700">{alquiler.equipo1}</p>
                )}
                {alquiler.equipo2 && (
                  <p className="text-xs text-slate-500">vs {alquiler.equipo2}</p>
                )}
                <p className="text-xs text-slate-400">{alquiler.hora}</p>
              </div>
            );
          } else if (escuela) {
            borderColor = "#2563eb";
            badgeColor = "bg-blue-100 text-blue-700";
            badgeText = "Escuela";
            contenido = (
              <div className="mt-2 space-y-0.5">
                {escuela.equipo_clase && (
                  <p className="text-xs font-medium text-slate-700">{escuela.equipo_clase}</p>
                )}
                {escuela.profesor && (
                  <p className="text-xs text-slate-500">{escuela.profesor}</p>
                )}
                <p className="text-xs text-slate-400">{escuela.hora}</p>
              </div>
            );
          }

          return (
            <div
              key={cancha.id}
              className="bg-white rounded-xl p-4 border-l-4 shadow-sm"
              style={{ borderLeftColor: borderColor, borderTopColor: "#e2e8f0", borderRightColor: "#e2e8f0", borderBottomColor: "#e2e8f0", borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-800">{cancha.label}</p>
                  <p className="text-xs text-slate-400">{cancha.tipo}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}>
                  {badgeText}
                </span>
              </div>
              {contenido}
            </div>
          );
        })}
      </div>
    </div>
  );
}
