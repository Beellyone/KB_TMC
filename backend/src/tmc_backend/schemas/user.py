from pydantic import BaseModel

from ..models.user import UserRole


class UserResponse(BaseModel):
    id: int
    username: str
    fio: str | None
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}
