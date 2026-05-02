import type { ReactNode } from "react"
import type { DataTableProps, SelectFilterDef } from "./types"
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
}: DataTableProps<T>) {
  const filters    = useFilterState(columns, data)
  const pagination = usePagination(defaultRowsPerPage)
  const selection  = useRowSelection(getRowId)

  const { pageData, safePage, ...pageInfo } = pagination.paginate(filters.filteredData)

  const visibleColumns = columns.filter(c => c.visible !== false)
  const filterPillCols = columns.filter(c => c.filter && c.key !== rightFilterKey)
  const rightCol       = columns.find(c => c.key === rightFilterKey)

  const handleTabChange = (tabId: string) => {
    onTabChange?.(tabId)
    filters.clearAllFilters()
    pagination.resetPage()
    selection.clearSelection()
  }

  const renderPill = (colKey: string, alignRight = false): ReactNode => {
    const col = columns.find(c => c.key === colKey)
    if (!col?.filter) return null
    const def    = col.filter
    const active = filters.activeFilters[colKey]
    const isActive = active && isFilterActive(active)

    const content = def.type === "select" ? (
      <SelectDropdown
        options={(def as SelectFilterDef<T>).options}
        activeValue={active?.type === "select" ? active.value : ""}
        onSelect={val => { filters.setFilter(colKey, { type: "select", value: val }); pagination.resetPage() }}
        onClear={() => { filters.clearFilter(colKey); pagination.resetPage() }}
      />
    ) : (
      <NumberRangeDropdown
        current={active?.type === "number-range" ? { min: active.min, max: active.max } : null}
        onApply={(min, max) => { filters.setFilter(colKey, { type: "number-range", min, max }); pagination.resetPage() }}
        onClear={() => { filters.clearFilter(colKey); pagination.resetPage() }}
      />
    )

    return (
      <FilterPill
        key={colKey}
        label={def.label}
        activeValue={isActive ? formatActiveFilter(active!) : undefined}
        isOpen={filters.openFilter === colKey}
        onToggle={() => filters.toggleOpenFilter(colKey)}
        onClear={e => { e.stopPropagation(); filters.clearFilter(colKey); pagination.resetPage() }}
        alignRight={alignRight}
      >
        {content}
      </FilterPill>
    )
  }

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

        {filterPillCols.length > 0 && (
          <DataTableFilterBar
            activeFilterCount={filters.activeFilterCount}
            onClearAll={() => { filters.clearAllFilters(); pagination.resetPage() }}
          >
            {filterPillCols.map(col => renderPill(col.key))}
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
          rowsPerPage={pagination.rowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          onPageChange={pagination.setCurrentPage}
          onRowsPerPageChange={pagination.changeRowsPerPage}
        />
      </div>
    </>
  )
}
