from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class GoldPedidoDetalhado(Base):
    __tablename__ = "gold_pedidos_detalhado"

    id_pedido: Mapped[str] = mapped_column(String, primary_key=True)
    id_cliente: Mapped[str | None] = mapped_column(String, nullable=True)
    id_produto: Mapped[str | None] = mapped_column(String, nullable=True)
    nome_produto: Mapped[str | None] = mapped_column(String, nullable=True)
    nome_cliente: Mapped[str | None] = mapped_column(String, nullable=True)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    ativo: Mapped[int | None] = mapped_column(Integer, nullable=True)
    data_pedido: Mapped[str | None] = mapped_column(String, nullable=True)
    ano_mes: Mapped[str | None] = mapped_column(String, nullable=True)
    metodo_pagamento: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str | None] = mapped_column(String, nullable=True)
    quantidade: Mapped[float | None] = mapped_column(Float, nullable=True)
    valor_pedido: Mapped[float | None] = mapped_column(Float, nullable=True)
    receita_bruta: Mapped[float | None] = mapped_column(Float, nullable=True)
    valor_reembolsado: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp_ingestion: Mapped[str | None] = mapped_column(String, nullable=True)
