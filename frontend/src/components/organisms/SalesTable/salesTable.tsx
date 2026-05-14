import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react"
import { DataTable } from "@/components/organisms/DataTable"
import { getSaleColumns } from "./columns"
import { fetchSales } from "@/lib/api/sales"
import type { Sale } from "@/types/sale"
import type { Tab, ActiveFilters } from "@/components/organisms/DataTable/types"
import { SaleFormSheet } from "./SaleForms"
import { SaleExpandedRow } from "./SaleExpandedRow"

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
  data_from:        string
  data_to:          string
}

const EMPTY_FILTERS: ServerFilters = { status: "", metodo_pagamento: "", categoria: "", data_from: "", data_to: "" }

type FilterSnapshot = {
  tab:           string
  page:          number
  serverFilters: ServerFilters
}

export type SalesTableHandle = {
  undo:    () => void
  reset:   () => void
  openAdd: () => void
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
    const [searchScope,    setSearchScope]    = useState<"all" | "client" | "product">("all")
    const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set())
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

    const handleToggleExpand = useCallback((id: string) => {
      setExpandedRowIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) { next.delete(id) } else { next.add(id) }
        return next
      })
    }, [])

    const columns = getSaleColumns(expandedRowIds, handleToggleExpand)

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
      },
      openAdd: () => { setEditSale(undefined); setFormOpen(true) },
    }), [pushHistory])

    const { status, metodo_pagamento, categoria, data_from, data_to } = serverFilters

    useEffect(() => {
      let cancelled = false

      fetchSales({ page, pageSize, tab: activeTab, status, metodo_pagamento, categoria, data_from, data_to, search, search_field: searchScope })
        .then((res) => {
          if (cancelled) return
          setSales(res.data)
          setTotal(res.total)
        })
        .catch(console.error)
        .finally(() => { if (!cancelled) setLoading(false) })

      return () => { cancelled = true }
    }, [page, pageSize, activeTab, status, metodo_pagamento, categoria, data_from, data_to, search, searchScope, refetchKey])

    const handleTabChange = (tabId: string) => {
      pushHistory()
      setExpandedRowIds(new Set())
      setLoading(true)
      setActiveTab(tabId)
      setPage(1)
      setServerFilters(EMPTY_FILTERS)
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
      pushHistory()
      setExpandedRowIds(new Set())
      setLoading(true)
      setServerFilters(prev => ({
        ...prev,
        status:           sf?.type === "select"     && sf.value ? sf.value : "",
        metodo_pagamento: pf?.type === "select"     && pf.value ? pf.value : "",
        categoria:        cf?.type === "select"     && cf.value ? cf.value : "",
        data_from:        df?.type === "date-range" && df.from  ? df.from  : "",
        data_to:          df?.type === "date-range" && df.to    ? df.to    : "",
      }))
      setPage(1)
    }

    const handleSearchChange = (q: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
      searchTimer.current = setTimeout(() => {
        setSearch(q)
        setPage(1)
        setLoading(true)
      }, 300)
    }

    const handleEditSale = useCallback((sale: Sale) => {
      setEditSale(sale)
      setFormOpen(true)
    }, [])

    const handleFormClose = () => {
      setFormOpen(false)
      setEditSale(undefined)
    }

    const handleFormSuccess = () => {
      setLoading(true)
      setRefetchKey(k => k + 1)
    }

    return (
      <>
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
          searchPlaceholder={searchScope === "client" ? "Buscar por cliente..." : searchScope === "product" ? "Buscar por produto..." : "Buscar por cliente ou produto..."}
          searchPrefix={
            <select
              value={searchScope}
              onChange={e => { setSearchScope(e.target.value as typeof searchScope); setPage(1) }}
              className="text-xs text-gray-600 bg-transparent border-r border-gray-200 pr-1.5 mr-0.5 outline-none cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="client">Cliente</option>
              <option value="product">Produto</option>
            </select>
          }
          headerClassName="bg-[#F0DDFD]"
          dividersClassName="divide-[#9F83B2]"
          expandedRowIds={expandedRowIds}
          renderExpandedRow={(sale) => <SaleExpandedRow sale={sale} onEdit={handleEditSale} />}
          rowsPerPageOptions={[10, 25, 50]}
          serverPagination={{
            total,
            page,
            pageSize,
            onPageChange:     handlePageChange,
            onPageSizeChange: handlePageSizeChange,
          }}
        />
        <SaleFormSheet
          open={formOpen}
          sale={editSale}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      </>
    )
  }
)
