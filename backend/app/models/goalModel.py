import uuid
from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from database.database import Base


class GoalItem(Base):
    __tablename__ = "goals"

    id:           Mapped[str]        = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id:      Mapped[str | None] = mapped_column(String, nullable=True)
    kind:         Mapped[str]        = mapped_column(String)           # "product_sales" | "new_clients" | "category_sales"
    label:        Mapped[str]        = mapped_column(String)
    target:       Mapped[int]        = mapped_column(Integer)
    product_id:   Mapped[str | None] = mapped_column(String, nullable=True)
    product_name: Mapped[str | None] = mapped_column(String, nullable=True)
    category:     Mapped[str | None] = mapped_column(String, nullable=True)
