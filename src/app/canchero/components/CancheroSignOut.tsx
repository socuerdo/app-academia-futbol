"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function CancheroSignOut() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
    >
      Salir
    </button>
  );
}
