import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft"
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight"

const WINDOW_SIZE = 10

interface DataTablePaginationProps {
  startItem: number
  endItem: number
  totalItems: number
  currentPage: number
  pageNumbers: number[]
  rowsPerPage: number
  rowsPerPageOptions: number[]
  onPageChange: (page: number) => void
  onRowsPerPageChange: (n: number) => void
}

export function DataTablePagination({
  startItem,
  endItem,
  totalItems,
  currentPage,
  pageNumbers,
  rowsPerPage,
  rowsPerPageOptions,
  onPageChange,
  onRowsPerPageChange,
}: DataTablePaginationProps) {
  const totalPages = pageNumbers.length
  const totalWindows = Math.ceil(totalPages / WINDOW_SIZE)

  const [pageWindow, setPageWindow] = useState(() => Math.floor((currentPage - 1) / WINDOW_SIZE))

  useEffect(() => {
    setPageWindow(Math.floor((currentPage - 1) / WINDOW_SIZE))
  }, [currentPage])

  const visiblePages = pageNumbers.slice(pageWindow * WINDOW_SIZE, (pageWindow + 1) * WINDOW_SIZE)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Rows per page</span>
        <select
          value={rowsPerPage}
          onChange={e => onRowsPerPageChange(Number(e.target.value))}
          className="border border-[#D1B1E5] rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 bg-[#F7EBFF]"
        >
          {rowsPerPageOptions.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-0.5">
        {totalWindows > 1 && pageWindow > 0 && (
          <button
            onClick={() => setPageWindow(w => w - 1)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
          >
            <KeyboardDoubleArrowLeftIcon sx={{ fontSize: 18 }} />
          </button>
        )}

        {visiblePages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "w-8 h-8 text-sm rounded transition-colors",
              currentPage === page
                ? "bg-[#F7EBFF] border border-[#D1B1E5] text-gray-600"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {page}
          </button>
        ))}

        {totalWindows > 1 && pageWindow < totalWindows - 1 && (
          <button
            onClick={() => setPageWindow(w => w + 1)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
          >
            <KeyboardDoubleArrowRightIcon sx={{ fontSize: 18 }} />
          </button>
        )}
      </div>

      <span className="text-sm text-gray-500">
        {startItem}–{endItem} of {totalItems}
      </span>
    </div>
  )
}
