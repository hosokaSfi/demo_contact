# 担当者APIのHTTP入出力。割り当てのプルダウンで使う一覧だけを返す。

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.user import UserRepository
from app.schemas.user import UserResponse
from app.services.user import UserService

router = APIRouter(prefix="/api/users", tags=["users"])


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


@router.get("", response_model=list[UserResponse])
def list_users(service: UserService = Depends(get_user_service)) -> list[UserResponse]:
    users = service.list_users()
    return [UserResponse.model_validate(user) for user in users]
