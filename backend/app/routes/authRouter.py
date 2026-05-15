import os
import sys
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.authSchemas import LoginRequest, LoginResponse
from app.services.authService import AuthService

from sqlalchemy.orm import Session
from database.database import get_db

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login", status_code=200)
def user_login(credentials: LoginRequest, db: Session = Depends(get_db)):
    logged_user = AuthService.user_login(credentials, db)
    return logged_user