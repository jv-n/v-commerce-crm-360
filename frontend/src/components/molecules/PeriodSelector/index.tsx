import { useState } from "react"
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
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
  { type: "custom",   label: "Personalizado" },
]

interface PeriodSelectorProps {
  value: PeriodFilter
  onChange: (period: PeriodFilter) => void
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [customStart, setCustomStart] = useState(value.startDate ?? "")
  const [customEnd, setCustomEnd] = useState(value.endDate ?? "")
  const [open, setOpen] = useState(false)

  const currentLabel =
    PERIOD_OPTIONS.find((o) => o.type === value.type)?.label ?? "Período"

  function selectOption(type: PeriodType) {
    if (type !== "custom") {
      onChange({ type })
      setOpen(false)
    }
    // for custom, keep open so user can fill dates
  }

  function applyCustom() {
    if (!customStart || !customEnd) return
    onChange({ type: "custom", startDate: customStart, endDate: customEnd })
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground shadow-sm hover:bg-muted transition-colors">
          <CalendarTodayOutlinedIcon style={{ fontSize: 14 }} className="text-muted-foreground" />
          <span>{currentLabel}</span>
          <KeyboardArrowDownIcon style={{ fontSize: 16 }} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        {PERIOD_OPTIONS.filter((o) => o.type !== "custom").map((option) => (
          <DropdownMenuItem
            key={option.type}
            className={cn(value.type === option.type && "bg-muted font-semibold")}
            onSelect={() => selectOption(option.type)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {/* Custom option header */}
        <div
          className={cn(
            "flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
            value.type === "custom" && "bg-muted font-semibold",
          )}
          onClick={() => selectOption("custom")}
        >
          Personalizado
        </div>

        {/* Date inputs (always visible when custom is selected or being configured) */}
        {(value.type === "custom" || open) && (
          <div className="px-2 pb-2 pt-1 flex flex-col gap-1.5">
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-muted-foreground">De</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-muted-foreground">Até</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
              />
            </div>
            <button
              onClick={applyCustom}
              disabled={!customStart || !customEnd}
              className="mt-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-40"
            >
              Aplicar
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
