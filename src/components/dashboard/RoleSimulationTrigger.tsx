"use client";

import { ShieldCheck } from "lucide-react";

interface RoleSimulationTriggerProps {
  onOpen: () => void;
}

export function RoleSimulationTrigger({ onOpen }: RoleSimulationTriggerProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onOpen}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
    >
      <ShieldCheck className="w-4 h-4 text-slate-500" />
      Cambiar rol a...
    </button>
  );
}
