from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from starlette.concurrency import run_in_threadpool
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import google_oauth_configured, settings
from app.core.deps import get_current_user
from app.core.security import (
    create_token,
    hash_password,
    oauth_google_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthConfigOut, GoogleOAuthRequest, Token, UserCreate, UserOut
from app.services.oauth_google import GoogleOAuthError, profile_from_authorization_code

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=Token)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)) -> Token:
    password_hash = await run_in_threadpool(hash_password, body.password)
    user = User(
        name=body.name,
        email=body.email,
        password_hash=password_hash,
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    await db.refresh(user)
    return Token(access_token=create_token(sub=str(user.id)))


@router.post("/token", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Token:
    result = await db.execute(
        select(User).where(User.email == form_data.username.casefold())
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login details.",
        )
    valid = await run_in_threadpool(
        verify_password, form_data.password, user.password_hash
    )
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login details.",
        )
    return Token(access_token=create_token(sub=str(user.id)))


@router.get("/auth-check")
async def auth_check(_user: User = Depends(get_current_user)) -> str:
    return "OK"


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.post("/oauth/google", response_model=Token)
async def google_oauth(
    body: GoogleOAuthRequest,
    db: AsyncSession = Depends(get_db),
) -> Token:
    if not google_oauth_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured.",
        )
    code = body.code.strip()
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code is required.",
        )
    try:
        profile = await profile_from_authorization_code(
            code=code,
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret,
            redirect_uri=settings.google_redirect_uri,
        )
    except GoogleOAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google sign-in could not be completed.",
        ) from exc

    result = await db.execute(select(User).where(User.email == profile.email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            name=profile.name,
            email=profile.email,
            password_hash=oauth_google_password_hash(profile.sub),
        )
        db.add(user)
        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            result = await db.execute(select(User).where(User.email == profile.email))
            user = result.scalar_one_or_none()
            if user is None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists.",
                )
        else:
            await db.refresh(user)
    return Token(access_token=create_token(sub=str(user.id)))


@router.get("/config", response_model=AuthConfigOut)
async def config() -> AuthConfigOut:
    if google_oauth_configured():
        return AuthConfigOut(
            auth_type="password+google",
            google_client_id=settings.google_client_id,
        )
    return AuthConfigOut(auth_type="password", google_client_id=None)
