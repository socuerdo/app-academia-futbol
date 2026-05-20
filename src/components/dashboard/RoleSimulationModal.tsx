"use client";

import { startRoleSimulation } from "@/app/simulation-actions";
import { useRoleSimulation } from "@/hooks/useRoleSimulation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SIMULATION_ROLES = [
  {
    value: "canchero",
    label: "Canchero",
    description: "Dashboard de canchas y reservas",
    path: "/canchero",
  },
  {
    value: "profesor",
    label: "Profesor",
    description: "Cargar asistencias y evaluaciones",
    path: "/dashboard",
  },
  {
    value: "secretaria",
    label: "Secretaría",
    description: "Jugadores, cuotas y reportes",
    path: "/dashboard",
  },
] as const;

interface RoleSimulationModalProps {
  rol: string;
  onClose: () => void;
}

export function RoleSimulationModal({ rol, onClose }: RoleSimulationModalProps) {
  const [mounted, setMounted] = useState(false);
  const { simulateRole } = useRoleSimulation();

  useEffect(() => { setMounted(true); }, []);

  async function handleSelect(selected: (typeof SIMULATION_ROLES)[number]) {
    await startRoleSimulation(selected.value);
    simulateRole(selected.value, rol, "/dashboard");
    onClose();
    if (window.location.pathname.startsWith(selected.path)) {
      window.location.reload();
    } else {
      window.location.href = selected.path;
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-sm w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">Cambiar rol a...</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Vas a ver la app como si tuvieras este rol. Tu rol real no cambia.
          </p>
        </div>
        <div className="p-3 space-y-1.5">
          {SIMULATION_ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <p className="text-sm font-medium text-slate-800">{r.label}</p>
              <p className="text-xs text-slate-500">{r.description}</p>
            </button>
          ))}
        </div>
        <div className="p-3 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
