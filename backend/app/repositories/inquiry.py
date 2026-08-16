# お問い合わせ(inquiries)テーブルの読み書き。

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inquiry import Inquiry


class InquiryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def find_all(
        self, status: str | None = None, assignee_id: int | None = None
    ) -> list[Inquiry]:
        statement = select(Inquiry).order_by(Inquiry.created_at.desc())

        if status is not None:
            statement = statement.where(Inquiry.status == status)

        if assignee_id is not None:
            statement = statement.where(Inquiry.assignee_id == assignee_id)

        return list(self.db.scalars(statement).unique().all())

    def find_by_id(self, inquiry_id: int) -> Inquiry | None:
        return self.db.scalars(
            select(Inquiry).where(Inquiry.id == inquiry_id)
        ).unique().first()

    def add(self, inquiry: Inquiry) -> Inquiry:
        self.db.add(inquiry)
        self.db.flush()
        return inquiry
