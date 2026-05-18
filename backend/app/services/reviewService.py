from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from app.models.reviewModel import GoldAvaliacao360 as FtAvaliacao
from app.schemas.reviewSchemas import ReviewSchema


def _to_review(row: FtAvaliacao) -> ReviewSchema:
    return ReviewSchema(
        id=row.id_avaliacao,
        id_pedido=row.id_pedido,
        id_cliente=row.id_cliente,
        id_produto=row.id_produto,
        nota_produto=row.nota_produto,
        comentario=row.comentario,
        nota_nps=row.nota_nps,
        categoria_nps=row.categoria_nps,
        recomenda=row.recomenda == "True" if row.recomenda is not None else None,
        data_avaliacao=row.data_avaliacao,
    )


class ReviewService:
    _SORT_COLUMNS = {
        "data":          lambda: FtAvaliacao.data_avaliacao,
        "nota_produto":  lambda: FtAvaliacao.nota_produto,
        "nota_nps":      lambda: FtAvaliacao.nota_nps,
    }

    def __init__(self, db: Session):
        self.db = db

    def get_reviews(
        self,
        page: int = 1,
        page_size: int = 10,
        product_id: str | None = None,
        categoria_nps: str | None = None,
        rating_min: float | None = None,
        rating_max: float | None = None,
        sort_by: str | None = "data",
        sort_dir: str | None = "desc",
    ) -> tuple[list[ReviewSchema], int]:
        query = self.db.query(FtAvaliacao)

        if product_id:
            query = query.filter(FtAvaliacao.id_produto == product_id)
        if categoria_nps:
            query = query.filter(FtAvaliacao.categoria_nps == categoria_nps)
        if rating_min is not None:
            query = query.filter(FtAvaliacao.nota_produto >= rating_min)
        if rating_max is not None:
            query = query.filter(FtAvaliacao.nota_produto <= rating_max)

        col_fn = self._SORT_COLUMNS.get(sort_by or "data")
        if col_fn:
            order = desc(col_fn()) if sort_dir == "desc" else asc(col_fn())
            query = query.order_by(order)

        total = query.count()
        rows = query.offset((page - 1) * page_size).limit(page_size).all()
        return [_to_review(r) for r in rows], total
