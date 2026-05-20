import uuid
from sqlalchemy import String, Float, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from database.database import Base


class BookmarkItem(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "entity_id", name="uq_bookmark_user_entity"),)

    id:          Mapped[str]          = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id:     Mapped[str | None]   = mapped_column(String, nullable=True)
    kind:        Mapped[str]          = mapped_column(String)           # "contact" | "product"
    entity_id:   Mapped[str]          = mapped_column(String)
    name:        Mapped[str]          = mapped_column(String)
    email:       Mapped[str | None]   = mapped_column(String,  nullable=True)
    price:       Mapped[float | None] = mapped_column(Float,   nullable=True)
    total_sales: Mapped[int | None]   = mapped_column(Integer, nullable=True)
    category:    Mapped[str | None]   = mapped_column(String,  nullable=True)
