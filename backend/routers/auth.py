from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from database import get_db
from models.db_models import User
from services.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix='/api/auth', tags=['auth'])


class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user_id: str
    email: str
    name: str


class MeResponse(BaseModel):
    user_id: str
    email: str
    name: str


@router.post('/register', response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Sprawdź czy email zajęty
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, 'Ten adres e-mail jest już zarejestrowany')

    if len(body.password) < 8:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, 'Hasło musi mieć co najmniej 8 znaków')

    user = User(
        email=body.email.lower().strip(),
        name=body.name.strip(),
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id), user.email)
    return TokenResponse(access_token=token, user_id=str(user.id), email=user.email, name=user.name)


@router.post('/login', response_model=TokenResponse)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == form.username.lower()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            'Nieprawidłowy e-mail lub hasło',
            headers={'WWW-Authenticate': 'Bearer'},
        )

    token = create_access_token(str(user.id), user.email)
    return TokenResponse(access_token=token, user_id=str(user.id), email=user.email, name=user.name)


@router.get('/me', response_model=MeResponse)
async def me(current_user: User = Depends(get_current_user)):
    return MeResponse(user_id=str(current_user.id), email=current_user.email, name=current_user.name)
