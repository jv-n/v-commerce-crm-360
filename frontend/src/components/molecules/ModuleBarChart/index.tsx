import { BarChart } from "@mui/x-charts/BarChart";
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import { useEffect, useMemo, useRef, useState } from "react";
import { FilterSelectType } from "./FilterSelect";
import type { GranularityState } from "./FilterSelect";
import { fetchRevenueChart } from "@/lib/api/dashboard";
import type { PeriodFilter } from "@/types/dashboard";
import type { RevenueChartData, RevenueBucket } from "@/types/dashboard";

export type ModuleBarChartProps = {
    title: string
    period: PeriodFilter
}

const PT_MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

function formatLabel(key: string, bucket: RevenueBucket): string {
    if (bucket === "year") return key
    if (bucket === "month") {
        const [y, m] = key.split("-")
        return `${PT_MONTHS[parseInt(m) - 1]}/${y.slice(2)}`
    }
    if (bucket === "week") return `Sem ${key.split("-W")[1]}`
    const parts = key.split("-")
    return `${parts[2]}/${parts[1]}`
}

function granularityToParam(g: GranularityState): "total" | "category" | "product" {
    if (g.granularity === "CATEGORY") return "category"
    if (g.granularity === "PRODUCT") return "product"
    return "total"
}

export function ModuleBarChart({ title, period }: ModuleBarChartProps) {
    const [granularityState, setGranularityState] = useState<GranularityState>({
        granularity: "ALL",
        category: null,
        product: null,
    })

    const [chartData, setChartData] = useState<RevenueChartData | null>(null)
    const [loadedKey, setLoadedKey] = useState<string | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)

    const requestKey = useMemo(() => JSON.stringify({
        period,
        granularity: granularityState.granularity,
        category: granularityState.category,
        productId: granularityState.product?.id ?? null,
    }), [period, granularityState])

    const isLoading = requestKey !== loadedKey

    useEffect(() => {
        let alive = true
        const params = JSON.parse(requestKey)
        fetchRevenueChart({
            period: params.period,
            granularity: granularityToParam(granularityState),
            categories: params.category ? [params.category] : [],
            productIds: params.productId ? [params.productId] : [],
        })
            .then(data => {
                if (!alive) return
                setChartData(data)
                setLoadedKey(requestKey)
            })
            .catch(console.error)
        return () => { alive = false }
    }, [requestKey]) // eslint-disable-line react-hooks/exhaustive-deps

    const formattedLabels = chartData
        ? chartData.labels.map(l => formatLabel(l, chartData.bucket))
        : []

    const series = chartData
        ? chartData.series.map(s => ({ label: s.name, data: s.data }))
        : []

    return (
        <div className="flex flex-col gap-2 rounded-xl bg-card p-4 shadow-sm h-full w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#A195A9] text-[1rem] font-bold">
                    <PaymentsRoundedIcon style={{ fontSize: 22 }}/>
                    {title}
                </div>
                <div className="flex items-center gap-2">
                    {isLoading && (
                        <span className="text-xs text-muted-foreground animate-pulse">Carregando...</span>
                    )}
                    <FilterSelectType onChange={setGranularityState} />
                </div>
            </div>
            <div ref={containerRef} className="w-full h-full flex flex-row justify-start">
                {chartData && formattedLabels.length > 0 ? (
                    <BarChart
                        xAxis={[{ scaleType: "band", data: formattedLabels, barGapRatio: 0.5 }]}
                        series={series}
                    />
                ) : (
                    <div className="flex w-full h-[370px] items-center justify-center text-sm text-muted-foreground">
                        {isLoading ? "Carregando gráfico..." : "Sem dados para o período selecionado"}
                    </div>
                )}
            </div>
        </div>
    )
}
