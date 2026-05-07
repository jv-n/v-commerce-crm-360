from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models.productModel import Product
from app.schemas.productSchemas import ProductCreateSchema, ProductUpdateSchema


class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def get_products(
        self, skip: int = 0, limit: int = 10, search: str = "", category: str = ""
    ):
        query = self.db.query(Product)

        if search:
            query = query.filter(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.id.ilike(f"%{search}%"),
                )
            )
        if category:
            query = query.join(Product.category).filter(
                Product.category.name.ilike(f"%{category}%")
            )

        return query.offset(skip).limit(limit).all()

    def get_product_by_id(self, product_id: int):
        return self.db.query(Product).filter(Product.id == product_id).first()

    def create_product(self, product: ProductCreateSchema):
        db_product = Product(**product.model_dump())
        self.db.add(db_product)
        self.db.commit()
        self.db.refresh(db_product)
        return db_product

    def update_product(self, product_id: int, product: ProductUpdateSchema):
        db_product = self.get_product_by_id(product_id)
        if db_product:
            update_data = product.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_product, key, value)
            self.db.commit()
            self.db.refresh(db_product)
        return db_product

    def delete_product(self, product_id: int):
        db_product = self.get_product_by_id(product_id)
        if db_product:
            self.db.delete(db_product)
            self.db.commit()
        return db_product
