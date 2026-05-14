from datetime import date
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import and_, bindparam, func, or_, text
from sqlalchemy.orm import Session

from app.models.ticketModel import FtTicketSuporte
from app.schemas.ticketSchemas import (
    TicketCreate,
    TicketOut,
    TicketUpdate,
    TicketsPageOut,
)


class TicketService:
    @staticmethod
    def _get_client_names_by_ids(db: Session, client_ids: list[str]) -> dict[str, str]:
        if not client_ids:
            return {}

        rows = db.execute(
            text("""
                SELECT id_cliente, nome_completo
                FROM dim_clientes
                WHERE id_cliente IN :client_ids
            """).bindparams(bindparam("client_ids", expanding=True)),
            {"client_ids": client_ids},
        ).fetchall()

        return {
            row[0]: row[1]
            for row in rows
            if row[0] and row[1]
        }

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
    def _build_ticket_out(
        ticket: FtTicketSuporte,
        client_names: dict[str, str] | None = None,
    ) -> TicketOut:
        client_names = client_names or {}

        return TicketOut(
            ticket_id=ticket.ticket_id,
            id_cliente=ticket.id_cliente,
            nome_cliente=client_names.get(ticket.id_cliente) if ticket.id_cliente else None,
            id_pedido=ticket.id_pedido,
            tipo_problema=ticket.tipo_problema,
            data_abertura=ticket.data_abertura,
            data_resolucao=ticket.data_resolucao,
            tempo_resolucao_minutos=ticket.tempo_resolucao_minutos,
            tempo_resolucao_horas=ticket.tempo_resolucao_horas,
            agente_suporte=ticket.agente_suporte,
            nota_avaliacao=ticket.nota_avaliacao,
            resolvido=ticket.resolvido,
            hora_abertura=ticket.hora_abertura,
            dia_semana_abertura=ticket.dia_semana_abertura,
        )

    @staticmethod
    def get_tickets(
        db: Session,
        page: int = 1,
        page_size: int = 20,
        search: str = "",
        responsible: list[str] | None = None,
        problem: list[str] | None = None,
        resolved: str = "",
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

        if opened_from:
            query = query.filter(
                func.date(FtTicketSuporte.data_abertura) >= opened_from
            )

        if opened_to:
            query = query.filter(
                func.date(FtTicketSuporte.data_abertura) <= opened_to
            )

        if responsible:
            query = query.filter(FtTicketSuporte.agente_suporte.in_(responsible))

        if problem:
            query = query.filter(FtTicketSuporte.tipo_problema.in_(problem))

        if status:
            status_filters = []

            for item in status:
                normalized_status = item.strip().lower()

                if normalized_status == "finalizado":
                    status_filters.append(
                        func.lower(FtTicketSuporte.resolvido) == "true"
                    )

                elif normalized_status == "em atendimento":
                    status_filters.append(
                        and_(
                            func.lower(FtTicketSuporte.resolvido) == "false",
                            FtTicketSuporte.agente_suporte.is_not(None),
                            func.trim(FtTicketSuporte.agente_suporte) != "",
                        )
                    )

                elif normalized_status == "aguardando":
                    status_filters.append(
                        and_(
                            func.lower(FtTicketSuporte.resolvido) == "false",
                            or_(
                                FtTicketSuporte.agente_suporte.is_(None),
                                func.trim(FtTicketSuporte.agente_suporte) == "",
                            ),
                        )
                    )

                else:
                    raise HTTPException(status_code=400, detail="Status inválido")

            query = query.filter(or_(*status_filters))

        elif resolved:
            query = query.filter(
                func.lower(FtTicketSuporte.resolvido) == resolved.lower()
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
                    score_filters.append(FtTicketSuporte.nota_avaliacao.is_(None))
                else:
                    try:
                        score_value = float(normalized_score)
                    except ValueError:
                        raise HTTPException(status_code=400, detail="Nota inválida")

                    score_filters.append(FtTicketSuporte.nota_avaliacao == score_value)

            query = query.filter(or_(*score_filters))

        total = query.with_entities(func.count(FtTicketSuporte.ticket_id)).scalar() or 0

        rows = (
            query
            .order_by(FtTicketSuporte.data_abertura.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        client_ids = list({
            ticket.id_cliente
            for ticket in rows
            if ticket.id_cliente
        })

        client_names = TicketService._get_client_names_by_ids(db, client_ids)

        return TicketsPageOut(
            data=[
                TicketService._build_ticket_out(ticket, client_names)
                for ticket in rows
            ],
            total=total,
            page=page,
            pageSize=page_size,
        )

    @staticmethod
    def get_responsibles(db: Session) -> list[str]:
        rows = db.execute(
            text("""
                SELECT agente_suporte
                FROM dim_agentes_suporte
                WHERE agente_suporte IS NOT NULL
                  AND TRIM(agente_suporte) <> ''
                ORDER BY agente_suporte ASC
            """)
        ).fetchall()

        return [row[0] for row in rows]

    @staticmethod
    def get_ticket(db: Session, ticket_id: str) -> TicketOut:
        row = db.get(FtTicketSuporte, ticket_id)

        if not row:
            raise HTTPException(status_code=404, detail="Ticket não encontrado")

        client_names = TicketService._get_client_names_by_ids(
            db,
            [row.id_cliente] if row.id_cliente else [],
        )

        return TicketService._build_ticket_out(row, client_names)

    @staticmethod
    def create_ticket(db: Session, ticket_in: TicketCreate) -> TicketOut:
        row = FtTicketSuporte(
            ticket_id=str(uuid4()),
            **ticket_in.model_dump()
        )

        db.add(row)
        db.commit()
        db.refresh(row)

        client_names = TicketService._get_client_names_by_ids(
            db,
            [row.id_cliente] if row.id_cliente else [],
        )

        return TicketService._build_ticket_out(row, client_names)

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

        client_names = TicketService._get_client_names_by_ids(
            db,
            [row.id_cliente] if row.id_cliente else [],
        )

        return TicketService._build_ticket_out(row, client_names)

    @staticmethod
    def delete_ticket(db: Session, ticket_id: str) -> None:
        row = db.get(FtTicketSuporte, ticket_id)

        if not row:
            raise HTTPException(status_code=404, detail="Ticket não encontrado")

        db.delete(row)
        db.commit()