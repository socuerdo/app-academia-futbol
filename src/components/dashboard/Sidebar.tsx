"use client";

import type { MenuItem } from "@/types/dashboard";
import {
  AlertTriangle,
  BarChart2,
  Building2,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Settings,
  Shield,
  Upload,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  menuItems: MenuItem[];
  clubNombre: string;
  clubLogoUrl: string | null;
  clubIniciales: string;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
  hasAlertas?: boolean;
}

export function Sidebar({
  menuItems,
  clubNombre,
  clubLogoUrl,
  clubIniciales,
  collapsed,
  onToggleCollapse,
  onClose,
  isMobile = false,
  hasAlertas = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const linkClass = (href: string) => {
    const active = pathname === href;
    return `group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium border-l-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
      active
        ? "border-white text-white"
        : "border-transparent text-white/85 hover:bg-white/10 hover:text-white"
    }`;
  };

  const linkIcon = (label: string, href?: string): LucideIcon => {
    const text = `${label} ${href ?? ""}`.toLowerCase();
    if (text.includes("dashboard")) return LayoutDashboard;
    if (text.includes("jugador")) return Users;
    if (text.includes("cargar asist")) return ClipboardList;
    if (text.includes("asistencia")) return BarChart2;
    if (text.includes("evaluacion")) return ClipboardList;
    if (text.includes("sede")) return MapPin;
    if (text.includes("categoria")) return Building2;
    if (text.includes("usuario")) return UserCog;
    if (text.includes("personaliz")) return Settings;
    if (text.includes("importar")) return Upload;
    if (text.includes("activar")) return Shield;
    if (text.includes("cargar jugador")) return UserPlus;
    if (text.includes("alerta")) return AlertTriangle;
    return LayoutDashboard;
  };

  const isAlertItem = (label: string, href?: string) => {
    const text = `${label} ${href ?? ""}`.toLowerCase();
    return text.includes("alerta");
  };

  const handleLinkClick = () => {
    if (isMobile && onClose) onClose();
  };

  return (
    <aside
      className={`
        flex flex-col h-full
        ${isMobile ? "w-72" : collapsed ? "w-16" : "w-64"}
        transition-all duration-300 ease-in-out
      `}
      style={{ backgroundColor: "var(--color-sidebar, #2c3e50)" }}
    >
      {/* Logo / nombre del club */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <Link
          href="/dashboard"
          onClick={handleLinkClick}
          className="flex items-center gap-3 overflow-hidden"
        >
          {clubLogoUrl ? (
            <img
              src={clubLogoUrl}
              alt={clubNombre}
              className="h-9 w-9 rounded-lg object-contain shrink-0"
            />
          ) : (
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
              style={{ backgroundColor: "var(--color-primary, #c0392b)" }}
            >
              {clubIniciales}
            </div>
          )}
          {(!collapsed || isMobile) && (
            <span className="text-white font-semibold truncate">{clubNombre}</span>
          )}
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => {
          if (item.type === "link") {
            const Icon = linkIcon(item.label, item.href);
            const showAlertBadge = hasAlertas && isAlertItem(item.label, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={linkClass(item.href)}
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                {showAlertBadge && (
                  <span className="ml-auto inline-flex h-2.5 w-2.5 rounded-full bg-rose-300 animate-pulse" />
                )}
              </Link>
            );
          }
          if (item.type === "group") {
            const isOpen = openGroups[item.label] ?? true;
            const groupId = `group-${item.label}`;
            const GroupIcon = linkIcon(item.label);
            return (
              <div key={groupId} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.label)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  title={collapsed && !isMobile ? item.label : undefined}
                  aria-label={`Alternar grupo ${item.label}`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <GroupIcon className="h-4 w-4 shrink-0" aria-hidden />
                    {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                  </span>
                  {(!collapsed || isMobile) && (
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  )}
                </button>
                {(!collapsed || isMobile) && isOpen && (
                  <div className="pl-3 space-y-0.5 border-l border-white/20 ml-2">
                    {item.items.map((sub) => {
                      const SubIcon = linkIcon(sub.label, sub.href);
                      const showAlertBadge = hasAlertas && isAlertItem(sub.label, sub.href);
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={handleLinkClick}
                          className={`py-1.5 px-2 rounded text-sm ${linkClass(sub.href)}`}
                        >
                          <SubIcon className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="truncate">{sub.label}</span>
                          {showAlertBadge && (
                            <span className="ml-auto inline-flex h-2.5 w-2.5 rounded-full bg-rose-300 animate-pulse" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </nav>

      {/* Botón colapsar (solo desktop) */}
      {!isMobile && onToggleCollapse && (
        <div className="p-2 border-t border-white/10">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <ChevronLeft className={`w-4 h-4 shrink-0 ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed && <span>Colapsar</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
