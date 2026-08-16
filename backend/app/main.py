# FastAPIアプリの入口。CORSの設定と、疎通確認用の /api/health だけを持つ。
# 起動時にテーブルを作るので、当日モデルを追加すればそのままDBに反映される。

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, SessionLocal, engine

# create_all がテーブルを作れるよう、モデルを読み込ませる。
from app.models import inquiry, inquiry_history, user  # noqa: F401
from app.seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """起動時に、モデルの定義どおりにテーブルを作り、動作確認用のデータを入れる。"""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()

    yield


app = FastAPI(title="Inquiry Demo API", lifespan=lifespan)

# フロントエンド(http://localhost:3000)からのアクセスを許可する。
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    """フロントから叩いて疎通を確かめるためのAPI。"""
    return {"status": "ok"}
