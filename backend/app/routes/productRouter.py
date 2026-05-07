from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from app.schemas.productSchemas import ProductSchema
from app.services.productService import ProductService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[ProductSchema])
def get_products(
    skip: int = 0, limit: int = 10, search: Optional[str] = None, db: Session = Depends(get_db)
):
    product_service = ProductService(db)
    products = product_service.get_products(skip=skip, limit=limit, search=search)
    if not products:
        raise HTTPException(status_code=404, detail="Products not found")
    return products
