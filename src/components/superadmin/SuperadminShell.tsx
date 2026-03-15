"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const SUPERADMIN_MENU = [
  { label: "Dashboard", href: "/superadmin" },
  { label: "Clubes", href: "/superadmin/clubes" },
  { label: "Usuarios", href: "/superadmin/usuarios" },
];

interface SuperadminShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string | undefined;
}

export function SuperadminShell({
  children,
  userName,
  userEmail,
}: SuperadminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200 bg-slate-800"
        style={{ backgroundColor: "var(--color-sidebar, #1e293b)" }}
      >
        <div className="p-4 border-b border-white/10">
          <Link href="/superadmin" className="flex items-center gap-2">
            <span className="text-white font-bold text-lg">Superadmin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {SUPERADMIN_MENU.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/20 text-white"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 flex flex-col transform transition-transform duration-200 md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ backgroundColor: "var(--color-sidebar, #1e293b)" }}
      >
        <div className="p-4 border-b border-white/10">
          <Link
            href="/superadmin"
            onClick={() => setMobileOpen(false)}
            className="text-white font-bold text-lg"
          >
            Superadmin
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {SUPERADMIN_MENU.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 flex items-center justify-between px-4 gap-4 border-b-2 border-slate-800 bg-white">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{userName || userEmail}</p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium text-white bg-slate-800">
              Superadmin
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
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
