from pydantic import BaseModel
from typing import Optional


class GoalCreate(BaseModel):
    kind:         str
    label:        str
    target:       int
    product_id:   Optional[str] = None
    product_name: Optional[str] = None
    category:     Optional[str] = None


class GoalOut(BaseModel):
    id:             str
    kind:           str
    label:          str
    target:         int
    current:        int
    reference_month: Optional[str] = None   # "YYYY-MM" do mês usado no cálculo
    product_id:     Optional[str] = None
    product_name:   Optional[str] = None
    category:       Optional[str] = None

    model_config = {"from_attributes": True}
