import json

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...auth.dependencies import get_current_user
from ...database import get_db
from ...models.audit_log import AuditLog
from ...models.user import User
from ...models.warehouse import Territory, Warehouse
from ...schemas.warehouse import (
    TerritoryCreate,
    TerritoryResponse,
    TerritoryUpdate,
    WarehouseCreate,
    WarehouseResponse,
    WarehouseUpdate,
)

log = structlog.get_logger()
router = APIRouter(prefix="/warehouses", tags=["warehouses"])


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


# ── Territories ─────────────────────────────────────────────


@router.get("/territories", response_model=list[TerritoryResponse])
async def list_territories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Territory).order_by(Territory.name))
    return result.scalars().all()


@router.post("/territories", response_model=TerritoryResponse, status_code=status.HTTP_201_CREATED)
async def create_territory(
    body: TerritoryCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Territory).where(Territory.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Территория с таким именем уже существует")
    terr = Territory(name=body.name)
    db.add(terr)
    await db.flush()
    await _audit(db, user, "create", "territory", terr.id, {"name": terr.name})
    await db.commit()
    await db.refresh(terr)
    return terr


@router.patch("/territories/{terr_id}", response_model=TerritoryResponse)
async def update_territory(
    terr_id: int,
    body: TerritoryUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    terr = await db.get(Territory, terr_id)
    if not terr:
        raise HTTPException(status_code=404, detail="Территория не найдена")
    changes = {}
    if body.name is not None and body.name != terr.name:
        dup = await db.execute(select(Territory).where(Territory.name == body.name, Territory.id != terr_id))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Территория с таким именем уже существует")
        changes["name"] = {"old": terr.name, "new": body.name}
        terr.name = body.name
    if changes:
        await _audit(db, user, "update", "territory", terr.id, changes)
        await db.commit()
        await db.refresh(terr)
    return terr


@router.delete("/territories/{terr_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_territory(
    terr_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    terr = await db.get(Territory, terr_id)
    if not terr:
        raise HTTPException(status_code=404, detail="Территория не найдена")
    await _audit(db, user, "delete", "territory", terr.id, {"name": terr.name})
    await db.delete(terr)
    await db.commit()


# ── Warehouses ──────────────────────────────────────────────


@router.get("", response_model=list[WarehouseResponse])
async def list_warehouses(
    territory_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Warehouse).order_by(Warehouse.name)
    if territory_id is not None:
        q = q.where(Warehouse.territory_id == territory_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
async def create_warehouse(
    body: WarehouseCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await db.get(Territory, body.territory_id):
        raise HTTPException(status_code=400, detail="Территория не найдена")
    wh = Warehouse(territory_id=body.territory_id, name=body.name)
    db.add(wh)
    await db.flush()
    await _audit(db, user, "create", "warehouse", wh.id, {
        "name": wh.name, "territory_id": wh.territory_id,
    })
    await db.commit()
    await db.refresh(wh)
    return wh


@router.patch("/{wh_id}", response_model=WarehouseResponse)
async def update_warehouse(
    wh_id: int,
    body: WarehouseUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wh = await db.get(Warehouse, wh_id)
    if not wh:
        raise HTTPException(status_code=404, detail="Склад не найден")
    changes = {}
    if body.name is not None and body.name != wh.name:
        changes["name"] = {"old": wh.name, "new": body.name}
        wh.name = body.name
    if body.territory_id is not None and body.territory_id != wh.territory_id:
        if not await db.get(Territory, body.territory_id):
            raise HTTPException(status_code=400, detail="Территория не найдена")
        changes["territory_id"] = {"old": wh.territory_id, "new": body.territory_id}
        wh.territory_id = body.territory_id
    if changes:
        await _audit(db, user, "update", "warehouse", wh.id, changes)
        await db.commit()
        await db.refresh(wh)
    return wh


@router.delete("/{wh_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_warehouse(
    wh_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    wh = await db.get(Warehouse, wh_id)
    if not wh:
        raise HTTPException(status_code=404, detail="Склад не найден")
    await _audit(db, user, "delete", "warehouse", wh.id, {"name": wh.name})
    await db.delete(wh)
    await db.commit()
