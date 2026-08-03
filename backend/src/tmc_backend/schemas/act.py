from datetime import date, datetime

from pydantic import BaseModel, Field

from ..models.act import ActStatus, AttentionMark, CostApproval, StateQualification


class ActDatesUpdate(BaseModel):
    diagnostics_date: date | None = None
    verification_date: date | None = None
    invoice_date: date | None = None
    return_date: date | None = None
    confirmation_date: date | None = None
    completion_date: date | None = None


class ActDatesResponse(BaseModel):
    diagnostics_date: date | None
    verification_date: date | None
    invoice_date: date | None
    return_date: date | None
    confirmation_date: date | None
    completion_date: date | None

    model_config = {"from_attributes": True}


class ActCreate(BaseModel):
    number: str = Field(min_length=1, max_length=100)
    executor_id: int


class ActUpdate(BaseModel):
    status: ActStatus | None = None
    attention_mark: AttentionMark | None = None
    dates: ActDatesUpdate | None = None


class ActResponse(BaseModel):
    id: int
    number: str
    executor_id: int
    file_name: str
    attention_mark: AttentionMark
    status: ActStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ActDetailResponse(ActResponse):
    dates: ActDatesResponse | None = None
    repairs_count: int = 0


class UploadPreviewRow(BaseModel):
    row_number: int
    tmc_code: str
    serial_number: str
    fault_description: str
    tmc_id: int | None = None
    tmc_name: str | None = None


class UploadValidationError(BaseModel):
    row_number: int
    field: str
    message: str


class UploadValidationWarning(BaseModel):
    row_number: int
    field: str
    message: str
    is_guarantee: bool = False


class UploadPreviewResponse(BaseModel):
    rows: list[UploadPreviewRow]
    errors: list[UploadValidationError]
    warnings: list[UploadValidationWarning]
    file_name: str
    executor_id: int
    act_number: str


class ActConfirmRequest(BaseModel):
    number: str = Field(min_length=1, max_length=100)
    executor_id: int
    file_name: str
    rows: list[UploadPreviewRow]


class RepairUpdate(BaseModel):
    cost_approval: CostApproval | None = None
    state_qualification: StateQualification | None = None
    attention_mark: AttentionMark | None = None
    price: float | None = Field(default=None, ge=0)


class RepairResponse(BaseModel):
    id: int
    act_id: int
    damaged_tmc_id: int
    fault_description: str | None
    cost_approval: CostApproval
    state_qualification: StateQualification
    attention_mark: AttentionMark
    price: float
    tmc_code: str | None = None
    tmc_name: str | None = None
    serial_number: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class GuaranteeCheckRequest(BaseModel):
    tmc_id: int
    serial_number: str


class GuaranteeCheckResponse(BaseModel):
    is_guarantee: bool
    original_repair_id: int | None = None
    original_completion_date: date | None = None
    days_remaining: int | None = None
