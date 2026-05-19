import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft"
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight"
import KeyboardDoubleArrowLeftIcon from "@mui/icons-material/KeyboardDoubleArrowLeft"
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight"
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md"

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
  const pageWindow = Math.floor((currentPage - 1) / WINDOW_SIZE)
  const [rppOpen, setRppOpen] = useState(false)
  const rppRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!rppOpen) return
    const handler = (e: MouseEvent) => {
      if (rppRef.current && !rppRef.current.contains(e.target as Node)) setRppOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [rppOpen])

  const visiblePages = pageNumbers.slice(pageWindow * WINDOW_SIZE, (pageWindow + 1) * WINDOW_SIZE)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <div className="flex items-center gap-3 text-sm text-gray-900">
        <span>Linhas por página</span>
        <div className="relative" ref={rppRef}>
          <button
            onClick={() => setRppOpen(o => !o)}
            className="flex items-center gap-1.5 border border-[#D1B1E5] rounded-md px-2.5 py-1 text-sm bg-[#F7EBFF] hover:bg-[#CFA7FF] transition-colors min-w-[56px] justify-between"
          >
            <span>{rowsPerPage}</span>
            {rppOpen ? <MdKeyboardArrowUp size={14} /> : <MdKeyboardArrowDown size={14} />}
          </button>
          {rppOpen && (
            <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 min-w-[80px]">
              {rowsPerPageOptions.map(n => (
                <button
                  key={n}
                  onClick={() => { onRowsPerPageChange(n); setRppOpen(false) }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm transition-colors",
                    n === rowsPerPage
                      ? "bg-white border-y border-black text-gray-900 font-medium"
                      : "text-gray-900 hover:bg-[#CFA7FF]"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        
        {totalWindows > 1 && pageWindow > 0 && (
          <button
            onClick={() => onPageChange((pageWindow - 1) * WINDOW_SIZE + 1)}
            className="p-1.5 rounded hover:bg-[#CFA7FF] transition-colors text-black"
          >
            <KeyboardDoubleArrowLeftIcon sx={{ fontSize: 18 }} />
          </button>
        )}

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded hover:bg-[#CFA7FF] transition-colors text-black disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <KeyboardArrowLeftIcon sx={{ fontSize: 18 }} />
        </button>

        {visiblePages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "w-8 h-8 text-sm rounded transition-colors",
              currentPage === page
                ? "bg-[#EACAFF] border border-[#B899CC] text-black"
                : "text-black hover:bg-[#F0DDFD]"
            )}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded hover:bg-[#CFA7FF] transition-colors text-black disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
        </button>
        
        {totalWindows > 1 && pageWindow < totalWindows - 1 && (
          <button
            onClick={() => onPageChange((pageWindow + 1) * WINDOW_SIZE + 1)}
            className="p-1.5 rounded hover:bg-[#CFA7FF] transition-colors text-black"
          >
            <KeyboardDoubleArrowRightIcon sx={{ fontSize: 18 }} />
          </button>
        )}
      </div>

      <span className="text-sm font-medium text-gray-900">
        {startItem}–{endItem} of {totalItems}
      </span>
    </div>
  )
}