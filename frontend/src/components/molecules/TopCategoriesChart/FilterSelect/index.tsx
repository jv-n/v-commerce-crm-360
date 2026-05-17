import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined"
import ArrowDownwardOutlinedIcon from "@mui/icons-material/ArrowDownwardOutlined"
import ArrowUpwardOutlinedIcon from "@mui/icons-material/ArrowUpwardOutlined"
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

export type MetricOption = "vendidos" | "receita" | "visualizacoes" | "abandono"
export type TopNOption = 5 | 10 | 15 | 20
export type OrderOption = "desc" | "asc"

export interface FilterState {
  metric: MetricOption
  topN: TopNOption
  order: OrderOption
}

const METRIC_LABELS: Record<MetricOption, string> = {
  vendidos: "Mais vendidos",
  receita: "Maior receita",
  visualizacoes: "Mais visualizados",
  abandono: "Maior abandono",
}

const TOP_N_OPTIONS: TopNOption[] = [5, 10, 15, 20]

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
  const current = options.find(o => o.value === value)?.label ?? label

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="bg-[#E7DEED] rounded-md transition hover:bg-[#D0C5D6] p-1.5 text-black text-xs flex items-center gap-1 whitespace-nowrap">
          {current}
          <KeyboardArrowDownOutlinedIcon
            fontSize="small"
            className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
          />
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

  const topNOptions = TOP_N_OPTIONS.map(n => ({ value: n as TopNOption, label: `Top ${n}` }))

  return (
    <div className="flex flex-row gap-2 items-center">
      <SelectDropdown
        value={state.metric}
        options={metricOptions}
        label="Métrica"
        onChange={metric => onChange({ ...state, metric })}
      />
      <SelectDropdown
        value={state.topN}
        options={topNOptions}
        label="Quantidade"
        onChange={topN => onChange({ ...state, topN })}
      />
      <button
        title={state.order === "desc" ? "Mostrando maiores primeiro" : "Mostrando menores primeiro"}
        onClick={() => onChange({ ...state, order: state.order === "desc" ? "asc" : "desc" })}
        className="bg-[#E7DEED] rounded-md transition hover:bg-[#D0C5D6] p-1.5 text-black flex items-center"
      >
        {state.order === "desc"
          ? <ArrowDownwardOutlinedIcon style={{ fontSize: 14 }} />
          : <ArrowUpwardOutlinedIcon style={{ fontSize: 14 }} />
        }
      </button>
    </div>
  )
}
