from dataclasses import dataclass
from datetime import date, timedelta

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.act import Act, ActStatus, DamagedTmc, Repair

GUARANTEE_DAYS = 180


@dataclass
class GuaranteeResult:
    is_guarantee: bool
    original_repair_id: int | None = None
    original_completion_date: date | None = None
    days_remaining: int | None = None


async def check_guarantee(
    db: AsyncSession,
    tmc_id: int,
    serial_number: str,
    exclude_act_id: int | None = None,
) -> GuaranteeResult:
    result = await db.execute(
        select(DamagedTmc).where(
            DamagedTmc.tmc_id == tmc_id,
            DamagedTmc.serial_number == serial_number,
        )
    )
    damaged = result.scalars().first()
    if not damaged:
        return GuaranteeResult(is_guarantee=False)

    q = (
        select(Repair)
        .join(Act)
        .where(
            and_(
                Repair.damaged_tmc_id == damaged.id,
                Act.status == ActStatus.COMPLETE,
                Act.dates.has(completion_date=None) == False,  # noqa: E712
            )
        )
        .options(selectinload(Repair.act).selectinload(Act.dates))
        .order_by(Act.created_at.desc())
    )
    if exclude_act_id:
        q = q.where(Repair.act_id != exclude_act_id)

    result = await db.execute(q)
    last_repair = result.scalars().first()
    if not last_repair or not last_repair.act.dates.completion_date:
        return GuaranteeResult(is_guarantee=False)

    completion = last_repair.act.dates.completion_date
    deadline = completion + timedelta(days=GUARANTEE_DAYS)
    today = date.today()

    if today <= deadline:
        return GuaranteeResult(
            is_guarantee=True,
            original_repair_id=last_repair.id,
            original_completion_date=completion,
            days_remaining=(deadline - today).days,
        )

    return GuaranteeResult(is_guarantee=False)
