from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.contactSchemas import ContactsPageOut
from app.services.contactService import ContactService
from database.database import get_db

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("/", response_model=ContactsPageOut)
def get_contacts(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    tab: str = Query("all"),
    search: str = Query(""),
    status: str = Query(""),
    purchases_min: int | None = Query(None, ge=0),
    purchases_max: int | None = Query(None, ge=0),
    created_year: str = Query(""),
    engagement: str = Query(""),
    db: Session = Depends(get_db),
):
    return ContactService.get_contacts(
        db,
        page=page,
        page_size=pageSize,
        tab=tab,
        search=search,
        status=status,
        purchases_min=purchases_min,
        purchases_max=purchases_max,
        created_year=created_year,
        engagement=engagement,
    )
