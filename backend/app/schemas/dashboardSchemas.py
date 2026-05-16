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


class MapItemOut(BaseModel):
    key: str
    total_pedidos: int
    total_valor: float


class MapDataOut(BaseModel):
    view: str
    items: list[MapItemOut]
