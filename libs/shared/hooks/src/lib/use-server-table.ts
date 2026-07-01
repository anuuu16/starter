import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from './use-debounce';

export interface ServerTableSort {
  key: string;
  dir: 'asc' | 'desc';
}

export interface ServerTableParams {
  /** 1-based page number (natural for most APIs). */
  page: number;
  pageSize: number;
  q: string;
  sort: ServerTableSort | null;
}

export interface ServerTableResult<T> {
  rows: T[];
  total: number;
}

/** Shape consumed by `@org/ui`'s DataTable `server` prop (structurally typed). */
export interface ServerTableBinding {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
  sort: ServerTableSort | null;
  onSortChange: (sort: ServerTableSort | null) => void;
  query: string;
  onQueryChange: (query: string) => void;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  loading: boolean;
}

export interface UseServerTableOptions {
  pageSize?: number;
  initialSort?: ServerTableSort | null;
  /** Debounce (ms) applied to the search query before refetching. */
  searchDebounce?: number;
}

export interface UseServerTable<T> {
  rows: T[];
  total: number;
  loading: boolean;
  error: Error | null;
  /** Re-run the current fetch (e.g. after a create/edit/delete). */
  reload: () => void;
  /** Pass straight to `<DataTable server={...} />`. */
  server: ServerTableBinding;
}

/**
 * Drives a server-paginated/searchable/sortable table. Owns page/pageSize/
 * query/sort state, debounces the query, guards against out-of-order responses,
 * and exposes a `server` binding for `@org/ui`'s DataTable. `fetcher` should map
 * the params to an API call and return `{ rows, total }`.
 *
 *   const t = useServerTable((p) => apiGet(`/x?page=${p.page}&q=${p.q}`));
 *   <DataTable data={t.rows} server={t.server} ... />
 */
export function useServerTable<T>(
  fetcher: (params: ServerTableParams) => Promise<ServerTableResult<T>>,
  options: UseServerTableOptions = {},
): UseServerTable<T> {
  const { pageSize: initialPageSize = 20, initialSort = null, searchDebounce = 300 } =
    options;

  // 0-based to match `@org/ui` DataTable's `server.page` (a TanStack pageIndex).
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [rawQuery, setRawQuery] = useState('');
  const [sort, setSort] = useState<ServerTableSort | null>(initialSort);

  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const query = useDebounce(rawQuery, searchDebounce);

  // Keep a stable ref to the latest fetcher so callers can pass an inline arrow
  // without forcing a refetch on every render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Monotonic request id → ignore responses that resolve out of order.
  const reqId = useRef(0);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    fetcherRef
      .current({ page: pageIndex + 1, pageSize, q: query, sort })
      .then((res) => {
        if (id !== reqId.current) return;
        setRows(res.rows);
        setTotal(res.total);
        setError(null);
      })
      .catch((e: unknown) => {
        if (id !== reqId.current) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [pageIndex, pageSize, query, sort, reloadTick]);

  const reload = useCallback(() => setReloadTick((n) => n + 1), []);

  const onPageChange = useCallback((p: number) => setPageIndex(p), []);
  const onSortChange = useCallback((s: ServerTableSort | null) => {
    setSort(s);
    setPageIndex(0);
  }, []);
  const onQueryChange = useCallback((q: string) => {
    setRawQuery(q);
    setPageIndex(0);
  }, []);
  const onPageSizeChange = useCallback((ps: number) => {
    setPageSize(ps);
    setPageIndex(0);
  }, []);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return {
    rows,
    total,
    loading,
    error,
    reload,
    server: {
      page: pageIndex,
      pageCount,
      total,
      onPageChange,
      sort,
      onSortChange,
      query: rawQuery,
      onQueryChange,
      pageSize,
      onPageSizeChange,
      loading,
    },
  };
}
