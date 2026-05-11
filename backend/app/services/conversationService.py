"""
conversationService.py
----------------------
Lógica de negócio para persistência do histórico de conversas do agente V.IA.
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.conversationModel import Conversation
from app.schemas.conversationSchemas import (
    ConversationCreate,
    ConversationDetail,
    ConversationSummary,
)


def _to_summary(conv: Conversation) -> ConversationSummary:
    messages = conv.get_messages()
    return ConversationSummary(
        id=conv.id,
        session_id=conv.session_id,
        title=conv.title,
        message_count=len(messages),
        started_at=conv.started_at,
        ended_at=conv.ended_at,
    )


def _to_detail(conv: Conversation) -> ConversationDetail:
    messages = conv.get_messages()
    return ConversationDetail(
        id=conv.id,
        session_id=conv.session_id,
        title=conv.title,
        message_count=len(messages),
        started_at=conv.started_at,
        ended_at=conv.ended_at,
        messages=[
            {
                "role": m.get("role", "user"),
                "content": m.get("content", ""),
                "sources": m.get("sources", []),
                "queries": m.get("queries", []),
            }
            for m in messages
        ],
    )


def save_conversation(db: Session, payload: ConversationCreate) -> ConversationSummary:
    """Persiste uma conversa encerrada no banco."""
    conv = Conversation(
        session_id=payload.session_id,
        title=payload.title,
        started_at=payload.started_at,
        ended_at=datetime.now(timezone.utc),
    )
    conv.set_messages([m.model_dump() for m in payload.messages])

    db.add(conv)
    db.commit()
    db.refresh(conv)
    return _to_summary(conv)


def list_conversations(
    db: Session,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[ConversationSummary], int]:
    """Retorna conversas mais recentes primeiro, com total para paginação."""
    total = db.query(Conversation).count()
    rows = (
        db.query(Conversation)
        .order_by(Conversation.ended_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_to_summary(r) for r in rows], total


def get_conversation(db: Session, conversation_id: int) -> ConversationDetail | None:
    """Retorna uma conversa com todas as mensagens, ou None se não existir."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        return None
    return _to_detail(conv)


def delete_conversation(db: Session, conversation_id: int) -> bool:
    """Remove uma conversa. Retorna True se deletou, False se não encontrou."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        return False
    db.delete(conv)
    db.commit()
    return True
