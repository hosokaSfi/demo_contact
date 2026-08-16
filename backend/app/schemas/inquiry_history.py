# 対応履歴のAPI入出力の型。

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CommentCreate(BaseModel):
    """対応メモの投稿。user_idは操作した担当者。"""

    body: str = Field(min_length=1)
    user_id: int


class InquiryHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_type: str
    body: str | None
    from_value: str | None
    to_value: str | None
    user_name: str | None
    created_at: datetime
