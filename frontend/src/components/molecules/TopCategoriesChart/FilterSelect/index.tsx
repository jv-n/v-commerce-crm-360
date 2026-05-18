import CloseIcon from "@mui/icons-material/Close"
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu"
import { cn } from "@/lib/utils"

export type MetricOption = "vendidos" | "receita" | "visualizacoes" | "abandono"

export interface FilterState {
  metric: MetricOption
}

const METRIC_LABELS: Record<MetricOption, string> = {
  vendidos: "Mais vendidos",
  receita: "Maior receita",
  visualizacoes: "Mais visualizados",
  abandono: "Maior abandono",
}

function SelectDropdown<T extends string | number>({
  value,
  options,
  label,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  label: string
  onChange: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const current  = options.find(o => o.value === value)?.label ?? label
  const isActive = value !== options[0]?.value

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border transition-colors whitespace-nowrap",
          isActive
            ? "bg-purple-100 border-purple-300 text-gray-900 font-medium"
            : "border-transparent text-gray-900 hover:bg-purple-100 hover:border-purple-300"
        )}>
          {current}
          {isActive
            ? <CloseIcon sx={{ fontSize: 13 }} onClick={(e) => { e.stopPropagation(); onChange(options[0].value) }} />
            : open ? <MdKeyboardArrowUp size={14} /> : <MdKeyboardArrowDown size={14} />
          }
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.map(opt => (
            <DropdownMenuItem
              key={String(opt.value)}
              className={value === opt.value ? "font-semibold bg-[#EDE5F2]" : ""}
              onSelect={() => onChange(opt.value)}
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface Props {
  state: FilterState
  onChange: (s: FilterState) => void
}

export function TopCategoriesFilterSelect({ state, onChange }: Props) {
  const metricOptions = (Object.keys(METRIC_LABELS) as MetricOption[]).map(k => ({
    value: k,
    label: METRIC_LABELS[k],
  }))

  return (
    <SelectDropdown
      value={state.metric}
      options={metricOptions}
      label="Métrica"
      onChange={metric => onChange({ metric })}
    />
  )
}
