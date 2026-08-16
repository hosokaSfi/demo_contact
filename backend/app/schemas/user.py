# 担当者のAPI入出力の型。作成・更新は行わないため、レスポンス用だけを持つ。

from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
