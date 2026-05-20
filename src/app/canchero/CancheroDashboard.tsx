"use client";

import { useEffect, useState, useCallback } from "react";
import type { TurnoAlquiler, TurnoEscuela } from "@/lib/canchas";
import { fetchTurnosAlquiler, fetchTurnosEscuela } from "./actions";
import { VistaHoyTab } from "./components/VistaHoyTab";
import { HorariosTab } from "./components/HorariosTab";
import { CobrosTab } from "./components/CobrosTab";
import { EscuelaTab } from "./components/EscuelaTab";
import { NuevaReservaModal } from "./components/NuevaReservaModal";

type Tab = "hoy" | "horarios" | "cobros" | "escuela";

interface CancheroDashboardProps {
  initialFecha: string;
  initialTurnosAlquiler: TurnoAlquiler[];
  initialTurnosEscuela: TurnoEscuela[];
}

export function CancheroDashboard({
  initialFecha,
  initialTurnosAlquiler,
  initialTurnosEscuela,
}: CancheroDashboardProps) {
  const [now, setNow] = useState(new Date());
  const [tab, setTab] = useState<Tab>("hoy");
  const [fecha, setFecha] = useState(initialFecha);
  const [turnosAlquiler, setTurnosAlquiler] = useState<TurnoAlquiler[]>(initialTurnosAlquiler);
  const [turnosEscuela, setTurnosEscuela] = useState<TurnoEscuela[]>(initialTurnosEscuela);
  const [showModal, setShowModal] = useState(false);
  const [editingTurno, setEditingTurno] = useState<TurnoAlquiler | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const [alquiler, escuela] = await Promise.all([
        fetchTurnosAlquiler(f),
        fetchTurnosEscuela(f),
      ]);
      setTurnosAlquiler(alquiler);
      setTurnosEscuela(escuela);
    } catch {
      // silencioso — los datos anteriores persisten
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleFechaChange(f: string) {
    setFecha(f);
    await loadData(f);
  }

  function handleTurnoGuardado(turno: TurnoAlquiler, isNew: boolean) {
    setTurnosAlquiler((prev) =>
      isNew ? [...prev, turno] : prev.map((t) => (t.id === turno.id ? turno : t))
    );
    setShowModal(false);
    setEditingTurno(null);
  }

  function handleTurnoEliminado(id: string) {
    setTurnosAlquiler((prev) => prev.filter((t) => t.id !== id));
  }

  function handleTurnoEscuelaGuardado(turno: TurnoEscuela, isNew: boolean) {
    setTurnosEscuela((prev) =>
      isNew ? [...prev, turno] : prev.map((t) => (t.id === turno.id ? turno : t))
    );
  }

  function handleTurnoEscuelaEliminado(id: string) {
    setTurnosEscuela((prev) => prev.filter((t) => t.id !== id));
  }

  function openNuevoModal() {
    setEditingTurno(null);
    setShowModal(true);
  }

  function openEditModal(turno: TurnoAlquiler) {
    setEditingTurno(turno);
    setShowModal(true);
  }

  const timeStr = now.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const tabs: { id: Tab; label: string; short: string }[] = [
    { id: "hoy", label: "Vista de hoy", short: "Hoy" },
    { id: "horarios", label: "Horarios", short: "Horarios" },
    { id: "cobros", label: "Cobros", short: "Cobros" },
    { id: "escuela", label: "Escuela", short: "Escuela" },
  ];

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-4">
          <span className="text-xl font-mono font-semibold text-slate-700">{timeStr}</span>
          {loading && (
            <span className="text-xs text-slate-400">Cargando...</span>
          )}
        </div>
        <button
          type="button"
          onClick={openNuevoModal}
          className="w-full sm:w-auto px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: "#16a34a" }}
        >
          + Nueva reserva
        </button>
      </div>

      <div className="bg-white border-b border-slate-200 px-4 flex gap-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.id
                ? "border-green-600 text-green-700"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <span className="sm:hidden">{t.short}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 p-4">
        {tab === "hoy" && (
          <VistaHoyTab
            turnosAlquiler={turnosAlquiler}
            turnosEscuela={turnosEscuela}
            now={now}
          />
        )}
        {tab === "horarios" && (
          <HorariosTab
            fecha={fecha}
            turnosAlquiler={turnosAlquiler}
            onFechaChange={handleFechaChange}
            onEditar={openEditModal}
            onEliminado={handleTurnoEliminado}
          />
        )}
        {tab === "cobros" && (
          <CobrosTab
            fecha={fecha}
            turnosAlquiler={turnosAlquiler}
            onFechaChange={handleFechaChange}
          />
        )}
        {tab === "escuela" && (
          <EscuelaTab
            fecha={fecha}
            turnosEscuela={turnosEscuela}
            onFechaChange={handleFechaChange}
            onGuardado={handleTurnoEscuelaGuardado}
            onEliminado={handleTurnoEscuelaEliminado}
          />
        )}
      </div>

      {showModal && (
        <NuevaReservaModal
          fecha={fecha}
          turno={editingTurno}
          onGuardado={handleTurnoGuardado}
          onClose={() => { setShowModal(false); setEditingTurno(null); }}
        />
      )}
    </div>
  );
}
