from datetime import date, datetime

from pydantic import BaseModel, Field


class SpecificationCreate(BaseModel):
    executor_id: int
    valid_from: date
    valid_until: date


class SpecificationUpdate(BaseModel):
    executor_id: int | None = None
    valid_from: date | None = None
    valid_until: date | None = None


class SpecificationResponse(BaseModel):
    id: int
    executor_id: int
    valid_from: date
    valid_until: date
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SpecMotherTmcAdd(BaseModel):
    mother_tmc_id: int


class SpecMotherTmcResponse(BaseModel):
    id: int
    specification_id: int
    mother_tmc_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SpecWorkUpsert(BaseModel):
    breakdown_source: str = Field(pattern="^(category|own)$")
    breakdown_id: int
    price: float = Field(ge=0)


class SpecWorkResponse(BaseModel):
    id: int
    spec_mother_tmc_id: int
    breakdown_source: str
    breakdown_id: int
    price: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
