from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class Specification(TimestampMixin, Base):
    __tablename__ = "specifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    executor_id: Mapped[int] = mapped_column(ForeignKey("executors.id", ondelete="CASCADE"))
    valid_from: Mapped[date] = mapped_column(Date)
    valid_until: Mapped[date] = mapped_column(Date)

    mother_tmcs: Mapped[list["SpecMotherTmc"]] = relationship(
        back_populates="specification", cascade="all, delete-orphan",
    )


class SpecMotherTmc(TimestampMixin, Base):
    __tablename__ = "spec_mother_tmcs"

    id: Mapped[int] = mapped_column(primary_key=True)
    specification_id: Mapped[int] = mapped_column(ForeignKey("specifications.id", ondelete="CASCADE"))
    mother_tmc_id: Mapped[int] = mapped_column(ForeignKey("mother_tmcs.id", ondelete="CASCADE"))

    specification: Mapped[Specification] = relationship(back_populates="mother_tmcs")
    works: Mapped[list["SpecWork"]] = relationship(back_populates="spec_mother_tmc", cascade="all, delete-orphan")


class SpecWork(TimestampMixin, Base):
    __tablename__ = "spec_works"

    id: Mapped[int] = mapped_column(primary_key=True)
    spec_mother_tmc_id: Mapped[int] = mapped_column(ForeignKey("spec_mother_tmcs.id", ondelete="CASCADE"))
    breakdown_source: Mapped[str] = mapped_column(String(20))
    breakdown_id: Mapped[int] = mapped_column(Integer)
    price: Mapped[float] = mapped_column(Numeric(12, 2), default=0)

    spec_mother_tmc: Mapped[SpecMotherTmc] = relationship(back_populates="works")
