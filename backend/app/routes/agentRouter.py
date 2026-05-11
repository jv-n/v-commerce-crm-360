"""
agentRouter.py
--------------
Endpoints FastAPI do Agente de IA V-Commerce CRM 360.

Endpoints:
  GET  /agent/suggestions          → Perguntas sugeridas ao iniciar o chat
  POST /agent/chat                 → Enviar mensagem e receber resposta
  DELETE /agent/session/{id}       → Limpar histórico de uma sessão
"""

import os
import sys
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

# ── Adiciona o diretório ai-agent ao path para importação ─────────────────────
_AGENT_DIR = Path(__file__).resolve().parents[3] / "ai-agent"
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from agent import chat, clear_session_history, get_agent  # noqa: E402
from database_tools import DatabaseTools  # noqa: E402
from prompts import SUGGESTED_QUESTIONS  # noqa: E402

from app.schemas.agentSchemas import (  # noqa: E402
    ChatRequest,
    ChatResponse,
    ClearSessionResponse,
    SuggestionsResponse,
)

router = APIRouter(prefix="/agent", tags=["agent"])

# Caminho do banco resolvido a partir da localização deste arquivo:
# No Docker : /app/app/routes/agentRouter.py → parents[2] = /app → /app/database/vcommerce.db
# Localmente: backend/app/routes/agentRouter.py → parents[2] = backend/ → backend/database/vcommerce.db
_DB_PATH = Path(__file__).resolve().parents[2] / "database" / "vcommerce.db"

# Instância compartilhada do DatabaseTools
_db: DatabaseTools | None = None


def _get_db() -> DatabaseTools:
    """Retorna a instância singleton do DatabaseTools."""
    global _db
    if _db is None:
        _db = DatabaseTools(db_path=_DB_PATH)
    return _db


def _check_api_key() -> None:
    """Verifica se a chave da API Gemini está configurada."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "sua-chave-aqui":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "GEMINI_API_KEY não configurada. "
                "Adicione sua chave da API do Google AI Studio no arquivo .env."
            ),
        )


# ─────────────────────────────────────────────────────────────────────────────
# GET /agent/suggestions
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/suggestions",
    response_model=SuggestionsResponse,
    summary="Perguntas sugeridas",
    description=(
        "Retorna uma lista de perguntas relevantes para orientar o usuário "
        "ao iniciar uma conversa com o agente."
    ),
)
async def get_suggestions() -> SuggestionsResponse:
    return SuggestionsResponse(suggestions=SUGGESTED_QUESTIONS)


# ─────────────────────────────────────────────────────────────────────────────
# POST /agent/chat
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Conversar com o agente",
    description=(
        "Envia uma mensagem em linguagem natural ao agente de IA e recebe "
        "uma resposta fundamentada nos dados do CRM V-Commerce. "
        "Inclua o mesmo `session_id` em todas as requisições de uma conversa "
        "para que o agente mantenha o contexto."
    ),
)
async def chat_with_agent(body: ChatRequest) -> ChatResponse:
    _check_api_key()

    try:
        result = await chat(
            message=body.message,
            session_id=body.session_id,
            db=_get_db(),
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Banco de dados não encontrado. "
                "Execute 'python backend/database/seed.py' para populá-lo."
            ),
        )
    except Exception as exc:
        # Loga o erro internamente e retorna mensagem genérica
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno do agente: {str(exc)}",
        )

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        queries=result["queries"],
        session_id=result["session_id"],
    )


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /agent/session/{session_id}
# ─────────────────────────────────────────────────────────────────────────────

@router.delete(
    "/session/{session_id}",
    response_model=ClearSessionResponse,
    summary="Limpar histórico da sessão",
    description="Remove o histórico de conversa de uma sessão, iniciando uma nova conversa do zero.",
)
async def clear_session(session_id: str) -> ClearSessionResponse:
    clear_session_history(session_id)
    return ClearSessionResponse(
        message="Histórico da sessão removido com sucesso.",
        session_id=session_id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /agent/health
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/health",
    summary="Status do agente",
    description="Verifica se o agente está configurado e o banco acessível.",
)
async def agent_health() -> dict:
    db_ok = _get_db().db_path.exists()
    api_key_ok = bool(os.getenv("GEMINI_API_KEY", ""))

    return {
        "agent": "V.AI — V-Commerce CRM 360",
        "model": "gemini-2.5-flash",
        "database": "ok" if db_ok else "banco não encontrado",
        "api_key": "configurada" if api_key_ok else "não configurada",
        "status": "ok" if (db_ok and api_key_ok) else "degradado",
    }
