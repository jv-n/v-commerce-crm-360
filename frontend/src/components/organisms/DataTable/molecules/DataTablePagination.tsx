import { cn } from "@/lib/utils"

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"
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
  const pageWindow = Math.floor((currentPage - 1) / WINDOW_SIZE)

  const visiblePages = pageNumbers.slice(
    pageWindow * WINDOW_SIZE,
    (pageWindow + 1) * WINDOW_SIZE
  )

  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages || totalPages === 0

  const paginationButtonClassName = (disabled: boolean) =>
    cn(
      "flex h-8 w-8 items-center justify-center rounded transition-colors",
      disabled
        ? "text-gray-300 cursor-not-allowed"
        : "text-gray-900 hover:bg-gray-100"
    )

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="flex items-center gap-3 text-sm text-gray-900">
        <span className="font-medium">Rows per page</span>

        <div className="relative">
          <select
            value={rowsPerPage}
            onChange={e => onRowsPerPageChange(Number(e.target.value))}
            className="h-9 min-w-[72px] appearance-none rounded-lg border border-[#D1B1E5] bg-[#F7EBFF] pl-4 pr-10 text-sm font-medium text-gray-900 outline-none focus:ring-1 focus:ring-[#D1B1E5]"
          >
            {rowsPerPageOptions.map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <KeyboardArrowDownIcon
            sx={{ fontSize: 22 }}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-900"
          />
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={isFirstPage}
          className={paginationButtonClassName(isFirstPage)}
          title="Primeira página"
        >
          <KeyboardDoubleArrowLeftIcon sx={{ fontSize: 20 }} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className={paginationButtonClassName(isFirstPage)}
          title="Página anterior"
        >
          <KeyboardArrowLeftIcon sx={{ fontSize: 20 }} />
        </button>

        {visiblePages.map(page => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={cn(
              "h-8 min-w-8 rounded px-2 text-sm font-medium transition-colors",
              currentPage === page
                ? "bg-[#F7EBFF] border border-[#D1B1E5] text-gray-900"
                : "text-gray-900 hover:bg-gray-100"
            )}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          className={paginationButtonClassName(isLastPage)}
          title="Próxima página"
        >
          <KeyboardArrowRightIcon sx={{ fontSize: 20 }} />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={isLastPage}
          className={paginationButtonClassName(isLastPage)}
          title="Última página"
        >
          <KeyboardDoubleArrowRightIcon sx={{ fontSize: 20 }} />
        </button>
      </div>

      <span className="text-sm font-medium text-gray-900">
        {startItem}–{endItem} of {totalItems}
      </span>
    </div>
  )
}