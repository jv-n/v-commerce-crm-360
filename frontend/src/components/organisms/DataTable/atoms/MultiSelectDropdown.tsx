import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import CheckIcon from "@mui/icons-material/Check"

interface MultiSelectDropdownProps {
  options: string[]
  activeValues: string[]
  onToggle: (value: string) => void
  onClear: () => void
  renderOption?: (value: string) => ReactNode
}

export function MultiSelectDropdown({
  options,
  activeValues,
  onToggle,
  onClear,
  renderOption,
}: MultiSelectDropdownProps) {
  return (
    <div className="min-w-[200px]">
      <div className="py-1 max-h-64 overflow-y-auto">
        {options.map(opt => {
          const checked = activeValues.includes(opt)
          return (
            <button
              key={opt}
              onClick={e => { e.stopPropagation(); onToggle(opt) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
            >
              <div className={cn(
                "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                checked ? "bg-purple-600 border-purple-600" : "border-gray-300"
              )}>
                {checked && <CheckIcon sx={{ fontSize: 11, color: "white" }} />}
              </div>
              {renderOption ? renderOption(opt) : <span className="text-sm text-gray-700">{opt}</span>}
            </button>
          )
        })}
      </div>
      {activeValues.length > 0 && (
        <div className="border-t border-gray-100 px-3 py-2">
          <button
            onClick={e => { e.stopPropagation(); onClear() }}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Limpar filtro
          </button>
        </div>
      )}
    </div>
  )
}
