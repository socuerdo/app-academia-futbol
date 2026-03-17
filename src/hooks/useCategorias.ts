"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import type { Categoria } from "@/types/database";

async function fetchCategorias(clubId: string): Promise<Categoria[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("club_id", clubId)
    .order("orden");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export function useCategorias(clubId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    clubId ? ["categorias", clubId] : null,
    () => fetchCategorias(clubId as string)
  );

  return {
    categorias: data ?? [],
    isLoading,
    isError: !!error,
    refetch: mutate,
  };
}

