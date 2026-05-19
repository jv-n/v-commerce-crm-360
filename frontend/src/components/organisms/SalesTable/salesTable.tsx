import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from "react"
import { DataTable } from "@/components/organisms/DataTable"
import { getSaleColumns } from "./columns"
import { fetchSales } from "@/lib/api/sales"
import { fetchContacts } from "@/lib/api/contacts"
import { fetchProducts } from "@/lib/api/products"
import { ExportPopover, type ExportPill } from "@/components/molecules/ExportPopover"
import type { Sale } from "@/types/sale"
import type { Tab, ActiveFilters } from "@/components/organisms/DataTable/types"
import { SaleFormSheet } from "./SaleForms"
import { SaleExpandedRow } from "./SaleExpandedRow"

// ── Table ──────────────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  { id: "all",       label: "Todos os pedidos"   },
  { id: "concluded", label: "Pedidos concluídos" },
  { id: "pending",   label: "Pedidos pendentes"  },
  { id: "failed",    label: "Pedidos falhos"      },
]

const DEFAULT_PAGE_SIZE = 10

interface ServerFilters {
  status:           string
  metodo_pagamento: string
  categoria:        string
  data_from:        string
  data_to:          string
  nome_cliente:     string
  nome_produto:     string
}

const EMPTY_FILTERS: ServerFilters = {
  status: "", metodo_pagamento: "", categoria: "",
  data_from: "", data_to: "", nome_cliente: "", nome_produto: "",
}

type SaleSort = { key: string; direction: "asc" | "desc" } | null

type FilterSnapshot = {
  tab:           string
  page:          number
  serverFilters: ServerFilters
  sort:          SaleSort
}

export type SalesTableHandle = {
  undo:       () => void
  reset:      () => void
  openAdd:    () => void
  openExport: () => void
}

