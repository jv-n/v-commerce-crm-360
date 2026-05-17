from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.schemas.contactDetailsSchemas import (
    ContactDetailsOut,
    ContactMetricsOut,
    ContactOrdersPageOut,
    ContactTicketsPageOut,
    ContactViewedProductOut,
)
from app.services.contactDetailsService import ContactDetailsService
from database.database import get_db

router = APIRouter(prefix="/contacts", tags=["contact-details"])


@router.get("/{contact_id}/details", response_model=ContactDetailsOut)
def get_contact_details(
    contact_id: str,
    db: Session = Depends(get_db),
):
    result = ContactDetailsService(db).get_contact_details(contact_id)

    if not result:
        raise HTTPException(status_code=404, detail="Contact not found")

    return result


@router.get("/{contact_id}/orders", response_model=ContactOrdersPageOut)
def get_contact_orders(
    contact_id: str,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=500),
    db: Session = Depends(get_db),
):
    result = ContactDetailsService(db).get_contact_orders(
        contact_id=contact_id,
        page=page,
        page_size=pageSize,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Contact not found")

    return result


@router.get("/{contact_id}/tickets", response_model=ContactTicketsPageOut)
def get_contact_tickets(
    contact_id: str,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=500),
    db: Session = Depends(get_db),
):
    result = ContactDetailsService(db).get_contact_tickets(
        contact_id=contact_id,
        page=page,
        page_size=pageSize,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Contact not found")

    return result


@router.get("/{contact_id}/metrics", response_model=ContactMetricsOut)
def get_contact_metrics(
    contact_id: str,
    ano_mes: str | None = Query(None),
    db: Session = Depends(get_db),
):
    result = ContactDetailsService(db).get_contact_metrics(
        contact_id=contact_id,
        ano_mes=ano_mes,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Contact not found")

    return result


@router.get("/{contact_id}/viewed-products", response_model=list[ContactViewedProductOut])
def get_contact_viewed_products(
    contact_id: str,
    db: Session = Depends(get_db),
):
    result = ContactDetailsService(db).get_contact_viewed_products(contact_id)

    if result is None:
        raise HTTPException(status_code=404, detail="Contact not found")

    return result