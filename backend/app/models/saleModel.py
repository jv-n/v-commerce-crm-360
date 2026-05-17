from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class GoldPedidoDetalhado(Base):
    __tablename__ = "gold_pedidos_detalhado"

    id_pedido: Mapped[str] = mapped_column(String, primary_key=True)
    id_cliente: Mapped[str | None] = mapped_column(String, nullable=True)
    nome_cliente: Mapped[str | None] = mapped_column("nome_completo", String, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    telefone: Mapped[str | None] = mapped_column(String, nullable=True)
    id_produto: Mapped[str | None] = mapped_column(String, nullable=True)
    nome_produto: Mapped[str | None] = mapped_column(String, nullable=True)
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


class SaleActivity(Base):
    __tablename__ = "ft_sale_activities"

    id:            Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_pedido:     Mapped[str]      = mapped_column(String, nullable=False, index=True)
    user_name:     Mapped[str]      = mapped_column(String(255), nullable=False)
    field_name:    Mapped[str]      = mapped_column(String(100), nullable=False)
    old_value:     Mapped[str|None] = mapped_column(String, nullable=True)
    new_value:     Mapped[str|None] = mapped_column(String, nullable=True)
    change_method: Mapped[str]      = mapped_column(String(100), nullable=False, default="Edição direta")
    changed_at:    Mapped[datetime] = mapped_column(DateTime, nullable=False)
