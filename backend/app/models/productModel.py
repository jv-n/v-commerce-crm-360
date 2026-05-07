from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class GoldDesempenhoProduto(Base):
    __tablename__ = "gold_desempenho_produto"

    id_produto: Mapped[str] = mapped_column(String, primary_key=True)
    nome_produto: Mapped[str | None] = mapped_column(String, nullable=True)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    preco: Mapped[float | None] = mapped_column(Float, nullable=True)
    estoque_disponivel: Mapped[float | None] = mapped_column(Float, nullable=True)
    nota_media_avaliacao: Mapped[float | None] = mapped_column(Float, nullable=True)
    qtd_vendida: Mapped[float | None] = mapped_column(Float, nullable=True)
