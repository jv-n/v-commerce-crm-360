from pydantic import BaseModel
from typing import Optional


class BookmarkCreate(BaseModel):
    kind:        str
    entity_id:   str
    name:        str
    email:       Optional[str]   = None
    price:       Optional[float] = None
    total_sales: Optional[int]   = None
    category:    Optional[str]   = None


class BookmarkOut(BaseModel):
    id:          str
    kind:        str
    entity_id:   str
    name:        str
    email:       Optional[str]   = None
    price:       Optional[float] = None
    total_sales: Optional[int]   = None
    category:    Optional[str]   = None

    model_config = {"from_attributes": True}
