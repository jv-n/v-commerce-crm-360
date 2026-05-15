from datetime import date
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.ticketModel import GoldTicket360
from app.schemas.ticketSchemas import (
    TicketCreate,
    TicketOut,
    TicketUpdate,
    TicketsPageOut,
)


class TicketService:
    @staticmethod
    def _validate_iso_date(value: str, field_name: str) -> str:
        if not value:
            return ""

        try:
            date.fromisoformat(value)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Data inválida para {field_name}. Use o formato yyyy-mm-dd.",
            )

        return value

    @staticmethod
    def _status_to_resolvido(status_atendimento: str | None) -> str | None:
        if not status_atendimento:
            return None

        normalized_status = status_atendimento.strip().lower()

        if normalized_status == "finalizado":
            return "True"

        return "False"

    @staticmethod
    def _build_ticket_out(ticket: GoldTicket360) -> TicketOut:
        return TicketOut(
            ticket_id=ticket.ticket_id,
            id_cliente=ticket.id_cliente,
            status_atendimento=ticket.status_atendimento,
            tipo_problema=ticket.tipo_problema,
            data_abertura=ticket.data_abertura,
            hora_abertura=ticket.hora_abertura,
            agente_suporte=ticket.agente_suporte,
            nome_cliente=ticket.nome_cliente,
            regiao_cliente=ticket.regiao_cliente,
            estado_cliente=ticket.estado_cliente,
            faixa_etaria=ticket.faixa_etaria,
            id_pedido=ticket.id_pedido,
            tempo_resolucao_horas=ticket.tempo_resolucao_horas,
            nota_avaliacao=ticket.nota_avaliacao,
            timestamp_ingestion=ticket.timestamp_ingestion,
            resolvido=TicketService._status_to_resolvido(ticket.status_atendimento),
        )

    @staticmethod
    def get_tickets(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: str = "",
        responsible: list[str] | None = None,
        problem: list[str] | None = None,
        status: list[str] | None = None,
        score: list[str] | None = None,
        opened_from: str = "",
        opened_to: str = "",
    ) -> TicketsPageOut:
        responsible = responsible or []
        problem = problem or []
        status = status or []
        score = score or []

        opened_from = TicketService._validate_iso_date(opened_from, "openedFrom")
        opened_to = TicketService._validate_iso_date(opened_to, "openedTo")

        query = db.query(GoldTicket360)

        if search:
            like = f"%{search}%"
            query = query.filter(
                or_(
                    GoldTicket360.ticket_id.ilike(like),
                    GoldTicket360.id_cliente.ilike(like),
                    GoldTicket360.id_pedido.ilike(like),
                    GoldTicket360.tipo_problema.ilike(like),
                    GoldTicket360.agente_suporte.ilike(like),
                    GoldTicket360.nome_cliente.ilike(like),
                    GoldTicket360.status_atendimento.ilike(like),
                    GoldTicket360.regiao_cliente.ilike(like),
                    GoldTicket360.estado_cliente.ilike(like),
                    GoldTicket360.faixa_etaria.ilike(like),
                )
            )

        if opened_from:
            query = query.filter(
                func.date(GoldTicket360.data_abertura) >= opened_from
            )

        if opened_to:
            query = query.filter(
                func.date(GoldTicket360.data_abertura) <= opened_to
            )

        if responsible:
            query = query.filter(GoldTicket360.agente_suporte.in_(responsible))

        if problem:
            query = query.filter(GoldTicket360.tipo_problema.in_(problem))

        if status:
            valid_statuses = {
                "finalizado",
                "em atendimento",
                "aguardando",
            }

            normalized_statuses = [
                item.strip().lower()
                for item in status
                if item and item.strip()
            ]

            invalid_statuses = [
                item for item in normalized_statuses if item not in valid_statuses
            ]

            if invalid_statuses:
                raise HTTPException(status_code=400, detail="Status inválido")

            query = query.filter(
                func.lower(GoldTicket360.status_atendimento).in_(normalized_statuses)
            )

        if score:
            score_filters = []

            for item in score:
                normalized_score = item.strip().lower()

                if normalized_score in {
                    "sem avaliação",
                    "sem_avaliação",
                    "sem_avaliacao",
                    "sem avaliacao",
                }:
                    score_filters.append(GoldTicket360.nota_avaliacao.is_(None))
                else:
                    try:
                        score_value = float(normalized_score)
                    except ValueError:
                        raise HTTPException(status_code=400, detail="Nota inválida")

                    score_filters.append(GoldTicket360.nota_avaliacao == score_value)

            query = query.filter(or_(*score_filters))

        total = query.with_entities(func.count(GoldTicket360.ticket_id)).scalar() or 0

        rows = (
            query
            .order_by(GoldTicket360.data_abertura.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return TicketsPageOut(
            data=[
                TicketService._build_ticket_out(ticket)
                for ticket in rows
            ],
            total=total,
            page=page,
            pageSize=page_size,
        )

    @staticmethod
    def get_responsibles(db: Session) -> list[str]:
        rows = (
            db.query(GoldTicket360.agente_suporte)
            .filter(GoldTicket360.agente_suporte.is_not(None))
            .filter(func.trim(GoldTicket360.agente_suporte) != "")
            .distinct()
            .order_by(GoldTicket360.agente_suporte.asc())
            .all()
        )

        return [row[0] for row in rows]

    @staticmethod
    def get_ticket(db: Session, ticket_id: str) -> TicketOut:
        row = db.get(GoldTicket360, ticket_id)

        if not row:
            raise HTTPException(status_code=404, detail="Ticket não encontrado")

        return TicketService._build_ticket_out(row)

    @staticmethod
    def create_ticket(db: Session, ticket_in: TicketCreate) -> TicketOut:
        row = GoldTicket360(
            ticket_id=str(uuid4()),
            **ticket_in.model_dump()
        )

        db.add(row)
        db.commit()
        db.refresh(row)

        return TicketService._build_ticket_out(row)

    @staticmethod
    def update_ticket(
        db: Session,
        ticket_id: str,
        ticket_in: TicketUpdate,
    ) -> TicketOut:
        row = db.get(GoldTicket360, ticket_id)

        if not row:
            raise HTTPException(status_code=404, detail="Ticket não encontrado")

        for field, value in ticket_in.model_dump(exclude_unset=True).items():
            setattr(row, field, value)

        db.commit()
        db.refresh(row)

        return TicketService._build_ticket_out(row)

    @staticmethod
    def delete_ticket(db: Session, ticket_id: str) -> None:
        row = db.get(GoldTicket360, ticket_id)

        if not row:
            raise HTTPException(status_code=404, detail="Ticket não encontrado")

        db.delete(row)
        db.commit()