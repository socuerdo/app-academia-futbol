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
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { esAdminOAuditor } from "@/lib/permisos";

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
  faltas: number;
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
  if (esAdminOAuditor(rol)) return accesosAdmin;
  if (rol === "secretaria") return accesosSecretaria;
  return accesosProfesor;
}

const MESES_CORTOS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function labelDias(dias: number): string {
  if (dias === 0) return "Hoy";
  if (dias === 1) return "Mañana";
  if (dias === -1) return "Ayer";
  if (dias < 0) return `Hace ${Math.abs(dias)} días`;
  return `En ${dias} días`;
}

// "club" es blanco con el ícono en el color del club; el tinte de fondo queda reservado a los estados (verde, rojo, ámbar).
const TONOS = {
  club: { bg: "bg-white", icon: "" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-700" },
  rose: { bg: "bg-rose-50", icon: "text-rose-700" },
  amber: { bg: "bg-amber-50", icon: "text-amber-700" },
} as const;

function StatCard({
  tone,
  Icon,
  label,
  value,
  hint,
  href,
}: {
  tone: keyof typeof TONOS;
  Icon: LucideIcon;
  label: string;
  value: number | string;
  hint: string;
  href?: string;
}) {
  const t = TONOS[tone];
  const esClub = tone === "club";
  const contenido = (
    <>
      <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon
          className={`h-4 w-4 shrink-0 ${t.icon}`}
          style={esClub ? { color: "var(--color-primary)" } : undefined}
          aria-hidden
        />
        <span>{label}</span>
      </p>
      <p className="mt-2 font-display text-5xl font-extrabold italic leading-none text-slate-900">{value}</p>
      <p className="mt-1 hidden text-xs text-slate-600 sm:block">{hint}</p>
    </>
  );
  const className = `rounded-xl border border-slate-200 ${t.bg} p-3 sm:p-4 shadow-sm transition-shadow duration-200`;
  return href ? (
    <Link
      href={href}
      className={`${className} block hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300`}
    >
      {contenido}
    </Link>
  ) : (
    <div className={className}>{contenido}</div>
  );
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
      <h1 className="font-display text-4xl font-extrabold uppercase italic leading-none tracking-tight text-slate-900">Dashboard</h1>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-display text-xl font-extrabold uppercase italic tracking-wide text-slate-800">Accesos rápidos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {accesos.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 min-h-[44px] flex flex-col gap-1 hover:shadow-md hover:scale-[1.02] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <a.Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-slate-800">{a.label}</span>
              <span className="text-xs text-slate-600 line-clamp-1">{a.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          tone="club"
          Icon={Users}
          label="Jugadores activos"
          value={stats.jugadoresActivos}
          hint="Total habilitado para entrenar"
        />
        <StatCard
          tone="emerald"
          Icon={CheckCircle}
          label="Presentes hoy"
          value={stats.presentesHoy}
          hint="Asistencia diaria registrada"
        />
        <StatCard
          tone="club"
          Icon={BarChart2}
          label="% asistencia del mes"
          value={`${stats.pctAsistenciaMes}%`}
          hint="Promedio mensual del club"
        />
        <StatCard
          tone="rose"
          Icon={AlertTriangle}
          label="Alertas (<70% mes)"
          value={stats.alertasBajaAsistencia}
          hint="Jugadores para seguimiento"
          href="/dashboard/asistencias?tab=reporte"
        />
        <StatCard
          tone="amber"
          Icon={DollarSign}
          label="Cuotas impagas (mes)"
          value={stats.cuotasImpagas}
          hint="Jugadores con deuda actual"
          href={canVerCuotas ? "/dashboard/cuotas?tab=morosidad" : undefined}
        />
      </div>

      {proxCumpleanios.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 shadow-sm overflow-hidden">
          <h2 className="px-4 py-3 text-sm font-semibold text-orange-800 border-b border-orange-100 flex items-center gap-2">
            <Cake className="h-4 w-4" aria-hidden />
            Cumpleaños (últimos 7 días y próximos 14)
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
                          j.dias === 0
                            ? "bg-orange-500 text-white"
                            : j.dias < 0
                              ? "bg-slate-100 text-slate-600"
                              : "bg-orange-100 text-orange-700"
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

      {jugadoresBajaAsistencia.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <h2 className="px-4 py-3 text-sm font-semibold text-slate-800 border-b border-slate-100">
            Jugadores con 2+ faltas en el mes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th className="text-left py-2 px-4">Apellido</th>
                  <th className="text-left py-2 px-4">Nombre</th>
                  <th className="text-left py-2 px-4">Categoría</th>
                  <th className="text-left py-2 px-4 hidden sm:table-cell">DNI</th>
                  <th className="text-right py-2 px-4">Faltas</th>
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
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            j.faltas >= 4
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {j.faltas} {j.faltas === 1 ? "falta" : "faltas"}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <Link
                        href={`/dashboard/asistencias?tab=jugador&jugador=${encodeURIComponent(j.id)}`}
                        className="inline-block py-2 font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 rounded"
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
    </div>
  );
}
