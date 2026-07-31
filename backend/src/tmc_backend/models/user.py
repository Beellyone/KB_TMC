import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class UserRole(int, enum.Enum):
    DEV = 1
    ADMIN = 2
    ENGINEER = 3
    OPERATOR = 4
    STORE_ST = 5
    EXECUTOR = 6
    ST = 7


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    fio: Mapped[str | None] = mapped_column(String(255), default=None)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.ST)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
