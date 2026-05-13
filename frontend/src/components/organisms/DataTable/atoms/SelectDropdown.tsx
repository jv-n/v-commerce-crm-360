import { cn } from "@/lib/utils"

interface SelectDropdownProps {
  options: string[]
  activeValue: string
  onSelect: (value: string) => void
  onClear: () => void
}

export function SelectDropdown({ options, activeValue, onSelect, onClear }: SelectDropdownProps) {
  return (
    <div className="py-1 min-w-[180px] max-h-64 overflow-y-auto">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className={cn(
            "w-full text-left px-3 py-2 text-sm transition-colors",
            activeValue === opt
              ? "bg-purple-50 text-purple-700 font-medium"
              : "hover:bg-[#EACAFF] text-gray-700"
          )}
        >
          {opt}
        </button>
      ))}
      {activeValue && (
        <button
          onClick={onClear}
          className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
        >
          Limpar filtro
        </button>
      )}
    </div>
  )
}
