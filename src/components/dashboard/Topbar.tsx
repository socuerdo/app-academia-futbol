"use client";

import type { Rol } from "@/types/database";
import { Bell, LogOut, Menu, Slash } from "lucide-react";
import { usePathname } from "next/navigation";

interface TopbarProps {
  userName: string;
  userEmail: string | undefined;
  userPhotoUrl?: string | null;
  rol: Rol;
  onMenuClick: () => void;
}

const rolLabels: Record<Rol, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  profesor: "Profesor",
};

function formatSegment(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getInitials(nameOrEmail?: string): string {
  if (!nameOrEmail) return "?";
  const base = nameOrEmail.includes("@") ? nameOrEmail.split("@")[0] : nameOrEmail;
  const parts = base.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function Topbar({
  userName,
  userEmail,
  userPhotoUrl,
  rol,
  onMenuClick,
}: TopbarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = segments.slice(1).map(formatSegment);
  const initials = getInitials(userName || userEmail);

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 gap-4 bg-white/90 backdrop-blur border-b border-slate-200/70 shadow-sm">
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        aria-label="Abrir menú"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex-1 min-w-0 hidden md:flex items-center text-sm text-slate-500">
        <span className="font-medium text-slate-700">Dashboard</span>
        {breadcrumbItems.map((item) => (
          <span key={item} className="inline-flex items-center">
            <Slash className="h-3.5 w-3.5 mx-1.5 text-slate-400" />
            <span className="truncate max-w-[160px]">{item}</span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
        </button>
        <div className="hidden sm:block text-right min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{userName || userEmail}</p>
          <p className="text-xs text-slate-500 truncate">{userEmail}</p>
        </div>
        <span
          className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white shrink-0"
          style={{ backgroundColor: "var(--color-primary, #c0392b)" }}
        >
          {rolLabels[rol]}
        </span>
        <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center text-xs font-semibold text-slate-700 border border-slate-300">
          {userPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userPhotoUrl} alt="Avatar del usuario" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </form>
      </div>
    </header>
  );
}
