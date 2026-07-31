from datetime import datetime

from pydantic import BaseModel, Field


class TmcCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class TmcCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)


class TmcCategoryResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MotherTmcCreate(BaseModel):
    category_id: int
    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)


class MotherTmcUpdate(BaseModel):
    category_id: int | None = None
    code: str | None = Field(default=None, min_length=1, max_length=100)
    name: str | None = Field(default=None, min_length=1, max_length=255)


class MotherTmcResponse(BaseModel):
    id: int
    category_id: int
    code: str
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MotherTmcDetailResponse(MotherTmcResponse):
    category: TmcCategoryResponse


class TmcCreate(BaseModel):
    mother_tmc_id: int
    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)


class TmcUpdate(BaseModel):
    mother_tmc_id: int | None = None
    code: str | None = Field(default=None, min_length=1, max_length=100)
    name: str | None = Field(default=None, min_length=1, max_length=255)


class TmcResponse(BaseModel):
    id: int
    mother_tmc_id: int
    code: str
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
