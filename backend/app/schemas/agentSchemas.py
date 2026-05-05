"""
agentSchemas.py
---------------
Schemas Pydantic para os endpoints do Agente de IA.
"""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Payload recebido pelo endpoint POST /agent/chat"""

    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Pergunta em linguagem natural do usuário.",
        examples=["Quais foram os 5 produtos mais vendidos em 2024?"],
    )
    session_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description=(
            "ID único da sessão de conversa. "
            "Gerado pelo frontend e persistido para manter o histórico."
        ),
        examples=["user-abc123-session-001"],
    )


class ChatResponse(BaseModel):
    """Payload retornado pelo endpoint POST /agent/chat"""

    answer: str = Field(
        description="Resposta do agente em linguagem natural."
    )
    sources: list[str] = Field(
        default_factory=list,
        description="Tabelas do banco consultadas para gerar a resposta.",
        examples=[["gold_kpis_vendas_mensal", "gold_desempenho_produto"]],
    )
    queries: list[str] = Field(
        default_factory=list,
        description=(
            "Queries SQL executadas durante o processamento. "
            "Útil para analistas que querem auditar a fonte dos dados."
        ),
    )
    session_id: str = Field(
        description="ID da sessão — retornar nas próximas requisições para manter o contexto."
    )


class SuggestionsResponse(BaseModel):
    """Payload retornado pelo endpoint GET /agent/suggestions"""

    suggestions: list[str] = Field(
        description="Lista de perguntas sugeridas para iniciar a conversa com o agente."
    )


class ClearSessionResponse(BaseModel):
    """Payload retornado pelo endpoint DELETE /agent/session/{session_id}"""

    message: str
    session_id: str
