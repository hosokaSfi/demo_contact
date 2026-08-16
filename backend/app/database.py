# データベース(SQLite)への接続をまとめたファイル。
# テーブル定義のもとになる Base と、APIから使う get_db() をここで用意する。

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# DBファイルの置き場所。コンテナ内の /app/data/app.db に作られる。
DATABASE_URL = "sqlite:////app/data/app.db"

# check_same_thread=False は SQLite を FastAPI から使うときのお約束。
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """モデル(テーブル定義)の親クラス。当日はこれを継承してモデルを作る。"""


def get_db() -> Generator[Session, None, None]:
    """APIの中でDBを使うための関数。Depends(get_db) の形で受け取る。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
