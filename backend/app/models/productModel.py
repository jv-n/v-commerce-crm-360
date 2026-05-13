from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class DimProduto(Base):
    __tablename__ = "dim_produtos"

    id_produto: Mapped[str] = mapped_column(String, primary_key=True)
    nome_produto: Mapped[str] = mapped_column(String)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    preco: Mapped[float | None] = mapped_column(Float, nullable=True)
    estoque_disponivel: Mapped[float | None] = mapped_column(Float, nullable=True)
    ativo: Mapped[str | None] = mapped_column(String, nullable=True)
    data_cadastro_produto: Mapped[str | None] = mapped_column(String, nullable=True)


class GoldDesempenhoProduto(Base):
    __tablename__ = "gold_desempenho_produto"

    id_produto: Mapped[str] = mapped_column(String, primary_key=True)
    nota_media_avaliacao: Mapped[float | None] = mapped_column(Float, nullable=True)
    qtd_vendida: Mapped[float | None] = mapped_column(Float, nullable=True)
    receita_total: Mapped[float | None] = mapped_column(Float, nullable=True)
    ticket_medio: Mapped[float | None] = mapped_column(Float, nullable=True)
    qtd_avaliacoes: Mapped[float | None] = mapped_column(Float, nullable=True)
    nota_nps_media: Mapped[float | None] = mapped_column(Float, nullable=True)
    qtd_tickets_gerados: Mapped[float | None] = mapped_column(Float, nullable=True)
    tipo_problema_mais_frequente: Mapped[str | None] = mapped_column(String, nullable=True)
    ratio_ticket_por_venda: Mapped[float | None] = mapped_column(Float, nullable=True)
