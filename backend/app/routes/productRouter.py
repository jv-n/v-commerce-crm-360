from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database.database import get_db
from app.schemas.productSchemas import ProductSchema, ProductsPageOut
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
    )
    return {"data": data, "total": total, "page": page, "pageSize": pageSize}


@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = ProductService(db).get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return product
