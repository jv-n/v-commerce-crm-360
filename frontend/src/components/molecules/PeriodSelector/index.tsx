import { useState } from "react"
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/atoms/dropdown-menu"
import type { PeriodFilter, PeriodType } from "@/types/dashboard"
import { cn } from "@/lib/utils"

const PERIOD_OPTIONS: { type: PeriodType; label: string }[] = [
  { type: "2weeks",   label: "Últimas 2 semanas" },
  { type: "month",    label: "Último mês" },
  { type: "3months",  label: "Últimos 3 meses" },
  { type: "semester", label: "Último semestre" },
  { type: "year",     label: "Último ano" },
]

interface PeriodSelectorProps {
  value: PeriodFilter
  onChange: (period: PeriodFilter) => void
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [customStart, setCustomStart] = useState(value.startDate ?? "")
  const [customEnd,   setCustomEnd]   = useState(value.endDate   ?? "")
  const [open,        setOpen]        = useState(false)

  const currentLabel =
    value.type === "custom"
      ? "Personalizado"
      : (PERIOD_OPTIONS.find((o) => o.type === value.type)?.label ?? "Período")

  const isInvalid = !!customStart && !!customEnd && customStart > customEnd
  const isActive  = value.type !== "year"

  function handleStart(v: string) {
    setCustomStart(v)
    const invalid = !!v && !!customEnd && v > customEnd
    if (!invalid) onChange({ type: "custom", startDate: v || undefined, endDate: customEnd || undefined })
  }

  function handleEnd(v: string) {
    setCustomEnd(v)
    const invalid = !!customStart && !!v && customStart > v
    if (!invalid) onChange({ type: "custom", startDate: customStart || undefined, endDate: v || undefined })
  }

  function clearToDefault(e: React.MouseEvent) {
    e.stopPropagation()
    setCustomStart("")
    setCustomEnd("")
    onChange({ type: "year" })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border border-transparent text-gray-900 hover:bg-purple-100 hover:border-purple-300 transition-colors">
          <span>{currentLabel}</span>
          {open ? <MdKeyboardArrowUp size={14} /> : <MdKeyboardArrowDown size={14} />}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {PERIOD_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.type}
            className={cn(value.type === option.type && "bg-muted font-semibold")}
            onSelect={() => { onChange({ type: option.type }); setOpen(false) }}
          >
            {option.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <p className={cn(
          "px-2 pt-1.5 pb-0.5 text-xs font-medium",
          value.type === "custom" ? "text-purple-700" : "text-gray-500"
        )}>
          Personalizado
        </p>

        <div className="px-2 pb-2.5 pt-1 flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">De</label>
            <input
              type="date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(e) => handleStart(e.target.value)}
              className={`border rounded-md px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 ${isInvalid ? "border-red-400 focus:ring-red-300" : "border-gray-200 focus:ring-purple-300"}`}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Até</label>
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              onChange={(e) => handleEnd(e.target.value)}
              className={`border rounded-md px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 ${isInvalid ? "border-red-400 focus:ring-red-300" : "border-gray-200 focus:ring-purple-300"}`}
            />
          </div>
          {isInvalid && (
            <p className="text-xs text-red-500">Data inicial não pode ser maior que a final</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
