import enum
from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class ActStatus(enum.StrEnum):
    NEW = "NEW"
    CHECKING = "CHECKING"
    DONE = "DONE"
    COMPLETE = "COMPLETE"
    DECLINED = "DECLINED"


class CostApproval(enum.StrEnum):
    DISAPPROVED = "DISAPPROVED"
    APPROVED = "APPROVED"
    GUARANTEE = "GUARANTEE"


class StateQualification(enum.StrEnum):
    UNCHECKED = "UNCHECKED"
    UNQUALIFIED = "UNQUALIFIED"
    QUALIFIED = "QUALIFIED"


class AttentionMark(enum.StrEnum):
    CALM = "CALM"
    ATTENTION = "ATTENTION"


class Act(TimestampMixin, Base):
    __tablename__ = "acts"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    executor_id: Mapped[int] = mapped_column(ForeignKey("executors.id", ondelete="CASCADE"))
    file_name: Mapped[str] = mapped_column(String(255))
    attention_mark: Mapped[AttentionMark] = mapped_column(
        Enum(AttentionMark), default=AttentionMark.CALM,
    )
    status: Mapped[ActStatus] = mapped_column(Enum(ActStatus), default=ActStatus.NEW)

    dates: Mapped["ActDate"] = relationship(back_populates="act", cascade="all, delete-orphan", uselist=False)
    repairs: Mapped[list["Repair"]] = relationship(back_populates="act", cascade="all, delete-orphan")


class ActDate(Base):
    __tablename__ = "act_dates"

    id: Mapped[int] = mapped_column(primary_key=True)
    act_id: Mapped[int] = mapped_column(ForeignKey("acts.id", ondelete="CASCADE"), unique=True)
    diagnostics_date: Mapped[date | None] = mapped_column(Date, default=None)
    verification_date: Mapped[date | None] = mapped_column(Date, default=None)
    invoice_date: Mapped[date | None] = mapped_column(Date, default=None)
    return_date: Mapped[date | None] = mapped_column(Date, default=None)
    confirmation_date: Mapped[date | None] = mapped_column(Date, default=None)
    completion_date: Mapped[date | None] = mapped_column(Date, default=None)

    act: Mapped[Act] = relationship(back_populates="dates")


class DamagedTmc(TimestampMixin, Base):
    __tablename__ = "damaged_tmcs"
    __table_args__ = (
        UniqueConstraint("tmc_id", "serial_number", name="uq_damaged_tmc_serial"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    tmc_id: Mapped[int] = mapped_column(ForeignKey("tmcs.id", ondelete="CASCADE"))
    serial_number: Mapped[str] = mapped_column(String(255), index=True)

    repairs: Mapped[list["Repair"]] = relationship(back_populates="damaged_tmc")


class Repair(TimestampMixin, Base):
    __tablename__ = "repairs"

    id: Mapped[int] = mapped_column(primary_key=True)
    act_id: Mapped[int] = mapped_column(ForeignKey("acts.id", ondelete="CASCADE"))
    damaged_tmc_id: Mapped[int] = mapped_column(ForeignKey("damaged_tmcs.id", ondelete="CASCADE"))
    fault_description: Mapped[str | None] = mapped_column(Text, default=None)
    cost_approval: Mapped[CostApproval] = mapped_column(
        Enum(CostApproval), default=CostApproval.DISAPPROVED,
    )
    state_qualification: Mapped[StateQualification] = mapped_column(
        Enum(StateQualification), default=StateQualification.UNCHECKED,
    )
    attention_mark: Mapped[AttentionMark] = mapped_column(
        Enum(AttentionMark), default=AttentionMark.CALM,
    )
    price: Mapped[float] = mapped_column(Numeric(12, 2), default=0)

    act: Mapped[Act] = relationship(back_populates="repairs")
    damaged_tmc: Mapped[DamagedTmc] = relationship(back_populates="repairs")
