"use client";

import { useRoleSimulation } from "@/hooks/useRoleSimulation";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
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

interface RoleSimulationTriggerProps {
  rol: string;
}

export function RoleSimulationTrigger({ rol }: RoleSimulationTriggerProps) {
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { simulateRole } = useRoleSimulation();

  useEffect(() => { setMounted(true); }, []);

  function handleSelect(selected: (typeof SIMULATION_ROLES)[number]) {
    simulateRole(selected.value, rol, "/dashboard");
    setShowModal(false);
    router.push(selected.path);
  }

  return (
    <>
      <button
        type="button"
        role="menuitem"
        onClick={() => setShowModal(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
      >
        <ShieldCheck className="w-4 h-4 text-slate-500" />
        Cambiar rol a...
      </button>

      {showModal && mounted && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowModal(false)}
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
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
