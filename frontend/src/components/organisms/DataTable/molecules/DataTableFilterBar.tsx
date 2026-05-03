import type { ReactNode } from "react"
import AddIcon from "@mui/icons-material/Add"
import TuneIcon from "@mui/icons-material/Tune"
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

      <button className="p-1.5 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50">
        <AddIcon sx={{ fontSize: 14 }} />
      </button>

      {activeFilterCount > 0 && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 ml-1 transition-colors"
        >
          <CloseIcon sx={{ fontSize: 13 }} />
          Limpar todos ({activeFilterCount})
        </button>
      )}

      <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 ml-1">
        <TuneIcon sx={{ fontSize: 15 }} />
        Filtros avançados
      </button>
    </div>
  )
}
