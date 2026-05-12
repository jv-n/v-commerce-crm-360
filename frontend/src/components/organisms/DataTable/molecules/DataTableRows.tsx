import { Fragment } from "react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import type { Column } from "../types"

import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward"
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward"
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore"

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
    <div className="mt-3 h-[545px] min-h-0 overflow-auto rounded-xl">
      <table className="w-full text-[13px]">
        <thead className="sticky top-0 z-10">
          <tr className={cn("border-b border-gray-200", headerClassName)}>
            <th className="w-9 px-2 py-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleAll}
                className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-gray-800"
              />
            </th>

            {columns.map(col => {
              const isActive = sortKey === col.key

              return (
                <th
                  key={col.key}
                  style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                  className="px-2 py-2 text-left text-[13px] font-bold text-gray-900"
                >
                  {col.sortable && col.header ? (
                    <button
                      onClick={() => onSort?.(col.key)}
                      className={cn(
                        "group inline-flex items-center gap-1 font-bold text-gray-900 transition-colors hover:text-gray-800",
                        isActive && "text-gray-900"
                      )}
                    >
                      {col.header}

                      <span
                        className={cn(
                          "transition-colors",
                          isActive
                            ? "text-gray-700"
                            : "text-gray-300 group-hover:text-gray-400"
                        )}
                      >
                        {isActive && sortDir === "asc" && (
                          <ArrowUpwardIcon sx={{ fontSize: 12 }} />
                        )}

                        {isActive && sortDir === "desc" && (
                          <ArrowDownwardIcon sx={{ fontSize: 12 }} />
                        )}

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
                <td className="px-2 py-2">
                  <div className="h-3.5 w-3.5 rounded bg-gray-200" />
                </td>

                {columns.map(col => (
                  <td key={col.key} className="px-2 py-2">
                    <div
                      className="h-3.5 rounded bg-gray-200"
                      style={{
                        width: `${60 + ((i * 13 + col.key.length * 7) % 35)}%`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <>
              {pageData.map(row => {
                const id = getRowId(row)
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
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleRow(id)}
                          className="h-3.5 w-3.5 cursor-pointer rounded border-gray-300 accent-gray-800"
                        />
                      </td>

                      {columns.map(col => (
                        <td key={col.key} className="px-2 py-2">
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
                    className="px-4 py-10 text-center text-sm text-gray-400"
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