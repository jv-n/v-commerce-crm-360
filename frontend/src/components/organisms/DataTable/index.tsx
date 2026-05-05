import type { ReactNode } from "react"
import { useState } from "react"
import type { DataTableProps, SelectFilterDef, ServerPagination } from "./types"
import { useFilterState, isFilterActive, formatActiveFilter } from "./hooks/useFilterState"
import { useRowSelection } from "./hooks/useRowSelection"
import { usePagination } from "./hooks/usePagination"
import { DataTableTabs } from "./molecules/DataTableTabs"
import { DataTableFilterBar } from "./molecules/DataTableFilterBar"
import { DataTableRows } from "./molecules/DataTableRows"
import { DataTablePagination } from "./molecules/DataTablePagination"
import { FilterPill } from "./atoms/FilterPill"
import { SelectDropdown } from "./atoms/SelectDropdown"
import { NumberRangeDropdown } from "./atoms/NumberRangeDropdown"

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
  tabs = [],
  activeTab,
  onTabChange,
  rightFilterKey,
  rowsPerPageOptions = [10, 25, 50],
  defaultRowsPerPage = 10,
  serverPagination,
  onFiltersChange,
}: DataTableProps<T>) {
  const filters    = useFilterState(columns, data, serverPagination ? onFiltersChange : undefined)
  const pagination = usePagination(defaultRowsPerPage)
  const selection  = useRowSelection(getRowId)

  const [shownOptionalKeys, setShownOptionalKeys] = useState<Set<string>>(new Set())

  const { pageData, safePage, ...pageInfo } = serverPagination
    ? { ...buildServerPageInfo(serverPagination, data.length), pageData: data }
    : pagination.paginate(filters.filteredData)

  const visibleColumns  = columns.filter(c => c.visible !== false)
  const rightCol        = columns.find(c => c.key === rightFilterKey)

  const mandatoryFilterCols = columns.filter(c => c.filter && !c.filterOptional && c.key !== rightFilterKey)
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
  }

  const renderPill = (colKey: string, alignRight = false, isOptional = false): ReactNode => {
    const col = columns.find(c => c.key === colKey)
    if (!col?.filter) return null
    const def     = col.filter
    const active  = filters.activeFilters[colKey]
    const isActive = active && isFilterActive(active)

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

    const content = def.type === "select" ? (
      <SelectDropdown
        options={(def as SelectFilterDef<T>).options}
        activeValue={active?.type === "select" ? active.value : ""}
        onSelect={val => { filters.setFilter(colKey, { type: "select", value: val }); pagination.resetPage() }}
        onClear={handleClear}
      />
    ) : (
      <NumberRangeDropdown
        current={active?.type === "number-range" ? { min: active.min, max: active.max } : null}
        onApply={(min, max) => { filters.setFilter(colKey, { type: "number-range", min, max }); pagination.resetPage() }}
        onClear={handleClear}
      />
    )

    return (
      <FilterPill
        key={colKey}
        label={def.label}
        activeValue={isActive ? formatActiveFilter(active!) : undefined}
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

      <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
        {tabs.length > 0 && (
          <DataTableTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            rightSlot={rightCol ? renderPill(rightCol.key, true) : undefined}
          />
        )}

        {showFilterBar && (
          <DataTableFilterBar
            activeFilterCount={filters.activeFilterCount}
            onClearAll={() => { filters.clearAllFilters(); pagination.resetPage(); setShownOptionalKeys(new Set()) }}
            availableOptionalFilters={availableOptionalFilters}
            onAddFilter={addOptionalFilter}
          >
            {filterPillCols.map(col => renderPill(col.key, false, col.filterOptional))}
          </DataTableFilterBar>
        )}

        <DataTableRows
          columns={visibleColumns}
          pageData={pageData}
          getRowId={getRowId}
          selectedRows={selection.selectedRows}
          isAllSelected={selection.isPageAllSelected(pageData)}
          onToggleAll={() => selection.toggleAll(pageData)}
          onToggleRow={selection.toggleRow}
        />

        <DataTablePagination
          {...pageInfo}
          currentPage={safePage}
          rowsPerPage={serverPagination?.pageSize ?? pagination.rowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          onPageChange={serverPagination?.onPageChange ?? pagination.setCurrentPage}
          onRowsPerPageChange={serverPagination?.onPageSizeChange ?? pagination.changeRowsPerPage}
        />
      </div>
    </>
  )
}
