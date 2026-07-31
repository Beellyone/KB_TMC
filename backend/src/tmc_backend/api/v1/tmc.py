import json

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...auth.dependencies import get_current_user
from ...database import get_db
from ...models.audit_log import AuditLog
from ...models.tmc import MotherTmc, Tmc, TmcCategory
from ...models.user import User
from ...schemas.tmc import (
    MotherTmcCreate,
    MotherTmcDetailResponse,
    MotherTmcResponse,
    MotherTmcUpdate,
    TmcCategoryCreate,
    TmcCategoryResponse,
    TmcCategoryUpdate,
    TmcCreate,
    TmcResponse,
    TmcUpdate,
)

log = structlog.get_logger()
router = APIRouter(prefix="/tmc", tags=["tmc"])


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


# ── Categories ──────────────────────────────────────────────


@router.get("/categories", response_model=list[TmcCategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TmcCategory).order_by(TmcCategory.name))
    return result.scalars().all()


@router.post("/categories", response_model=TmcCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    body: TmcCategoryCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(TmcCategory).where(TmcCategory.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Категория с таким именем уже существует")
    cat = TmcCategory(name=body.name)
    db.add(cat)
    await db.flush()
    await _audit(db, user, "create", "tmc_category", cat.id, {"name": cat.name})
    await db.commit()
    await db.refresh(cat)
    return cat


@router.patch("/categories/{cat_id}", response_model=TmcCategoryResponse)
async def update_category(
    cat_id: int,
    body: TmcCategoryUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cat = await db.get(TmcCategory, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    changes = {}
    if body.name is not None and body.name != cat.name:
        dup = await db.execute(select(TmcCategory).where(TmcCategory.name == body.name, TmcCategory.id != cat_id))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Категория с таким именем уже существует")
        changes["name"] = {"old": cat.name, "new": body.name}
        cat.name = body.name
    if changes:
        await _audit(db, user, "update", "tmc_category", cat.id, changes)
        await db.commit()
        await db.refresh(cat)
    return cat


@router.delete("/categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    cat_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cat = await db.get(TmcCategory, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    await _audit(db, user, "delete", "tmc_category", cat.id, {"name": cat.name})
    await db.delete(cat)
    await db.commit()


# ── Mother TMC ──────────────────────────────────────────────


@router.get("/mothers", response_model=list[MotherTmcResponse])
async def list_mothers(
    category_id: int | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    q = select(MotherTmc).order_by(MotherTmc.code)
    if category_id is not None:
        q = q.where(MotherTmc.category_id == category_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/mothers/{mother_id}", response_model=MotherTmcDetailResponse)
async def get_mother(mother_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MotherTmc).where(MotherTmc.id == mother_id).options(selectinload(MotherTmc.category))
    )
    mother = result.scalar_one_or_none()
    if not mother:
        raise HTTPException(status_code=404, detail="Материнский ТМЦ не найден")
    return mother


@router.post("/mothers", response_model=MotherTmcResponse, status_code=status.HTTP_201_CREATED)
async def create_mother(
    body: MotherTmcCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await db.get(TmcCategory, body.category_id):
        raise HTTPException(status_code=400, detail="Категория не найдена")
    dup = await db.execute(select(MotherTmc).where(MotherTmc.code == body.code))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Код уже используется")
    mother = MotherTmc(category_id=body.category_id, code=body.code, name=body.name)
    db.add(mother)
    await db.flush()
    await _audit(db, user, "create", "mother_tmc", mother.id, {
        "code": mother.code, "name": mother.name, "category_id": mother.category_id,
    })
    await db.commit()
    await db.refresh(mother)
    return mother


@router.patch("/mothers/{mother_id}", response_model=MotherTmcResponse)
async def update_mother(
    mother_id: int,
    body: MotherTmcUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mother = await db.get(MotherTmc, mother_id)
    if not mother:
        raise HTTPException(status_code=404, detail="Материнский ТМЦ не найден")
    changes = {}
    if body.code is not None and body.code != mother.code:
        dup = await db.execute(select(MotherTmc).where(MotherTmc.code == body.code, MotherTmc.id != mother_id))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Код уже используется")
        changes["code"] = {"old": mother.code, "new": body.code}
        mother.code = body.code
    if body.name is not None and body.name != mother.name:
        changes["name"] = {"old": mother.name, "new": body.name}
        mother.name = body.name
    if body.category_id is not None and body.category_id != mother.category_id:
        if not await db.get(TmcCategory, body.category_id):
            raise HTTPException(status_code=400, detail="Категория не найдена")
        changes["category_id"] = {"old": mother.category_id, "new": body.category_id}
        mother.category_id = body.category_id
    if changes:
        await _audit(db, user, "update", "mother_tmc", mother.id, changes)
        await db.commit()
        await db.refresh(mother)
    return mother


@router.delete("/mothers/{mother_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mother(
    mother_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mother = await db.get(MotherTmc, mother_id)
    if not mother:
        raise HTTPException(status_code=404, detail="Материнский ТМЦ не найден")
    await _audit(db, user, "delete", "mother_tmc", mother.id, {"code": mother.code, "name": mother.name})
    await db.delete(mother)
    await db.commit()


# ── TMC Items ───────────────────────────────────────────────


@router.get("/mothers/{mother_id}/items", response_model=list[TmcResponse])
async def list_items(mother_id: int, db: AsyncSession = Depends(get_db)):
    if not await db.get(MotherTmc, mother_id):
        raise HTTPException(status_code=404, detail="Материнский ТМЦ не найден")
    result = await db.execute(select(Tmc).where(Tmc.mother_tmc_id == mother_id).order_by(Tmc.code))
    return result.scalars().all()


@router.post("/items", response_model=TmcResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    body: TmcCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await db.get(MotherTmc, body.mother_tmc_id):
        raise HTTPException(status_code=400, detail="Материнский ТМЦ не найден")
    dup = await db.execute(select(Tmc).where(Tmc.code == body.code))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Код уже используется")
    item = Tmc(mother_tmc_id=body.mother_tmc_id, code=body.code, name=body.name)
    db.add(item)
    await db.flush()
    await _audit(db, user, "create", "tmc", item.id, {
        "code": item.code, "name": item.name, "mother_tmc_id": item.mother_tmc_id,
    })
    await db.commit()
    await db.refresh(item)
    return item


@router.patch("/items/{item_id}", response_model=TmcResponse)
async def update_item(
    item_id: int,
    body: TmcUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(Tmc, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="ТМЦ не найден")
    changes = {}
    if body.code is not None and body.code != item.code:
        dup = await db.execute(select(Tmc).where(Tmc.code == body.code, Tmc.id != item_id))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Код уже используется")
        changes["code"] = {"old": item.code, "new": body.code}
        item.code = body.code
    if body.name is not None and body.name != item.name:
        changes["name"] = {"old": item.name, "new": body.name}
        item.name = body.name
    if body.mother_tmc_id is not None and body.mother_tmc_id != item.mother_tmc_id:
        if not await db.get(MotherTmc, body.mother_tmc_id):
            raise HTTPException(status_code=400, detail="Материнский ТМЦ не найден")
        changes["mother_tmc_id"] = {"old": item.mother_tmc_id, "new": body.mother_tmc_id}
        item.mother_tmc_id = body.mother_tmc_id
    if changes:
        await _audit(db, user, "update", "tmc", item.id, changes)
        await db.commit()
        await db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(Tmc, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="ТМЦ не найден")
    await _audit(db, user, "delete", "tmc", item.id, {"code": item.code, "name": item.name})
    await db.delete(item)
    await db.commit()
