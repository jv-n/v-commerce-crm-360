import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined"
import TrendingUpIcon from "@mui/icons-material/TrendingUp"
import TrendingDownIcon from "@mui/icons-material/TrendingDown"
import { CardInfoTooltip } from "@/components/atoms/CardInfoTooltip"
import { fetchOrdersCard } from "@/lib/api/dashboard"
import type { OrdersCardData, PeriodFilter } from "@/types/dashboard"

const ptBR = new Intl.NumberFormat("pt-BR")

function PctTooltip({ pct, total }: { pct: number; total: number }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({ top: 0, left: 0 })
  const ref             = useRef<HTMLSpanElement>(null)

  const handleEnter = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      setPos({ top: r.top + window.scrollY, left: r.left + r.width / 2 + window.scrollX })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onScroll = () => setOpen(false)
    window.addEventListener("scroll", onScroll, true)
    return () => window.removeEventListener("scroll", onScroll, true)
  }, [open])

  const count = Math.round((pct / 100) * total)

  return (
    <span
      ref={ref}
      className="text-xs font-semibold text-gray-900 cursor-default"
      onMouseEnter={handleEnter}
      onMouseLeave={() => setOpen(false)}
    >
      {pct.toFixed(1)}%
      {open && createPortal(
        <div
          className="pointer-events-none fixed z-[9999]"
          style={{ top: pos.top, left: pos.left, transform: "translate(-50%, calc(-100% - 10px))" }}
        >
          <div className="bg-[#222] text-white rounded-2xl px-3.5 py-2.5 text-sm whitespace-nowrap shadow-xl">
            {ptBR.format(count)} pedidos
          </div>
          <div className="flex justify-center -mt-1.5">
            <div className="w-3 h-3 bg-[#222] rotate-45" />
          </div>
        </div>,
        document.body
      )}
    </span>
  )
}

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#A195A9] text-[1rem] font-bold">
          <LocalOfferOutlinedIcon style={{ fontSize: 22 }} />
          Pedidos
        </div>
        {!isLoading && (
          <CardInfoTooltip text={`Período anterior: ${ptBR.format(data!.prev_total)}`} />
        )}
      </div>

      {/* Total + trend badge */}
      <div className="flex flex-col gap-1.5">
        <span className="text-3xl font-bold text-gray-900 leading-none">
          {isLoading ? "—" : ptBR.format(data!.total)}
        </span>
        <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
          positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
        }`}>
          {positive
            ? <TrendingUpIcon style={{ fontSize: 13 }} />
            : <TrendingDownIcon style={{ fontSize: 13 }} />}
          {isLoading ? "—" : `${positive ? "+" : ""}${data!.trend_pct.toFixed(1)}%`}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Status breakdown */}
      <div className="flex flex-col gap-2">
        {STATUS_ROWS.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-[2px] flex-shrink-0" style={{ background: color }} />
            {isLoading
              ? <span className="text-xs font-semibold text-gray-900">—</span>
              : <PctTooltip pct={data![key] as number} total={data!.total} />
            }
            <span className="text-xs text-gray-900 truncate">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
