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
  emptyMessage?: string
  headerClassName?: string
  rowClassName?: string
  dividersClassName?: string
  expandedRowId?: string | null
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
  emptyMessage = "Nenhum item encontrado.",
  headerClassName = "bg-gray-50",
  rowClassName = "",
  dividersClassName = "divide-gray-100",
  expandedRowId,
  renderExpandedRow,
  sortKey,
  sortDir,
  onSort,
}: DataTableRowsProps<T>) {
  return (
    <div className="overflow-x-auto">
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
                  className="px-3 py-3 text-left text-xs font-semibold text-gray-500"
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
          {pageData.map(row => {
            const id         = getRowId(row)
            const isSelected = selectedRows.has(id)
            const isExpanded = expandedRowId === id
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
        </tbody>
      </table>
    </div>
  )
}
