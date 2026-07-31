import bcrypt
import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth.dependencies import get_current_user
from ...auth.jwt import create_access_token, create_refresh_token, decode_token
from ...database import get_db
from ...models.user import User
from ...schemas.auth import ChangePasswordRequest, LoginRequest, RefreshRequest, TokenResponse
from ...schemas.user import UserResponse

log = structlog.get_logger()
router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory token blacklist for logout (in production, use Redis)
_revoked_tokens: set[str] = set()


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()
    if user is None or not bcrypt.checkpw(body.password.encode(), user.password_hash.encode()):
        log.warning("login_failed", username=body.username)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
    log.info("login_success", username=user.username, role=user.role.name)
    return TokenResponse(
        access_token=create_access_token(user.id, user.username, user.role.value),
        refresh_token=create_refresh_token(user.id),
    )


@router.post("/logout")
async def logout(credentials=Depends(get_current_user)):
    log.info("logout", username=credentials.username)
    return {"detail": "Logged out"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return TokenResponse(
        access_token=create_access_token(user.id, user.username, user.role.value),
        refresh_token=create_refresh_token(user.id),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not bcrypt.checkpw(body.old_password.encode(), current_user.password_hash.encode()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неверный текущий пароль")
    current_user.password_hash = bcrypt.hashpw(body.new_password.encode(), bcrypt.gensalt()).decode()
    await db.commit()
    return {"detail": "Пароль изменён"}
