import type { ReactNode } from "react"
import { useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import type {
  DataTableProps,
  NumberRangeFilterDef,
  SelectFilterDef,
  ServerPagination,
} from "./types"
import {
  formatActiveFilter,
  isFilterActive,
  useFilterState,
} from "./hooks/useFilterState"
import { usePagination } from "./hooks/usePagination"
import { useRowSelection } from "./hooks/useRowSelection"
import { FilterPill } from "./atoms/FilterPill"
import { NumberRangeDropdown } from "./atoms/NumberRangeDropdown"
import { SelectDropdown } from "./atoms/SelectDropdown"
import { TogglePill } from "./atoms/TogglePill"
import { DataTableFilterBar } from "./molecules/DataTableFilterBar"
import { DataTablePagination } from "./molecules/DataTablePagination"
import { DataTableRows } from "./molecules/DataTableRows"
import { DataTableTabs } from "./molecules/DataTableTabs"

function buildServerPageInfo(sp: ServerPagination, dataLength: number) {
  const totalPages = Math.max(1, Math.ceil(sp.total / sp.pageSize))

  return {
    pageData: null,
    safePage: sp.page,
    pageNumbers: Array.from({ length: totalPages }, (_, i) => i + 1),
    startItem: sp.total === 0 ? 0 : (sp.page - 1) * sp.pageSize + 1,
    endItem: Math.min(sp.page * sp.pageSize, sp.total),
    totalItems: sp.total,
    _dataLength: dataLength,
  }
}

export function DataTable<T,>({
  data,
  columns,
  getRowId,
  loading,
  tabs = [],
  activeTab,
  onTabChange,
  rowsPerPageOptions = [10, 25, 50],
  defaultRowsPerPage = 10,
  serverPagination,
  onFiltersChange,
  onSearchChange,
  headerClassName,
  rowClassName,
  dividersClassName,
  expandedRowIds,
  renderExpandedRow,
  filterBarExtra,
  tabsRightSlot,
  searchFn,
  searchPlaceholder,
  onSortChange,
}: DataTableProps<T>) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    onSearchChange?.(q)
  }

  const searchedData = useMemo(() => {
    if (!searchFn || !searchQuery.trim()) return data
    return data.filter(row => searchFn(row, searchQuery))
  }, [data, searchFn, searchQuery])

  const filters = useFilterState(columns, searchedData, onFiltersChange)
  const pagination = usePagination(defaultRowsPerPage)
  const selection = useRowSelection(getRowId)

  const [shownOptionalKeys, setShownOptionalKeys] = useState<Set<string>>(
    new Set()
  )
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc"

    setSortKey(key)
    setSortDir(newDir)
    pagination.resetPage()

    if (serverPagination) {
      onSortChange?.({ key, direction: newDir })
    }
  }

  const sortedData = (arr: T[]): T[] => {
    if (!sortKey || serverPagination) return arr

    const col = columns.find(c => c.key === sortKey)
    if (!col?.sortValue) return arr

    return [...arr].sort((a, b) => {
      const va = col.sortValue!(a) ?? ""
      const vb = col.sortValue!(b) ?? ""

      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1

      return 0
    })
  }

  const { pageData, safePage, ...pageInfo } = serverPagination
    ? { ...buildServerPageInfo(serverPagination, data.length), pageData: data }
    : pagination.paginate(sortedData(filters.filteredData))

  const visibleColumns = columns.filter(c => c.visible !== false)

  const mandatoryFilterCols = columns.filter(c => c.filter && !c.filterOptional)
  const optionalFilterCols = columns.filter(c => c.filter && c.filterOptional)

  const isActive = (key: string) => {
    const f = filters.activeFilters[key]
    return !!f && isFilterActive(f)
  }

  const shownOptionalCols = optionalFilterCols.filter(
    c => shownOptionalKeys.has(c.key) || isActive(c.key)
  )

  const filterPillCols = [...mandatoryFilterCols, ...shownOptionalCols]

  const availableOptionalFilters = optionalFilterCols
    .filter(c => !shownOptionalKeys.has(c.key) && !isActive(c.key))
    .map(c => ({ key: c.key, label: c.filter!.label }))

  const addOptionalFilter = (key: string) => {
    setShownOptionalKeys(prev => new Set([...prev, key]))
  }

  const handleTabChange = (tabId: string) => {
    onTabChange?.(tabId)
    filters.clearAllFilters()
    pagination.resetPage()
    selection.clearSelection()
    setShownOptionalKeys(new Set())
    setSortKey(null)
    setSortDir("asc")
  }

  const renderPill = (
    colKey: string,
    alignRight = false,
    isOptional = false
  ): ReactNode => {
    const col = columns.find(c => c.key === colKey)
    if (!col?.filter) return null

    const def = col.filter

    if (def.type === "toggle") {
      const active = filters.activeFilters[colKey]
      const isOn = active?.type === "toggle" ? active.active : false

      return (
        <TogglePill
          key={colKey}
          label={def.label}
          active={isOn}
          onToggle={() => {
            filters.setFilter(colKey, { type: "toggle", active: !isOn })
            pagination.resetPage()
          }}
        />
      )
    }

    const active = filters.activeFilters[colKey]
    const active_ = active && isFilterActive(active)

    const handleClear = () => {
      filters.clearFilter(colKey)
      pagination.resetPage()

      if (isOptional) {
        setShownOptionalKeys(prev => {
          const next = new Set(prev)
          next.delete(colKey)
          return next
        })
      }
    }

    const content =
      def.type === "select" ? (
        <SelectDropdown
          options={(def as SelectFilterDef<T>).options}
          activeValue={active?.type === "select" ? active.value : ""}
          onSelect={val => {
            filters.setFilter(colKey, { type: "select", value: val })
            pagination.resetPage()
          }}
          onClear={handleClear}
        />
      ) : (
        <NumberRangeDropdown
          current={
            active?.type === "number-range"
              ? { min: active.min, max: active.max }
              : null
          }
          onApply={(min, max) => {
            filters.setFilter(colKey, { type: "number-range", min, max })
            pagination.resetPage()
          }}
          onClear={handleClear}
          minBound={(def as NumberRangeFilterDef<T>).minBound}
          maxBound={(def as NumberRangeFilterDef<T>).maxBound}
          variant={(def as NumberRangeFilterDef<T>).variant}
        />
      )

    return (
      <FilterPill
        key={colKey}
        label={def.label}
        activeValue={active_ ? formatActiveFilter(active!) : undefined}
        isOpen={filters.openFilter === colKey}
        onToggle={() => filters.toggleOpenFilter(colKey)}
        onClear={e => {
          e.stopPropagation()
          handleClear()
        }}
        alignRight={alignRight}
      >
        {content}
      </FilterPill>
    )
  }

  const showFilterBar =
    filterPillCols.length > 0 || availableOptionalFilters.length > 0

  return (
    <>
      {filters.openFilter && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => filters.setOpenFilter(null)}
        />
      )}

      <div className={cn("flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white")}>
        {tabs.length > 0 && (
          <div className="shrink-0">
            <DataTableTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              rightSlot={tabsRightSlot}
              searchOpen={searchOpen}
              searchQuery={searchQuery}
              onSearchOpen={() => setSearchOpen(true)}
              onSearchChange={handleSearchChange}
              onSearchClose={() => {
                setSearchOpen(false)
                handleSearchChange("")
              }}
              searchPlaceholder={searchPlaceholder}
            />
          </div>
        )}

        {showFilterBar && (
          <div className="shrink-0">
            <DataTableFilterBar
              activeFilterCount={filters.activeFilterCount}
              onClearAll={() => {
                filters.clearAllFilters()
                pagination.resetPage()
                setShownOptionalKeys(new Set())
              }}
              availableOptionalFilters={availableOptionalFilters}
              onAddFilter={addOptionalFilter}
              extra={filterBarExtra}
            >
              {filterPillCols.map(col =>
                renderPill(col.key, false, col.filterOptional)
              )}
            </DataTableFilterBar>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto">
          <DataTableRows
            columns={visibleColumns}
            pageData={pageData}
            getRowId={getRowId}
            loading={loading}
            selectedRows={selection.selectedRows}
            isAllSelected={selection.isPageAllSelected(pageData)}
            onToggleAll={() => selection.toggleAll(pageData)}
            onToggleRow={selection.toggleRow}
            headerClassName={headerClassName}
            rowClassName={rowClassName}
            dividersClassName={dividersClassName}
            expandedRowIds={expandedRowIds}
            renderExpandedRow={renderExpandedRow}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>

        <div className="shrink-0">
          <DataTablePagination
            {...pageInfo}
            currentPage={safePage}
            rowsPerPage={serverPagination?.pageSize ?? pagination.rowsPerPage}
            rowsPerPageOptions={rowsPerPageOptions}
            onPageChange={
              serverPagination?.onPageChange ?? pagination.setCurrentPage
            }
            onRowsPerPageChange={
              serverPagination?.onPageSizeChange ?? pagination.changeRowsPerPage
            }
          />
        </div>
      </div>
    </>
  )
}