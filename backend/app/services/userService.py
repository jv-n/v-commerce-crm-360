import uuid

from fastapi import Depends
from sqlalchemy.orm import Session
from app.models.userModel import User
from app.schemas.userSchemas import UserCreate, UserUpdate
from app.core.security import hash_password, verify_password
from database.database import get_db

class UserService:
    @staticmethod
    def create_user(user: UserCreate, db: Session = Depends(get_db)) -> User:
        hashed_password = hash_password(user.password)
        db_user = User(id=str(uuid.uuid4()), name=user.name, email=user.email, password=hashed_password, role=user.role)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_user(user_id: int, db: Session = Depends(get_db)) -> User | None:
        user = db.query(User).filter(User.id == user_id).first()
        return user
    
    @staticmethod
    def get_all_users(db: Session = Depends(get_db)) -> list[User]:
        users = db.query(User).all()
        return users

    @staticmethod
    def update_user(user_id: str, user_update: UserUpdate, db: Session = Depends(get_db)) -> User | bool:
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return False
        for key, value in user_update.model_dump(exclude_unset=True).items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete_user(user_id: str, db: Session = Depends(get_db)) -> tuple[User | None, bool]:
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None, False
        db.delete(db_user)
        db.commit()
        return db_user, True