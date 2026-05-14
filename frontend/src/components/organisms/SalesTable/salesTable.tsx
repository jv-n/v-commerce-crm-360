import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from "react"
import { DataTable } from "@/components/organisms/DataTable"
import { saleColumns } from "./columns"
import { fetchSales } from "@/lib/api/sales"
import { ExportPopover, type ExportPill } from "@/components/molecules/ExportPopover"
import type { Sale } from "@/types/sale"
import type { Tab, ActiveFilters } from "@/components/organisms/DataTable/types"

const TABS: Tab[] = [
  { id: "all",       label: "Todos os pedidos"    },
  { id: "concluded", label: "Pedidos concluídos"  },
  { id: "returned",  label: "Pedidos devolvidos"  },
]

const DEFAULT_PAGE_SIZE = 10

interface ServerFilters {
  status:           string
  metodo_pagamento: string
  categoria:        string
}

const EMPTY_FILTERS: ServerFilters = { status: "", metodo_pagamento: "", categoria: "" }

type FilterSnapshot = {
  tab:           string
  page:          number
  serverFilters: ServerFilters
}

export type SalesTableHandle = {
  undo:       () => void
  reset:      () => void
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

    const currentSnapshot = useRef<FilterSnapshot>({ tab: "all", page: 1, serverFilters: EMPTY_FILTERS })
    useEffect(() => {
      currentSnapshot.current = { tab: activeTab, page, serverFilters }
    })

    const pushHistory = useCallback(() => {
      setFilterHistory(h => [...h, { ...currentSnapshot.current }])
    }, [])

    useEffect(() => {
      onCanUndoChange?.(filterHistory.length > 0)
    }, [filterHistory.length, onCanUndoChange])

    useImperativeHandle(ref, () => ({
      undo: () => {
        setFilterHistory(h => {
          if (h.length === 0) return h
          const prev = h[h.length - 1]
          setActiveTab(prev.tab)
          setPage(prev.page)
          setLoading(true)
          setServerFilters(prev.serverFilters)
          return h.slice(0, -1)
        })
      },
      reset: () => {
        pushHistory()
        setLoading(true)
        setActiveTab("all")
        setPage(1)
        setServerFilters(EMPTY_FILTERS)
      },
      openExport: () => setExportOpen(true),
    }), [pushHistory])

    const [exportOpen,    setExportOpen]    = useState(false)
    const [exportLoading, setExportLoading] = useState(false)

    // ── Seleção acumulativa por cache ──────────────────────────────────────────
    const salesRef        = useRef<Sale[]>([])
    const selectedCache   = useRef<Map<string, Sale>>(new Map())
    const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set())
    useEffect(() => { salesRef.current = sales }, [sales])

    const handleSelectionChange = useCallback((ids: Set<string>) => {
      const cache = selectedCache.current
      for (const id of cache.keys()) { if (!ids.has(id)) cache.delete(id) }
      for (const s of salesRef.current) { if (ids.has(s.id)) cache.set(s.id, s) }
      setSelectedIds(new Set(ids))
    }, [])

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
        const res = await fetchSales({ page: 1, pageSize: 500000, tab: activeTab, status: serverFilters.status, metodo_pagamento: serverFilters.metodo_pagamento, categoria: serverFilters.categoria })
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
      ...(activeTab === "concluded" ? [{ label: "Aba", value: "Pedidos concluídos" }] : []),
      ...(activeTab === "returned"  ? [{ label: "Aba", value: "Pedidos devolvidos"  }] : []),
      ...(serverFilters.status           ? [{ label: "Status",    value: serverFilters.status           }] : []),
      ...(serverFilters.metodo_pagamento ? [{ label: "Pagamento", value: serverFilters.metodo_pagamento }] : []),
      ...(serverFilters.categoria        ? [{ label: "Categoria", value: serverFilters.categoria        }] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [activeTab, serverFilters.status, serverFilters.metodo_pagamento, serverFilters.categoria])

    const { status, metodo_pagamento, categoria } = serverFilters

    useEffect(() => {
      let cancelled = false

      fetchSales({ page, pageSize, tab: activeTab, status, metodo_pagamento, categoria })
        .then((res) => {
          if (cancelled) return
          setSales(res.data)
          setTotal(res.total)
        })
        .catch(console.error)
        .finally(() => { if (!cancelled) setLoading(false) })

      return () => { cancelled = true }
    }, [page, pageSize, activeTab, status, metodo_pagamento, categoria])

    const handleTabChange = (tabId: string) => {
      pushHistory()
      setLoading(true)
      setActiveTab(tabId)
      setPage(1)
      setServerFilters(EMPTY_FILTERS)
    }

    const handlePageChange = (newPage: number) => {
      setLoading(true)
      setPage(newPage)
    }

    const handlePageSizeChange = (newSize: number) => {
      setLoading(true)
      setPageSize(newSize)
      setPage(1)
    }

    const handleFiltersChange = (active: ActiveFilters) => {
      const sf = active["status"]
      const pf = active["paymentMethod"]
      const cf = active["categoria"]
      pushHistory()
      setLoading(true)
      setServerFilters({
        status:           sf?.type === "select" && sf.value ? sf.value : "",
        metodo_pagamento: pf?.type === "select" && pf.value ? pf.value : "",
        categoria:        cf?.type === "select" && cf.value ? cf.value : "",
      })
      setPage(1)
    }

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
        columns={saleColumns}
        getRowId={(c) => c.id}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onFiltersChange={handleFiltersChange}
        onSelectionChange={handleSelectionChange}
        headerClassName="bg-[#F0DDFD]"
        dividersClassName="divide-[#9F83B2]"
        rowsPerPageOptions={[10, 25, 50]}
        serverPagination={{
          total,
          page,
          pageSize,
          onPageChange:     handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
      />
      </>
    )
  }
)
