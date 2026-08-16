# 担当者に関する業務ロジック。今は一覧の取得だけ。

from app.models.user import User
from app.repositories.user import UserRepository


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    def list_users(self) -> list[User]:
        return self.repository.find_all()
