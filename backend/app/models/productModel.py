from sqlalchemy import Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from database.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    price: Mapped[float] = mapped_column(Float, default=0.0)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("product_categories.id"))
    status: Mapped[str | None] = mapped_column(String, nullable=True)
    uf: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[str | None] = mapped_column(String, nullable=True)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_sales: Mapped[float | None] = mapped_column(Float, nullable=True)
    receita_total: Mapped[float | None] = mapped_column(Float, nullable=True)
    ticket_medio: Mapped[float | None] = mapped_column(Float, nullable=True)
    qtd_avaliacoes: Mapped[float | None] = mapped_column(Float, nullable=True)
    nota_nps_media: Mapped[float | None] = mapped_column(Float, nullable=True)
    qtd_tickets_gerados: Mapped[float | None] = mapped_column(Float, nullable=True)
    tipo_problema_mais_frequente: Mapped[str | None] = mapped_column(String, nullable=True)
    ratio_ticket_por_venda: Mapped[float | None] = mapped_column(Float, nullable=True)

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
