import { useState, useEffect } from "react"
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined"
import KeyboardArrowDownOutlinedIcon from "@mui/icons-material/KeyboardArrowDownOutlined"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu"
import type { MapView } from "./atoms/PeriodToggle"
import { MapLegend } from "./atoms/MapLegend"
import { StateRankingList } from "./molecules/StateRankingList"
import { BrazilSvgMap } from "./molecules/BrazilSvgMap"
import { fetchDashboardMap } from "@/lib/api/dashboard"
import type { MapItem, PeriodFilter } from "@/types/dashboard"
import { BRAZIL_STATE_PATHS } from "./brazilPaths"

// Maps each state sigla to its Brazilian macroregion
const STATE_REGION: Record<string, string> = {
  AC: "Norte",    AM: "Norte",    AP: "Norte",    PA: "Norte",
  RO: "Norte",    RR: "Norte",    TO: "Norte",
  AL: "Nordeste", BA: "Nordeste", CE: "Nordeste", MA: "Nordeste",
  PB: "Nordeste", PE: "Nordeste", PI: "Nordeste", RN: "Nordeste", SE: "Nordeste",
  DF: "Centro-Oeste", GO: "Centro-Oeste", MS: "Centro-Oeste", MT: "Centro-Oeste",
  ES: "Sudeste",  MG: "Sudeste",  RJ: "Sudeste",  SP: "Sudeste",
  PR: "Sul",      RS: "Sul",      SC: "Sul",
}

interface BrazilMapCardProps {
  period: PeriodFilter
}

export function BrazilMapCard({ period }: BrazilMapCardProps) {
  const [view, setView]           = useState<MapView>("estados")
  const [items, setItems]         = useState<MapItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetchDashboardMap(view, period)
      .then((res) => setItems(res.items))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [view, period])

  // ------------------------------------------------------------------
  // Derived data
  // ------------------------------------------------------------------

  // Lookup: key → total_valor / total_pedidos from API
  const apiValor   = Object.fromEntries(items.map((d) => [d.key, d.total_valor]))
  const apiPedidos = Object.fromEntries(items.map((d) => [d.key, d.total_pedidos]))

  const allValues = items.map((d) => d.total_valor)
  const min   = allValues.length ? Math.min(...allValues) : 0
  const max   = allValues.length ? Math.max(...allValues) : 0
  const total = allValues.reduce((s, v) => s + v, 0)

  // Per-state lookups passed to BrazilSvgMap (works for both views)
  const stateValues:  Record<string, number> = {}
  const statePedidos: Record<string, number> = {}
  const stateLabels:  Record<string, string> = {}

  for (const sigla of Object.keys(BRAZIL_STATE_PATHS)) {
    if (view === "estados") {
      stateValues[sigla]  = apiValor[sigla]   ?? 0
      statePedidos[sigla] = apiPedidos[sigla] ?? 0
      stateLabels[sigla]  = `${sigla} — ${BRAZIL_STATE_PATHS[sigla].name}`
    } else {
      const region = STATE_REGION[sigla]
      stateValues[sigla]  = region ? (apiValor[region]   ?? 0) : 0
      statePedidos[sigla] = region ? (apiPedidos[region] ?? 0) : 0
      stateLabels[sigla]  = region ?? sigla
    }
  }

  // Top-5 ranking
  const topItems = [...items]
    .sort((a, b) => b.total_valor - a.total_valor)
    .slice(0, 5)
    .map((d) => ({
      key:   d.key,
      valor: d.total_valor,
      pct:   total > 0 ? Math.round((d.total_valor / total) * 100) : 0,
    }))

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-4 shadow-sm h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#A195A9] text-[1rem] font-bold">
          <LocationOnOutlinedIcon style={{ fontSize: 16 }} />
          Estados com mais vendas
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="bg-[#E7DEED] rounded-md transition hover:bg-[#D0C5D6] p-1.5 text-black text-xs flex items-center gap-1 whitespace-nowrap">
              {view === "estados" ? "Estados" : "Regiões"}
              <KeyboardArrowDownOutlinedIcon fontSize="small" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              {(["estados", "regioes"] as MapView[]).map(v => (
                <DropdownMenuItem
                  key={v}
                  className={view === v ? "font-semibold bg-[#EDE5F2]" : ""}
                  onSelect={() => setView(v)}
                >
                  {v === "estados" ? "Estados" : "Regiões"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content: map + legend, ranking overlaid at bottom-left */}
      <div className="relative flex items-stretch gap-2 flex-1 min-h-0">
        <BrazilSvgMap
          stateValues={stateValues}
          statePedidos={statePedidos}
          stateLabels={stateLabels}
          min={min}
          max={max}
          isLoading={isLoading}
        />
        <MapLegend min={min} max={max} />
        <div className="absolute bottom-2 left-2 rounded-lg bg-card/80 backdrop-blur-sm p-2">
          <StateRankingList items={topItems} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
