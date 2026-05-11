"""
conversationSchemas.py
----------------------
Schemas Pydantic para os endpoints de histórico de conversas do agente V.IA.
"""

from datetime import datetime

from pydantic import BaseModel, Field


# ── Mensagem individual ───────────────────────────────────────────────────────

class MessageSchema(BaseModel):
    role: str = Field(description="'user' ou 'assistant'")
    content: str = Field(description="Conteúdo da mensagem")
    sources: list[str] = Field(default_factory=list, description="Tabelas consultadas (apenas assistente)")
    queries: list[str] = Field(default_factory=list, description="Queries SQL executadas (apenas assistente)")


# ── Request ───────────────────────────────────────────────────────────────────

class ConversationCreate(BaseModel):
    """Payload enviado pelo frontend para salvar uma conversa encerrada."""

    session_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="ID da sessão do agente.",
    )
    title: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Título da conversa (normalmente o primeiro texto do usuário).",
    )
    messages: list[MessageSchema] = Field(
        default_factory=list,
        description="Lista completa de mensagens da conversa.",
    )
    started_at: datetime = Field(
        description="Timestamp de início da conversa (UTC).",
    )


# ── Responses ─────────────────────────────────────────────────────────────────

class ConversationSummary(BaseModel):
    """Dados resumidos — usados na listagem do histórico."""

    id: int
    session_id: str
    title: str
    message_count: int = Field(description="Total de mensagens na conversa.")
    started_at: datetime
    ended_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetail(ConversationSummary):
    """Dados completos — inclui todas as mensagens."""

    messages: list[MessageSchema]


class ConversationListResponse(BaseModel):
    conversations: list[ConversationSummary]
    total: int


class ConversationDeleteResponse(BaseModel):
    message: str
    id: int
