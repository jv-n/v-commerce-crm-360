import type { ReactNode } from "react"
import CloseIcon from "@mui/icons-material/Close"

interface DataTableFilterBarProps {
  children: ReactNode
  activeFilterCount: number
  onClearAll: () => void
}

export function DataTableFilterBar({ children, activeFilterCount, onClearAll }: DataTableFilterBarProps) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-200 bg-gray-50/60 flex-wrap relative z-50">
      <span className="text-sm text-gray-400 font-medium">Filtrar por:</span>

      {children}

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
