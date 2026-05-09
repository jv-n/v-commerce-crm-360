from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from fastapi import HTTPException
from uuid import uuid4

from app.models.ticketModel import FtTicketSuporte
from app.schemas.ticketSchemas import (
    TicketCreate,
    TicketOut,
    TicketUpdate,
    TicketsPageOut,
)


class TicketService:
    @staticmethod
    def get_tickets(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: str = "",
        responsible: str = "",
        problem: str = "",
        resolved: str = "",
    ) -> TicketsPageOut:
        query = db.query(FtTicketSuporte)

        if search:
            like = f"%{search}%"
            query = query.filter(
                or_(
                    FtTicketSuporte.ticket_id.ilike(like),
                    FtTicketSuporte.id_cliente.ilike(like),
                    FtTicketSuporte.id_pedido.ilike(like),
                    FtTicketSuporte.tipo_problema.ilike(like),
                    FtTicketSuporte.agente_suporte.ilike(like),
                    FtTicketSuporte.dia_semana_abertura.ilike(like),
                )
            )

        if responsible:
            query = query.filter(FtTicketSuporte.agente_suporte == responsible)

        if problem:
            query = query.filter(FtTicketSuporte.tipo_problema == problem)

        if resolved:
            query = query.filter(func.lower(FtTicketSuporte.resolvido) == resolved.lower())

        total = query.with_entities(func.count(FtTicketSuporte.ticket_id)).scalar() or 0

        rows = (
            query
            .order_by(FtTicketSuporte.data_abertura.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return TicketsPageOut(
            data=[TicketOut.model_validate(row) for row in rows],
            total=total,
            page=page,
            pageSize=page_size,
        )

    @staticmethod
    def get_ticket(db: Session, ticket_id: str) -> TicketOut:
        row = db.get(FtTicketSuporte, ticket_id)

        if not row:
            raise HTTPException(status_code=404, detail="Ticket não encontrado")

        return TicketOut.model_validate(row)

    @staticmethod
    def create_ticket(db: Session, ticket_in: TicketCreate) -> TicketOut:
        row = FtTicketSuporte(
            ticket_id=str(uuid4()),
            **ticket_in.model_dump()
        )

        db.add(row)
        db.commit()
        db.refresh(row)
        return TicketOut.model_validate(row)

    @staticmethod
    def update_ticket(
        db: Session,
        ticket_id: str,
        ticket_in: TicketUpdate,
    ) -> TicketOut:
        row = db.get(FtTicketSuporte, ticket_id)

        if not row:
            raise HTTPException(status_code=404, detail="Ticket não encontrado")

        for field, value in ticket_in.model_dump(exclude_unset=True).items():
            setattr(row, field, value)

        db.commit()
        db.refresh(row)

        return TicketOut.model_validate(row)

    @staticmethod
    def delete_ticket(db: Session, ticket_id: str) -> None:
        row = db.get(FtTicketSuporte, ticket_id)

        if not row:
            raise HTTPException(status_code=404, detail="Ticket não encontrado")

        db.delete(row)
        db.commit()