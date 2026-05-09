from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


TipoProblema = Literal["Pagamento", "Reembolso", "Entrega", "Produto"]
Resolvido = Literal["True", "False"]


class TicketBase(BaseModel):
    id_cliente: str | None = None
    id_pedido: str | None = None
    tipo_problema: TipoProblema | None = None
    data_abertura: str | None = None
    data_resolucao: str | None = None
    tempo_resolucao_minutos: float | None = Field(default=None, ge=0)
    tempo_resolucao_horas: float | None = Field(default=None, ge=0)
    agente_suporte: str | None = None
    nota_avaliacao: float | None = Field(default=None, ge=1, le=5)
    resolvido: Resolvido | None = None
    hora_abertura: int | None = Field(default=None, ge=0, le=23)
    dia_semana_abertura: str | None = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(TicketBase):
    pass


class TicketOut(TicketBase):
    model_config = ConfigDict(from_attributes=True)

    ticket_id: str


class TicketsPageOut(BaseModel):
    data: list[TicketOut]
    total: int
    page: int
    pageSize: int