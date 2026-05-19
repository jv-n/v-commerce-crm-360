from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class GoldSessaoResumo(Base):
    __tablename__ = "gold_sessao_resumo"

    id_sessao: Mapped[str] = mapped_column(String, primary_key=True)

    data_sessao: Mapped[str | None] = mapped_column(String, nullable=True)
    ano_mes: Mapped[str | None] = mapped_column(String, nullable=True)
    canal: Mapped[str | None] = mapped_column(String, nullable=True)
    dispositivo: Mapped[str | None] = mapped_column(String, nullable=True)
    origem_sessao: Mapped[str | None] = mapped_column(String, nullable=True)
    id_cliente: Mapped[str | None] = mapped_column(String, nullable=True)
    houve_conversao: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tempo_total_seg: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_eventos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timestamp_ingestion: Mapped[str | None] = mapped_column(String, nullable=True)
