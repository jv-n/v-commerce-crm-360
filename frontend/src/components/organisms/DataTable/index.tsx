import { useState } from "react"
import { cn } from "@/lib/utils"
import type { DataTableProps } from "./types"
import AddIcon from "@mui/icons-material/Add"
import TuneIcon from "@mui/icons-material/Tune"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined"
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined"
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined"

export function DataTable<T,>({
  data,
  columns,
  getRowId,
  tabs = [],
  activeTab,
  onTabChange,
  filterPills = [],
  rowsPerPageOptions = [10, 25, 50],
  defaultRowsPerPage = 10,
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage]   = useState(1)
  const [rowsPerPage, setRowsPerPage]   = useState(defaultRowsPerPage)

  const totalItems = data.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const safePage   = Math.min(currentPage, totalPages)
  const pageData   = data.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)

  const isAllSelected = pageData.length > 0 && pageData.every(r => selectedRows.has(getRowId(r)))

  const toggleAll = () => {
    const next = new Set(selectedRows)
    if (isAllSelected) pageData.forEach(r => next.delete(getRowId(r)))
    else               pageData.forEach(r => next.add(getRowId(r)))
    setSelectedRows(next)
  }

  const toggleRow = (id: string) => {
    const next = new Set(selectedRows)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedRows(next)
  }

  const handleTabChange = (tabId: string) => {
    onTabChange?.(tabId)
    setCurrentPage(1)
    setSelectedRows(new Set())
  }

  const handleRowsPerPageChange = (val: number) => {
    setRowsPerPage(val)
    setCurrentPage(1)
  }

  const startItem  = totalItems === 0 ? 0 : (safePage - 1) * rowsPerPage + 1
  const endItem    = Math.min(safePage * rowsPerPage, totalItems)
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">

      {/* ── Tabs + Right Controls ─────────────────────────────────── */}
      {tabs.length > 0 && (
        <div className="flex items-center justify-between border-b border-gray-200 px-4">
          <div className="flex items-center">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === tab.id
                    ? "border-gray-800 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                )}
              >
                <TableRowsOutlinedIcon sx={{ fontSize: 15 }} />
                {tab.label}
              </button>
            ))}
            <button className="p-2 ml-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
              <AddIcon sx={{ fontSize: 16 }} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-sm text-gray-600 border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50">
              Todos os estados
              <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <SearchOutlinedIcon sx={{ fontSize: 18 }} />
            </button>
            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
              <button className="p-1.5 bg-gray-100 text-gray-700 border-r border-gray-200">
                <TableRowsOutlinedIcon sx={{ fontSize: 16 }} />
              </button>
              <button className="p-1.5 text-gray-400 hover:bg-gray-50">
                <GridViewOutlinedIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter Bar ────────────────────────────────────────────── */}
      {filterPills.length > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-200 bg-gray-50/60 flex-wrap">
          <span className="text-sm text-gray-400 font-medium">Filtrar por:</span>
          {filterPills.map(opt => (
            <button
              key={opt}
              className="flex items-center gap-1 text-sm text-gray-700 bg-white border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50 shadow-sm"
            >
              {opt}
              <KeyboardArrowDownIcon sx={{ fontSize: 14 }} />
            </button>
          ))}
          <button className="p-1.5 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50">
            <AddIcon sx={{ fontSize: 14 }} />
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 ml-1">
            <TuneIcon sx={{ fontSize: 15 }} />
            Filtros avançados
          </button>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleAll}
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
                      onChange={() => toggleRow(id)}
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
                  Nenhum item encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Rows per page</span>
          <select
            value={rowsPerPage}
            onChange={e => handleRowsPerPageChange(Number(e.target.value))}
            className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
          >
            {rowsPerPageOptions.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <KeyboardArrowLeftIcon sx={{ fontSize: 18 }} />
          </button>
          {pageNumbers.map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={cn(
                "w-8 h-8 text-sm rounded transition-colors",
                safePage === page
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <span className="text-sm text-gray-500">
          {startItem}–{endItem} of {totalItems}
        </span>
      </div>
    </div>
  )
}