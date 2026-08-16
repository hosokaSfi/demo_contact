# お問い合わせのAPI入出力の型。用途ごとにスキーマを分ける。

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.inquiry_history import InquiryHistoryResponse
from app.schemas.user import UserResponse


class InquiryStatus(StrEnum):
    """対応状況。遷移の制約は設けず、どの状態からでも変更できる。"""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    PENDING = "pending"
    CLOSED = "closed"


class InquiryCreate(BaseModel):
    """公開フォームからの受付。"""

    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=1, max_length=255)
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1)


class InquiryStatusUpdate(BaseModel):
    status: InquiryStatus


class InquiryAssigneeUpdate(BaseModel):
    """担当者の割り当て。Noneを送ると解除になる。"""

    assignee_id: int | None


class InquiryResponse(BaseModel):
    """受付直後に返す最小限の情報。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    subject: str
    status: InquiryStatus
    created_at: datetime


class InquiryListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject: str
    name: str
    status: InquiryStatus
    assignee: UserResponse | None
    created_at: datetime


class InquiryDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    subject: str
    body: str
    status: InquiryStatus
    assignee: UserResponse | None
    created_at: datetime
    updated_at: datetime
    histories: list[InquiryHistoryResponse]
