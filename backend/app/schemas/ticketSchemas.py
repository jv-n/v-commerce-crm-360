from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


TipoProblema = Literal["Pagamento", "Reembolso", "Entrega", "Produto"]
StatusAtendimento = Literal["Finalizado", "Em atendimento", "Aguardando"]
Resolvido = Literal["True", "False"]


class TicketBase(BaseModel):
    id_cliente: str | None = None
    status_atendimento: StatusAtendimento | None = None
    tipo_problema: TipoProblema | None = None
    data_abertura: str | None = None
    hora_abertura: str | None = None
    agente_suporte: str | None = None
    nome_cliente: str | None = None
    regiao_cliente: str | None = None
    estado_cliente: str | None = None
    faixa_etaria: str | None = None
    id_pedido: str | None = None
    tempo_resolucao_horas: float | None = Field(default=None, ge=0)
    nota_avaliacao: float | None = Field(default=None, ge=1, le=5)
    timestamp_ingestion: str | None = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(TicketBase):
    pass


class TicketOut(TicketBase):
    model_config = ConfigDict(from_attributes=True)

    ticket_id: str
    resolvido: Resolvido | None = None


class TicketsPageOut(BaseModel):
    data: list[TicketOut]
    total: int
    page: int
    pageSize: int