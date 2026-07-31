from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class TmcCategory(TimestampMixin, Base):
    __tablename__ = "tmc_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    mother_tmcs: Mapped[list["MotherTmc"]] = relationship(back_populates="category", cascade="all, delete-orphan")


class MotherTmc(TimestampMixin, Base):
    __tablename__ = "mother_tmcs"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("tmc_categories.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))

    category: Mapped[TmcCategory] = relationship(back_populates="mother_tmcs")
    items: Mapped[list["Tmc"]] = relationship(back_populates="mother_tmc", cascade="all, delete-orphan")


class Tmc(TimestampMixin, Base):
    __tablename__ = "tmcs"

    id: Mapped[int] = mapped_column(primary_key=True)
    mother_tmc_id: Mapped[int] = mapped_column(ForeignKey("mother_tmcs.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))

    mother_tmc: Mapped[MotherTmc] = relationship(back_populates="items")
