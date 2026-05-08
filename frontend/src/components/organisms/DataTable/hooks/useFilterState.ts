import { useState, useMemo } from "react"
import type { Column, ActiveFilters, ActiveFilter } from "../types"

export function isFilterActive(f: ActiveFilter): boolean {
  if (f.type === "select") return f.value !== ""
  if (f.type === "toggle") return f.active
  return f.min != null || f.max != null
}

export function formatActiveFilter(f: ActiveFilter): string {
  if (f.type === "select") return f.value
  if (f.type === "toggle") return ""
  const { min, max } = f
  if (min != null && max != null) return `${min} – ${max}`
  if (min != null) return `≥ ${min}`
  if (max != null) return `≤ ${max}`
  return ""
}

export function useFilterState<T>(columns: Column<T>[], data: T[], onChange?: (f: ActiveFilters) => void) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(() => {
    const init: ActiveFilters = {}
    for (const col of columns) {
      if (col.filter?.type === "toggle" && col.filter.defaultActive) {
        init[col.key] = { type: "toggle", active: true }
      }
    }
    return init
  })
  const [openFilter, setOpenFilter]       = useState<string | null>(null)

  const setFilter = (key: string, value: ActiveFilter) => {
    setActiveFilters(prev => {
      const next = { ...prev, [key]: value }
      onChange?.(next)
      return next
    })
    setOpenFilter(null)
  }

  const clearFilter = (key: string) => {
    setActiveFilters(prev => {
      const next = { ...prev }
      delete next[key]
      onChange?.(next)
      return next
    })
    setOpenFilter(null)
  }

  const clearAllFilters = () => {
    onChange?.({})
    setActiveFilters({})
  }

  const toggleOpenFilter = (key: string) =>
    setOpenFilter(prev => (prev === key ? null : key))

  const filteredData = useMemo(() => {
    const filterCols = columns.filter(c => c.filter)
    if (!filterCols.length || !Object.keys(activeFilters).length) return data

    return data.filter(row =>
      filterCols.every(col => {
        const active = activeFilters[col.key]
        if (!active || !isFilterActive(active)) return true
        const def = col.filter!

        if (def.type === "select" && active.type === "select")
          return def.filterFn(row, active.value)
        if (def.type === "number-range" && active.type === "number-range")
          return def.filterFn(row, active.min, active.max)
        if (def.type === "toggle" && active.type === "toggle" && active.active)
          return def.filterFn(row)
        return true
      })
    )
  }, [data, activeFilters, columns])

  const activeFilterCount = Object.values(activeFilters).filter(isFilterActive).length

  return {
    activeFilters,
    openFilter,
    setOpenFilter,
    toggleOpenFilter,
    setFilter,
    clearFilter,
    clearAllFilters,
    filteredData,
    activeFilterCount,
  }
}
