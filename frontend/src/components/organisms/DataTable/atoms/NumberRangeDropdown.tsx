import { useState } from "react"

interface NumberRangeDropdownProps {
  current: { min: number | null; max: number | null } | null
  onApply: (min: number | null, max: number | null) => void
  onClear: () => void
}

export function NumberRangeDropdown({ current, onApply, onClear }: NumberRangeDropdownProps) {
  const [min, setMin] = useState(current?.min?.toString() ?? "")
  const [max, setMax] = useState(current?.max?.toString() ?? "")
  const hasActive = current?.min != null || current?.max != null

  return (
    <div className="p-3 space-y-3 min-w-[190px]">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Intervalo</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={min}
          onChange={e => setMin(e.target.value)}
          placeholder="Mín"
          className="w-[72px] border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
        <span className="text-gray-400 text-sm">–</span>
        <input
          type="number"
          value={max}
          onChange={e => setMax(e.target.value)}
          placeholder="Máx"
          className="w-[72px] border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => onApply(min ? Number(min) : null, max ? Number(max) : null)}
          className="flex-1 bg-gray-900 text-white rounded-md py-1.5 text-xs font-medium hover:bg-gray-800 transition-colors"
        >
          Aplicar
        </button>
        {hasActive && (
          <button
            onClick={onClear}
            className="px-2.5 text-red-500 hover:bg-red-50 rounded-md text-xs border border-red-200 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  )
}
