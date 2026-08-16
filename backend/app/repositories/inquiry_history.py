# 対応履歴(inquiry_histories)テーブルの読み書き。

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inquiry_history import InquiryHistory


class InquiryHistoryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def find_by_inquiry_id(self, inquiry_id: int) -> list[InquiryHistory]:
        statement = (
            select(InquiryHistory)
            .where(InquiryHistory.inquiry_id == inquiry_id)
            .order_by(InquiryHistory.created_at, InquiryHistory.id)
        )
        return list(self.db.scalars(statement).unique().all())

    def add(self, history: InquiryHistory) -> InquiryHistory:
        self.db.add(history)
        self.db.flush()
        return history
