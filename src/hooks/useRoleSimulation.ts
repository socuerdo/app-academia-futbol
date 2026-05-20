"use client";

import { useCallback, useEffect, useState } from "react";

const SESSION_KEY = "role_simulation";

type SimulationState = {
  simulatedRole: string;
  realRole: string;
  returnPath: string;
};

export function useRoleSimulation() {
  const [simulation, setSimulation] = useState<SimulationState | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) setSimulation(JSON.parse(raw));
    } catch {}
  }, []);

  const simulateRole = useCallback(
    (simulatedRole: string, realRole: string, returnPath: string) => {
      const state: SimulationState = { simulatedRole, realRole, returnPath };
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
      } catch {}
      setSimulation(state);
    },
    []
  );

  const clearSimulation = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
    setSimulation(null);
  }, []);

  return {
    isSimulating: simulation !== null,
    simulatedRole: simulation?.simulatedRole ?? null,
    returnPath: simulation?.returnPath ?? "/dashboard",
    simulateRole,
    clearSimulation,
  };
}
