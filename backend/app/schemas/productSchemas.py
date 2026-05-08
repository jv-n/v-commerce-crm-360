from pydantic import BaseModel


class ProductSchema(BaseModel):
    id: str
    name: str
    price: float | None = None
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


class ProductsPageOut(BaseModel):
    data: list[ProductSchema]
    total: int
    page: int
    pageSize: int
