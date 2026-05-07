import { useState, forwardRef, useImperativeHandle } from "react"
import { DataTable } from "@/components/organisms/DataTable"
import { makeProductColumns } from "./columns"
import { mockProducts } from "@/lib/mocks/products"
import { cn } from "@/lib/utils"
import { ProductExpandedRow } from "./ProductExpandedRow"
import { AdvancedFiltersDrawer, EMPTY_ADVANCED, advancedActiveCount } from "./AdvancedFiltersDrawer"
import { GroupedUFDropdown } from "./GroupedUFDropdown"
import type { AdvancedFilters } from "./AdvancedFiltersDrawer"
import type { Tab } from "@/components/organisms/DataTable/types"
import type { Product } from "@/types/product"
import TuneIcon from "@mui/icons-material/Tune"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import CloseIcon from "@mui/icons-material/Close"

const TABS: Tab[] = [
  { id: "all", label: "Todos os produtos" },
  { id: "new", label: "Novos produtos" },
]

function parseDMY(s: string): Date {
  const [d, m, y] = s.split("/")
  return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`)
}

function applyCustomFilters(
  products: Product[],
  tab: string,
  uf: string | null,
  adv: AdvancedFilters,
): Product[] {
  let data = products

  if (tab === "new")     data = data.filter(p => p.state === "Novo")
  if (uf)                data = data.filter(p => p.uf === uf)
  if (adv.states.length) data = data.filter(p => adv.states.includes(p.state))

  const priceMin = adv.priceMin !== "" ? Number(adv.priceMin) : null
  const priceMax = adv.priceMax !== "" ? Number(adv.priceMax) : null
  if (priceMin != null) data = data.filter(p => p.price != null && p.price >= priceMin)
  if (priceMax != null) data = data.filter(p => p.price != null && p.price <= priceMax)

  const ratingMin = adv.ratingMin !== "" ? Number(adv.ratingMin) : null
  const ratingMax = adv.ratingMax !== "" ? Number(adv.ratingMax) : null
  if (ratingMin != null) data = data.filter(p => p.rating >= ratingMin)
  if (ratingMax != null) data = data.filter(p => p.rating <= ratingMax)

  const stockMin = adv.stockMin !== "" ? Number(adv.stockMin) : null
  const stockMax = adv.stockMax !== "" ? Number(adv.stockMax) : null
  if (stockMin != null) data = data.filter(p => p.stock >= stockMin)
  if (stockMax != null) data = data.filter(p => p.stock <= stockMax)

  if (adv.dateFrom) {
    const from = new Date(adv.dateFrom)
    data = data.filter(p => parseDMY(p.createdAt) >= from)
  }
  if (adv.dateTo) {
    const to = new Date(adv.dateTo)
    data = data.filter(p => parseDMY(p.createdAt) <= to)
  }

  return data
}

export type ProductsTableHandle = {
  undo:  () => void
  reset: () => void
}

export const ProductsTable = forwardRef<ProductsTableHandle, { onCanUndoChange?: (can: boolean) => void }>(
  ({ onCanUndoChange }, ref) => {
  const [activeTab,      setActiveTab]      = useState("all")
  const [tableKey,       setTableKey]       = useState(0)
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set())
  const [selectedUF,     setSelectedUF]     = useState<string | null>(null)
  const [ufOpen,         setUfOpen]         = useState(false)
  const [advanced,       setAdvanced]       = useState<AdvancedFilters>(EMPTY_ADVANCED)
  const [drawerOpen,     setDrawerOpen]     = useState(false)

  const advCount = advancedActiveCount(advanced)

  const data = applyCustomFilters(mockProducts, activeTab, selectedUF, advanced)

  const onToggleExpand = (id: string) =>
    setExpandedRowIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const onToggleAllExpand = () =>
    setExpandedRowIds(prev =>
      prev.size === data.length
        ? new Set()
        : new Set(data.map(p => p.id))
    )

  useImperativeHandle(ref, () => ({
    undo:  () => {},
    reset: () => {
      setActiveTab("all")
      setSelectedUF(null)
      setAdvanced(EMPTY_ADVANCED)
      setTableKey(k => k + 1)
      onCanUndoChange?.(false)
    },
  }))

  const tabsRightSlot = (
    <div className="relative">
      {ufOpen && <div className="fixed inset-0 z-[9998]" onClick={() => setUfOpen(false)} />}
      <button
        onClick={() => setUfOpen(o => !o)}
        className={cn(
          "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors",
          selectedUF ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-600 hover:bg-gray-100"
        )}
      >
        {selectedUF ?? "Todos os estados"}
        {selectedUF && (
          <span role="button" onClick={e => { e.stopPropagation(); setSelectedUF(null) }} className="hover:opacity-70">
            <CloseIcon sx={{ fontSize: 12 }} />
          </span>
        )}
        <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
      </button>

      {ufOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] min-w-[220px]">
          <GroupedUFDropdown
            selected={selectedUF}
            onSelect={uf => { setSelectedUF(uf); setUfOpen(false) }}
          />
        </div>
      )}
    </div>
  )

  const filterBarExtra = (
    <button
      onClick={() => setDrawerOpen(true)}
      className={cn(
        "flex items-center gap-1.5 text-sm transition-colors",
        advCount > 0 ? "text-purple-700 font-medium" : "text-gray-400 hover:text-gray-600"
      )}
    >
      <TuneIcon sx={{ fontSize: 15 }} />
      Filtros avançados
      {advCount > 0 && (
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold leading-none">
          {advCount}
        </span>
      )}
    </button>
  )

  return (
    <>
      <AdvancedFiltersDrawer
        open={drawerOpen}
        filters={advanced}
        onChange={setAdvanced}
        onClose={() => setDrawerOpen(false)}
        onClear={() => setAdvanced(EMPTY_ADVANCED)}
      />

      <DataTable
        key={tableKey}
        data={data}
        columns={makeProductColumns(expandedRowIds, onToggleExpand, data.map(p => p.id), onToggleAllExpand)}
        getRowId={(p) => p.id}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={tab => { setActiveTab(tab); setTableKey(k => k + 1) }}
        searchFn={(p, q) => p.name.toLowerCase().includes(q.toLowerCase())}
        searchPlaceholder="Buscar produto..."
        noBorder
        headerClassName="bg-[#F0DDFD]"
        dividersClassName="divide-[#9F83B2]"
        expandedRowIds={expandedRowIds}
        renderExpandedRow={(p) => <ProductExpandedRow product={p} />}
        tabsRightSlot={tabsRightSlot}
        filterBarExtra={filterBarExtra}
      />
    </>
  )
})
