from pydantic import BaseModel


class MetricOut(BaseModel):
    value: float
    prev_value: float
    trend_pct: float
    yoy_value: float
    yoy_pct: float


class PeriodInfo(BaseModel):
    start: str
    end: str
    prev_start: str
    prev_end: str
    yoy_start: str
    yoy_end: str


class DashboardMetricsOut(BaseModel):
    period: PeriodInfo
    nps: MetricOut
    vendas: MetricOut
    clientes: MetricOut
    tickets: MetricOut
    leads_convertidos: MetricOut
    sessoes: MetricOut


class MapItemOut(BaseModel):
    key: str
    total_pedidos: int
    total_valor: float


class MapDataOut(BaseModel):
    view: str
    items: list[MapItemOut]


class RevenueSeriesOut(BaseModel):
    name: str
    data: list[float]


class RevenueChartOut(BaseModel):
    bucket: str  # "day" | "week" | "month" | "year"
    labels: list[str]
    series: list[RevenueSeriesOut]


class OrdersCardOut(BaseModel):
    total: int
    prev_total: int
    trend_pct: float
    aprovados_pct: float
    processando_pct: float
    recusados_pct: float
    reembolsados_pct: float


class TopCategoryItemOut(BaseModel):
    name: str
    value: float


class TopCategoriesOut(BaseModel):
    metric: str
    order: str
    items: list[TopCategoryItemOut]
