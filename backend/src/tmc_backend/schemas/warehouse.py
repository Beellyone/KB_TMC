from datetime import datetime

from pydantic import BaseModel, Field


class TerritoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class TerritoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)


class TerritoryResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WarehouseCreate(BaseModel):
    territory_id: int
    name: str = Field(min_length=1, max_length=255)


class WarehouseUpdate(BaseModel):
    territory_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)


class WarehouseResponse(BaseModel):
    id: int
    territory_id: int
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
