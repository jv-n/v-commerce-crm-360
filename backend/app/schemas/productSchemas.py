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
