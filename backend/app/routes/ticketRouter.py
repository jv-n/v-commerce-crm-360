from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.ticketSchemas import (
    TicketCreate,
    TicketOut,
    TicketUpdate,
    TicketsPageOut,
)
from app.services.ticketService import TicketService
from database.database import get_db

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("/", response_model=TicketsPageOut)
def get_tickets(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    responsible: Annotated[list[str] | None, Query()] = None,
    problem: Annotated[list[str] | None, Query()] = None,
    resolved: str = Query(""),
    status: Annotated[list[str] | None, Query()] = None,
    score: Annotated[list[str] | None, Query()] = None,
    openedFrom: str = Query(""),
    openedTo: str = Query(""),
    db: Session = Depends(get_db),
):
    return TicketService.get_tickets(
        db,
        page=page,
        page_size=pageSize,
        search=search,
        responsible=responsible,
        problem=problem,
        resolved=resolved,
        status=status,
        score=score,
        opened_from=openedFrom,
        opened_to=openedTo,
    )


@router.get("/responsibles", response_model=list[str])
def get_ticket_responsibles(db: Session = Depends(get_db)):
    return TicketService.get_responsibles(db)


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    return TicketService.get_ticket(db, ticket_id)


@router.post("/", response_model=TicketOut, status_code=201)
def create_ticket(ticket_in: TicketCreate, db: Session = Depends(get_db)):
    return TicketService.create_ticket(db, ticket_in)


@router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: str,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
):
    return TicketService.update_ticket(db, ticket_id, ticket_in)


@router.delete("/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: str, db: Session = Depends(get_db)):
    TicketService.delete_ticket(db, ticket_id)