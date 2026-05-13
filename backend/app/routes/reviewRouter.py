from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database.database import get_db
from app.schemas.reviewSchemas import ReviewsPageOut
from app.services.reviewService import ReviewService

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("", response_model=ReviewsPageOut)
def get_reviews(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    product_id: Optional[str] = Query(None, description="Filtrar por produto"),
    categoria_nps: Optional[str] = Query(None, description="Promotor | Neutro | Detrator"),
    rating_min: Optional[float] = Query(None, ge=0, le=10),
    rating_max: Optional[float] = Query(None, ge=0, le=10),
    sort_by: Optional[str] = Query("data", description="data | nota_produto | nota_nps"),
    sort_dir: Optional[str] = Query("desc", description="asc | desc"),
    db: Session = Depends(get_db),
):
    data, total = ReviewService(db).get_reviews(
        page=page,
        page_size=pageSize,
        product_id=product_id,
        categoria_nps=categoria_nps,
        rating_min=rating_min,
        rating_max=rating_max,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    return {"data": data, "total": total, "page": page, "pageSize": pageSize}
