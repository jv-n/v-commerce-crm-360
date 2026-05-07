from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.productModel import Product, ProductCategory
from app.schemas.productSchemas import ProductCreateSchema, ProductUpdateSchema


def _dmy_to_iso(dmy: str) -> str:
    """Converte DD/MM/YYYY para YYYY-MM-DD (para comparação lexicográfica no SQLite)."""
    d, m, y = dmy.strip().split("/")
    return f"{y}-{m.zfill(2)}-{d.zfill(2)}"


class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def get_products(
        self,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
        category: str | None = None,
        status: str | None = None,
        uf: str | None = None,
        price_min: float | None = None,
        price_max: float | None = None,
        stock_min: int | None = None,
        stock_max: int | None = None,
        rating_min: float | None = None,
        rating_max: float | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> tuple[list[Product], int]:
        query = self.db.query(Product)

        if search:
            query = query.filter(Product.name.ilike(f"%{search}%"))

        if category:
            query = query.join(Product.category).filter(
                ProductCategory.name.ilike(f"%{category}%")
            )

        if status:
            statuses = [s.strip() for s in status.split(",") if s.strip()]
            if statuses:
                query = query.filter(Product.status.in_(statuses))

        if uf:
            query = query.filter(Product.uf == uf)

        if price_min is not None:
            query = query.filter(Product.price >= price_min)
        if price_max is not None:
            query = query.filter(Product.price <= price_max)

        if stock_min is not None:
            query = query.filter(Product.stock >= stock_min)
        if stock_max is not None:
            query = query.filter(Product.stock <= stock_max)

        if rating_min is not None:
            query = query.filter(Product.rating >= rating_min)
        if rating_max is not None:
            query = query.filter(Product.rating <= rating_max)

        # created_at está em DD/MM/YYYY — converte para ISO antes de comparar
        if date_from:
            try:
                iso_from = _dmy_to_iso(date_from)
                # substr converte DD/MM/YYYY → YYYY-MM-DD no SQLite em tempo de query
                query = query.filter(
                    func.substr(Product.created_at, 7, 4)
                    + "-"
                    + func.substr(Product.created_at, 4, 2)
                    + "-"
                    + func.substr(Product.created_at, 1, 2)
                    >= iso_from
                )
            except ValueError:
                pass

        if date_to:
            try:
                iso_to = _dmy_to_iso(date_to)
                query = query.filter(
                    func.substr(Product.created_at, 7, 4)
                    + "-"
                    + func.substr(Product.created_at, 4, 2)
                    + "-"
                    + func.substr(Product.created_at, 1, 2)
                    <= iso_to
                )
            except ValueError:
                pass

        total = query.count()
        skip = (page - 1) * page_size
        data = query.offset(skip).limit(page_size).all()
        return data, total

    def get_product_by_id(self, product_id: int) -> Product | None:
        return self.db.query(Product).filter(Product.id == product_id).first()

    def create_product(self, product: ProductCreateSchema) -> Product:
        db_product = Product(**product.model_dump())
        self.db.add(db_product)
        self.db.commit()
        self.db.refresh(db_product)
        return db_product

    def update_product(self, product_id: int, product: ProductUpdateSchema) -> Product | None:
        db_product = self.get_product_by_id(product_id)
        if db_product:
            for key, value in product.model_dump(exclude_unset=True).items():
                setattr(db_product, key, value)
            self.db.commit()
            self.db.refresh(db_product)
        return db_product

    def delete_product(self, product_id: int) -> Product | None:
        db_product = self.get_product_by_id(product_id)
        if db_product:
            self.db.delete(db_product)
            self.db.commit()
        return db_product
