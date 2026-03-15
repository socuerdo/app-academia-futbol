"use client";

import Link from "next/link";

interface Stats {
  jugadoresActivos: number;
  presentesHoy: number;
  pctAsistenciaMes: number;
  alertasBajaAsistencia: number;
}

interface JugadorBaja {
  id: string;
  nombre: string;
  apellido: string;
  categoria: string;
  dni: string;
  pct: number;
}

interface DashboardPrincipalProps {
  stats: Stats;
  jugadoresBajaAsistencia: JugadorBaja[];
  rol: "admin" | "profesor";
}

const accesosAdmin = [
  { label: "Cargar jugador", href: "/dashboard/jugadores/cargar" },
  { label: "Cargar asistencias", href: "/dashboard/asistencias/cargar" },
  { label: "Reportes", href: "/dashboard/asistencias/reportes" },
  { label: "Gestión de usuarios", href: "/dashboard/administracion/usuarios" },
];

const accesosProfesor = [
  { label: "Cargar jugador", href: "/dashboard/jugadores/cargar" },
  { label: "Cargar asistencias", href: "/dashboard/asistencias/cargar" },
  { label: "Reportes", href: "/dashboard/asistencias/reportes" },
];

export function DashboardPrincipal({
  stats,
  jugadoresBajaAsistencia,
  rol,
}: DashboardPrincipalProps) {
  const accesos = rol === "admin" ? accesosAdmin : accesosProfesor;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ borderTopWidth: 4, borderTopColor: "var(--color-primary)" }}
        >
          <p className="text-sm font-medium text-slate-500">Jugadores activos</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.jugadoresActivos}</p>
        </div>
        <div
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ borderTopWidth: 4, borderTopColor: "var(--color-primary)" }}
        >
          <p className="text-sm font-medium text-slate-500">Presentes hoy</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.presentesHoy}</p>
        </div>
        <div
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ borderTopWidth: 4, borderTopColor: "var(--color-primary)" }}
        >
          <p className="text-sm font-medium text-slate-500">% asistencia del mes</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.pctAsistenciaMes}%</p>
        </div>
        <div
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ borderTopWidth: 4, borderTopColor: "var(--color-primary)" }}
        >
          <p className="text-sm font-medium text-slate-500">Alertas (&lt;70% mes)</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{stats.alertasBajaAsistencia}</p>
        </div>
      </div>

      {jugadoresBajaAsistencia.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <h2 className="px-4 py-3 text-sm font-semibold text-slate-800 border-b border-slate-100">
            Jugadores con asistencia &lt; 70% en el mes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-left py-2 px-4">Apellido</th>
                  <th className="text-left py-2 px-4">Nombre</th>
                  <th className="text-left py-2 px-4">Categoría</th>
                  <th className="text-left py-2 px-4">DNI</th>
                  <th className="text-right py-2 px-4">% mes</th>
                  <th className="text-right py-2 px-4">Acción</th>
                </tr>
              </thead>
              <tbody>
                {jugadoresBajaAsistencia.map((j) => (
                  <tr key={j.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-4">{j.apellido}</td>
                    <td className="py-2 px-4">{j.nombre}</td>
                    <td className="py-2 px-4">{j.categoria}</td>
                    <td className="py-2 px-4">{j.dni}</td>
                    <td className="py-2 px-4 text-right font-medium">{j.pct}%</td>
                    <td className="py-2 px-4 text-right">
                      <Link
                        href={`/dashboard/jugadores/buscar?dni=${encodeURIComponent(j.dni)}`}
                        className="font-medium hover:underline"
                        style={{ color: "var(--color-primary)" }}
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Accesos rápidos</h2>
        <div className="flex flex-wrap gap-2">
          {accesos.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
