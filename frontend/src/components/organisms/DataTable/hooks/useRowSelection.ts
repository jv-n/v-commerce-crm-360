import { useState } from "react"

export function useRowSelection<T>(getRowId: (row: T) => string) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const isPageAllSelected = (page: T[]): boolean =>
    page.length > 0 && page.every(r => selectedRows.has(getRowId(r)))

  const toggleAll = (page: T[]) => {
    const next = new Set(selectedRows)
    if (isPageAllSelected(page)) page.forEach(r => next.delete(getRowId(r)))
    else                         page.forEach(r => next.add(getRowId(r)))
    setSelectedRows(next)
  }

  const toggleRow = (id: string) => {
    const next = new Set(selectedRows)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedRows(next)
  }

  const clearSelection = () => setSelectedRows(new Set())

  return { selectedRows, isPageAllSelected, toggleAll, toggleRow, clearSelection }
}
