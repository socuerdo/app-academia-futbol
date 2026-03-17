"use client";

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCategorias } from "@/hooks/useCategorias";
import type { Categoria } from "@/types/database";
import { Toast } from "@/components/ui/Toast";

interface CategoriasViewProps {
  clubId: string;
}

export function CategoriasView({ clubId }: CategoriasViewProps) {
  const { categorias, isLoading, refetch } = useCategorias(clubId);
  const [localCategorias, setLocalCategorias] = useState<Categoria[]>(categorias);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const sensors = useSensors(useSensor(PointerSensor));

  function showToast(message: string) {
    setToast({ message, visible: true });
  }

  function hideToast() {
    setToast((prev) => ({ ...prev, visible: false }));
  }

  // Sincronizar cuando SWR trae datos
  if (!isLoading && localCategorias.length === 0 && categorias.length > 0) {
    setLocalCategorias(categorias);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const nombre = newName.trim();
    if (!nombre) return;
    setError(null);

    const maxOrden = categorias.reduce((max, c) => Math.max(max, c.orden ?? 0), 0);
    const orden = maxOrden + 1;

    const optimistic: Categoria = {
      id: `temp-${Date.now()}`,
      club_id: clubId,
      nombre,
      orden,
      activo: true,
      created_at: new Date().toISOString(),
    };
    setLocalCategorias((prev) => [...prev, optimistic]);
    setNewName("");

    const { data, error: insertError } = await supabase
      .from("categorias")
      .insert({ club_id: clubId, nombre, orden, activo: true })
      .select("*")
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "No se pudo crear la categoría.");
      setLocalCategorias((prev) => prev.filter((c) => c.id !== optimistic.id));
      return;
    }

    showToast("Categoría creada.");
    await refetch();
  }

  async function handleToggle(cat: Categoria) {
    setError(null);
    const next = !cat.activo;
    setLocalCategorias((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, activo: next } : c))
    );
    const { error: updateError } = await supabase
      .from("categorias")
      .update({ activo: next })
      .eq("id", cat.id);
    if (updateError) {
      setError(updateError.message);
      setLocalCategorias((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, activo: !next } : c))
      );
      return;
    }
    showToast("Categoría actualizada.");
    await refetch();
  }

  async function handleDelete(cat: Categoria) {
    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return;
    setError(null);

    const { count, error: countError } = await supabase
      .from("jugadores")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("categoria", cat.nombre);

    if (countError) {
      setError(countError.message);
      return;
    }

    if ((count ?? 0) > 0) {
      setError(
        "No podés eliminar esta categoría porque tiene jugadores asignados. Primero cambiá los jugadores a otra categoría."
      );
      return;
    }

    const prev = localCategorias;
    setLocalCategorias((cur) => cur.filter((c) => c.id !== cat.id));

    const { error: deleteError } = await supabase
      .from("categorias")
      .delete()
      .eq("id", cat.id);

    if (deleteError) {
      setError(deleteError.message);
      setLocalCategorias(prev);
      return;
    }

    showToast("Categoría eliminada.");
    await refetch();
  }

  async function handleSaveEdit(catId: string) {
    const nombre = editingName.trim();
    if (!nombre) return;
    setError(null);
    const prev = localCategorias;
    setLocalCategorias((cur) =>
      cur.map((c) => (c.id === catId ? { ...c, nombre } : c))
    );
    setEditingId(null);

    const { error: updateError } = await supabase
      .from("categorias")
      .update({ nombre })
      .eq("id", catId);

    if (updateError) {
      setError(updateError.message);
      setLocalCategorias(prev);
      return;
    }
    showToast("Categoría actualizada.");
    await refetch();
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localCategorias.findIndex((c) => c.id === active.id);
    const newIndex = localCategorias.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newList = [...localCategorias];
    const [moved] = newList.splice(oldIndex, 1);
    newList.splice(newIndex, 0, moved);

    // Recalcular orden
    const recalculated = newList.map((c, idx) => ({ ...c, orden: idx + 1 }));
    setLocalCategorias(recalculated);

    const updates = recalculated.map((c) =>
      supabase.from("categorias").update({ orden: c.orden }).eq("id", c.id)
    );
    const results = await Promise.all(updates);
    const hasError = results.some((r) => "error" in r && r.error);
    if (hasError) {
      setError("No se pudo guardar el nuevo orden.");
      await refetch();
      return;
    }
    showToast("Orden de categorías actualizado.");
    await refetch();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-800">Categorías</h2>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{error}</div>
      )}

      <form onSubmit={handleCreate} className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre de la nueva categoría"
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-offset-1 focus:border-transparent outline-none"
          style={{ ["--tw-ring-color" as string]: "var(--color-primary)" }}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg text-white font-medium"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Nueva categoría
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading && (
          <p className="p-4 text-sm text-slate-500">Cargando categorías...</p>
        )}
        {!isLoading && localCategorias.length === 0 && (
          <p className="p-4 text-sm text-slate-500">
            No hay categorías aún. Creá la primera con el formulario de arriba.
          </p>
        )}

        {!isLoading && localCategorias.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <ul className="divide-y divide-slate-100">
              {localCategorias.map((cat) => (
                <li
                  key={cat.id}
                  id={cat.id}
                  className="flex items-center justify-between px-4 py-2 gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="cursor-grab text-slate-400">⋮⋮</span>
                    <span className="text-xs text-slate-500 w-8">#{cat.orden}</span>
                    {editingId === cat.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded-lg text-sm"
                      />
                    ) : (
                      <span className="text-sm font-medium text-slate-800">
                        {cat.nombre}
                      </span>
                    )}
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        cat.activo
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {cat.activo ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === cat.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="text-xs px-2 py-1 rounded-lg text-white font-medium"
                          style={{ backgroundColor: "var(--color-primary)" }}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-300 text-slate-700"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditingName(cat.nombre);
                          }}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-300 text-slate-700"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(cat)}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-300 text-slate-700"
                        >
                          {cat.activo ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </DndContext>
        )}
      </div>

      <Toast
        message={toast.message}
        visible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
}

