"use client";

import type { MenuItem } from "@/types/dashboard";
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
}: SidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const linkClass = (href: string) => {
    const active = pathname === href;
    return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? "bg-white/20 text-white"
        : "text-white/85 hover:bg-white/10 hover:text-white"
    }`;
  };

  const handleLinkClick = () => {
    if (isMobile && onClose) onClose();
  };

  return (
    <aside
      className={`
        flex flex-col h-full
        ${isMobile ? "w-72" : collapsed ? "w-16" : "w-64"}
        transition-all duration-200 ease-in-out
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
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={linkClass(item.href)}
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <span className="truncate">{item.label}</span>
              </Link>
            );
          }
          if (item.type === "group") {
            const isOpen = openGroups[item.label] ?? true;
            const groupId = `group-${item.label}`;
            return (
              <div key={groupId} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.label)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
                  title={collapsed && !isMobile ? item.label : undefined}
                >
                  <span className="truncate">{item.label}</span>
                  {(!collapsed || isMobile) && (
                    <svg
                      className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
                {(!collapsed || isMobile) && isOpen && (
                  <div className="pl-3 space-y-0.5 border-l border-white/20 ml-2">
                    {item.items.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={handleLinkClick}
                        className={`block py-1.5 px-2 rounded text-sm ${linkClass(sub.href)}`}
                      >
                        {sub.label}
                      </Link>
                    ))}
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 text-sm"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <svg
              className={`w-4 h-4 shrink-0 ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {!collapsed && <span>Colapsar</span>}
          </button>
        </div>
      )}
    </aside>
  );
}
