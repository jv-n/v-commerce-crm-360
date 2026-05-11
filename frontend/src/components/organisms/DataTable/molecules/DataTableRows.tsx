import { Fragment } from "react"
import { cn } from "@/lib/utils"
import type { Column } from "../types"
import type { ReactNode } from "react"
import ArrowUpwardIcon   from "@mui/icons-material/ArrowUpward"
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward"
import UnfoldMoreIcon    from "@mui/icons-material/UnfoldMore"

interface DataTableRowsProps<T> {
  columns: Column<T>[]
  pageData: T[]
  getRowId: (row: T) => string
  selectedRows: Set<string>
  isAllSelected: boolean
  onToggleAll: () => void
  onToggleRow: (id: string) => void
  loading?: boolean
  emptyMessage?: string
  headerClassName?: string
  rowClassName?: string
  dividersClassName?: string
  expandedRowIds?: Set<string>
  renderExpandedRow?: (row: T) => ReactNode
  sortKey?: string | null
  sortDir?: "asc" | "desc"
  onSort?: (key: string) => void
}

export function DataTableRows<T,>({
  columns,
  pageData,
  getRowId,
  selectedRows,
  isAllSelected,
  onToggleAll,
  onToggleRow,
  loading = false,
  emptyMessage = "Nenhum item encontrado.",
  headerClassName = "bg-gray-50",
  rowClassName = "",
  dividersClassName = "divide-gray-100",
  expandedRowIds,
  renderExpandedRow,
  sortKey,
  sortDir,
  onSort,
}: DataTableRowsProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl mt-4">
      <table className="w-full text-sm">
        <thead>
          <tr className={cn("border-b border-gray-200", headerClassName)}>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleAll}
                className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-gray-800"
              />
            </th>
            {columns.map(col => {
              const isActive = sortKey === col.key
              return (
                <th
                  key={col.key}
                  style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                  className="px-3 py-3 text-left text-sm font-semibold text-gray-500"
                >
                  {col.sortable && col.header ? (
                    <button
                      onClick={() => onSort?.(col.key)}
                      className={cn(
                        "group inline-flex items-center gap-1 hover:text-gray-800 transition-colors",
                        isActive && "text-gray-800"
                      )}
                    >
                      {col.header}
                      <span className={cn(
                        "transition-colors",
                        isActive ? "text-gray-700" : "text-gray-300 group-hover:text-gray-400"
                      )}>
                        {isActive && sortDir === "asc"  && <ArrowUpwardIcon   sx={{ fontSize: 12 }} />}
                        {isActive && sortDir === "desc" && <ArrowDownwardIcon sx={{ fontSize: 12 }} />}
                        {!isActive && <UnfoldMoreIcon sx={{ fontSize: 13 }} />}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className={cn("divide-y", dividersClassName)}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-3">
                  <div className="w-4 h-4 rounded bg-gray-200" />
                </td>
                {columns.map(col => (
                  <td key={col.key} className="px-3 py-3">
                    <div className="h-4 rounded bg-gray-200" style={{ width: `${60 + (i * 13 + col.key.length * 7) % 35}%` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <>
              {pageData.map(row => {
                const id         = getRowId(row)
                const isSelected = selectedRows.has(id)
                const isExpanded = expandedRowIds?.has(id) ?? false
                return (
                  <Fragment key={id}>
                    <tr
                      className={cn(
                        "transition-colors",
                        rowClassName || "hover:bg-gray-50/80",
                        isSelected && "bg-blue-50/60"
                      )}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleRow(id)}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-gray-800"
                        />
                      </td>
                      {columns.map(col => (
                        <td key={col.key} className="px-3 py-3">
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && renderExpandedRow && (
                      <tr>
                        <td colSpan={columns.length + 1} className="p-0">
                          {renderExpandedRow(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}

              {pageData.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}
