import { BarChart } from "@mui/x-charts/BarChart";
import { FilterSelectPeriod, FilterSelectType } from "./FilterSelect";

export type PeriodOption = "ALL" | "3" | "6" | "12"

export type ModuleBarChartProps = {
    xAxis_data: string[]
    serial_data: number[]
    title: string
    type: string
}

import type { GranularityOption } from "./FilterSelect";

const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
    { value: "ALL", label: "Todo o período" },
    { value: "3",   label: "Últimos 3 meses" },
    { value: "6",   label: "Últimos 6 meses" },
    { value: "12",  label: "Ano completo" },
]

const GRANULARITY_OPTIONS: { value: GranularityOption; label: string }[] = [
    { value: "ALL",      label: "Todos" },
    { value: "CATEGORY", label: "Por categoria" },
    { value: "PRODUCT",  label: "Por produto" },
]

export function ModuleBarChart(props: ModuleBarChartProps) {

    return(
        <div className="flex flex-col gap-3 items-start justify-center bg-white rounded-md shadow-sm p-4">
            <span className="text-md font-bold text-secondary-foreground">{props.title}</span>
            <div className="flex flex-row gap-2 items-start justify-center">
                <FilterSelectType Options={GRANULARITY_OPTIONS} />
                <FilterSelectPeriod Options={PERIOD_OPTIONS} />
            </div>
            <BarChart
                xAxis={[
                    {
                        id: "barCategory",
                        data: props.xAxis_data,
                        height: 26,
                        barGapRatio: 0.5
                    }
                ]}
                series={[
                    {
                        data: props.serial_data
                    }
                ]}
                height={410}
                width={610}
            />
        </div>
    )
}