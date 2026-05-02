import type { ReactNode } from "react"

export interface Column<T> {
  key: string
  header: string
  minWidth?: string
  render: (row: T) => ReactNode
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
  filterPills?: string[]
  rowsPerPageOptions?: number[]
  defaultRowsPerPage?: number
}