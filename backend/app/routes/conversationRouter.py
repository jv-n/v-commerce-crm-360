"""
conversationRouter.py
---------------------
Endpoints FastAPI para gerenciamento do histórico de conversas do agente V.IA.

Endpoints:
  GET    /conversations            → Lista conversas salvas (mais recentes primeiro)
  POST   /conversations            → Salva uma conversa encerrada
  GET    /conversations/{id}       → Retorna conversa completa com mensagens
  DELETE /conversations/{id}       → Remove uma conversa do histórico
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.schemas.conversationSchemas import (
    ConversationCreate,
    ConversationDeleteResponse,
    ConversationDetail,
    ConversationListResponse,
    ConversationSummary,
)
from app.services.conversationService import (
    delete_conversation,
    get_conversation,
    list_conversations,
    save_conversation,
)
from database.database import get_db

router = APIRouter(prefix="/conversations", tags=["conversations"])


# ─────────────────────────────────────────────────────────────────────────────
# GET /conversations
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=ConversationListResponse,
    summary="Listar histórico de conversas",
    description="Retorna as conversas encerradas, ordenadas da mais recente para a mais antiga.",
)
def list_conversations_endpoint(
    skip: int = Query(0, ge=0, description="Offset para paginação"),
    limit: int = Query(50, ge=1, le=200, description="Máximo de conversas retornadas"),
    db: Session = Depends(get_db),
) -> ConversationListResponse:
    conversations, total = list_conversations(db, skip=skip, limit=limit)
    return ConversationListResponse(conversations=conversations, total=total)


# ─────────────────────────────────────────────────────────────────────────────
# POST /conversations
# ─────────────────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=ConversationSummary,
    status_code=status.HTTP_201_CREATED,
    summary="Salvar conversa",
    description="Persiste uma conversa encerrada no banco de dados.",
)
def save_conversation_endpoint(
    body: ConversationCreate,
    db: Session = Depends(get_db),
) -> ConversationSummary:
    return save_conversation(db, body)


# ─────────────────────────────────────────────────────────────────────────────
# GET /conversations/{id}
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/{conversation_id}",
    response_model=ConversationDetail,
    summary="Detalhe de uma conversa",
    description="Retorna todos os dados de uma conversa, incluindo todas as mensagens.",
)
def get_conversation_endpoint(
    conversation_id: int,
    db: Session = Depends(get_db),
) -> ConversationDetail:
    conv = get_conversation(db, conversation_id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversa {conversation_id} não encontrada.",
        )
    return conv


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /conversations/{id}
# ─────────────────────────────────────────────────────────────────────────────

@router.delete(
    "/{conversation_id}",
    response_model=ConversationDeleteResponse,
    summary="Remover conversa",
    description="Remove permanentemente uma conversa do histórico.",
)
def delete_conversation_endpoint(
    conversation_id: int,
    db: Session = Depends(get_db),
) -> ConversationDeleteResponse:
    deleted = delete_conversation(db, conversation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversa {conversation_id} não encontrada.",
        )
    return ConversationDeleteResponse(
        message="Conversa removida com sucesso.",
        id=conversation_id,
    )
