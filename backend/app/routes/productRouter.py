from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from database.database import get_db
from app.schemas.productSchemas import (
    ProductSchema, ProductsPageOut, ProductCreate, ProductUpdate,
    ProductOrderOut, ProductTicketOut, ProductMonthlyRevenueOut,
    ProductActivityOut, ProductResumoOut,
)
from app.services.productService import ProductService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductsPageOut)
def get_products(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None, description="Ativo ou Inativo"),
    uf: Optional[str] = Query(None),
    price_min: Optional[float] = Query(None, ge=0),
    price_max: Optional[float] = Query(None, ge=0),
    stock_min: Optional[int] = Query(None, ge=0),
    stock_max: Optional[int] = Query(None, ge=0),
    rating_min: Optional[float] = Query(None, ge=0, le=10),
    rating_max: Optional[float] = Query(None, ge=0, le=10),
    sales_min: Optional[float] = Query(None, ge=0),
    sales_max: Optional[float] = Query(None, ge=0),
    date_from: Optional[str] = Query(None, description="DD/MM/YYYY"),
    date_to: Optional[str] = Query(None, description="DD/MM/YYYY"),
    sort_by: Optional[str] = Query(None, description="name|price|stock|rating|totalSales"),
    sort_dir: Optional[str] = Query("asc", description="asc|desc"),
    db: Session = Depends(get_db),
):
    data, total = ProductService(db).get_products(
        page=page,
        page_size=pageSize,
        search=search,
        category=category,
        status=status,
        uf=uf,
        price_min=price_min,
        price_max=price_max,
        stock_min=stock_min,
        stock_max=stock_max,
        rating_min=rating_min,
        rating_max=rating_max,
        sales_min=sales_min,
        sales_max=sales_max,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return {"data": data, "total": total, "page": page, "pageSize": pageSize}


@router.get("/suppliers", response_model=list[str])
def get_suppliers(db: Session = Depends(get_db)):
    return ProductService(db).get_suppliers()


@router.post("/", response_model=ProductSchema, status_code=201)
def create_product(body: ProductCreate, db: Session = Depends(get_db)):
    return ProductService(db).create_product(body)


@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = ProductService(db).get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return product


@router.patch("/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: str,
    body: ProductUpdate,
    x_user_name: str = Header(default="Sistema", alias="X-User-Name"),
    db: Session = Depends(get_db),
):
    product = ProductService(db).update_product(product_id, body, user_name=x_user_name)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: str, db: Session = Depends(get_db)):
    deleted = ProductService(db).delete_product(product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Produto não encontrado")


@router.get("/{product_id}/resumo", response_model=ProductResumoOut)
def get_product_resumo(product_id: str, db: Session = Depends(get_db)):
    result = ProductService(db).get_product_resumo(product_id)
    if not result:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return result


@router.get("/{product_id}/activities", response_model=list[ProductActivityOut])
def get_product_activities(
    product_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return ProductService(db).get_product_activities(product_id, limit=limit)


@router.get("/{product_id}/orders", response_model=list[ProductOrderOut])
def get_product_orders(product_id: str, db: Session = Depends(get_db)):
    return ProductService(db).get_product_orders(product_id)


@router.get("/{product_id}/tickets", response_model=list[ProductTicketOut])
def get_product_tickets(product_id: str, db: Session = Depends(get_db)):
    return ProductService(db).get_product_tickets(product_id)


@router.get("/{product_id}/monthly-revenue", response_model=list[ProductMonthlyRevenueOut])
def get_product_monthly_revenue(product_id: str, db: Session = Depends(get_db)):
    return ProductService(db).get_product_monthly_revenue(product_id)
