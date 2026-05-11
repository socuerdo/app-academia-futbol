"use client";

import {
  AlertTriangle,
  BarChart2,
  Cake,
  CheckCircle,
  ClipboardList,
  DollarSign,
  UserCog,
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

interface JugadorCumpleanios {
  id: string;
  nombre: string;
  apellido: string;
  categoria: string;
  fecha_nacimiento: string;
  dias: number;
}

type Rol = "admin" | "superadmin" | "profesor" | "secretaria";

interface DashboardPrincipalProps {
  stats: Stats;
  jugadoresBajaAsistencia: JugadorBaja[];
  proxCumpleanios?: JugadorCumpleanios[];
  rol: Rol;
}

const accesosAdmin = [
  {
    label: "Jugadores",
    desc: "Gestionar y consultar el plantel",
    href: "/dashboard/jugadores",
    Icon: Users,
  },
  {
    label: "Cargar asistencias",
    desc: "Registrar presentes y ausentes",
    href: "/dashboard/asistencias",
    Icon: CheckCircle,
  },
  {
    label: "Reportes",
    desc: "Ver métricas y evolución mensual",
    href: "/dashboard/asistencias?tab=reporte",
    Icon: BarChart2,
  },
  {
    label: "Gestión de usuarios",
    desc: "Administrar accesos del staff",
    href: "/dashboard/usuarios",
    Icon: UserCog,
  },
];

const accesosProfesor = [
  {
    label: "Cargar asistencias",
    desc: "Registrar presentes y ausentes",
    href: "/dashboard/asistencias",
    Icon: CheckCircle,
  },
  {
    label: "Reportes",
    desc: "Ver métricas y evolución mensual",
    href: "/dashboard/asistencias?tab=reporte",
    Icon: BarChart2,
  },
  {
    label: "Evaluaciones",
    desc: "Ver y registrar evaluaciones",
    href: "/dashboard/evaluaciones",
    Icon: ClipboardList,
  },
];

const accesosSecretaria = [
  {
    label: "Jugadores",
    desc: "Consultar y gestionar plantel",
    href: "/dashboard/jugadores",
    Icon: Users,
  },
  {
    label: "Cobrar cuotas",
    desc: "Registrar pagos del período",
    href: "/dashboard/cuotas",
    Icon: DollarSign,
  },
  {
    label: "Morosidad",
    desc: "Jugadores con cuota pendiente",
    href: "/dashboard/cuotas?tab=morosidad",
    Icon: AlertTriangle,
  },
];

function getAccesos(rol: Rol) {
  if (rol === "admin" || rol === "superadmin") return accesosAdmin;
  if (rol === "secretaria") return accesosSecretaria;
  return accesosProfesor;
}

const MESES_CORTOS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function labelDias(dias: number): string {
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  return `En ${dias} días`;
}

export function DashboardPrincipal({
  stats,
  jugadoresBajaAsistencia,
  proxCumpleanios = [],
  rol,
}: DashboardPrincipalProps) {
  const accesos = getAccesos(rol);
  const canVerCuotas = rol !== "profesor";

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
        <Link
          href="/dashboard/asistencias?tab=reporte"
          className="relative rounded-xl border border-slate-200 bg-rose-50 p-4 shadow-sm border-l-4 border-l-rose-500 hover:shadow-md transition-shadow duration-200"
        >
          <AlertTriangle className="h-9 w-9 text-rose-400 absolute right-4 top-4" aria-hidden />
          <p className="text-sm font-medium text-slate-600">Alertas (&lt;70% mes)</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.alertasBajaAsistencia}</p>
          <p className="text-xs text-slate-500 mt-1">Jugadores para seguimiento</p>
        </Link>
        {canVerCuotas ? (
          <Link
            href="/dashboard/cuotas?tab=morosidad"
            className="relative rounded-xl border border-slate-200 bg-amber-50 p-4 shadow-sm border-l-4 border-l-amber-500 hover:shadow-md transition-shadow duration-200"
          >
            <DollarSign className="h-9 w-9 text-amber-400 absolute right-4 top-4" aria-hidden />
            <p className="text-sm font-medium text-slate-600">Cuotas impagas (mes)</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.cuotasImpagas}</p>
            <p className="text-xs text-slate-500 mt-1">Jugadores con deuda actual</p>
          </Link>
        ) : (
          <div className="relative rounded-xl border border-slate-200 bg-amber-50 p-4 shadow-sm border-l-4 border-l-amber-500">
            <DollarSign className="h-9 w-9 text-amber-400 absolute right-4 top-4" aria-hidden />
            <p className="text-sm font-medium text-slate-600">Cuotas impagas (mes)</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.cuotasImpagas}</p>
            <p className="text-xs text-slate-500 mt-1">Jugadores con deuda actual</p>
          </div>
        )}
      </div>

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
              <span className="text-xs text-slate-500 line-clamp-1">{a.desc}</span>
            </Link>
          ))}
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
                  <th className="text-left py-2 px-4 hidden sm:table-cell">DNI</th>
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
                    <td className="py-2 px-4 hidden sm:table-cell">{j.dni}</td>
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
                        href={`/dashboard/asistencias?tab=jugador&jugador=${encodeURIComponent(j.id)}`}
                        className="font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded"
                        style={{ color: "var(--color-primary)" }}
                      >
                        Ver reporte
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {proxCumpleanios.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 shadow-sm overflow-hidden">
          <h2 className="px-4 py-3 text-sm font-semibold text-orange-800 border-b border-orange-100 flex items-center gap-2">
            <Cake className="h-4 w-4" aria-hidden />
            Próximos cumpleaños (14 días)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-orange-50 text-orange-700">
                  <th className="text-left py-2 px-4">Jugador</th>
                  <th className="text-left py-2 px-4">Categoría</th>
                  <th className="text-left py-2 px-4">Fecha</th>
                  <th className="text-left py-2 px-4">Cuándo</th>
                </tr>
              </thead>
              <tbody>
                {proxCumpleanios.map((j) => {
                  const parts = j.fecha_nacimiento.split("-");
                  const dia = Number(parts[2]);
                  const mes = MESES_CORTOS[Number(parts[1]) - 1];
                  return (
                    <tr key={j.id} className="border-t border-orange-100 hover:bg-orange-100/40">
                      <td className="py-2 px-4 font-medium text-slate-800">{j.apellido}, {j.nombre}</td>
                      <td className="py-2 px-4 text-slate-600">{j.categoria}</td>
                      <td className="py-2 px-4 text-slate-600">{dia} de {mes}</td>
                      <td className="py-2 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          j.dias === 0 ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-700"
                        }`}>
                          {labelDias(j.dias)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
