import { cn } from "@/lib/utils"
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"

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

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Rows per page</span>
        <select
          value={rowsPerPage}
          onChange={e => onRowsPerPageChange(Number(e.target.value))}
          className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
        >
          {rowsPerPageOptions.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <KeyboardArrowLeftIcon sx={{ fontSize: 18 }} />
        </button>
        {pageNumbers.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "w-8 h-8 text-sm rounded transition-colors",
              currentPage === page
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
        </button>
      </div>

      <span className="text-sm text-gray-500">
        {startItem}–{endItem} of {totalItems}
      </span>
    </div>
  )
}
