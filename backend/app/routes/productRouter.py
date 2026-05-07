from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from app.schemas.productSchemas import (
    ProductSchema,
    ProductCreateSchema,
    ProductUpdateSchema,
)
from app.services.productService import ProductService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[ProductSchema])
def get_products(
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    product_service = ProductService(db)
    products = product_service.get_products(
        skip=skip, limit=limit, search=search, category=category
    )
    return products


@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product_service = ProductService(db)
    product = product_service.get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductSchema)
def create_product(product: ProductCreateSchema, db: Session = Depends(get_db)):
    product_service = ProductService(db)
    return product_service.create_product(product=product)


@router.put("/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: int, product: ProductUpdateSchema, db: Session = Depends(get_db)
):
    product_service = ProductService(db)
    db_product = product_service.update_product(product_id=product_id, product=product)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product


@router.delete("/{product_id}", response_model=ProductSchema)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product_service = ProductService(db)
    db_product = product_service.delete_product(product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return db_product
