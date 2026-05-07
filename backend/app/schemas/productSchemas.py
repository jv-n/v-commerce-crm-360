from pydantic import BaseModel


class ProductSchema(BaseModel):
    id_produto: str
    nome_produto: str | None
    categoria: str | None
    preco: float | None
    estoque_disponivel: float | None
    nota_media_avaliacao: float | None
    qtd_vendida: float | None

    class Config:
        from_attributes = True


class ProductCreateSchema(BaseModel):
    id_produto: str
    nome_produto: str
    categoria: str
    preco: float
    estoque_disponivel: int


class ProductUpdateSchema(BaseModel):
    nome_produto: str | None = None
    categoria: str | None = None
    preco: float | None = None
    estoque_disponivel: int | None = None