export const SalesTable = forwardRef<SalesTableHandle, { onCanUndoChange?: (can: boolean) => void }>(
  ({ onCanUndoChange }, ref) => {
    const [activeTab,      setActiveTab]      = useState("all")
    const [page,           setPage]           = useState(1)
    const [pageSize,       setPageSize]       = useState(DEFAULT_PAGE_SIZE)
    const [sales,          setSales]          = useState<Sale[]>([])
    const [total,          setTotal]          = useState(0)
    const [loading,        setLoading]        = useState(true)
    const [serverFilters,  setServerFilters]  = useState<ServerFilters>(EMPTY_FILTERS)
    const [filterHistory,  setFilterHistory]  = useState<FilterSnapshot[]>([])
    const [formOpen,       setFormOpen]       = useState(false)
    const [editSale,       setEditSale]       = useState<Sale | undefined>(undefined)
    const [refetchKey,     setRefetchKey]     = useState(0)
    const [search,         setSearch]         = useState("")
    const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set())
    const [sort,           setSort]           = useState<SaleSort>(null)
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const searchRef   = useRef("")

    const currentSnapshot = useRef<FilterSnapshot>({ tab: "all", page: 1, serverFilters: EMPTY_FILTERS, sort: null })
    useEffect(() => {
      currentSnapshot.current = { tab: activeTab, page, serverFilters, sort }
    })

    const pushHistory = useCallback(() => {
      setFilterHistory(h => [...h, {
        ...currentSnapshot.current,
        serverFilters: { ...currentSnapshot.current.serverFilters },
        sort: currentSnapshot.current.sort ? { ...currentSnapshot.current.sort } : null,
      }])
    }, [])

    useEffect(() => {
      onCanUndoChange?.(filterHistory.length > 0)
    }, [filterHistory.length, onCanUndoChange])

    const handleToggleExpand = useCallback((id: string) => {
      setExpandedRowIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) { next.delete(id) } else { next.add(id) }
        return next
      })
    }, [])

    const fetchClientOptions = useCallback(async (q: string): Promise<string[]> => {
      const res = await fetchContacts({ page: 1, pageSize: 10, tab: "all", search: q, sortBy: null, sortDir: "asc" })
      return res.data.map(c => c.name).filter(Boolean)
    }, [])

    const fetchProductOptions = useCallback(async (q: string): Promise<string[]> => {
      const res = await fetchProducts({ search: q, pageSize: 10 })
      return res.data.map(p => p.name).filter(Boolean)
    }, [])

    const columns = getSaleColumns(expandedRowIds, handleToggleExpand, fetchClientOptions, fetchProductOptions)

    const [exportOpen,    setExportOpen]    = useState(false)
    const [exportLoading, setExportLoading] = useState(false)

    useImperativeHandle(ref, () => ({
      undo: () => {
        setFilterHistory(h => {
          if (h.length === 0) return h
          const prev = h[h.length - 1]
          setExpandedRowIds(new Set())
          setActiveTab(prev.tab)
          setPage(prev.page)
          setLoading(true)
          setServerFilters(prev.serverFilters)
          setSort(prev.sort)
          return h.slice(0, -1)
        })
      },
      reset: () => {
        pushHistory()
        setExpandedRowIds(new Set())
        setLoading(true)
        setActiveTab("all")
        setPage(1)
        setServerFilters(EMPTY_FILTERS)
        setSort(null)
      },
      openAdd:    () => { setEditSale(undefined); setFormOpen(true) },
      openExport: () => setExportOpen(true),
    }), [pushHistory])

    const { status, metodo_pagamento, categoria, data_from, data_to, nome_cliente, nome_produto } = serverFilters

    // ── Selection cache ────────────────────────────────────────────────────────
    const salesRef      = useRef<Sale[]>([])
    const selectedCache = useRef<Map<string, Sale>>(new Map())
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    useEffect(() => { salesRef.current = sales }, [sales])

    const handleSelectionChange = useCallback((ids: Set<string>) => {
      const cache = selectedCache.current
      for (const id of cache.keys()) { if (!ids.has(id)) cache.delete(id) }
      for (const s of salesRef.current) { if (ids.has(s.id)) cache.set(s.id, s) }
      setSelectedIds(new Set(ids))
    }, [])

    // ── CSV helpers ────────────────────────────────────────────────────────────
    const buildCSV = (rows: Sale[]) => {
      const headers = ["ID", "Produto", "Cliente", "Categoria", "Quantidade", "Valor", "Data", "Status", "Pagamento"]
      const lines = rows.map(s => [s.id, s.product, s.client, s.categoria ?? "", s.amount, s.value, s.date, s.status, s.payment_method])
      return [headers, ...lines].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
    }

    const downloadCSV = (csv: string, filename: string) => {
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    }

    const handleExportCSV = async () => {
      setExportLoading(true)
      try {
        const res = await fetchSales({
          page: 1, pageSize: 500000, tab: activeTab,
          status, metodo_pagamento, categoria, data_from, data_to,
          nome_cliente, nome_produto,
          search, search_field: search ? "sale_id" : undefined,
          sortKey: sort?.key, sortDir: sort?.direction,
        })
        downloadCSV(buildCSV(res.data), `pedidos_${new Date().toISOString().slice(0, 10)}.csv`)
        setExportOpen(false)
      } finally { setExportLoading(false) }
    }

    const handleExportSelected = async () => {
      setExportLoading(true)
      try {
        downloadCSV(buildCSV(Array.from(selectedCache.current.values())), `pedidos_selecionados_${new Date().toISOString().slice(0, 10)}.csv`)
        setExportOpen(false)
      } finally { setExportLoading(false) }
    }

    const exportPills: ExportPill[] = useMemo(() => [
      ...(activeTab === "concluded"        ? [{ label: "Aba",      value: "Pedidos concluídos"       }] : []),
      ...(activeTab === "returned"         ? [{ label: "Aba",      value: "Pedidos devolvidos"        }] : []),
      ...(serverFilters.status             ? [{ label: "Status",   value: serverFilters.status        }] : []),
      ...(serverFilters.metodo_pagamento   ? [{ label: "Pgto",     value: serverFilters.metodo_pagamento }] : []),
      ...(serverFilters.categoria          ? [{ label: "Categ.",   value: serverFilters.categoria     }] : []),
      ...(serverFilters.nome_cliente       ? [{ label: "Cliente",  value: serverFilters.nome_cliente  }] : []),
      ...(serverFilters.nome_produto       ? [{ label: "Produto",  value: serverFilters.nome_produto  }] : []),
    ], [activeTab, serverFilters])

    // ── Fetch ──────────────────────────────────────────────────────────────────
    useEffect(() => {
      let cancelled = false
      fetchSales({
        page, pageSize, tab: activeTab,
        status, metodo_pagamento, categoria, data_from, data_to,
        nome_cliente, nome_produto,
        search, search_field: search ? "sale_id" : undefined,
        sortKey: sort?.key, sortDir: sort?.direction,
      })
        .then((res) => {
          if (cancelled) return
          setSales(res.data)
          setTotal(res.total)
        })
        .catch(console.error)
        .finally(() => { if (!cancelled) setLoading(false) })
      return () => { cancelled = true }
    }, [page, pageSize, activeTab, status, metodo_pagamento, categoria, data_from, data_to, nome_cliente, nome_produto, search, sort, refetchKey])

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleTabChange = (tabId: string) => {
      pushHistory()
      setExpandedRowIds(new Set())
      setLoading(true)
      setActiveTab(tabId)
      setPage(1)
      setServerFilters(EMPTY_FILTERS)
      setSort(null)
    }

    const handleSortChange = (s: SaleSort) => {
      pushHistory()
      setExpandedRowIds(new Set())
      setLoading(true)
      setPage(1)
      setSort(s)
    }

    const handlePageChange = (newPage: number) => {
      setExpandedRowIds(new Set())
      setLoading(true)
      setPage(newPage)
    }

    const handlePageSizeChange = (newSize: number) => {
      setExpandedRowIds(new Set())
      setLoading(true)
      setPageSize(newSize)
      setPage(1)
    }

    const handleFiltersChange = (active: ActiveFilters) => {
      const sf = active["status"]
      const pf = active["paymentMethod"]
      const cf = active["categoria"]
      const df = active["saleDate"]
      const clF = active["client"]
      const prF = active["product"]
      pushHistory()
      setExpandedRowIds(new Set())
      setLoading(true)
      setServerFilters(prev => ({
        ...prev,
        status:           sf?.type === "select"        && sf.value  ? sf.value  : "",
        metodo_pagamento: pf?.type === "select"        && pf.value  ? pf.value  : "",
        categoria:        cf?.type === "select"        && cf.value  ? cf.value  : "",
        data_from:        df?.type === "date-range"    && df.from   ? df.from   : "",
        data_to:          df?.type === "date-range"    && df.to     ? df.to     : "",
        nome_cliente:     clF?.type === "search-select" && clF.value ? clF.value : "",
        nome_produto:     prF?.type === "search-select" && prF.value ? prF.value : "",
      }))
      setPage(1)
    }

    const handleSearchChange = (q: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
      searchTimer.current = setTimeout(() => {
        if (searchRef.current === q) return
        searchRef.current = q
        setSearch(q)
        setPage(1)
        setLoading(true)
      }, 300)
    }

    const handleEditSale = useCallback((sale: Sale) => {
      setEditSale(sale)
      setFormOpen(true)
    }, [])

    return (
      <>
        <ExportPopover
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          total={total}
          entityLabel="Pedidos"
          pills={exportPills}
          exportLoading={exportLoading}
          onExport={handleExportCSV}
          selectedCount={selectedIds.size}
          onExportSelected={handleExportSelected}
        />
        <DataTable
          data={sales}
          loading={loading}
          columns={columns}
          getRowId={(c) => c.id}
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onFiltersChange={handleFiltersChange}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          searchPlaceholder="Buscar por ID do pedido..."
          headerClassName="bg-[#EACAFF] [&_th:not(:first-child)_button_svg]:!text-[#9F83B2] [&_th:not(:first-child)_button:hover_svg]:!text-[#6F2B90]"
          dividersClassName="divide-[#9F83B2]"
          expandedRowIds={expandedRowIds}
          renderExpandedRow={(sale) => <SaleExpandedRow sale={sale} onEdit={handleEditSale} />}
          onRowClick={(sale) => handleToggleExpand(sale.id)}
          rowsPerPageOptions={[10, 25, 50]}
          serverPagination={{
            total,
            page,
            pageSize,
            onPageChange:     handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
          onSelectionChange={handleSelectionChange}
        />
        <SaleFormSheet
          open={formOpen}
          sale={editSale}
          onClose={() => { setFormOpen(false); setEditSale(undefined) }}
          onSuccess={() => { setLoading(true); setRefetchKey(k => k + 1) }}
        />
      </>
    )
  }
)
