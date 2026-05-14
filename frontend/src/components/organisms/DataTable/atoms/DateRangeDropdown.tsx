import { useState } from "react"

interface DateRangeDropdownProps {
  current: { from: string | null; to: string | null } | null
  onApply: (from: string | null, to: string | null) => void
  onClear: () => void
}

export function DateRangeDropdown({ current, onApply, onClear }: DateRangeDropdownProps) {
  const [from, setFrom] = useState(current?.from ?? "")
  const [to,   setTo]   = useState(current?.to   ?? "")

  const hasActive  = !!(current?.from || current?.to)
  const isInvalid  = !!from && !!to && from > to

  return (
    <div className="p-3 space-y-3 min-w-[220px]">
      <p className="text-xs font-medium text-black uppercase tracking-wide">Intervalo de datas</p>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">De</label>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={e => setFrom(e.target.value)}
            className={`border rounded-md px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 ${isInvalid ? "border-red-400 focus:ring-red-300" : "border-gray-200 focus:ring-purple-300"}`}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Até</label>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={e => setTo(e.target.value)}
            className={`border rounded-md px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 ${isInvalid ? "border-red-400 focus:ring-red-300" : "border-gray-200 focus:ring-purple-300"}`}
          />
        </div>
      </div>

      {isInvalid && (
        <p className="text-xs text-red-500">Data inicial não pode ser maior que a final</p>
      )}

      <div className="flex gap-1.5">
        <button
          disabled={isInvalid}
          onClick={() => onApply(from || null, to || null)}
          className="flex-1 bg-[#EACAFF] border border-[#B899CC] text-black rounded-md py-1.5 text-xs font-medium hover:bg-[#d9adff] hover:border-[#9e72b8] active:bg-[#c99aee] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#EACAFF] disabled:hover:border-[#B899CC]"
        >
          Aplicar
        </button>
        {hasActive && (
          <button
            onClick={() => { setFrom(""); setTo(""); onClear() }}
            className="px-2.5 text-red-500 hover:bg-red-50 rounded-md text-xs border border-red-200 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  )
}
