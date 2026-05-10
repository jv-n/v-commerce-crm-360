import { useState, useMemo } from "react"
import type { Column, ActiveFilters, ActiveFilter } from "../types"

export function isFilterActive(f: ActiveFilter): boolean {
  if (f.type === "select") return f.value !== ""
  if (f.type === "toggle") return f.active
  if (f.type === "multi-select") return f.values.length > 0
  return f.min != null || f.max != null
}

export function formatActiveFilter(f: ActiveFilter): string {
  if (f.type === "select") return f.value
  if (f.type === "toggle") return ""
  if (f.type === "multi-select") {
    if (f.values.length === 0) return ""
    if (f.values.length <= 2) return f.values.join(", ")
    return `${f.values.length} selecionados`
  }
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

  const setFilter = (key: string, value: ActiveFilter, keepOpen = false) => {
    const next = { ...activeFilters, [key]: value }
    setActiveFilters(next)
    onChange?.(next)
    if (!keepOpen) setOpenFilter(null)
  }

  const clearFilter = (key: string) => {
    const next = { ...activeFilters }
    delete next[key]
    setActiveFilters(next)
    onChange?.(next)
    setOpenFilter(null)
  }

  const clearAllFilters = () => {
    setActiveFilters({})
    onChange?.({})
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
        if (def.type === "multi-select" && active.type === "multi-select")
          return def.filterFn(row, active.values)
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
