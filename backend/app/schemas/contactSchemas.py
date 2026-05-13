from pydantic import BaseModel, ConfigDict


class ContactCreate(BaseModel):
    name: str
    email: str | None = None


class ContactUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    clientStatus: str | None = None


class ContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # Identidade
    id: str
    name: str | None
    email: str | None
    phone: str | None           # não existe em gold_cliente_360 — sempre None

    # Segmentação e origem
    clientStatus: str | None    # segmento_cliente
    region: str | None          # regiao
    origin: str | None          # origem

    # Pedidos / compras
    purchases: int              # total_pedidos
    distinctProducts: int       # total_produtos_distintos
    totalRevenue: float         # receita_total
    avgTicket: float            # ticket_medio
    firstPurchase: str | None   # data_primeiro_pedido (formatado)
    lastPurchase: str | None    # data_ultimo_pedido (formatado)
    favPaymentMethod: str | None  # metodo_pagamento_favorito

    # Suporte
    totalTickets: int           # total_tickets
    resolutionRate: float       # taxa_resolucao
    avgSupportRating: float | None  # nota_media_atendimento

    # NPS / engajamento
    engagement: str             # categoria_nps_recente (normalizado)
    engagementScore: float      # nota_nps_media (normalizado 0–100)
    productRating: float | None  # nota_produto_media

    # Compat. com frontend (aponta para data_primeiro_pedido)
    createdAt: str | None


class ContactsPageOut(BaseModel):
    data: list[ContactOut]
    total: int
    page: int
    pageSize: int
