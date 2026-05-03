import { cn } from "@/lib/utils"
import type { Column } from "../types"

interface DataTableRowsProps<T> {
  columns: Column<T>[]
  pageData: T[]
  getRowId: (row: T) => string
  selectedRows: Set<string>
  isAllSelected: boolean
  onToggleAll: () => void
  onToggleRow: (id: string) => void
  emptyMessage?: string
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
}: DataTableRowsProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleAll}
                className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-gray-800"
              />
            </th>
            {columns.map(col => (
              <th
                key={col.key}
                style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {pageData.map(row => {
            const id         = getRowId(row)
            const isSelected = selectedRows.has(id)
            return (
              <tr
                key={id}
                className={cn(
                  "hover:bg-gray-50/80 transition-colors",
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
