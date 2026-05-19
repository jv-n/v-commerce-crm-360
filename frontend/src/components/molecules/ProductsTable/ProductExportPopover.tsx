import { ExportPopover, type ExportPill } from "@/components/molecules/ExportPopover"
import type { AdvancedFilters } from "./AdvancedFiltersDrawer"
import type { ActiveFilters } from "@/components/organisms/DataTable/types"

function fmtR(v: string) {
  return `R$${Number(v).toLocaleString("pt-BR")}`
}

function buildPills(
  advanced: AdvancedFilters,
  colFilters: ActiveFilters,
  searchQuery: string,
  activeTab: string,
): ExportPill[] {
  const pills: ExportPill[] = []

  if (activeTab === "new") pills.push({ label: "Aba", value: "Novos produtos" })
  if (searchQuery)         pills.push({ label: "Busca", value: searchQuery })

  if (advanced.states.length)
    pills.push({ label: "Status", value: advanced.states.join(", ") })

  if (advanced.priceMin !== "" || advanced.priceMax !== "") {
    const min = advanced.priceMin !== "" ? fmtR(advanced.priceMin) : null
    const max = advanced.priceMax !== "" ? fmtR(advanced.priceMax) : null
    pills.push({ label: "Preço", value: min && max ? `${min} – ${max}` : min ? `> ${min}` : `< ${max!}` })
  }

  if (advanced.stockMin !== "" || advanced.stockMax !== "") {
    const min = advanced.stockMin !== "" ? advanced.stockMin : null
    const max = advanced.stockMax !== "" ? advanced.stockMax : null
    pills.push({ label: "Estoque", value: min && max ? `${min} – ${max}` : min ? `> ${min}` : `< ${max!}` })
  }

  if (advanced.ratingMin !== "" || advanced.ratingMax !== "") {
    const min = advanced.ratingMin !== "" ? advanced.ratingMin : null
    const max = advanced.ratingMax !== "" ? advanced.ratingMax : null
    pills.push({ label: "Avaliação", value: min && max ? `${min} – ${max}` : min ? `> ${min}` : `< ${max!}` })
  }

  if (advanced.dateFrom || advanced.dateTo) {
    const from = advanced.dateFrom ? new Date(advanced.dateFrom).toLocaleDateString("pt-BR") : null
    const to   = advanced.dateTo   ? new Date(advanced.dateTo).toLocaleDateString("pt-BR")   : null
    pills.push({ label: "Data", value: from && to ? `${from} – ${to}` : from ? `a partir de ${from}` : `até ${to!}` })
  }

  const cat = colFilters.category
  if (cat?.type === "select" && cat.value)
    pills.push({ label: "Categoria", value: cat.value })
  if (cat?.type === "multi-select" && cat.values.length > 0)
    pills.push({ label: "Categoria", value: cat.values.join(", ") })

  const price = colFilters.price
  if (price?.type === "number-range" && (price.min != null || price.max != null)) {
    const min = price.min != null ? fmtR(String(price.min)) : null
    const max = price.max != null ? fmtR(String(price.max)) : null
    pills.push({ label: "Preço", value: min && max ? `${min} – ${max}` : min ? `> ${min}` : `< ${max!}` })
  }

  const stock = colFilters.stock
  if (stock?.type === "number-range" && (stock.min != null || stock.max != null))
    pills.push({ label: "Estoque", value: `${stock.min ?? "—"} – ${stock.max ?? "—"}` })

  const rating = colFilters.rating
  if (rating?.type === "number-range" && (rating.min != null || rating.max != null))
    pills.push({ label: "Avaliação", value: `${rating.min ?? "—"} – ${rating.max ?? "—"}` })

  const sales = colFilters.totalSales
  if (sales?.type === "number-range" && (sales.min != null || sales.max != null))
    pills.push({ label: "Vendas", value: `${sales.min ?? "—"} – ${sales.max ?? "—"}` })

  return pills
}

interface Props {
  open: boolean
  onClose: () => void
  total: number
  advanced: AdvancedFilters
  colFilters: ActiveFilters
  searchQuery: string
  activeTab: string
  exportLoading: boolean
  onExport: () => void
  selectedCount?: number
  onExportSelected?: () => void
}

export function ProductExportPopover({ open, onClose, total, advanced, colFilters, searchQuery, activeTab, exportLoading, onExport, selectedCount, onExportSelected }: Props) {
  return (
    <ExportPopover
      open={open}
      onClose={onClose}
      total={total}
      entityLabel="Produtos"
      pills={buildPills(advanced, colFilters, searchQuery, activeTab)}
      exportLoading={exportLoading}
      onExport={onExport}
      selectedCount={selectedCount}
      onExportSelected={onExportSelected}
    />
  )
}
