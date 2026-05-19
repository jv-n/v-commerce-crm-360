from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from app.schemas.contactDetailSchemas import (
    ContactDashboardOut,
    ContactDetailOut,
    ContactDetailPatchIn,
    ContactMetricsOut,
    ContactOrdersPageOut,
    ContactTicketsPageOut,
    ContactViewedProductOut,
)
from app.services.contactDetailService import ContactDetailService
from database.database import get_db


router = APIRouter(prefix="/contact-details", tags=["contact-details"])


@router.get("/{contact_id}/details", response_model=ContactDetailOut)
def get_contact_details(
    contact_id: str,
    db: Session = Depends(get_db),
):
    result = ContactDetailService(db).get_contact_details(contact_id)

    if not result:
        raise HTTPException(status_code=404, detail="Contact not found")

    return result


@router.patch("/{contact_id}/details", response_model=ContactDetailOut)
def patch_contact_details(
    contact_id: str,
    payload: ContactDetailPatchIn,
    db: Session = Depends(get_db),
    x_user_name: str = Header(default="Sistema", alias="X-User-Name"),
):
    result = ContactDetailService(db).patch_contact_details(
        contact_id=contact_id,
        payload=payload,
        user_name=x_user_name,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Contact not found")

    return result


@router.get("/{contact_id}/dashboard", response_model=ContactDashboardOut)
def get_contact_dashboard(
    contact_id: str,
    period: str = Query("current_month"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(5, ge=1, le=500),
    db: Session = Depends(get_db),
):
    result = ContactDetailService(db).get_contact_dashboard(
        contact_id=contact_id,
        period=period,
        page=page,
        page_size=pageSize,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Contact not found")

    return result


@router.get("/{contact_id}/metrics", response_model=ContactMetricsOut)
def get_contact_metrics(
    contact_id: str,
    period: str = Query("current_month"),
    db: Session = Depends(get_db),
):
    result = ContactDetailService(db).get_contact_metrics(
        contact_id=contact_id,
        period=period,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Contact not found")

    return result


@router.get("/{contact_id}/orders", response_model=ContactOrdersPageOut)
def get_contact_orders(
    contact_id: str,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=500),
    period: str = Query("current_month"),
    db: Session = Depends(get_db),
):
    result = ContactDetailService(db).get_contact_orders(
        contact_id=contact_id,
        page=page,
        page_size=pageSize,
        period=period,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Contact not found")

    return result


@router.get("/{contact_id}/tickets", response_model=ContactTicketsPageOut)
def get_contact_tickets(
    contact_id: str,
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=500),
    period: str = Query("current_month"),
    db: Session = Depends(get_db),
):
    result = ContactDetailService(db).get_contact_tickets(
        contact_id=contact_id,
        page=page,
        page_size=pageSize,
        period=period,
    )

    if not result:
        raise HTTPException(status_code=404, detail="Contact not found")

    return result


@router.get(
    "/{contact_id}/viewed-products",
    response_model=list[ContactViewedProductOut],
)
def get_contact_viewed_products(
    contact_id: str,
    period: str = Query("current_month"),
    db: Session = Depends(get_db),
):
    result = ContactDetailService(db).get_contact_viewed_products(
        contact_id=contact_id,
        period=period,
    )

    if result is None:
        raise HTTPException(status_code=404, detail="Contact not found")

    return result

@router.delete("/{contact_id}/details")
def delete_contact_details(
    contact_id: str,
    db: Session = Depends(get_db),
):
    deleted = ContactDetailService(db).delete_contact_details(contact_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Contact not found")

    return {"message": "Contact deleted successfully"}