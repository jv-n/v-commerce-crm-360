import type { ReactNode } from "react"

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
  header: string
  minWidth?: string
  /** Set false to hide from table while keeping filter available */
  visible?: boolean
  render: (row: T) => ReactNode
  filter?: FilterDef<T>
}

export interface Tab {
  id: string
  label: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  getRowId: (row: T) => string
  tabs?: Tab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  rowsPerPageOptions?: number[]
  defaultRowsPerPage?: number
}
