from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.schemas.contactSchemas import ContactsPageOut, ContactOut, ContactCreate, ContactUpdate
from app.services.contactService import ContactService
from database.database import get_db

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.post("/", response_model=ContactOut, status_code=201)
def create_contact(body: ContactCreate, db: Session = Depends(get_db)):
    return ContactService(db).create_contact(body)


@router.put("/{contact_id}", response_model=ContactOut)
def update_contact(contact_id: str, body: ContactUpdate, db: Session = Depends(get_db)):
    result = ContactService(db).update_contact(contact_id, body)
    if not result:
        raise HTTPException(status_code=404, detail="Contact not found")
    return result


@router.get("/", response_model=ContactsPageOut)
def get_contacts(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    tab: str = Query("all"),
    search: str = Query(""),
    purchases_min: int | None = Query(None, ge=0),
    purchases_max: int | None = Query(None, ge=0),
    created_year: str = Query(""),
    engagement: str = Query(""),
    client_status: list[str] = Query(default=[]),
    has_phone: bool = Query(False),
    sort_by: str = Query(""),
    sort_dir: str = Query("asc"),
    # advanced filters
    regioes: list[str] = Query(default=[]),
    origens: list[str] = Query(default=[]),
    pagamentos: list[str] = Query(default=[]),
    receita_min: float | None = Query(None),
    receita_max: float | None = Query(None),
    ticket_medio_min: float | None = Query(None),
    ticket_medio_max: float | None = Query(None),
    primeira_compra_from: str = Query(""),
    primeira_compra_to: str = Query(""),
    ultima_compra_from: str = Query(""),
    ultima_compra_to: str = Query(""),
    tickets_suporte_min: int | None = Query(None),
    tickets_suporte_max: int | None = Query(None),
    nota_atend_min: float | None = Query(None),
    nota_atend_max: float | None = Query(None),
    nps_min: float | None = Query(None),
    nps_max: float | None = Query(None),
    nota_prod_min: float | None = Query(None),
    nota_prod_max: float | None = Query(None),
    db: Session = Depends(get_db),
):
    return ContactService(db).get_contacts(
        page=page,
        page_size=pageSize,
        tab=tab,
        search=search,
        purchases_min=purchases_min,
        purchases_max=purchases_max,
        created_year=created_year,
        engagement=engagement,
        client_status=client_status,
        has_phone=has_phone,
        sort_by=sort_by,
        sort_dir=sort_dir,
        regioes=regioes,
        origens=origens,
        pagamentos=pagamentos,
        receita_min=receita_min,
        receita_max=receita_max,
        ticket_medio_min=ticket_medio_min,
        ticket_medio_max=ticket_medio_max,
        primeira_compra_from=primeira_compra_from,
        primeira_compra_to=primeira_compra_to,
        ultima_compra_from=ultima_compra_from,
        ultima_compra_to=ultima_compra_to,
        tickets_suporte_min=tickets_suporte_min,
        tickets_suporte_max=tickets_suporte_max,
        nota_atend_min=nota_atend_min,
        nota_atend_max=nota_atend_max,
        nps_min=nps_min,
        nps_max=nps_max,
        nota_prod_min=nota_prod_min,
        nota_prod_max=nota_prod_max,
    )
