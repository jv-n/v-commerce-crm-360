from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from database.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    price: Mapped[float] = mapped_column(Float)
    stock: Mapped[int] = mapped_column(Integer)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("product_categories.id"))

    category = relationship("ProductCategory", back_populates="products")


class ProductCategory(Base):
    __tablename__ = "product_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)

    products = relationship("Product", back_populates="category")


class GoldDesempenhoProduto(Base):
    __tablename__ = "gold_desempenho_produto"

    id_produto: Mapped[str] = mapped_column(String, primary_key=True)
    nome_produto: Mapped[str | None] = mapped_column(String, nullable=True)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    preco: Mapped[float | None] = mapped_column(Float, nullable=True)
    estoque_disponivel: Mapped[float | None] = mapped_column(Float, nullable=True)
    nota_media_avaliacao: Mapped[float | None] = mapped_column(Float, nullable=True)
    qtd_vendida: Mapped[float | None] = mapped_column(Float, nullable=True)
