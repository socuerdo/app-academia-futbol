"use client";

import {
  AlertTriangle,
  BarChart2,
  CheckCircle,
  ClipboardList,
  DollarSign,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  jugadoresActivos: number;
  presentesHoy: number;
  pctAsistenciaMes: number;
  alertasBajaAsistencia: number;
  cuotasImpagas: number;
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
  {
    label: "Cargar jugador",
    desc: "Alta rápida de nuevos jugadores",
    href: "/dashboard/jugadores/cargar",
    Icon: UserPlus,
  },
  {
    label: "Cargar asistencias",
    desc: "Registrar presentes y ausentes",
    href: "/dashboard/asistencias/cargar",
    Icon: CheckCircle,
  },
  {
    label: "Reportes",
    desc: "Ver métricas y evolución mensual",
    href: "/dashboard/asistencias/reportes",
    Icon: BarChart2,
  },
  {
    label: "Gestión de usuarios",
    desc: "Administrar accesos del staff",
    href: "/dashboard/administracion/usuarios",
    Icon: UserCog,
  },
];

const accesosProfesor = [
  {
    label: "Cargar jugador",
    desc: "Alta rápida de nuevos jugadores",
    href: "/dashboard/jugadores/cargar",
    Icon: UserPlus,
  },
  {
    label: "Cargar asistencias",
    desc: "Registrar presentes y ausentes",
    href: "/dashboard/asistencias/cargar",
    Icon: CheckCircle,
  },
  {
    label: "Reportes",
    desc: "Ver métricas y evolución mensual",
    href: "/dashboard/asistencias/reportes",
    Icon: BarChart2,
  },
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative rounded-xl border border-slate-200 bg-blue-50 p-4 shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow duration-200">
          <Users className="h-9 w-9 text-blue-400 absolute right-4 top-4" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Jugadores activos</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.jugadoresActivos}</p>
          <p className="text-xs text-slate-500 mt-1">Total habilitado para entrenar</p>
        </div>
        <div className="relative rounded-xl border border-slate-200 bg-emerald-50 p-4 shadow-sm border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow duration-200">
          <CheckCircle className="h-9 w-9 text-emerald-400 absolute right-4 top-4" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Presentes hoy</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.presentesHoy}</p>
          <p className="text-xs text-slate-500 mt-1">Asistencia diaria registrada</p>
        </div>
        <div className="relative rounded-xl border border-slate-200 bg-violet-50 p-4 shadow-sm border-l-4 border-l-violet-500 hover:shadow-md transition-shadow duration-200">
          <BarChart2 className="h-9 w-9 text-violet-400 absolute right-4 top-4" aria-hidden />
          <p className="text-sm font-medium text-slate-600">% asistencia del mes</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.pctAsistenciaMes}%</p>
          <p className="text-xs text-slate-500 mt-1">Promedio mensual del club</p>
        </div>
        <div className="relative rounded-xl border border-slate-200 bg-rose-50 p-4 shadow-sm border-l-4 border-l-rose-500 hover:shadow-md transition-shadow duration-200">
          <AlertTriangle className="h-9 w-9 text-rose-400 absolute right-4 top-4" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Alertas (&lt;70% mes)</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.alertasBajaAsistencia}</p>
          <p className="text-xs text-slate-500 mt-1">Jugadores para seguimiento</p>
        </div>
        <Link
          href="/dashboard/cuotas/morosidad"
          className="relative rounded-xl border border-slate-200 bg-amber-50 p-4 shadow-sm border-l-4 border-l-amber-500 hover:shadow-md transition-shadow duration-200"
        >
          <DollarSign className="h-9 w-9 text-amber-400 absolute right-4 top-4" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Cuotas impagas (mes)</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.cuotasImpagas}</p>
          <p className="text-xs text-slate-500 mt-1">Jugadores con deuda actual</p>
        </Link>
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
                {jugadoresBajaAsistencia.map((j, idx) => (
                  <tr
                    key={j.id}
                    className={`border-t border-slate-100 hover:bg-slate-50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    }`}
                  >
                    <td className="py-2 px-4">{j.apellido}</td>
                    <td className="py-2 px-4">{j.nombre}</td>
                    <td className="py-2 px-4">{j.categoria}</td>
                    <td className="py-2 px-4">{j.dni}</td>
                    <td className="py-2 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full ${
                              j.pct < 50 ? "bg-rose-500" : j.pct < 70 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, j.pct))}%` }}
                          />
                        </div>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            j.pct < 50
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {j.pct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <Link
                        href={`/dashboard/jugadores/buscar?dni=${encodeURIComponent(j.dni)}`}
                        className="font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {accesos.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col gap-1 hover:shadow-md hover:scale-[1.02] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <a.Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-slate-800">{a.label}</span>
              <span className="text-xs text-slate-500">{a.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
