"use client";

import type { Rol } from "@/types/database";
import { Bell, Cake, LogOut, Menu, Slash, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface TopbarProps {
  userName: string;
  userEmail: string | undefined;
  userPhotoUrl?: string | null;
  rol: Rol;
  onMenuClick: () => void;
  cumpleaniosCount?: number;
}

const rolLabels: Record<Rol, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  profesor: "Profesor",
  secretaria: "Secretaría",
  canchero: "Canchero",
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
  cumpleaniosCount = 0,
}: TopbarProps) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = segments.slice(1).map(formatSegment);
  const initials = getInitials(userName || userEmail);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
        {cumpleaniosCount > 0 && (
          <a
            href="/dashboard"
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            aria-label={`${cumpleaniosCount} cumpleaños próximos`}
            title={`${cumpleaniosCount} cumpleaños en los próximos 14 días`}
          >
            <Cake className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {cumpleaniosCount}
            </span>
          </a>
        )}
        <button
          type="button"
          disabled
          className="relative p-2 rounded-lg text-slate-300 cursor-not-allowed"
          aria-label="Notificaciones (próximamente)"
          title="Notificaciones (próximamente)"
        >
          <Bell className="w-5 h-5" />
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

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Abrir menú de usuario"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="h-9 w-9 rounded-full overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center text-xs font-semibold text-slate-700 border border-slate-300 hover:ring-2 hover:ring-offset-1 transition-shadow"
            style={{ ["--tw-ring-color" as string]: "var(--color-primary, #c0392b)" }}
          >
            {userPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userPhotoUrl} alt="Avatar del usuario" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {userName || userEmail}
                </p>
                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
              </div>
              <Link
                href="/dashboard/perfil"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <User className="w-4 h-4 text-slate-500" />
                Mi perfil
              </Link>
              <form action="/api/auth/signout" method="post" className="border-t border-slate-100">
                <button
                  type="submit"
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
                >
                  <LogOut className="w-4 h-4 text-slate-500" />
                  Cerrar sesión
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
