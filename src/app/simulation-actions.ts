"use server";

import { cookies } from "next/headers";

const VALID_SIMULATION_ROLES = ["profesor", "secretaria", "canchero"] as const;
type SimulationRole = (typeof VALID_SIMULATION_ROLES)[number];

export async function startRoleSimulation(role: string): Promise<void> {
  if (!VALID_SIMULATION_ROLES.includes(role as SimulationRole)) return;
  const cookieStore = await cookies();
  cookieStore.set("simulated_role", role, {
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });
}

export async function stopRoleSimulation(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("simulated_role");
}
