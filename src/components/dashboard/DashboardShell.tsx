"use client";

import type { Club } from "@/types/database";
import type { MenuItem } from "@/types/dashboard";
import { useCallback, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface DashboardUser {
  id: string;
  email?: string;
}

interface DashboardShellProps {
  children: React.ReactNode;
  club: Club;
  user: DashboardUser;
  userName: string;
  rol: "admin" | "profesor";
  menuItems: MenuItem[];
}

export function DashboardShell({
  children,
  club,
  user,
  userName,
  rol,
  menuItems,
}: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div
      className="flex h-screen overflow-hidden bg-slate-50"
      style={
        {
          "--color-primary": club.color_primario,
          "--color-sidebar": club.color_sidebar,
        } as React.CSSProperties
      }
    >
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col shrink-0">
        <Sidebar
          menuItems={menuItems}
          clubNombre={club.nombre}
          clubLogoUrl={club.logo_url}
          clubIniciales={club.iniciales}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          isMobile={false}
        />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar
          menuItems={menuItems}
          clubNombre={club.nombre}
          clubLogoUrl={club.logo_url}
          clubIniciales={club.iniciales}
          collapsed={false}
          onClose={closeMobile}
          isMobile
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          userName={userName}
          userEmail={user.email}
          rol={rol}
          onMenuClick={openMobile}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>

    </div>
  );
}
