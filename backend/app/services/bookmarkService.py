import uuid
from sqlalchemy.orm import Session
from app.models.bookmarkModel import BookmarkItem
from app.schemas.bookmarkSchemas import BookmarkCreate, BookmarkOut


class BookmarkService:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, user_id: str) -> list[BookmarkOut]:
        rows = self.db.query(BookmarkItem).filter(BookmarkItem.user_id == user_id).all()
        return [self._to_out(r) for r in rows]

    def add(self, data: BookmarkCreate, user_id: str) -> BookmarkOut:
        existing = (
            self.db.query(BookmarkItem)
            .filter(BookmarkItem.user_id == user_id, BookmarkItem.entity_id == data.entity_id)
            .first()
        )
        if existing:
            return self._to_out(existing)

        row = BookmarkItem(
            id=str(uuid.uuid4()),
            user_id=user_id,
            kind=data.kind,
            entity_id=data.entity_id,
            name=data.name,
            email=data.email,
            price=data.price,
            total_sales=data.total_sales,
            category=data.category,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return self._to_out(row)

    def remove(self, entity_id: str, user_id: str) -> bool:
        row = (
            self.db.query(BookmarkItem)
            .filter(BookmarkItem.user_id == user_id, BookmarkItem.entity_id == entity_id)
            .first()
        )
        if not row:
            return False
        self.db.delete(row)
        self.db.commit()
        return True

    def _to_out(self, r: BookmarkItem) -> BookmarkOut:
        return BookmarkOut(
            id=r.id,
            kind=r.kind,
            entity_id=r.entity_id,
            name=r.name,
            email=r.email,
            price=r.price,
            total_sales=r.total_sales,
            category=r.category,
        )
