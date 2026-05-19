from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.userSchemas import UserCreate, UserUpdate, UserOut
from app.services.userService import UserService
from database.database import get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = UserService.create_user(user, db)
    return db_user

@router.get("/", response_model=list[UserOut])
def read_users(db: Session = Depends(get_db)):
    users = UserService.get_all_users(db)
    return users

@router.get("/{user_id}", response_model=UserOut)
def read_user(user_id: str, db: Session = Depends(get_db)):
    db_user = UserService.get_user(user_id, db)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: str, user_update: UserUpdate, db: Session = Depends(get_db)):
    db_user = UserService.update_user(user_id, user_update, db)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.delete("/{user_id}", response_model=UserOut)
def delete_user(user_id: str, db: Session = Depends(get_db)):
    db_user, success = UserService.delete_user(user_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user
