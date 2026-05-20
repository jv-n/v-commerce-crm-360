from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.database import get_db
from app.services.bookmarkService import BookmarkService
from app.schemas.bookmarkSchemas import BookmarkCreate, BookmarkOut
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.get("/", response_model=list[BookmarkOut])
def get_bookmarks(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return BookmarkService(db).get_all(user["sub"])


@router.post("/", response_model=BookmarkOut)
def add_bookmark(
    data: BookmarkCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return BookmarkService(db).add(data, user["sub"])


@router.delete("/{entity_id}")
def remove_bookmark(
    entity_id: str,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    BookmarkService(db).remove(entity_id, user["sub"])
    return {"ok": True}
