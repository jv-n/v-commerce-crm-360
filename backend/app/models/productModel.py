from datetime import datetime

from sqlalchemy import String, Float, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class GoldProdutoDetalhado(Base):
    __tablename__ = "gold_produtos_detalhado"

    id_produto: Mapped[str] = mapped_column(String, primary_key=True)
    nome_produto: Mapped[str] = mapped_column(String)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    preco: Mapped[float | None] = mapped_column(Float, nullable=True)
    fornecedor: Mapped[str | None] = mapped_column(String, nullable=True)
    peso_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    estoque_disponivel: Mapped[float | None] = mapped_column(Float, nullable=True)
    ativo: Mapped[str | None] = mapped_column(String, nullable=True)
    data_cadastro_produto: Mapped[str | None] = mapped_column(String, nullable=True)
    avaliacao_media: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp_ingestion: Mapped[str | None] = mapped_column(String, nullable=True)


class GoldDesempenhoProduto(Base):
    __tablename__ = "gold_desempenho_produto"

    id_produto: Mapped[str] = mapped_column(String, primary_key=True)
    nome_produto: Mapped[str | None] = mapped_column(String, nullable=True)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    preco: Mapped[float | None] = mapped_column(Float, nullable=True)
    fornecedor: Mapped[str | None] = mapped_column(String, nullable=True)
    estoque_disponivel: Mapped[float | None] = mapped_column(Float, nullable=True)
    ativo: Mapped[str | None] = mapped_column(String, nullable=True)
    peso_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    data_cadastro_produto: Mapped[str | None] = mapped_column(String, nullable=True)
    nota_media_avaliacao: Mapped[float | None] = mapped_column(Float, nullable=True)
    qtd_vendida: Mapped[float | None] = mapped_column(Float, nullable=True)
    receita_total: Mapped[float | None] = mapped_column(Float, nullable=True)
    ticket_medio: Mapped[float | None] = mapped_column(Float, nullable=True)
    qtd_avaliacoes: Mapped[float | None] = mapped_column(Float, nullable=True)
    nota_nps_media: Mapped[float | None] = mapped_column(Float, nullable=True)
    qtd_tickets_gerados: Mapped[float | None] = mapped_column(Float, nullable=True)
    tipo_problema_mais_frequente: Mapped[str | None] = mapped_column(String, nullable=True)
    ratio_ticket_por_venda: Mapped[float | None] = mapped_column(Float, nullable=True)


class GoldEngajamentoProdutoDigital(Base):
    __tablename__ = "gold_engajamento_produto_digital"

    id_produto: Mapped[str] = mapped_column(String, primary_key=True)
    nome_produto: Mapped[str | None] = mapped_column(String, nullable=True)
    categoria: Mapped[str | None] = mapped_column(String, nullable=True)
    preco: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_visualizacoes: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_adicionados_carrinho: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_compras: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_abandonos_carrinho: Mapped[float | None] = mapped_column(Float, nullable=True)
    taxa_abandono: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp_ingestion: Mapped[str | None] = mapped_column(String, nullable=True)


class ProductActivity(Base):
    __tablename__ = "ft_product_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_produto: Mapped[str] = mapped_column(String, nullable=False, index=True)
    user_name: Mapped[str] = mapped_column(String(255), nullable=False)
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[str | None] = mapped_column(String, nullable=True)
    new_value: Mapped[str | None] = mapped_column(String, nullable=True)
    change_method: Mapped[str] = mapped_column(String(100), nullable=False, default="Edição direta")
    changed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
