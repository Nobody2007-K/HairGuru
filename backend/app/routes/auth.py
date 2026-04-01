from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from ..config import ALGORITHM, SECRET_KEY
from ..database import get_db
from ..models import Analysis, SavedStyle, User
from ..schemas import AuthResponse, LoginRequest, MeResponse, RegisterRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Header(alias="authorization"), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if token.startswith("Bearer "):
        token = token[7:]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub", "0"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


@router.post("/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        return AuthResponse(success=False, error="Username already taken")

    display_name = body.display_name or body.username
    initials = "".join(w[0].upper() for w in display_name.split()[:2])

    user = User(
        username=body.username,
        display_name=display_name,
        avatar_initials=initials or "U",
        password_hash=pwd_context.hash(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id)
    return AuthResponse(
        success=True,
        token=token,
        user={
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "avatar_initials": user.avatar_initials,
            "created_at": user.created_at.isoformat(),
        },
    )


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not pwd_context.verify(body.password, user.password_hash):
        return AuthResponse(success=False, error="Invalid username or password")

    token = create_token(user.id)
    return AuthResponse(
        success=True,
        token=token,
        user={
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "avatar_initials": user.avatar_initials,
            "created_at": user.created_at.isoformat(),
        },
    )


@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    analysis_count = db.query(Analysis).filter(Analysis.user_id == current_user.id).count()
    saved_count = db.query(SavedStyle).filter(SavedStyle.user_id == current_user.id).count()

    return MeResponse(
        success=True,
        user=UserResponse(
            id=current_user.id,
            username=current_user.username,
            display_name=current_user.display_name,
            avatar_initials=current_user.avatar_initials,
            created_at=current_user.created_at,
        ),
        stats={
            "analyses_count": analysis_count,
            "saved_count": saved_count,
            "try_on_count": 0,
        },
    )
