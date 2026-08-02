import json

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth.dependencies import get_current_user
from ...database import get_db
from ...models.audit_log import AuditLog
from ...models.contractor import Executor
from ...models.specification import Specification, SpecMotherTmc, SpecWork
from ...models.tmc import MotherTmc
from ...models.user import User
from ...schemas.specification import (
    SpecificationCreate,
    SpecificationResponse,
    SpecificationUpdate,
    SpecMotherTmcAdd,
    SpecMotherTmcResponse,
    SpecWorkResponse,
    SpecWorkUpsert,
)

log = structlog.get_logger()
router = APIRouter(prefix="/specifications", tags=["specifications"])


async def _audit(
    db: AsyncSession,
    user: User,
    action: str,
    entity_type: str,
    entity_id: int,
    changes: dict | None = None,
):
    entry = AuditLog(
        user_id=user.id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        changes_json=json.dumps(changes, ensure_ascii=False, default=str) if changes else None,
    )
    db.add(entry)
    log.info("audit", action=action, entity_type=entity_type, entity_id=entity_id, user=user.username)


# ── Specifications ──────────────────────────────────────────


@router.get("", response_model=list[SpecificationResponse])
async def list_specifications(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Specification).order_by(Specification.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=SpecificationResponse, status_code=status.HTTP_201_CREATED)
async def create_specification(
    body: SpecificationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await db.get(Executor, body.executor_id):
        raise HTTPException(status_code=400, detail="Исполнитель не найден")
    if body.valid_until <= body.valid_from:
        raise HTTPException(status_code=400, detail="Дата окончания должна быть позже даты начала")
    spec = Specification(**body.model_dump())
    db.add(spec)
    await db.flush()
    await _audit(db, user, "create", "specification", spec.id, {
        "executor_id": spec.executor_id,
        "valid_from": str(spec.valid_from),
        "valid_until": str(spec.valid_until),
    })
    await db.commit()
    await db.refresh(spec)
    return spec


@router.get("/{spec_id}", response_model=SpecificationResponse)
async def get_specification(spec_id: int, db: AsyncSession = Depends(get_db)):
    spec = await db.get(Specification, spec_id)
    if not spec:
        raise HTTPException(status_code=404, detail="Спецификация не найдена")
    return spec


@router.patch("/{spec_id}", response_model=SpecificationResponse)
async def update_specification(
    spec_id: int,
    body: SpecificationUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    spec = await db.get(Specification, spec_id)
    if not spec:
        raise HTTPException(status_code=404, detail="Спецификация не найдена")
    changes = {}
    update_data = body.model_dump(exclude_unset=True)
    for field in ("executor_id", "valid_from", "valid_until"):
        if field in update_data and update_data[field] != getattr(spec, field):
            changes[field] = {"old": str(getattr(spec, field)), "new": str(update_data[field])}
            setattr(spec, field, update_data[field])
    if changes:
        await _audit(db, user, "update", "specification", spec.id, changes)
        await db.commit()
        await db.refresh(spec)
    return spec


@router.delete("/{spec_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_specification(
    spec_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    spec = await db.get(Specification, spec_id)
    if not spec:
        raise HTTPException(status_code=404, detail="Спецификация не найдена")
    await _audit(db, user, "delete", "specification", spec.id, {
        "executor_id": spec.executor_id,
    })
    await db.delete(spec)
    await db.commit()


# ── Spec Mother TMCs ────────────────────────────────────────


@router.get("/{spec_id}/mother-tmcs", response_model=list[SpecMotherTmcResponse])
async def list_spec_mother_tmcs(spec_id: int, db: AsyncSession = Depends(get_db)):
    if not await db.get(Specification, spec_id):
        raise HTTPException(status_code=404, detail="Спецификация не найдена")
    result = await db.execute(
        select(SpecMotherTmc).where(SpecMotherTmc.specification_id == spec_id)
    )
    return result.scalars().all()


@router.post("/{spec_id}/mother-tmcs", response_model=SpecMotherTmcResponse, status_code=status.HTTP_201_CREATED)
async def add_spec_mother_tmc(
    spec_id: int,
    body: SpecMotherTmcAdd,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await db.get(Specification, spec_id):
        raise HTTPException(status_code=404, detail="Спецификация не найдена")
    if not await db.get(MotherTmc, body.mother_tmc_id):
        raise HTTPException(status_code=400, detail="Материнский ТМЦ не найден")
    dup = await db.execute(
        select(SpecMotherTmc).where(
            SpecMotherTmc.specification_id == spec_id,
            SpecMotherTmc.mother_tmc_id == body.mother_tmc_id,
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Этот материнский ТМЦ уже добавлен")
    smt = SpecMotherTmc(specification_id=spec_id, mother_tmc_id=body.mother_tmc_id)
    db.add(smt)
    await db.flush()
    await _audit(db, user, "create", "spec_mother_tmc", smt.id, {
        "specification_id": spec_id, "mother_tmc_id": body.mother_tmc_id,
    })
    await db.commit()
    await db.refresh(smt)
    return smt


@router.delete("/{spec_id}/mother-tmcs/{smt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_spec_mother_tmc(
    spec_id: int,
    smt_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    smt = await db.get(SpecMotherTmc, smt_id)
    if not smt or smt.specification_id != spec_id:
        raise HTTPException(status_code=404, detail="Не найдено")
    await _audit(db, user, "delete", "spec_mother_tmc", smt.id, {
        "specification_id": spec_id, "mother_tmc_id": smt.mother_tmc_id,
    })
    await db.delete(smt)
    await db.commit()


# ── Spec Works ──────────────────────────────────────────────


@router.get("/{spec_id}/mother-tmcs/{smt_id}/works", response_model=list[SpecWorkResponse])
async def list_spec_works(spec_id: int, smt_id: int, db: AsyncSession = Depends(get_db)):
    smt = await db.get(SpecMotherTmc, smt_id)
    if not smt or smt.specification_id != spec_id:
        raise HTTPException(status_code=404, detail="Не найдено")
    result = await db.execute(
        select(SpecWork).where(SpecWork.spec_mother_tmc_id == smt_id)
    )
    return result.scalars().all()


@router.put("/{spec_id}/mother-tmcs/{smt_id}/works", response_model=list[SpecWorkResponse])
async def upsert_spec_works(
    spec_id: int,
    smt_id: int,
    body: list[SpecWorkUpsert],
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    smt = await db.get(SpecMotherTmc, smt_id)
    if not smt or smt.specification_id != spec_id:
        raise HTTPException(status_code=404, detail="Не найдено")

    result = await db.execute(
        select(SpecWork).where(SpecWork.spec_mother_tmc_id == smt_id)
    )
    existing = {(w.breakdown_source, w.breakdown_id): w for w in result.scalars().all()}

    updated = []
    for item in body:
        key = (item.breakdown_source, item.breakdown_id)
        if key in existing:
            w = existing[key]
            if float(w.price) != item.price:
                await _audit(db, user, "update", "spec_work", w.id, {
                    "price": {"old": float(w.price), "new": item.price},
                })
                w.price = item.price
            updated.append(w)
        else:
            w = SpecWork(
                spec_mother_tmc_id=smt_id,
                breakdown_source=item.breakdown_source,
                breakdown_id=item.breakdown_id,
                price=item.price,
            )
            db.add(w)
            updated.append(w)

    await db.flush()
    await _audit(db, user, "update", "spec_mother_tmc", smt.id, {
        "works_count": len(body),
    })
    await db.commit()
    for w in updated:
        await db.refresh(w)
    return updated
