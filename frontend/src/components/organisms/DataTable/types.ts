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

export type FilterDef<T> = SelectFilterDef<T> | NumberRangeFilterDef<T>

// ─── Active filter state ──────────────────────────────────────────────────────

export type SelectActiveFilter      = { type: "select"; value: string }
export type NumberRangeActiveFilter = { type: "number-range"; min: number | null; max: number | null }
export type ActiveFilter            = SelectActiveFilter | NumberRangeActiveFilter
export type ActiveFilters           = Record<string, ActiveFilter>

// ─── Column & Table props ─────────────────────────────────────────────────────

export interface Column<T> {
  key: string
  header: ReactNode
  minWidth?: string
  /** Set false to hide from table while keeping filter available */
  visible?: boolean
  /** If true, filter is hidden by default and only shown when user adds it via "+" */
  filterOptional?: boolean
  render: (row: T) => ReactNode
  filter?: FilterDef<T>
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
  columns: Column<T>[]
  getRowId: (row: T) => string
  tabs?: Tab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  rightFilterKey?: string
  rowsPerPageOptions?: number[]
  defaultRowsPerPage?: number
  /** When provided, disables internal pagination and uses these server-driven values */
  serverPagination?: ServerPagination
  /** Called whenever a column filter changes */
  onFiltersChange?: (filters: ActiveFilters) => void
  /** Called whenever the search query changes */
  onSearchChange?: (query: string) => void
  noBorder?: boolean
  headerClassName?: string
  rowClassName?: string
  dividersClassName?: string
  expandedRowIds?: Set<string>
  renderExpandedRow?: (row: T) => React.ReactNode
  filterBarExtra?: React.ReactNode
  tabsRightSlot?: React.ReactNode
  searchFn?: (row: T, query: string) => boolean
  searchPlaceholder?: string
}
