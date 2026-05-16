export type PeriodType = "2weeks" | "month" | "3months" | "semester" | "year" | "custom"

export interface PeriodFilter {
  type: PeriodType
  startDate?: string // YYYY-MM-DD
  endDate?: string   // YYYY-MM-DD
}

export interface MetricValue {
  value: number
  prev_value: number
  trend_pct: number
  yoy_value: number
  yoy_pct: number
}

export interface PeriodInfo {
  start: string
  end: string
  prev_start: string
  prev_end: string
  yoy_start: string
  yoy_end: string
}

export interface DashboardMetrics {
  period: PeriodInfo
  nps: MetricValue
  vendas: MetricValue
  clientes: MetricValue
  tickets: MetricValue
}

export interface MapItem {
  key: string
  total_pedidos: number
  total_valor: number
}

export interface MapData {
  view: string
  items: MapItem[]
}

export type RevenueBucket = "day" | "week" | "month" | "year"

export interface RevenueSeries {
  name: string
  data: number[]
}

export interface RevenueChartData {
  bucket: RevenueBucket
  labels: string[]
  series: RevenueSeries[]
}
