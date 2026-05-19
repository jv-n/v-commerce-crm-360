from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class GoldAvaliacao360(Base):
    __tablename__ = "gold_avaliacoes_360"

    id_avaliacao:   Mapped[str]         = mapped_column(String, primary_key=True)
    id_pedido:      Mapped[str | None]   = mapped_column(String, nullable=True)
    id_cliente:     Mapped[str | None]   = mapped_column(String, nullable=True)
    id_produto:     Mapped[str | None]   = mapped_column(String, nullable=True)
    nota_produto:   Mapped[float | None] = mapped_column(Float,  nullable=True)
    comentario:     Mapped[str | None]   = mapped_column(String, nullable=True)
    nota_nps:       Mapped[float | None] = mapped_column(Float,  nullable=True)
    categoria_nps:  Mapped[str | None]   = mapped_column(String, nullable=True)
    recomenda:      Mapped[str | None]   = mapped_column(String, nullable=True)
    data_avaliacao: Mapped[str | None]   = mapped_column(String, nullable=True)
