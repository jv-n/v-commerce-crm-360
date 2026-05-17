import { BarChart } from "@mui/x-charts/BarChart"
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined"
import { useState, useEffect, useRef, useMemo } from "react"
import { TopCategoriesFilterSelect } from "./FilterSelect"
import type { FilterState } from "./FilterSelect"
import { fetchTopCategories } from "@/lib/api/dashboard"
import type { PeriodFilter, TopCategoriesData } from "@/types/dashboard"

// Palette from the design (SVG): pink, lavender, salmon, light-blue, then expanded
const BAR_COLORS = [
  "#FFCBCC", "#FFCBFE", "#FFA58E", "#CBF8FF",
  "#C9B8E8", "#F0D49A", "#9FC4B8", "#E8C9A0",
  "#B8D4A0", "#D0B8F4", "#F4C0A0", "#A0C8D8",
  "#D8B8D8", "#C8D8A0", "#A8B8D8", "#D8C8A0",
  "#B0D0B8", "#D0A8B8", "#A8D0C8", "#C0B0D8",
]

function ChartLegend({ names }: { names: string[] }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center ml-[28px]">
      {names.map((name, i) => (
        <div key={name} className="flex items-center gap-1">
          <div
            className="w-2.5 h-2.5 rounded-[2px] flex-shrink-0"
            style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
          />
          <span className="text-[10px] text-muted-foreground leading-none truncate max-w-[90px]">
            {name}
          </span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  period: PeriodFilter
}

export function TopCategoriesChart({ period }: Props) {
  const [filter, setFilter] = useState<FilterState>({
    metric: "vendidos",
    topN: 5,
    order: "desc",
  })
  const [data, setData] = useState<TopCategoriesData | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [chartHeight, setChartHeight] = useState(150)

  const requestKey = useMemo(
    () => JSON.stringify({ period, ...filter }),
    [period, filter],
  )
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const isLoading = requestKey !== loadedKey

  useEffect(() => {
    let alive = true
    fetchTopCategories({
      period,
      metric: filter.metric,
      topN: filter.topN,
      order: filter.order,
    })
      .then(d => {
        if (!alive) return
        setData(d)
        setLoadedKey(requestKey)
      })
      .catch(console.error)
    return () => { alive = false }
  }, [requestKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = chartContainerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const h = entries[0].contentRect.height
      if (h > 0) setChartHeight(h)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const names  = data?.items.map(i => i.name)  ?? []
  const values = data?.items.map(i => i.value) ?? []

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-4 shadow-sm h-full w-[440px] flex-shrink-0">
      {/* Header — same structure as ModuleBarChart */}
      <div className="flex flex-row items-center gap-1.5 text-[#A195A9] text-[1rem] font-bold">
        <LeaderboardOutlinedIcon style={{ fontSize: 18 }} />
        Categorias de produtos
      </div>

      {/* Filters */}
      <TopCategoriesFilterSelect state={filter} onChange={setFilter} />

      {isLoading && (
        <span className="text-xs text-muted-foreground animate-pulse -mt-1">
          Carregando...
        </span>
      )}

      {/* Chart + legend grouped so legend sits immediately below bars */}
      <div className="flex flex-col flex-1 min-h-0 gap-1 -ml-3">
        <div ref={chartContainerRef} className="w-full flex-1 min-h-0">
          {names.length > 0 ? (
            <BarChart
              xAxis={[{
                scaleType: "band",
                data: names,
                barGapRatio: 0.35,
                colorMap: { type: "ordinal", colors: BAR_COLORS },
                tickLabelInterval: () => false,
              }]}
              yAxis={[{ tickLabelStyle: { fontSize: 9 } }]}
              series={[{ data: values }]}
              height={chartHeight}
              margin={{ left: 28, right: 42, top: 6, bottom: 8 }}
              slotProps={{ legend: { hidden: true } }}
            />
          ) : (
            <div className="flex w-full h-full items-center justify-center text-sm text-muted-foreground">
              {isLoading ? "" : "Sem dados para o período"}
            </div>
          )}
        </div>

        {names.length > 0 && <ChartLegend names={names} />}
      </div>
    </div>
  )
}
