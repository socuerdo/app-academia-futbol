"use client";

import { useCallback, useEffect, useState } from "react";

const SESSION_KEY = "role_simulation";
const COOKIE_KEY = "simulated_role";

type SimulationState = {
  simulatedRole: string;
  realRole: string;
  returnPath: string;
};

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; SameSite=Strict`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
}

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
        setCookie(COOKIE_KEY, simulatedRole);
      } catch {}
      setSimulation(state);
    },
    []
  );

  const clearSimulation = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      deleteCookie(COOKIE_KEY);
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
