import type { ReactNode } from "react"
import { Checkbox } from "@/components/atoms/checkbox"

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
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#F0DDFD] text-left transition-colors"
            >
              <Checkbox
                checked={checked}
                className="border-purple-300 pointer-events-none accent-purple-800"
              />
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
