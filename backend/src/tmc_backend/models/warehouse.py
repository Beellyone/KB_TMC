from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class Territory(TimestampMixin, Base):
    __tablename__ = "territories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    warehouses: Mapped[list["Warehouse"]] = relationship(back_populates="territory", cascade="all, delete-orphan")


class Warehouse(TimestampMixin, Base):
    __tablename__ = "warehouses"

    id: Mapped[int] = mapped_column(primary_key=True)
    territory_id: Mapped[int] = mapped_column(ForeignKey("territories.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))

    territory: Mapped[Territory] = relationship(back_populates="warehouses")
