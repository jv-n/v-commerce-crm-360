import { useState } from "react"
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined"
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"
import { cn } from "@/lib/utils"
import { BRAZIL_STATE_PATHS } from "./brazilPaths"

const MOCK_DATA: Record<"month" | "6months", Record<string, number>> = {
  month: {
    MG: 2_400_000, SP: 2_200_000, RJ: 1_500_000, PE: 1_300_000, BA: 1_100_000,
    PR: 870_000,   RS: 760_000,   SC: 630_000,   GO: 410_000,   CE: 320_000,
    ES: 280_000,   DF: 250_000,   MT: 220_000,   MS: 200_000,   PA: 180_000,
    PB: 150_000,   MA: 140_000,   SE: 125_000,   RN: 115_000,   AL: 100_000,
    PI: 90_000,    AM: 80_000,    RO: 65_000,    TO: 50_000,    AC: 38_000,
    AP: 28_000,    RR: 18_000,
  },
  "6months": {
    SP: 14_200_000, MG: 11_800_000, RJ: 8_900_000, RS: 6_300_000, PR: 5_800_000,
    SC: 4_200_000,  BA: 3_900_000,  GO: 2_700_000, PE: 2_500_000, CE: 2_100_000,
    ES: 1_800_000,  DF: 1_600_000,  MT: 1_400_000, MS: 1_300_000, PA: 1_100_000,
    PB: 980_000,    MA: 890_000,    SE: 800_000,   RN: 730_000,   AL: 650_000,
    PI: 580_000,    AM: 510_000,    RO: 420_000,   TO: 320_000,   AC: 240_000,
    AP: 170_000,    RR: 110_000,
  },
}

function lerpColor(from: [number, number, number], to: [number, number, number], t: number): string {
  const r = Math.round(from[0] + t * (to[0] - from[0]))
  const g = Math.round(from[1] + t * (to[1] - from[1]))
  const b = Math.round(from[2] + t * (to[2] - from[2]))
  return `rgb(${r},${g},${b})`
}

const COLOR_LOW: [number, number, number] = [220, 252, 231]
const COLOR_HIGH: [number, number, number] = [20, 83, 45]
const COLOR_EMPTY = "#e5e7eb"

function getStateColor(revenue: number | undefined, min: number, max: number): string {
  if (!revenue) return COLOR_EMPTY
  const t = (revenue - min) / (max - min)
  return lerpColor(COLOR_LOW, COLOR_HIGH, t)
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`
  return `R$ ${value}`
}

type Period = "month" | "6months"

const PERIOD_LABELS: Record<Period, string> = {
  month:    "Este mês",
  "6months": "Últimos 6 meses",
}

interface TooltipState {
  name: string
  revenue: number | undefined
  x: number
  y: number
}

export function BrazilMapCard() {
  const [period, setPeriod] = useState<Period>("month")
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const data = MOCK_DATA[period]
  const values = Object.values(data)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const total = values.reduce((s, v) => s + v, 0)

  const topStates = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([sigla, revenue]) => ({
      sigla,
      revenue,
      pct: Math.round((revenue / total) * 100),
    }))

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-4 shadow-sm h-full">
      {/* Header + filter on same row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <LocationOnOutlinedIcon style={{ fontSize: 16 }} />
          Estados com mais vendas
        </div>
        <div className="flex items-center gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
          <InfoOutlinedIcon className="text-muted-foreground cursor-default" style={{ fontSize: 16 }} />
        </div>
      </div>

      {/* Content: ranking + map */}
      <div className="flex items-stretch gap-2 flex-1 min-h-0">
        {/* Ranking list */}
        <div className="flex flex-col gap-1.5 min-w-[100px] self-start">
          {topStates.map(({ sigla, revenue, pct }, idx) => (
            <div key={sigla} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground w-3">{idx + 1}.</span>
                <span className="text-xs font-semibold text-card-foreground">{sigla}</span>
              </div>
              <span className="text-xs font-bold text-card-foreground" title={formatCurrency(revenue)}>
                {pct}%
              </span>
            </div>
          ))}
        </div>

        {/* SVG Map */}
        <div className="relative flex-1 min-h-0">
          <svg
            viewBox="-25 -28 365 378"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
            onMouseLeave={() => setTooltip(null)}
          >
            {Object.entries(BRAZIL_STATE_PATHS).map(([sigla, { name, d }]) => {
              const revenue = data[sigla]
              const fill = getStateColor(revenue, min, max)
              return (
                <path
                  key={sigla}
                  d={d}
                  fill={fill}
                  stroke="#ffffff"
                  strokeWidth={0.5}
                  style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                  onMouseEnter={(e) =>
                    setTooltip({ name, revenue, x: e.clientX, y: e.clientY })
                  }
                  onMouseMove={(e) =>
                    setTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none fixed z-50 rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border border-border"
              style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}
            >
              <span className="font-semibold">{tooltip.name}</span>
              {": "}
              {tooltip.revenue ? formatCurrency(tooltip.revenue) : "Sem dados"}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className="shrink-0">Menor</span>
        <div
          className="h-1.5 flex-1 rounded-full"
          style={{
            background: `linear-gradient(to right, rgb(${COLOR_LOW.join(",")}), rgb(${COLOR_HIGH.join(",")}))`,
          }}
        />
        <span className="shrink-0">Maior receita</span>
      </div>
    </div>
  )
}
