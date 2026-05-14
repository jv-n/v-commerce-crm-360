import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { useNavigate } from "react-router-dom"
import { DataTable } from "@/components/organisms/DataTable"
import { makeProductColumns } from "./columns"
import { cn } from "@/lib/utils"
import { ProductExpandedRow } from "./ProductExpandedRow"
import { AdvancedFiltersDrawer, EMPTY_ADVANCED, advancedActiveCount } from "./AdvancedFiltersDrawer"
import { fetchProducts } from "@/lib/api/products"
import type { AdvancedFilters } from "./AdvancedFiltersDrawer"
import type { ProductsParams } from "@/lib/api/products"
import type { ActiveFilters, Tab } from "@/components/organisms/DataTable/types"
import type { Product } from "@/types/product"
import { MdFilterList, MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md"

const TABS: Tab[] = [
  { id: "all", label: "Todos os produtos" },
  { id: "new", label: "Novos produtos" },
]

const DEFAULT_PAGE_SIZE = 10

function isoToDMY(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function columnFiltersToParams(cf: ActiveFilters): Partial<ProductsParams> {
  const p: Partial<ProductsParams> = {}

  const cat = cf.category
  if (cat?.type === "select" && cat.value) p.category = cat.value

  const price = cf.price
  if (price?.type === "number-range") {
    if (price.min != null) p.price_min = price.min
    if (price.max != null) p.price_max = price.max
  }

  const stock = cf.stock
  if (stock?.type === "number-range") {
    if (stock.min != null) p.stock_min = stock.min
    if (stock.max != null) p.stock_max = stock.max
  }

  const rating = cf.rating
  if (rating?.type === "number-range") {
    if (rating.min != null) p.rating_min = rating.min
    if (rating.max != null) p.rating_max = rating.max
  }

  const sales = cf.totalSales
  if (sales?.type === "number-range") {
    if (sales.min != null) p.sales_min = sales.min
    if (sales.max != null) p.sales_max = sales.max
  }

  return p
}

function newTabDateFrom(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 1)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${dd}/${mm}/${d.getFullYear()}`
}

function buildParams(
  page: number,
  pageSize: number,
  tab: string,
  adv: AdvancedFilters,
  colFilters: ActiveFilters,
  search: string,
  sort?: { key: string; direction: "asc" | "desc" } | null,
): ProductsParams {
  let status: string | undefined
  let tabDateFrom: string | undefined

  if (tab === "new") {
    tabDateFrom = newTabDateFrom()
  } else if (adv.states.length) {
    status = adv.states.join(",")
  }

  // adv.dateFrom explícito prevalece sobre o corte do tab
  const effectiveDateFrom = adv.dateFrom ? isoToDMY(adv.dateFrom) : tabDateFrom

  return {
    page,
    pageSize,
    ...(search             && { search }),
    ...(status             && { status }),

    ...(adv.priceMin  !== "" && { price_min:  Number(adv.priceMin)  }),
    ...(adv.priceMax  !== "" && { price_max:  Number(adv.priceMax)  }),
    ...(adv.stockMin  !== "" && { stock_min:  Number(adv.stockMin)  }),
    ...(adv.stockMax  !== "" && { stock_max:  Number(adv.stockMax)  }),
    ...(adv.ratingMin !== "" && { rating_min: Number(adv.ratingMin) }),
    ...(adv.ratingMax !== "" && { rating_max: Number(adv.ratingMax) }),
    ...(effectiveDateFrom  && { date_from: effectiveDateFrom }),
    ...(adv.dateTo         && { date_to:   isoToDMY(adv.dateTo) }),
    ...columnFiltersToParams(colFilters),
    ...(sort && { sort_by: sort.key, sort_dir: sort.direction }),
  }
}

export type ProductsTableHandle = {
  undo:  () => void
  reset: () => void
}

export const ProductsTable = forwardRef<ProductsTableHandle, { onCanUndoChange?: (can: boolean) => void }>(
  ({ onCanUndoChange }, ref) => {
  const [activeTab,      setActiveTab]      = useState("all")
  const [page,           setPage]           = useState(1)
  const [pageSize,       setPageSize]       = useState(DEFAULT_PAGE_SIZE)
  const [total,          setTotal]          = useState(0)
  const [loading,        setLoading]        = useState(true)
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set())

  const [advanced,       setAdvanced]       = useState<AdvancedFilters>(EMPTY_ADVANCED)
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [colFilters,     setColFilters]     = useState<ActiveFilters>({})
  const [searchQuery,    setSearchQuery]    = useState("")
  const [products,       setProducts]       = useState<Product[]>([])
  const [error,          setError]          = useState<string | null>(null)
  const [sort,           setSort]           = useState<{ key: string; direction: "asc" | "desc" } | null>(null)

  const navigate    = useNavigate()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const params = buildParams(page, pageSize, activeTab, advanced, colFilters, searchQuery, sort)

    const hasTextInput =
      searchQuery !== "" ||
      advanced.priceMin  !== "" || advanced.priceMax  !== "" ||
      advanced.stockMin  !== "" || advanced.stockMax  !== "" ||
      advanced.ratingMin !== "" || advanced.ratingMax !== "" ||
      colFilters.price?.type === "number-range" ||
      colFilters.stock?.type === "number-range" ||
      colFilters.rating?.type === "number-range"

    const delay = hasTextInput ? 300 : 0

    if (debounceRef.current) clearTimeout(debounceRef.current)

    let cancelled = false
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      fetchProducts(params)
        .then(res => {
          if (cancelled) return
          setProducts(res.data)
          setTotal(res.total)
        })
        .catch(err => { if (!cancelled) setError(String(err)) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, delay)

    return () => {
      cancelled = true
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [page, pageSize, activeTab, advanced, colFilters, searchQuery, sort])

  const advCount = advancedActiveCount(advanced)

  const resetPage = () => setPage(1)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setColFilters({})
    setSearchQuery("")
    resetPage()
  }

  const handleFiltersChange = (active: ActiveFilters) => {
    setColFilters(active)
    resetPage()
  }

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    resetPage()
  }

  const handleSortChange = (s: { key: string; direction: "asc" | "desc" } | null) => {
    setSort(s)
    resetPage()
  }

  const handlePageChange = (newPage: number) => setPage(newPage)

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    resetPage()
  }

  const onToggleExpand = (id: string) =>
    setExpandedRowIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const onToggleAllExpand = () =>
    setExpandedRowIds(prev =>
      prev.size === products.length ? new Set() : new Set(products.map(p => p.id))
    )

  useImperativeHandle(ref, () => ({
    undo: () => {},
    reset: () => {
      setActiveTab("all")
      setAdvanced(EMPTY_ADVANCED)
      setColFilters({})
      setSearchQuery("")
      setSort(null)
      setPage(1)
      setPageSize(DEFAULT_PAGE_SIZE)
      onCanUndoChange?.(false)
    },
  }))


  const filterBarExtra = (
    <button
      onClick={() => setDrawerOpen(o => !o)}
      className={cn(
        "flex items-center gap-1.5 text-sm transition-colors px-2 py-1 rounded-md",
        advCount > 0 ? "text-purple-700 font-medium hover:bg-[#F7EBFF]" : "text-gray-900 hover:bg-[#F7EBFF]"
      )}
    >
      <MdFilterList size={15} />
      Filtros avançados
      {advCount > 0 && (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold leading-none">
          {advCount}
        </span>
      )}
      {drawerOpen ? <MdKeyboardArrowUp size={15} /> : <MdKeyboardArrowDown size={15} />}
    </button>
  )

  if (error) return <p className="text-red-500 p-4">Erro ao carregar produtos: {error}</p>

  return (
    <>
      <AdvancedFiltersDrawer
        open={drawerOpen}
        filters={advanced}
        onChange={f => { setAdvanced(f); resetPage() }}
        onClose={() => setDrawerOpen(false)}
        onClear={() => { setAdvanced(EMPTY_ADVANCED); resetPage() }}
      />

      <DataTable
        loading={loading}
        data={loading ? [] : products}
        columns={makeProductColumns(expandedRowIds, onToggleExpand, products.map(p => p.id), onToggleAllExpand, (id) => navigate(`/products/${id}`)
        )}
        getRowId={(p) => p.id}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchFn={(p, q) => p.name.toLowerCase().includes(q.toLowerCase())}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
        searchPlaceholder="Buscar produto..."
        noBorder
        rowsPerPageOptions={[10, 25, 50]}
        expandedRowIds={expandedRowIds}
        renderExpandedRow={(p) => <ProductExpandedRow product={p} />}
        onRowClick={(p) => onToggleExpand(p.id)}
        onSortChange={handleSortChange}
        filterBarExtra={filterBarExtra}
        serverPagination={{
          total,
          page,
          pageSize,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
        }}
      />
    </>
  )
})
