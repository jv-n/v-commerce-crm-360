from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy.orm import Session

from app.schemas.salesSchemas import SaleOut, SaleCreate, SaleUpdate, SalesPageOut, SaleActivityOut
from app.services.saleService import SaleService
from database.database import get_db

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get("/", response_model=SalesPageOut)
def get_sales(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=500000),
    tab: str = Query("all"),
    status: str = Query(""),
    metodo_pagamento: str = Query(""),
    categoria: str = Query(""),
    ano_mes: str = Query("", description="Format: YYYY-MM"),
    data_from: str = Query("", description="Format: YYYY-MM-DD"),
    data_to: str = Query("", description="Format: YYYY-MM-DD"),
    search: str = Query(""),
    search_field: str = Query("all"),
    db: Session = Depends(get_db),
):
    return SaleService(db).get_sales(
        page=page,
        page_size=pageSize,
        tab=tab,
        status=status,
        metodo_pagamento=metodo_pagamento,
        categoria=categoria,
        ano_mes=ano_mes,
        data_from=data_from,
        data_to=data_to,
        search=search,
        search_field=search_field,
    )


@router.get("/{id_pedido}", response_model=SaleOut)
def get_sale(id_pedido: str, db: Session = Depends(get_db)):
    return SaleService(db).get_sale(id_pedido)


@router.post("/", response_model=SaleOut, status_code=201)
def create_sale(sale_in: SaleCreate, db: Session = Depends(get_db)):
    return SaleService(db).create_sale(sale_in)


@router.patch("/{id_pedido}", response_model=SaleOut)
def update_sale(
    id_pedido: str,
    sale_in: SaleUpdate,
    x_user_name: str = Header(default="Sistema", alias="X-User-Name"),
    db: Session = Depends(get_db),
):
    return SaleService(db).update_sale(id_pedido, sale_in, user_name=x_user_name)


@router.get("/{id_pedido}/activities", response_model=list[SaleActivityOut])
def get_sale_activities(
    id_pedido: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return SaleService(db).get_sale_activities(id_pedido, limit=limit)


@router.delete("/{id_pedido}", status_code=204)
def delete_sale(id_pedido: str, db: Session = Depends(get_db)):
    SaleService(db).delete_sale(id_pedido)
