# 対応履歴(inquiry_histories)テーブルの定義。
# コメントと変更ログを1つのテーブルに入れ、entry_typeで区別する。

from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import User


class HistoryEntryType(StrEnum):
    """履歴の種別。entry_typeによって使うカラムが変わる。"""

    COMMENT = "comment"
    STATUS_CHANGED = "status_changed"
    ASSIGNEE_CHANGED = "assignee_changed"


class InquiryHistory(Base):
    __tablename__ = "inquiry_histories"

    id: Mapped[int] = mapped_column(primary_key=True)
    inquiry_id: Mapped[int] = mapped_column(ForeignKey("inquiries.id"))
    entry_type: Mapped[str] = mapped_column(String(20))
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    # 担当者の変更はidではなく表示名を入れる。
    # 後から担当者名が変わっても、履歴は当時の記録のまま残したいため。
    from_value: Mapped[str | None] = mapped_column(String(100), nullable=True)
    to_value: Mapped[str | None] = mapped_column(String(100), nullable=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    user: Mapped[User | None] = relationship(lazy="joined")
