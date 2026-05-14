import type { ReactNode } from "react"
import type React from "react"

// ─── Filter definitions (attached to Column) ─────────────────────────────────

export interface SelectFilterDef<T> {
  type: "select"
  label: string
  options: string[]
  filterFn: (row: T, value: string) => boolean
}

export interface NumberRangeFilterDef<T> {
  type: "number-range"
  label: string
  minBound?: number
  maxBound?: number
  variant?: "slider"
  filterFn: (row: T, min: number | null, max: number | null) => boolean
}

export interface ToggleFilterDef<T> {
  type: "toggle"
  label: string
  defaultActive?: boolean
  filterFn: (row: T) => boolean
}

export interface MultiSelectFilterDef<T> {
  type: "multi-select"
  label: string
  options: string[]
  renderOption?: (value: string) => ReactNode
  filterFn?: (row: T, values: string[]) => boolean
}

export type FilterDef<T> =
  | SelectFilterDef<T>
  | NumberRangeFilterDef<T>
  | ToggleFilterDef<T>
  | MultiSelectFilterDef<T>

// ─── Active filter state ──────────────────────────────────────────────────────

export type SelectActiveFilter = { type: "select"; value: string }

export type NumberRangeActiveFilter = {
  type: "number-range"
  min: number | null
  max: number | null
}

export type ToggleActiveFilter = {
  type: "toggle"
  active: boolean
}

export type MultiSelectActiveFilter = {
  type: "multi-select"
  values: string[]
}

export type ActiveFilter =
  | SelectActiveFilter
  | NumberRangeActiveFilter
  | ToggleActiveFilter
  | MultiSelectActiveFilter

export type ActiveFilters = Record<string, ActiveFilter>

// ─── Column & Table props ─────────────────────────────────────────────────────

export interface Column<T> {
  key: string
  header: ReactNode
  minWidth?: string
  visible?: boolean
  filterOptional?: boolean
  sortable?: boolean
  sortValue?: (row: T) => string | number | null | undefined
  render: (row: T) => ReactNode
  filter?: FilterDef<T>
  /** When provided, shows a copy-to-clipboard icon next to the cell content with this ID value */
  copyId?: (row: T) => string
}

export interface Tab {
  id: string
  label: string
  count?: number
}

export interface ServerPagination {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export interface DataTableProps<T> {
  data: T[]
  loading?: boolean
  columns: Column<T>[]
  getRowId: (row: T) => string
  tabs?: Tab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  rightFilterKey?: string
  rowsPerPageOptions?: number[]
  defaultRowsPerPage?: number
  serverPagination?: ServerPagination
  onFiltersChange?: (filters: ActiveFilters) => void
  onSearchChange?: (query: string) => void
  onSortChange?: (sort: { key: string; direction: "asc" | "desc" } | null) => void
  /** Quando fornecido, clicar em qualquer ponto da linha chama este callback (ex: toggle expand) */
  onRowClick?: (row: T) => void
  noBorder?: boolean
  headerClassName?: string
  rowClassName?: string
  expandedRowClassName?: string
  dividersClassName?: string
  expandedRowIds?: Set<string>
  renderExpandedRow?: (row: T) => React.ReactNode
  filterBarExtra?: React.ReactNode
  tabsRightSlot?: React.ReactNode
  searchFn?: (row: T, query: string) => boolean
  searchPlaceholder?: string

  /**
   * Quantidade de filtros externos ativos.
   * Exemplo: filtros criados via filterBarExtra, como data inicial/final.
   */
  extraActiveFilterCount?: number

  /**
   * Função chamada junto com "Limpar todos".
   * Serve para limpar filtros externos criados fora da DataTable.
   */
  onClearExtraFilters?: () => void

  /** Disparado sempre que o conjunto de linhas selecionadas muda. */
  onSelectionChange?: (ids: Set<string>) => void
}