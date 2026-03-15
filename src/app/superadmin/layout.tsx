import { SuperadminShell } from "@/components/superadmin/SuperadminShell";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/superadmin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol, nombre_completo")
    .eq("id", user.id)
    .single();

  if (!profile || profile.rol !== "superadmin") {
    redirect("/dashboard");
  }

  const userName = profile.nombre_completo?.trim() || user.email || "";

  return (
    <div
      className="h-full"
      style={
        {
          "--color-primary": "#1e293b",
          "--color-sidebar": "#1e293b",
        } as React.CSSProperties
      }
    >
      <SuperadminShell
      userName={userName}
      userEmail={user.email ?? undefined}
    >
      {children}
    </SuperadminShell>
    </div>
  );
}
