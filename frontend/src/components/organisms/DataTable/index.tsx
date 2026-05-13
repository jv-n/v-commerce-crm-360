import type { ReactNode } from "react"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { DataTableProps, SelectFilterDef, NumberRangeFilterDef, MultiSelectFilterDef, ServerPagination } from "./types"
import { useFilterState, isFilterActive, formatActiveFilter } from "./hooks/useFilterState"
import { useRowSelection } from "./hooks/useRowSelection"
import { usePagination } from "./hooks/usePagination"
import { DataTableTabs } from "./molecules/DataTableTabs"
import { DataTableFilterBar } from "./molecules/DataTableFilterBar"
import { DataTableRows } from "./molecules/DataTableRows"
import { DataTablePagination } from "./molecules/DataTablePagination"
import { FilterPill } from "./atoms/FilterPill"
import { TogglePill } from "./atoms/TogglePill"
import { SelectDropdown } from "./atoms/SelectDropdown"
import { NumberRangeDropdown } from "./atoms/NumberRangeDropdown"
import { MultiSelectDropdown } from "./atoms/MultiSelectDropdown"

function buildServerPageInfo(sp: ServerPagination, dataLength: number) {
  const totalPages = Math.max(1, Math.ceil(sp.total / sp.pageSize))
  return {
    pageData:    null,
    safePage:    sp.page,
    pageNumbers: Array.from({ length: totalPages }, (_, i) => i + 1),
    startItem:   sp.total === 0 ? 0 : (sp.page - 1) * sp.pageSize + 1,
    endItem:     Math.min(sp.page * sp.pageSize, sp.total),
    totalItems:  sp.total,
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
  expandedRowClassName,
  dividersClassName,
  expandedRowIds,
  renderExpandedRow,
  filterBarExtra,
  tabsRightSlot,
  searchFn,
  searchPlaceholder,
  onSortChange,
  onRowClick,
}: DataTableProps<T>) {
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    onSearchChange?.(q)
  }

  const searchedData = useMemo(() => {
    if (!searchFn || !searchQuery.trim()) return data
    return data.filter(row => searchFn(row, searchQuery))
  }, [data, searchFn, searchQuery])

  const filters    = useFilterState(columns, searchedData, onFiltersChange)
  const pagination = usePagination(defaultRowsPerPage)
  const selection  = useRowSelection(getRowId)

  const [shownOptionalKeys, setShownOptionalKeys] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === "asc" ? "desc" : "asc"
    setSortKey(key)
    setSortDir(newDir)
    pagination.resetPage()
    if (serverPagination) onSortChange?.({ key, direction: newDir })
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

  const visibleColumns  = columns.filter(c => c.visible !== false)
  
  const mandatoryFilterCols = columns.filter(c => c.filter && !c.filterOptional)
  const optionalFilterCols  = columns.filter(c => c.filter && c.filterOptional)

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

  const renderPill = (colKey: string, alignRight = false, isOptional = false): ReactNode => {
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

    let content: ReactNode
    if (def.type === "select") {
      content = (
        <SelectDropdown
          options={(def as SelectFilterDef<T>).options}
          activeValue={active?.type === "select" ? active.value : ""}
          onSelect={val => { filters.setFilter(colKey, { type: "select", value: val }); pagination.resetPage() }}
          onClear={handleClear}
        />
      )
    } else if (def.type === "multi-select") {
      const msDef = def as MultiSelectFilterDef<T>
      const activeVals = active?.type === "multi-select" ? active.values : []
      content = (
        <MultiSelectDropdown
          options={msDef.options}
          activeValues={activeVals}
          renderOption={msDef.renderOption}
          onToggle={val => {
            const next = activeVals.includes(val)
              ? activeVals.filter(v => v !== val)
              : [...activeVals, val]
            filters.setFilter(colKey, { type: "multi-select", values: next }, true)
            pagination.resetPage()
          }}
          onClear={handleClear}
        />
      )
    } else {
      content = (
        <NumberRangeDropdown
          current={active?.type === "number-range" ? { min: active.min, max: active.max } : null}
          onApply={(min, max) => { filters.setFilter(colKey, { type: "number-range", min, max }); pagination.resetPage() }}
          onClear={handleClear}
          minBound={(def as NumberRangeFilterDef<T>).minBound}
          maxBound={(def as NumberRangeFilterDef<T>).maxBound}
          variant={(def as NumberRangeFilterDef<T>).variant}
        />
      )
    }

    return (
      <FilterPill
        key={colKey}
        label={def.label}
        activeValue={active_ ? formatActiveFilter(active!) : undefined}
        isOpen={filters.openFilter === colKey}
        onToggle={() => filters.toggleOpenFilter(colKey)}
        onClear={e => { e.stopPropagation(); handleClear() }}
        alignRight={alignRight}
      >
        {content}
      </FilterPill>
    )
  }

  const showFilterBar = filterPillCols.length > 0 || availableOptionalFilters.length > 0

  return (
    <>
      {filters.openFilter && (
        <div className="fixed inset-0 z-40" onClick={() => filters.setOpenFilter(null)} />
      )}

      <div className={cn("flex flex-col bg-white overflow-hidden flex-1 min-h-0")}>
        {tabs.length > 0 && (
          <DataTableTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            rightSlot={tabsRightSlot}
            searchOpen={searchOpen}
            searchQuery={searchQuery}
            onSearchOpen={() => setSearchOpen(true)}
            onSearchChange={handleSearchChange}
            onSearchClose={() => { setSearchOpen(false); handleSearchChange("") }}
            searchPlaceholder={searchPlaceholder}
          />
        )}

        {showFilterBar && (
          <DataTableFilterBar
            activeFilterCount={filters.activeFilterCount}
            onClearAll={() => { filters.clearAllFilters(); pagination.resetPage(); setShownOptionalKeys(new Set()) }}
            availableOptionalFilters={availableOptionalFilters}
            onAddFilter={addOptionalFilter}
            extra={filterBarExtra}
          >
            {filterPillCols.map(col => renderPill(col.key, false, col.filterOptional))}
          </DataTableFilterBar>
        )}

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
          expandedRowClassName={expandedRowClassName}
          dividersClassName={dividersClassName}
          expandedRowIds={expandedRowIds}
          renderExpandedRow={renderExpandedRow}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={onRowClick}
        />

      </div>

      <DataTablePagination
        {...pageInfo}
        currentPage={safePage}
        rowsPerPage={serverPagination?.pageSize ?? pagination.rowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={serverPagination?.onPageChange ?? pagination.setCurrentPage}
        onRowsPerPageChange={serverPagination?.onPageSizeChange ?? pagination.changeRowsPerPage}
      />
    </>
  )
}
