from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class GoldAvaliacao360(Base):
    __tablename__ = "gold_avaliacoes_360"

    id_avaliacao:        Mapped[str]         = mapped_column(String, primary_key=True)
    id_pedido:           Mapped[str | None]   = mapped_column(String, nullable=True)
    id_cliente:          Mapped[str | None]   = mapped_column(String, nullable=True)
    id_produto:          Mapped[str | None]   = mapped_column(String, nullable=True)
    nota_produto:        Mapped[float | None] = mapped_column(Float,  nullable=True)
    comentario:          Mapped[str | None]   = mapped_column(String, nullable=True)
    nota_nps:            Mapped[float | None] = mapped_column(Float,  nullable=True)
    categoria_nps:       Mapped[str | None]   = mapped_column(String, nullable=True)
    recomenda:           Mapped[str | None]   = mapped_column(String, nullable=True)
    data_avaliacao:      Mapped[str | None]   = mapped_column(String, nullable=True)
    nome_cliente:        Mapped[str | None]   = mapped_column(String, nullable=True)
    email:               Mapped[str | None]   = mapped_column(String, nullable=True)
    regiao:              Mapped[str | None]   = mapped_column(String, nullable=True)
    estado:              Mapped[str | None]   = mapped_column(String, nullable=True)
    faixa_etaria:        Mapped[str | None]   = mapped_column(String, nullable=True)
    nome_produto:        Mapped[str | None]   = mapped_column(String, nullable=True)
    categoria:           Mapped[str | None]   = mapped_column(String, nullable=True)
    metodo_pagamento:    Mapped[str | None]   = mapped_column(String, nullable=True)
    valor_pedido:        Mapped[float | None] = mapped_column(Float,  nullable=True)
    status_pedido:       Mapped[str | None]   = mapped_column(String, nullable=True)
    timestamp_ingestion: Mapped[str | None]   = mapped_column(String, nullable=True)


# Alias de compatibilidade — mantido caso haja imports existentes
FtAvaliacao = GoldAvaliacao360
