"use client";

import type { Rol } from "@/types/database";

interface TopbarProps {
  userName: string;
  userEmail: string | undefined;
  rol: Rol;
  onMenuClick: () => void;
}

const rolLabels: Record<Rol, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  profesor: "Profesor",
};

export function Topbar({ userName, userEmail, rol, onMenuClick }: TopbarProps) {
  return (
    <header
      className="h-14 shrink-0 flex items-center justify-between px-4 gap-4 border-b border-slate-200 bg-white"
      style={{ borderBottomColor: "var(--color-primary, #c0392b)", borderBottomWidth: 2 }}
    >
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        aria-label="Abrir menú"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1 min-w-0" />

      <div className="flex items-center gap-3">
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
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title="Cerrar sesión"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
}
