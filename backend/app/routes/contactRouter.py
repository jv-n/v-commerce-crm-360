from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.schemas.contactSchemas import ContactsPageOut, ContactOut, ContactCreate, ContactUpdate
from app.services.contactService import ContactService
from database.database import get_db

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.post("/", response_model=ContactOut, status_code=201)
def create_contact(body: ContactCreate, db: Session = Depends(get_db)):
    return ContactService.create_contact(db, body)


@router.put("/{contact_id}", response_model=ContactOut)
def update_contact(contact_id: str, body: ContactUpdate, db: Session = Depends(get_db)):
    result = ContactService.update_contact(db, contact_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Contact not found")
    return result


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
    sort_by: str = Query(""),
    sort_dir: str = Query("asc"),
    exclude_inactive: bool = Query(True),
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
        sort_by=sort_by,
        sort_dir=sort_dir,
        exclude_inactive=exclude_inactive,
    )
