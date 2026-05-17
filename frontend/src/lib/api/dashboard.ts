import type { DashboardMetrics, MapData, OrdersCardData, PeriodFilter, RevenueChartData, TopCategoriesData } from "@/types/dashboard"

function periodParams(period: PeriodFilter): URLSearchParams {
  const p = new URLSearchParams({ period_type: period.type })
  if (period.type === "custom" && period.startDate && period.endDate) {
    p.set("start_date", period.startDate)
    p.set("end_date", period.endDate)
  }
  return p
}

export async function fetchOrdersCard(period: PeriodFilter): Promise<OrdersCardData> {
  const res = await fetch(`/api/dashboard/orders?${periodParams(period)}`)
  if (!res.ok) throw new Error("Erro ao buscar dados de pedidos")
  return res.json()
}

export async function fetchDashboardMetrics(period: PeriodFilter): Promise<DashboardMetrics> {
  const res = await fetch(`/api/dashboard/metrics?${periodParams(period)}`)
  if (!res.ok) throw new Error("Erro ao buscar métricas do dashboard")
  return res.json()
}

export interface RevenueChartParams {
  period: PeriodFilter
  granularity: "total" | "category" | "product"
  categories?: string[]
  productIds?: string[]
}

export async function fetchRevenueChart(params: RevenueChartParams): Promise<RevenueChartData> {
  const p = periodParams(params.period)
  p.set("granularity", params.granularity)
  if (params.categories?.length) p.set("categories", params.categories.join(","))
  if (params.productIds?.length) p.set("product_ids", params.productIds.join(","))
  const res = await fetch(`/api/dashboard/revenue?${p}`)
  if (!res.ok) throw new Error("Erro ao buscar dados do gráfico de receita")
  return res.json()
}

export interface TopCategoriesParams {
  period: PeriodFilter
  metric: "vendidos" | "receita" | "visualizacoes" | "abandono"
  topN: number
  order: "desc" | "asc"
}

export async function fetchTopCategories(params: TopCategoriesParams): Promise<TopCategoriesData> {
  const p = periodParams(params.period)
  p.set("metric", params.metric)
  p.set("top_n", String(params.topN))
  p.set("order", params.order)
  const res = await fetch(`/api/dashboard/top-categories?${p}`)
  if (!res.ok) throw new Error("Erro ao buscar top categorias")
  return res.json()
}

export async function fetchDashboardMap(
  view: "estados" | "regioes",
  period: PeriodFilter,
): Promise<MapData> {
  const p = periodParams(period)
  p.set("view", view)
  const res = await fetch(`/api/dashboard/map?${p}`)
  if (!res.ok) throw new Error("Erro ao buscar dados do mapa")
  return res.json()
}
