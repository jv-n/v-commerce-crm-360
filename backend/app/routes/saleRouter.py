from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.schemas.salesSchemas import SaleOut, SaleCreate, SaleUpdate, SalesPageOut
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
    )


@router.get("/{id_pedido}", response_model=SaleOut)
def get_sale(id_pedido: str, db: Session = Depends(get_db)):
    return SaleService(db).get_sale(id_pedido)


@router.post("/", response_model=SaleOut, status_code=201)
def create_sale(sale_in: SaleCreate, db: Session = Depends(get_db)):
    return SaleService(db).create_sale(sale_in)


@router.patch("/{id_pedido}", response_model=SaleOut)
def update_sale(id_pedido: str, sale_in: SaleUpdate, db: Session = Depends(get_db)):
    return SaleService(db).update_sale(id_pedido, sale_in)


@router.delete("/{id_pedido}", status_code=204)
def delete_sale(id_pedido: str, db: Session = Depends(get_db)):
    SaleService(db).delete_sale(id_pedido)
