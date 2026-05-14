from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class FtTicketSuporte(Base):
    __tablename__ = "ft_tickets_suporte"

    ticket_id: Mapped[str] = mapped_column(String, primary_key=True)
    id_cliente: Mapped[str | None] = mapped_column(String, nullable=True)
    id_pedido: Mapped[str | None] = mapped_column(String, nullable=True)
    tipo_problema: Mapped[str | None] = mapped_column(String, nullable=True)
    data_abertura: Mapped[str | None] = mapped_column(String, nullable=True)
    data_resolucao: Mapped[str | None] = mapped_column(String, nullable=True)
    tempo_resolucao_minutos: Mapped[float | None] = mapped_column(Float, nullable=True)
    tempo_resolucao_horas: Mapped[float | None] = mapped_column(Float, nullable=True)
    agente_suporte: Mapped[str | None] = mapped_column(String, nullable=True)
    nota_avaliacao: Mapped[float | None] = mapped_column(Float, nullable=True)
    resolvido: Mapped[str | None] = mapped_column(String, nullable=True)
    hora_abertura: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dia_semana_abertura: Mapped[str | None] = mapped_column(String, nullable=True)
    timestamp_ingestion: Mapped[str | None] = mapped_column(String, nullable=True)