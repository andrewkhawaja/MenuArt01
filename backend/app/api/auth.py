from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.admin import Admin
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/admin", tags=["admin"])


class AdminRegister(BaseModel):
    email: EmailStr
    password: str


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(payload: AdminRegister, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()

    exists = db.query(Admin).filter(Admin.email == email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Admin already exists")

    a = Admin(
        email=email,
        hashed_password=hash_password(payload.password),  # ✅ MUST MATCH MODEL
    )
    db.add(a)
    db.commit()
    return {"ok": True}


@router.post("/login")
def login(payload: AdminLogin, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()

    a = db.query(Admin).filter(Admin.email == email).first()
    if not a or not verify_password(payload.password, a.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(subject=a.email)
    return {"access_token": token, "token_type": "bearer"}
