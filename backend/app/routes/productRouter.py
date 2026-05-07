from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database.database import get_db
from app.schemas.productSchemas import (
    ProductSchema,
    ProductsPageOut,
    ProductCreateSchema,
    ProductUpdateSchema,
)
from app.services.productService import ProductService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductsPageOut)
def get_products(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None, description="Vírgula separada: Ativo,Novo,Inativo,Descontinuado"),
    uf: Optional[str] = Query(None),
    price_min: Optional[float] = Query(None, ge=0),
    price_max: Optional[float] = Query(None, ge=0),
    stock_min: Optional[int] = Query(None, ge=0),
    stock_max: Optional[int] = Query(None, ge=0),
    rating_min: Optional[float] = Query(None, ge=0, le=10),
    rating_max: Optional[float] = Query(None, ge=0, le=10),
    date_from: Optional[str] = Query(None, description="DD/MM/YYYY"),
    date_to: Optional[str] = Query(None, description="DD/MM/YYYY"),
    db: Session = Depends(get_db),
):
    service = ProductService(db)
    data, total = service.get_products(
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
        date_from=date_from,
        date_to=date_to,
    )
    return {"data": data, "total": total, "page": page, "pageSize": pageSize}


@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    service = ProductService(db)
    product = service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductSchema)
def create_product(product: ProductCreateSchema, db: Session = Depends(get_db)):
    return ProductService(db).create_product(product=product)


@router.put("/{product_id}", response_model=ProductSchema)
def update_product(product_id: int, product: ProductUpdateSchema, db: Session = Depends(get_db)):
    db_product = ProductService(db).update_product(product_id=product_id, product=product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product


@router.delete("/{product_id}", response_model=ProductSchema)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = ProductService(db).delete_product(product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product
