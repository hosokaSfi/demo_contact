# 担当者(users)テーブルの読み書き。

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def find_all(self) -> list[User]:
        return list(self.db.scalars(select(User).order_by(User.id)).all())

    def find_by_id(self, user_id: int) -> User | None:
        return self.db.scalars(
            select(User).where(User.id == user_id)
        ).first()
