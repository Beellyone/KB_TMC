from datetime import date, datetime

from pydantic import BaseModel, Field


class ContragentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    full_name: str | None = Field(default=None, max_length=500)
    org_form: str | None = Field(default=None, max_length=100)
    person: str | None = Field(default=None, max_length=255)
    job: str | None = Field(default=None, max_length=255)
    basis: str | None = None


class ContragentUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    full_name: str | None = None
    org_form: str | None = None
    person: str | None = None
    job: str | None = None
    basis: str | None = None


class ContragentResponse(BaseModel):
    id: int
    name: str
    full_name: str | None
    org_form: str | None
    person: str | None
    job: str | None
    basis: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExecutorCreate(BaseModel):
    warehouse_id: int
    contragent_id: int
    emails: str | None = None
    agreement_number: str | None = Field(default=None, max_length=100)
    agreement_date: date | None = None


class ExecutorUpdate(BaseModel):
    warehouse_id: int | None = None
    contragent_id: int | None = None
    emails: str | None = None
    agreement_number: str | None = None
    agreement_date: date | None = None


class ExecutorResponse(BaseModel):
    id: int
    warehouse_id: int
    contragent_id: int
    emails: str | None
    agreement_number: str | None
    agreement_date: date | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
