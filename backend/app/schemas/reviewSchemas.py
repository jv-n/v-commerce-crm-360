from pydantic import BaseModel


class ReviewSchema(BaseModel):
    id: str
    id_pedido: str | None
    id_cliente: str | None
    id_produto: str | None
    nota_produto: float | None
    comentario: str | None
    nota_nps: float | None
    categoria_nps: str | None
    recomenda: bool | None
    data_avaliacao: str | None

    model_config = {"from_attributes": True}


class ReviewsPageOut(BaseModel):
    data: list[ReviewSchema]
    total: int
    page: int
    pageSize: int
