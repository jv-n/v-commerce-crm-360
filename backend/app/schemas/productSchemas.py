from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    category: str | None = None
    price: float | None = None
    supplier: str | None = None
    weight_kg: float | None = None
    stock: int = 0
    status: str = "Ativo"  # "Ativo" | "Inativo"


class ProductSchema(BaseModel):
    id: str
    name: str
    price: float | None = None
    supplier: str | None = None
    weight_kg: float | None = None
    stock: int
    category: str | None = None
    status: str | None = None
    uf: str | None = None
    created_at: str | None = None
    rating: float | None = None
    total_sales: float | None = None
    receita_total: float | None = None
    ticket_medio: float | None = None
    qtd_avaliacoes: float | None = None
    nota_nps_media: float | None = None
    qtd_tickets_gerados: float | None = None
    tipo_problema_mais_frequente: str | None = None
    ratio_ticket_por_venda: float | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    price: float | None = None
    supplier: str | None = None
    weight_kg: float | None = None
    stock: int | None = None
    status: str | None = None


class ProductsPageOut(BaseModel):
    data: list[ProductSchema]
    total: int
    page: int
    pageSize: int


class ProductOrderOut(BaseModel):
    id_pedido: str
    id_cliente: str | None = None
    nome_cliente: str | None = None
    data_pedido: str | None = None
    status: str | None = None
    valor_pedido: float | None = None
    metodo_pagamento: str | None = None
    quantidade: float | None = None


class ProductTicketOut(BaseModel):
    ticket_id: str
    id_pedido: str | None = None
    tipo_problema: str | None = None
    data_abertura: str | None = None
    data_resolucao: str | None = None
    resolvido: bool = False
    agente_suporte: str | None = None
    nota_avaliacao: float | None = None


class ProductMonthlyRevenueOut(BaseModel):
    ano_mes: str
    receita: float
