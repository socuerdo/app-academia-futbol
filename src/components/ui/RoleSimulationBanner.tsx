"use client";

import { useRoleSimulation } from "@/hooks/useRoleSimulation";
import { useRouter } from "next/navigation";

const ROL_LABELS: Record<string, string> = {
  canchero: "Canchero",
  profesor: "Profesor",
  secretaria: "Secretaría",
  admin: "Admin",
  superadmin: "Superadmin",
};

export function RoleSimulationBanner() {
  const { isSimulating, simulatedRole, returnPath, clearSimulation } = useRoleSimulation();
  const router = useRouter();

  if (!isSimulating || !simulatedRole) return null;

  function handleReturn() {
    clearSimulation();
    router.push(returnPath);
  }

  return (
    <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <span className="text-amber-700 font-medium">
          <span className="sm:hidden">Ves como:</span>
          <span className="hidden sm:inline">Estás viendo como:</span>
        </span>
        <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-semibold text-xs">
          {ROL_LABELS[simulatedRole] ?? simulatedRole}
        </span>
        <span className="text-amber-600 text-xs hidden sm:inline">Tu rol real no cambió.</span>
      </div>
      <button
        type="button"
        onClick={handleReturn}
        className="shrink-0 px-3 py-1 rounded-lg text-xs font-medium bg-amber-200 text-amber-800 hover:bg-amber-300 transition-colors"
      >
        <span className="sm:hidden">Salir</span>
        <span className="hidden sm:inline">Volver a mi rol</span>
      </button>
    </div>
  );
}
