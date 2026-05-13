from sqlalchemy.orm import Session
from app.schemas.authSchemas import LoginRequest, LoginResponse
from app.models.userModel import User
from database.database import get_db
from fastapi import Depends, HTTPException, status

from app.core.security import verify_password, create_access_token, decode_token

class AuthService:
    
    @staticmethod
    def user_login(credentials: LoginRequest, db: Session = Depends(get_db)):
        user = db.query(User).filter(User.email==credentials.email).first()

        if not user or not verify_password(credentials.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos",
            )
        
        token = create_access_token({
            "sub": str(user.id),
            "role": user.role,
            "name": user.name
        })

        return LoginResponse(
            access_token= token,
            user = {"id": user.id, "name": user.name, 
                    "email":user.email, "role": user.role},
        )

