from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class GoldTicket360(Base):
    __tablename__ = "gold_tickets_360"

    ticket_id: Mapped[str] = mapped_column(String, primary_key=True)

    id_cliente: Mapped[str | None] = mapped_column(String, nullable=True)
    status_atendimento: Mapped[str | None] = mapped_column(String, nullable=True)
    tipo_problema: Mapped[str | None] = mapped_column(String, nullable=True)
    data_abertura: Mapped[str | None] = mapped_column(String, nullable=True)
    hora_abertura: Mapped[str | None] = mapped_column(String, nullable=True)
    agente_suporte: Mapped[str | None] = mapped_column(String, nullable=True)
    nome_cliente: Mapped[str | None] = mapped_column(String, nullable=True)
    regiao_cliente: Mapped[str | None] = mapped_column(String, nullable=True)
    estado_cliente: Mapped[str | None] = mapped_column(String, nullable=True)
    faixa_etaria: Mapped[str | None] = mapped_column(String, nullable=True)
    id_pedido: Mapped[str | None] = mapped_column(String, nullable=True)
    tempo_resolucao_horas: Mapped[float | None] = mapped_column(Float, nullable=True)
    nota_avaliacao: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp_ingestion: Mapped[str | None] = mapped_column(String, nullable=True)


FtTicketSuporte = GoldTicket360