from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class Contragent(TimestampMixin, Base):
    __tablename__ = "contragents"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(500), default=None)
    org_form: Mapped[str | None] = mapped_column(String(100), default=None)
    person: Mapped[str | None] = mapped_column(String(255), default=None)
    job: Mapped[str | None] = mapped_column(String(255), default=None)
    basis: Mapped[str | None] = mapped_column(Text, default=None)

    executors: Mapped[list["Executor"]] = relationship(back_populates="contragent", cascade="all, delete-orphan")


class Executor(TimestampMixin, Base):
    __tablename__ = "executors"

    id: Mapped[int] = mapped_column(primary_key=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id", ondelete="CASCADE"))
    contragent_id: Mapped[int] = mapped_column(ForeignKey("contragents.id", ondelete="CASCADE"))
    emails: Mapped[str | None] = mapped_column(Text, default=None)
    agreement_number: Mapped[str | None] = mapped_column(String(100), default=None)
    agreement_date: Mapped[date | None] = mapped_column(Date, default=None)

    contragent: Mapped[Contragent] = relationship(back_populates="executors")
