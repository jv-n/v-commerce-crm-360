import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react"
import { DataTable } from "@/components/organisms/DataTable"
import { saleColumns } from "./columns"
import { fetchSales } from "@/lib/api/sales"
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
  undo:  () => void
  reset: () => void
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
    }), [pushHistory])

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
      <DataTable
        data={sales}
        loading={loading}
        columns={saleColumns}
        getRowId={(c) => c.id}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onFiltersChange={handleFiltersChange}
        rowsPerPageOptions={[10, 25, 50]}
        serverPagination={{
          total,
          page,
          pageSize,
          onPageChange:     handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
      />
    )
  }
)
