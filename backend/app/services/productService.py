from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models.productModel import GoldDesempenhoProduto


class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def get_products(self, skip: int = 0, limit: int = 10, search: str = ""):
        query = self.db.query(GoldDesempenhoProduto)

        if search:
            query = query.filter(
                or_(
                    GoldDesempenhoProduto.nome_produto.ilike(f"%{search}%"),
                    GoldDesempenhoProduto.id_produto.ilike(f"%{search}%"),
                )
            )

        return query.offset(skip).limit(limit).all()
