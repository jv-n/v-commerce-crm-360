from pydantic import BaseModel


class ContactDetailsOut(BaseModel):
    id: str
    name: str | None
    email: str | None
    phone: str | None
    gender: str | None
    birthDate: str | None
    age: int | None
    ageRange: str | None
    createdAt: str | None
    city: str | None
    state: str | None
    region: str | None
    country: str | None
    origin: str | None
    clientStatus: str | None
    contactType: str
    responsible: str | None = None


class ContactOrderProductOut(BaseModel):
    id_produto: str | None
    nome_produto: str | None
    categoria: str | None
    quantidade: float
    valor: float


class ContactOrderOut(BaseModel):
    id_pedido: str
    id_cliente: str | None
    data_pedido: str | None
    ano_mes: str | None
    status: str | None
    metodo_pagamento: str | None
    valor_total: float
    receita_bruta: float
    valor_reembolsado: float
    quantidade_total: float
    produtos_resumo: str
    produtos: list[ContactOrderProductOut]


class ContactOrdersPageOut(BaseModel):
    data: list[ContactOrderOut]
    total: int
    page: int
    pageSize: int


class ContactTicketOut(BaseModel):
    ticket_id: str
    id_cliente: str | None
    id_pedido: str | None
    status_atendimento: str | None
    tipo_problema: str | None
    data_abertura: str | None
    hora_abertura: str | None
    agente_suporte: str | None
    tempo_resolucao_horas: float | None
    nota_avaliacao: float | None


class ContactTicketsPageOut(BaseModel):
    data: list[ContactTicketOut]
    total: int
    page: int
    pageSize: int


class ContactCategoryMetricOut(BaseModel):
    categoria: str
    quantidade_total: float
    receita_total: float
    total_pedidos: int


class ContactMetricsOut(BaseModel):
    contactType: str
    comprasMes: float
    mediaNps: float | None
    categoriaNpsRecente: str | None

    origemLead: str | None
    produtoMaisVisualizado: str | None
    categoriaMaisVisualizada: str | None

    totalSessoes: int
    totalVisualizacoes: int
    totalCarrinho: int
    totalCheckouts: int
    totalAbandonoCarrinho: int
    taxaConversaoPct: float

    categoriasMaisCompradas: list[ContactCategoryMetricOut]


class ContactViewedProductOut(BaseModel):
    id_produto: str | None
    nome_produto: str | None
    categoria: str | None
    data_ultima_visualizacao: str | None
    tempo_medio_pagina_seg: float | None
    origem: str | None
    canal: str | None
    dispositivo: str | None
    observacao: str | None = None