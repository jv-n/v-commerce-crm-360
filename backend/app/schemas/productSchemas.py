from pydantic import BaseModel


class ProductCategorySchema(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ProductSchema(BaseModel):
    id: int
    name: str
    description: str | None = None
    price: float
    stock: int
    category_id: int
    category: ProductCategorySchema | None = None
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

    class Config:
        from_attributes = True


class ProductsPageOut(BaseModel):
    data: list[ProductSchema]
    total: int
    page: int
    pageSize: int


class ProductCreateSchema(BaseModel):
    name: str
    description: str | None = None
    price: float
    stock: int
    category_id: int
    status: str | None = None
    uf: str | None = None
    created_at: str | None = None


class ProductUpdateSchema(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    stock: int | None = None
    category_id: int | None = None
    status: str | None = None
    uf: str | None = None
