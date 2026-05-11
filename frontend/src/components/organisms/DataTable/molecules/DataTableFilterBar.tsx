import type { ReactNode } from "react"
import { useState, useRef, useEffect } from "react"
import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"

interface OptionalFilter {
  key: string
  label: string
}

interface DataTableFilterBarProps {
  children: ReactNode
  activeFilterCount: number
  onClearAll: () => void
  availableOptionalFilters: OptionalFilter[]
  onAddFilter: (key: string) => void
  extra?: ReactNode
}

export function DataTableFilterBar({
  children,
  activeFilterCount,
  onClearAll,
  availableOptionalFilters,
  onAddFilter,
  extra,
}: DataTableFilterBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [dropdownOpen])

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 flex-wrap relative z-50">
      <span className="text-sm text-gray-800 font-bold">Filtrar por:</span>

      {children}

      {availableOptionalFilters.length > 0 && (
        <>
          <div className="w-px h-4 bg-gray-200 self-center" />
          <div className="relative" ref={ref}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-[#F7EBFF]"
          >
            <AddIcon sx={{ fontSize: 14 }} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50 min-w-[160px]">
              {availableOptionalFilters.map(f => (
                <button
                  key={f.key}
                  onClick={() => { onAddFilter(f.key); setDropdownOpen(false) }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#F7EBFF] transition-colors"
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
        </>
      )}

      {extra}

      {activeFilterCount > 0 && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 ml-1 transition-colors"
        >
          <CloseIcon sx={{ fontSize: 13 }} />
          Limpar todos ({activeFilterCount})
        </button>
      )}

    </div>
  )
}
