"""
conversationModel.py
--------------------
Model SQLAlchemy para persistência do histórico de conversas do agente V.IA.

Cada registro representa uma conversa encerrada, armazenando:
- Metadados (id, session_id, título, timestamps)
- Mensagens serializadas como JSON no campo `messages_json`
"""

import json
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base


class Conversation(Base):
    __tablename__ = "agent_conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # ID da sessão do agente (usado para correlacionar com o histórico PydanticAI)
    session_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)

    # Primeiro texto do usuário, truncado — usado como título na listagem
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    # Mensagens serializadas em JSON: lista de {role, content, sources?, queries?}
    messages_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")

    # Timestamps em UTC
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    ended_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # ── Helpers ──────────────────────────────────────────────────────────────

    def get_messages(self) -> list[dict]:
        """Desserializa e retorna a lista de mensagens."""
        try:
            return json.loads(self.messages_json)
        except (json.JSONDecodeError, TypeError):
            return []

    def set_messages(self, messages: list[dict]) -> None:
        """Serializa e armazena a lista de mensagens."""
        self.messages_json = json.dumps(messages, ensure_ascii=False)
