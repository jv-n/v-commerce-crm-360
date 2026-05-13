from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from database.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)