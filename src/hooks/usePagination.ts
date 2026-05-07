"use client";

import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { useEffect, useMemo, useState } from "react";

export function usePagination<T>(rows: T[], initialPageSize: number = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Si cambia el dataset y el page actual queda fuera, volver a la primera página.
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    if (page > totalPages) setPage(totalPages);
  }, [rows.length, pageSize, page]);

  const paged = useMemo(() => {
    const from = (page - 1) * pageSize;
    return rows.slice(from, from + pageSize);
  }, [rows, page, pageSize]);

  function changePageSize(next: number) {
    setPageSize(next);
    setPage(1);
  }

  return {
    paged,
    page,
    pageSize,
    setPage,
    setPageSize: changePageSize,
    total: rows.length,
  };
}
