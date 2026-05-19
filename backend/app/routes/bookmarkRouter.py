from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.database import get_db
from app.services.bookmarkService import BookmarkService
from app.schemas.bookmarkSchemas import BookmarkCreate, BookmarkOut

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.get("/", response_model=list[BookmarkOut])
def get_bookmarks(db: Session = Depends(get_db)):
    return BookmarkService(db).get_all()


@router.post("/", response_model=BookmarkOut)
def add_bookmark(data: BookmarkCreate, db: Session = Depends(get_db)):
    return BookmarkService(db).add(data)


@router.delete("/{entity_id}")
def remove_bookmark(entity_id: str, db: Session = Depends(get_db)):
    BookmarkService(db).remove(entity_id)
    return {"ok": True}
