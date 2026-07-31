import json

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth.dependencies import get_current_user
from ...database import get_db
from ...models.audit_log import AuditLog
from ...models.contractor import Contragent, Executor
from ...models.user import User
from ...models.warehouse import Warehouse
from ...schemas.contractor import (
    ContragentCreate,
    ContragentResponse,
    ContragentUpdate,
    ExecutorCreate,
    ExecutorResponse,
    ExecutorUpdate,
)

log = structlog.get_logger()
router = APIRouter(prefix="/contractors", tags=["contractors"])


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


# ── Contragents ─────────────────────────────────────────────


@router.get("/contragents", response_model=list[ContragentResponse])
async def list_contragents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Contragent).order_by(Contragent.name))
    return result.scalars().all()


@router.post("/contragents", response_model=ContragentResponse, status_code=status.HTTP_201_CREATED)
async def create_contragent(
    body: ContragentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Contragent).where(Contragent.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Контрагент с таким именем уже существует")
    c = Contragent(**body.model_dump())
    db.add(c)
    await db.flush()
    await _audit(db, user, "create", "contragent", c.id, {"name": c.name})
    await db.commit()
    await db.refresh(c)
    return c


@router.patch("/contragents/{c_id}", response_model=ContragentResponse)
async def update_contragent(
    c_id: int,
    body: ContragentUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    c = await db.get(Contragent, c_id)
    if not c:
        raise HTTPException(status_code=404, detail="Контрагент не найден")
    changes = {}
    update_data = body.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != c.name:
        dup = await db.execute(
            select(Contragent).where(Contragent.name == update_data["name"], Contragent.id != c_id)
        )
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Контрагент с таким именем уже существует")
        changes["name"] = {"old": c.name, "new": update_data["name"]}
        c.name = update_data["name"]
    for field in ("full_name", "org_form", "person", "job", "basis"):
        if field in update_data and update_data[field] != getattr(c, field):
            changes[field] = {"old": getattr(c, field), "new": update_data[field]}
            setattr(c, field, update_data[field])
    if changes:
        await _audit(db, user, "update", "contragent", c.id, changes)
        await db.commit()
        await db.refresh(c)
    return c


@router.delete("/contragents/{c_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contragent(
    c_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    c = await db.get(Contragent, c_id)
    if not c:
        raise HTTPException(status_code=404, detail="Контрагент не найден")
    await _audit(db, user, "delete", "contragent", c.id, {"name": c.name})
    await db.delete(c)
    await db.commit()


# ── Executors ───────────────────────────────────────────────


@router.get("/executors", response_model=list[ExecutorResponse])
async def list_executors(
    warehouse_id: int | None = Query(default=None),
    contragent_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Executor)
    if warehouse_id is not None:
        q = q.where(Executor.warehouse_id == warehouse_id)
    if contragent_id is not None:
        q = q.where(Executor.contragent_id == contragent_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/executors", response_model=ExecutorResponse, status_code=status.HTTP_201_CREATED)
async def create_executor(
    body: ExecutorCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await db.get(Warehouse, body.warehouse_id):
        raise HTTPException(status_code=400, detail="Склад не найден")
    if not await db.get(Contragent, body.contragent_id):
        raise HTTPException(status_code=400, detail="Контрагент не найден")
    ex = Executor(**body.model_dump())
    db.add(ex)
    await db.flush()
    await _audit(db, user, "create", "executor", ex.id, {
        "warehouse_id": ex.warehouse_id, "contragent_id": ex.contragent_id,
    })
    await db.commit()
    await db.refresh(ex)
    return ex


@router.patch("/executors/{ex_id}", response_model=ExecutorResponse)
async def update_executor(
    ex_id: int,
    body: ExecutorUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ex = await db.get(Executor, ex_id)
    if not ex:
        raise HTTPException(status_code=404, detail="Исполнитель не найден")
    changes = {}
    update_data = body.model_dump(exclude_unset=True)
    if "warehouse_id" in update_data and update_data["warehouse_id"] != ex.warehouse_id:
        if not await db.get(Warehouse, update_data["warehouse_id"]):
            raise HTTPException(status_code=400, detail="Склад не найден")
        changes["warehouse_id"] = {"old": ex.warehouse_id, "new": update_data["warehouse_id"]}
        ex.warehouse_id = update_data["warehouse_id"]
    if "contragent_id" in update_data and update_data["contragent_id"] != ex.contragent_id:
        if not await db.get(Contragent, update_data["contragent_id"]):
            raise HTTPException(status_code=400, detail="Контрагент не найден")
        changes["contragent_id"] = {"old": ex.contragent_id, "new": update_data["contragent_id"]}
        ex.contragent_id = update_data["contragent_id"]
    for field in ("emails", "agreement_number", "agreement_date"):
        if field in update_data and update_data[field] != getattr(ex, field):
            changes[field] = {"old": str(getattr(ex, field)), "new": str(update_data[field])}
            setattr(ex, field, update_data[field])
    if changes:
        await _audit(db, user, "update", "executor", ex.id, changes)
        await db.commit()
        await db.refresh(ex)
    return ex


@router.delete("/executors/{ex_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_executor(
    ex_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ex = await db.get(Executor, ex_id)
    if not ex:
        raise HTTPException(status_code=404, detail="Исполнитель не найден")
    await _audit(db, user, "delete", "executor", ex.id, {
        "warehouse_id": ex.warehouse_id, "contragent_id": ex.contragent_id,
    })
    await db.delete(ex)
    await db.commit()
