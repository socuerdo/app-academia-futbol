"use client";

import { eliminarEvaluacion } from "@/app/dashboard/evaluaciones/actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface Props {
  id: string;
  redirectTo?: string;
}

export function EliminarEvaluacionButton({ id, redirectTo }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Eliminar esta evaluación? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      const res = await eliminarEvaluacion(id);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      router.push(redirectTo ?? "/dashboard/evaluaciones");
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
    >
      {pending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
