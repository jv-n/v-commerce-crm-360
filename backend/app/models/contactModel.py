from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class DimCliente(Base):
    __tablename__ = "dim_clientes"

    id_cliente: Mapped[str]       = mapped_column(String, primary_key=True)
    telefone:   Mapped[str | None] = mapped_column(String, nullable=True)


class GoldCliente360(Base):
    __tablename__ = "gold_cliente_360"

    id_cliente:                Mapped[str]         = mapped_column(String,  primary_key=True)
    nome_completo:             Mapped[str | None]   = mapped_column(String,  nullable=True)
    email:                     Mapped[str | None]   = mapped_column(String,  nullable=True)
    regiao:                    Mapped[str | None]   = mapped_column(String,  nullable=True)
    cidade:                    Mapped[str | None]   = mapped_column(String,  nullable=True)
    estado:                    Mapped[str | None]   = mapped_column(String,  nullable=True)
    origem:                    Mapped[str | None]   = mapped_column(String,  nullable=True)
    total_pedidos:             Mapped[float | None] = mapped_column(Float,   nullable=True)
    total_produtos_distintos:  Mapped[float | None] = mapped_column(Float,   nullable=True)
    receita_total:             Mapped[float | None] = mapped_column(Float,   nullable=True)
    ticket_medio:              Mapped[float | None] = mapped_column(Float,   nullable=True)
    data_primeiro_pedido:      Mapped[str | None]   = mapped_column(String,  nullable=True)
    data_ultimo_pedido:        Mapped[str | None]   = mapped_column(String,  nullable=True)
    metodo_pagamento_favorito: Mapped[str | None]   = mapped_column(String,  nullable=True)
    total_tickets:             Mapped[float | None] = mapped_column(Float,   nullable=True)
    taxa_resolucao:            Mapped[float | None] = mapped_column(Float,   nullable=True)
    nota_media_atendimento:    Mapped[float | None] = mapped_column(Float,   nullable=True)
    nota_nps_media:            Mapped[float | None] = mapped_column(Float,   nullable=True)
    nota_produto_media:        Mapped[float | None] = mapped_column(Float,   nullable=True)
    categoria_nps_recente:     Mapped[str | None]   = mapped_column(String,  nullable=True)
    segmento_cliente:          Mapped[str | None]   = mapped_column(String,  nullable=True)
    timestamp_ingestion:       Mapped[str | None]   = mapped_column(String,  nullable=True)
