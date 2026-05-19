import { useState } from "react"

interface NumberRangeDropdownProps {
  current: { min: number | null; max: number | null } | null
  onApply: (min: number | null, max: number | null) => void
  onClear: () => void
  minBound?: number
  maxBound?: number
  variant?: "slider"
}

export function NumberRangeDropdown({ current, onApply, onClear, minBound, maxBound, variant }: NumberRangeDropdownProps) {
  const lo = minBound ?? 0
  const hi = maxBound ?? 100

  const [minVal, setMinVal] = useState<number>(current?.min ?? lo)
  const [maxVal, setMaxVal] = useState<number>(current?.max ?? hi)

  const [min, setMin] = useState(current?.min?.toString() ?? "")
  const [max, setMax] = useState(current?.max?.toString() ?? "")
  const hasActive = current?.min != null || current?.max != null

  const isRangeInvalid = min !== "" && max !== "" && Number(min) > Number(max)

  if (variant === "slider") {
    const pct = (v: number) => ((v - lo) / (hi - lo)) * 100

    return (
      <div className="p-4 space-y-4 w-[220px]">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avaliação</p>

        <div className="relative h-5 flex items-center">
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-200" />
          <div
            className="absolute h-1.5 rounded-full bg-purple-500"
            style={{ left: `${pct(minVal)}%`, right: `${100 - pct(maxVal)}%` }}
          />
          <input
            type="range"
            min={lo} max={hi} step={0.1}
            value={minVal}
            onChange={e => {
              const v = Math.min(Number(e.target.value), maxVal - 0.1)
              setMinVal(v)
            }}
            className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-500 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-purple-500"
          />
          <input
            type="range"
            min={lo} max={hi} step={0.1}
            value={maxVal}
            onChange={e => {
              const v = Math.max(Number(e.target.value), minVal + 0.1)
              setMaxVal(v)
            }}
            className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-500 [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-purple-500"
          />
        </div>

        <div className="flex justify-between text-xs text-gray-600 font-medium">
          <span>{minVal.toFixed(1)}</span>
          <span>{maxVal.toFixed(1)}</span>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => onApply(minVal, maxVal)}
            className="flex-1 bg-[#F7EBFF] border border-[#D1B1E5] text-white rounded-md py-1.5 text-xs font-medium hover:bg-purple-600 transition-colors"
          >
            Aplicar
          </button>
          {hasActive && (
            <button
              onClick={() => { setMinVal(lo); setMaxVal(hi); onClear() }}
              className="px-2.5 text-red-500 hover:bg-red-50 rounded-md text-xs border border-red-200 transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3 min-w-[190px]">
      <p className="text-xs font-medium text-black uppercase tracking-wide">Intervalo</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={minBound ?? 0}
          max={maxBound}
          step={maxBound != null && maxBound <= 10 ? 0.1 : undefined}
          value={min}
          onChange={e => setMin(e.target.value.replace(/^-/, ""))}
          placeholder="Mín"
          className={`w-[72px] border rounded-md px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 ${isRangeInvalid ? "border-red-400 focus:ring-red-300" : "border-gray-200 focus:ring-purple-300"}`}
        />
        <span className="text-gray-400 text-sm">–</span>
        <input
          type="number"
          min={minBound ?? 0}
          max={maxBound}
          step={maxBound != null && maxBound <= 10 ? 0.1 : undefined}
          value={max}
          onChange={e => setMax(e.target.value.replace(/^-/, ""))}
          placeholder="Máx"
          className={`w-[72px] border rounded-md px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 ${isRangeInvalid ? "border-red-400 focus:ring-red-300" : "border-gray-200 focus:ring-purple-300"}`}
        />
      </div>
      {isRangeInvalid && (
        <p className="text-xs text-red-500">Mín não pode ser maior que Máx</p>
      )}
      <div className="flex gap-1.5">
        <button
          disabled={isRangeInvalid}
          onClick={() => {
            const clamp = (v: string, lo?: number, hi?: number) => {
              if (!v) return null
              let n = Math.max(0, Number(v))
              if (lo != null) n = Math.max(lo, n)
              if (hi != null) n = Math.min(hi, n)
              return n
            }
            onApply(clamp(min, minBound, maxBound), clamp(max, minBound, maxBound))
          }}
          className="flex-1 bg-[#F7EBFF] border border-[#D1B1E5] text-black rounded-md py-1.5 text-xs font-medium hover:bg-[#F0DDFD] hover:border-[#D1B1E5] active:bg-[#c99aee] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#EACAFF] disabled:hover:border-[#B899CC]"
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
