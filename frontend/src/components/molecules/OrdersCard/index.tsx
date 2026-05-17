import { useState, useEffect } from "react"
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined"
import TrendingUpIcon from "@mui/icons-material/TrendingUp"
import TrendingDownIcon from "@mui/icons-material/TrendingDown"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/tooltip"
import { fetchOrdersCard } from "@/lib/api/dashboard"
import type { OrdersCardData, PeriodFilter } from "@/types/dashboard"

const ptBR = new Intl.NumberFormat("pt-BR")

const STATUS_ROWS: { key: keyof OrdersCardData; label: string; color: string }[] = [
  { key: "aprovados_pct",    label: "Aprovados",    color: "#4ade80" },
  { key: "processando_pct",  label: "Processando",  color: "#f59e0b" },
  { key: "recusados_pct",    label: "Recusados",    color: "#f87171" },
  { key: "reembolsados_pct", label: "Reembolsados", color: "#d1d5db" },
]

interface Props {
  period: PeriodFilter
}

export function OrdersCard({ period }: Props) {
  const [data, setData] = useState<OrdersCardData | null>(null)

  useEffect(() => {
    let alive = true
    setData(null)
    fetchOrdersCard(period)
      .then(d => { if (alive) setData(d) })
      .catch(console.error)
    return () => { alive = false }
  }, [period])

  const isLoading = data === null
  const positive = (data?.trend_pct ?? 0) >= 0

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm h-full w-[180px] flex-shrink-0">
      {/* Header */}
      <div className="flex items-center gap-1.5 text-[#A195A9] text-[1rem] font-bold">
        <LocalOfferOutlinedIcon style={{ fontSize: 18 }} />
        Pedidos
      </div>

      {/* Total + trend badge */}
      <div className="flex flex-col gap-1.5">
        <span className="text-3xl font-bold text-secondary-foreground leading-none">
          {isLoading ? "—" : ptBR.format(data!.total)}
        </span>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full w-fit cursor-default ${
                positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}>
                {positive
                  ? <TrendingUpIcon style={{ fontSize: 13 }} />
                  : <TrendingDownIcon style={{ fontSize: 13 }} />}
                {isLoading ? "—" : `${positive ? "+" : ""}${data!.trend_pct.toFixed(1)}%`}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              Período anterior: {isLoading ? "—" : ptBR.format(data!.prev_total)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Status breakdown */}
      <div className="flex flex-col gap-2">
        {STATUS_ROWS.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-[2px] flex-shrink-0" style={{ background: color }} />
            <span className="text-xs font-semibold text-secondary-foreground">
              {isLoading ? "—" : `${(data![key] as number).toFixed(1)}%`}
            </span>
            <span className="text-xs text-muted-foreground truncate">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
