# お問い合わせ管理システム 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** お問い合わせの受付・一覧・詳細・ステータス変更・担当者割り当て・対応履歴を扱う管理システムを作る。

**Architecture:** バックエンドは `routers → services → repositories → models` の4層で、各層は1つ下の層だけを呼ぶ。フロントエンドは Server Component を既定とし、状態を持つ部分だけ Client Component に切り出す。対応履歴はコメントと変更ログを1テーブルに統合し、時系列のタイムラインとして表示する。

**Tech Stack:** FastAPI / SQLAlchemy 2.x / Pydantic v2 / SQLite / Next.js 16 App Router / React 19 / TypeScript / Tailwind CSS v4

**設計書:** `docs/superpowers/specs/2026-08-16-inquiry-management-design.md`

**テスト方針:** 自動テストは導入しない（ライブラリを増やさない方針のため）。
各タスクの検証は `curl` によるAPIの疎通確認と、ブラウザでの動作確認で行う。

---

## 前提: 開発環境の起動

作業中は常にバックエンドを起動しておく。

```bash
make up
```

コードを変更すると uvicorn が自動でリロードする。
リロードされない場合や `create_all` を効かせたい場合は `make up` をもう一度実行する。

フロントエンドの確認が必要なタスクでは、別のターミナルで以下を起動する。

```bash
make dev
```

---

## ファイル構成

このプランで作成・変更するファイルの一覧。

### backend

| ファイル | 責務 |
| --- | --- |
| `backend/app/models/user.py` | users テーブルの定義 |
| `backend/app/models/inquiry.py` | inquiries テーブルの定義 |
| `backend/app/models/inquiry_history.py` | inquiry_histories テーブルの定義と entry_type の Enum |
| `backend/app/schemas/user.py` | 担当者のレスポンス型 |
| `backend/app/schemas/inquiry.py` | お問い合わせの入出力型と status の Enum |
| `backend/app/schemas/inquiry_history.py` | 履歴のレスポンス型とコメント投稿の入力型 |
| `backend/app/repositories/user.py` | users の読み取り |
| `backend/app/repositories/inquiry.py` | inquiries の読み書き |
| `backend/app/repositories/inquiry_history.py` | inquiry_histories の読み書き |
| `backend/app/services/user.py` | 担当者一覧の取得 |
| `backend/app/services/inquiry.py` | 業務ロジック。履歴の自動記録とトランザクション境界 |
| `backend/app/routers/user.py` | `/api/users` のHTTP入出力 |
| `backend/app/routers/inquiry.py` | `/api/inquiries` のHTTP入出力 |
| `backend/app/seed.py` | 起動時のシードデータ投入 |
| `backend/app/main.py` | ルーターの登録とシードの呼び出し（変更） |

### frontend

| ファイル | 責務 |
| --- | --- |
| `frontend/lib/api.ts` | `apiPost` / `apiPatch` を追加（変更） |
| `frontend/lib/types.ts` | 複数画面で使うAPIレスポンスの型 |
| `frontend/app/_components/StatusBadge.tsx` | ステータスの色付きバッジ |
| `frontend/app/page.tsx` | トップページの導線（変更） |
| `frontend/app/contact/page.tsx` | 公開の問い合わせフォームのページ |
| `frontend/app/contact/_components/ContactForm.tsx` | フォームの入力と送信 |
| `frontend/app/inquiries/page.tsx` | 一覧ページ |
| `frontend/app/inquiries/_components/InquiryTable.tsx` | 一覧のテーブル |
| `frontend/app/inquiries/_components/InquiryFilter.tsx` | 絞り込みのセレクト |
| `frontend/app/inquiries/[id]/page.tsx` | 詳細ページ |
| `frontend/app/inquiries/[id]/_components/InquiryDetailCard.tsx` | 問い合わせ内容の表示 |
| `frontend/app/inquiries/[id]/_components/OperatorContext.tsx` | 操作者の選択状態を配下で共有する |
| `frontend/app/inquiries/[id]/_components/OperatorSelect.tsx` | 操作者のセレクト |
| `frontend/app/inquiries/[id]/_components/StatusSelect.tsx` | ステータス変更 |
| `frontend/app/inquiries/[id]/_components/AssigneeSelect.tsx` | 担当者の割り当て・解除 |
| `frontend/app/inquiries/[id]/_components/CommentForm.tsx` | 対応メモの投稿 |
| `frontend/app/inquiries/[id]/_components/HistoryTimeline.tsx` | 履歴のタイムライン |

---

## Task 1: モデルの定義

**Files:**
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/inquiry.py`
- Create: `backend/app/models/inquiry_history.py`

- [ ] **Step 1: users モデルを作る**

`backend/app/models/user.py`:

```python
# 担当者(users)テーブルの定義。
# 認証は行わないため、パスワードや権限のカラムは持たない。

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
```

- [ ] **Step 2: inquiries モデルを作る**

`backend/app/models/inquiry.py`:

```python
# お問い合わせ(inquiries)テーブルの定義。
# statusの取りうる値は schemas/inquiry.py の InquiryStatus に揃える。

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import User


class Inquiry(Base):
    __tablename__ = "inquiries"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255))
    subject: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="open")
    assignee_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # 一覧・詳細で担当者名を出すため、参照だけできるようにしておく。
    assignee: Mapped[User | None] = relationship(lazy="joined")
```

- [ ] **Step 3: inquiry_histories モデルを作る**

`backend/app/models/inquiry_history.py`:

```python
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
```

- [ ] **Step 4: main.py にモデルを読み込ませる**

`create_all` はインポートされたモデルしか作らない。
`backend/app/main.py` の `from app.database import Base, engine` の直後に以下を追加する。

```python
# create_all がテーブルを作れるよう、モデルを読み込ませる。
from app.models import inquiry, inquiry_history, user  # noqa: F401
```

- [ ] **Step 5: テーブルが作られることを確認する**

```bash
make up && docker compose exec -T backend python -c "import sqlite3; print([r[0] for r in sqlite3.connect('/app/data/app.db').execute(\"select name from sqlite_master where type='table'\")])"
```

Expected: `['users', 'inquiries', 'inquiry_histories']` が含まれる

- [ ] **Step 6: コミット**

```bash
git add backend/app/models backend/app/main.py
git commit -m "feat: お問い合わせ・担当者・対応履歴のモデルを追加"
```

---

## Task 2: スキーマの定義

**Files:**
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/schemas/inquiry_history.py`
- Create: `backend/app/schemas/inquiry.py`

- [ ] **Step 1: 担当者のスキーマを作る**

`backend/app/schemas/user.py`:

```python
# 担当者のAPI入出力の型。作成・更新は行わないため、レスポンス用だけを持つ。

from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
```

- [ ] **Step 2: 履歴のスキーマを作る**

`backend/app/schemas/inquiry_history.py`:

```python
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
```

`user_name` はモデルに無いため、Repositoryやroutersでそのまま詰めることはできない。
Task 6 で `InquiryHistory` から組み立てる関数を用意する。

- [ ] **Step 3: お問い合わせのスキーマを作る**

`backend/app/schemas/inquiry.py`:

```python
# お問い合わせのAPI入出力の型。用途ごとにスキーマを分ける。

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.inquiry_history import InquiryHistoryResponse
from app.schemas.user import UserResponse


class InquiryStatus(StrEnum):
    """対応状況。遷移の制約は設けず、どの状態からでも変更できる。"""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    PENDING = "pending"
    CLOSED = "closed"


class InquiryCreate(BaseModel):
    """公開フォームからの受付。"""

    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1)


class InquiryStatusUpdate(BaseModel):
    status: InquiryStatus


class InquiryAssigneeUpdate(BaseModel):
    """担当者の割り当て。Noneを送ると解除になる。"""

    assignee_id: int | None


class InquiryResponse(BaseModel):
    """受付直後に返す最小限の情報。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    subject: str
    status: InquiryStatus
    created_at: datetime


class InquiryListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject: str
    name: str
    status: InquiryStatus
    assignee: UserResponse | None
    created_at: datetime


class InquiryDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    subject: str
    body: str
    status: InquiryStatus
    assignee: UserResponse | None
    created_at: datetime
    updated_at: datetime
    histories: list[InquiryHistoryResponse]
```

- [ ] **Step 4: EmailStr が使えることを確認する**

`EmailStr` には `email-validator` が必要。入っていなければ FastAPI の起動時にエラーになる。

```bash
docker compose exec -T backend python -c "from pydantic import EmailStr; from pydantic import BaseModel; \
class M(BaseModel): e: EmailStr" 2>&1 | tail -3
```

Expected: エラーが出ない

エラーが出た場合は `EmailStr` を使わず、`email: str = Field(min_length=1, max_length=255)` に変更する。
ライブラリを増やさない方針のため、`email-validator` は追加しない。

- [ ] **Step 5: import が通ることを確認する**

```bash
docker compose exec -T backend python -c "from app.schemas.inquiry import InquiryDetail, InquiryStatus; print(list(InquiryStatus))"
```

Expected: 4つのステータスが表示される

- [ ] **Step 6: コミット**

```bash
git add backend/app/schemas
git commit -m "feat: お問い合わせ・担当者・対応履歴のスキーマを追加"
```

---

## Task 3: リポジトリの実装

**Files:**
- Create: `backend/app/repositories/user.py`
- Create: `backend/app/repositories/inquiry.py`
- Create: `backend/app/repositories/inquiry_history.py`

Repositoryは `commit()` を呼ばない。`add` / `flush` までに留める。
`commit()` はService側で行い、1リクエストの複数の書き込みを1つにまとめる。

- [ ] **Step 1: 担当者のリポジトリを作る**

`backend/app/repositories/user.py`:

```python
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
```

- [ ] **Step 2: お問い合わせのリポジトリを作る**

`backend/app/repositories/inquiry.py`:

```python
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
```

`lazy="joined"` を使っているため、結果に `unique()` が必要になる。

- [ ] **Step 3: 対応履歴のリポジトリを作る**

`backend/app/repositories/inquiry_history.py`:

```python
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
```

同じ秒に複数の履歴が入ることがあるため、`created_at` だけでなく `id` でも並べる。

- [ ] **Step 4: import が通ることを確認する**

```bash
docker compose exec -T backend python -c "from app.repositories.inquiry import InquiryRepository; from app.repositories.inquiry_history import InquiryHistoryRepository; from app.repositories.user import UserRepository; print('ok')"
```

Expected: `ok`

- [ ] **Step 5: コミット**

```bash
git add backend/app/repositories
git commit -m "feat: お問い合わせ・担当者・対応履歴のリポジトリを追加"
```

---

## Task 4: 担当者APIの実装

先に小さい方のAPIを一周させ、層のつなぎ方を確認する。

**Files:**
- Create: `backend/app/services/user.py`
- Create: `backend/app/routers/user.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: 担当者のサービスを作る**

`backend/app/services/user.py`:

```python
# 担当者に関する業務ロジック。今は一覧の取得だけ。

from app.models.user import User
from app.repositories.user import UserRepository


class UserService:
    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    def list_users(self) -> list[User]:
        return self.repository.find_all()
```

- [ ] **Step 2: 担当者のルーターを作る**

`backend/app/routers/user.py`:

```python
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
```

- [ ] **Step 3: main.py にルーターを登録する**

`backend/app/main.py` の CORS 設定の後に追加する。

```python
from app.routers import user

app.include_router(user.router)
```

`from app.routers import user` はファイル先頭のimport群に置く。

- [ ] **Step 4: 疎通を確認する**

```bash
make up && sleep 3 && curl -s http://localhost:8001/api/users
```

Expected: `[]`（シードはまだ無いので空配列）

- [ ] **Step 5: コミット**

```bash
git add backend/app/services/user.py backend/app/routers/user.py backend/app/main.py
git commit -m "feat: 担当者一覧APIを追加"
```

---

## Task 5: シードデータの投入

動作確認のためのデータを先に用意する。

**Files:**
- Create: `backend/app/seed.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: seed.py を作る**

`backend/app/seed.py`:

```python
# 起動時に動作確認用のデータを入れる。
# usersが0件のときだけ実行するので、再起動しても重複しない。

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.inquiry import Inquiry
from app.models.inquiry_history import HistoryEntryType, InquiryHistory
from app.models.user import User

USERS = [
    {"name": "佐藤 太郎", "email": "sato@example.com"},
    {"name": "鈴木 花子", "email": "suzuki@example.com"},
    {"name": "高橋 次郎", "email": "takahashi@example.com"},
]

INQUIRIES = [
    {
        "name": "山田 一郎",
        "email": "yamada@example.com",
        "subject": "ログインできない",
        "body": "パスワードを再設定しましたが、ログイン画面でエラーになります。",
        "status": "open",
        "assignee_index": None,
    },
    {
        "name": "田中 美咲",
        "email": "tanaka@example.com",
        "subject": "請求書の再発行をお願いしたい",
        "body": "先月分の請求書を紛失しました。再発行は可能でしょうか。",
        "status": "in_progress",
        "assignee_index": 0,
    },
    {
        "name": "伊藤 健",
        "email": "ito@example.com",
        "subject": "アカウントの解約について",
        "body": "解約の手順を教えてください。データはどうなりますか。",
        "status": "pending",
        "assignee_index": 1,
    },
    {
        "name": "渡辺 さくら",
        "email": "watanabe@example.com",
        "subject": "機能の追加要望",
        "body": "CSVの一括取り込みができると助かります。",
        "status": "closed",
        "assignee_index": 2,
    },
    {
        "name": "中村 大輔",
        "email": "nakamura@example.com",
        "subject": "画面の表示が崩れる",
        "body": "スマートフォンで開くと、表がはみ出して読めません。",
        "status": "open",
        "assignee_index": None,
    },
]


def seed(db: Session) -> None:
    """動作確認用のデータを入れる。すでにusersがあれば何もしない。"""
    if db.scalars(select(User)).first() is not None:
        return

    users = [User(name=u["name"], email=u["email"]) for u in USERS]
    db.add_all(users)
    db.flush()

    for item in INQUIRIES:
        index = item["assignee_index"]
        assignee = users[index] if index is not None else None
        inquiry = Inquiry(
            name=item["name"],
            email=item["email"],
            subject=item["subject"],
            body=item["body"],
            status=item["status"],
            assignee_id=assignee.id if assignee is not None else None,
        )
        db.add(inquiry)
        db.flush()

        # 担当者がいるものには、割り当ての履歴を残しておく。
        if assignee is not None:
            db.add(
                InquiryHistory(
                    inquiry_id=inquiry.id,
                    entry_type=HistoryEntryType.ASSIGNEE_CHANGED,
                    from_value=None,
                    to_value=assignee.name,
                    user_id=assignee.id,
                )
            )

        # 未対応以外のものには、ステータス変更とコメントを残しておく。
        if item["status"] != "open" and assignee is not None:
            db.add(
                InquiryHistory(
                    inquiry_id=inquiry.id,
                    entry_type=HistoryEntryType.STATUS_CHANGED,
                    from_value="open",
                    to_value=item["status"],
                    user_id=assignee.id,
                )
            )
            db.add(
                InquiryHistory(
                    inquiry_id=inquiry.id,
                    entry_type=HistoryEntryType.COMMENT,
                    body="お問い合わせありがとうございます。確認いたします。",
                    user_id=assignee.id,
                )
            )

    db.commit()
```

- [ ] **Step 2: main.py から呼ぶ**

`backend/app/main.py` の `lifespan` を次のように変更する。

```python
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
```

import を追加する。

```python
from app.database import Base, SessionLocal, engine
from app.seed import seed
```

- [ ] **Step 3: シードが入ることを確認する**

```bash
make up && sleep 3 && curl -s http://localhost:8001/api/users
```

Expected: 3件の担当者が返る

- [ ] **Step 4: 再起動しても重複しないことを確認する**

```bash
make up && sleep 3 && curl -s http://localhost:8001/api/users | python3 -c "import json,sys; print(len(json.load(sys.stdin)))"
```

Expected: `3`

- [ ] **Step 5: コミット**

```bash
git add backend/app/seed.py backend/app/main.py
git commit -m "feat: 動作確認用のシードデータを追加"
```

---

## Task 6: お問い合わせサービスの実装

このプランの中心。履歴の自動記録とトランザクション境界をここに置く。

**Files:**
- Create: `backend/app/services/inquiry.py`

- [ ] **Step 1: サービスを作る**

`backend/app/services/inquiry.py`:

```python
# お問い合わせの業務ロジック。
# ステータスと担当者の変更では、履歴を自動で記録する。
# commit()はこの層でだけ呼び、1リクエストの書き込みを1つにまとめる。

from enum import StrEnum

from app.models.inquiry import Inquiry
from app.models.inquiry_history import HistoryEntryType, InquiryHistory
from app.repositories.inquiry import InquiryRepository
from app.repositories.inquiry_history import InquiryHistoryRepository
from app.repositories.user import UserRepository


class AssigneeUpdateError(StrEnum):
    """担当者の割り当てが失敗した理由。routersがHTTPステータスに変換する。"""

    INQUIRY_NOT_FOUND = "inquiry_not_found"
    USER_NOT_FOUND = "user_not_found"


class InquiryService:
    def __init__(
        self,
        repository: InquiryRepository,
        history_repository: InquiryHistoryRepository,
        user_repository: UserRepository,
    ) -> None:
        self.repository = repository
        self.history_repository = history_repository
        self.user_repository = user_repository

    def list_inquiries(
        self, status: str | None = None, assignee_id: int | None = None
    ) -> list[Inquiry]:
        return self.repository.find_all(status=status, assignee_id=assignee_id)

    def get_inquiry(self, inquiry_id: int) -> Inquiry | None:
        return self.repository.find_by_id(inquiry_id)

    def get_histories(self, inquiry_id: int) -> list[InquiryHistory]:
        return self.history_repository.find_by_inquiry_id(inquiry_id)

    def create_inquiry(
        self, name: str, email: str, subject: str, body: str
    ) -> Inquiry:
        inquiry = Inquiry(
            name=name, email=email, subject=subject, body=body, status="open"
        )
        self.repository.add(inquiry)
        self.repository.db.commit()
        self.repository.db.refresh(inquiry)
        return inquiry

    def update_status(
        self, inquiry_id: int, status: str, user_id: int | None
    ) -> Inquiry | None:
        inquiry = self.repository.find_by_id(inquiry_id)

        if inquiry is None:
            return None

        # 値が変わらないときは履歴を残さない。
        # 同じ状態を選び直しただけでタイムラインが埋まるのを防ぐため。
        if inquiry.status != status:
            self.history_repository.add(
                InquiryHistory(
                    inquiry_id=inquiry.id,
                    entry_type=HistoryEntryType.STATUS_CHANGED,
                    from_value=inquiry.status,
                    to_value=status,
                    user_id=user_id,
                )
            )
            inquiry.status = status

        self.repository.db.commit()
        self.repository.db.refresh(inquiry)
        return inquiry

    def update_assignee(
        self, inquiry_id: int, assignee_id: int | None, user_id: int | None
    ) -> tuple[Inquiry | None, AssigneeUpdateError | None]:
        """更新結果と失敗理由を組で返す。

        「お問い合わせが無い」と「担当者が無い」でHTTPステータスが変わるため、
        Noneだけではrouters側が区別できない。例外クラスは作らずここで表す。
        """
        inquiry = self.repository.find_by_id(inquiry_id)

        if inquiry is None:
            return None, AssigneeUpdateError.INQUIRY_NOT_FOUND

        new_assignee = None

        if assignee_id is not None:
            new_assignee = self.user_repository.find_by_id(assignee_id)

            if new_assignee is None:
                return None, AssigneeUpdateError.USER_NOT_FOUND

        if inquiry.assignee_id != assignee_id:
            # 履歴には表示名を入れる。あとで担当者名が変わっても記録は当時のまま。
            self.history_repository.add(
                InquiryHistory(
                    inquiry_id=inquiry.id,
                    entry_type=HistoryEntryType.ASSIGNEE_CHANGED,
                    from_value=(
                        inquiry.assignee.name if inquiry.assignee is not None else None
                    ),
                    to_value=(
                        new_assignee.name if new_assignee is not None else None
                    ),
                    user_id=user_id,
                )
            )
            inquiry.assignee_id = assignee_id

        self.repository.db.commit()
        self.repository.db.refresh(inquiry)
        return inquiry, None

    def add_comment(
        self, inquiry_id: int, body: str, user_id: int
    ) -> InquiryHistory | None:
        inquiry = self.repository.find_by_id(inquiry_id)

        if inquiry is None:
            return None

        history = self.history_repository.add(
            InquiryHistory(
                inquiry_id=inquiry.id,
                entry_type=HistoryEntryType.COMMENT,
                body=body,
                user_id=user_id,
            )
        )
        self.repository.db.commit()
        self.repository.db.refresh(history)
        return history
```

- [ ] **Step 2: import が通ることを確認する**

```bash
docker compose exec -T backend python -c "from app.services.inquiry import InquiryService, AssigneeUpdateError; print(list(AssigneeUpdateError))"
```

Expected: 2つの理由が表示される

- [ ] **Step 3: コミット**

```bash
git add backend/app/services/inquiry.py
git commit -m "feat: お問い合わせサービスと対応履歴の自動記録を追加"
```

---

## Task 7: お問い合わせAPIの実装

**Files:**
- Create: `backend/app/routers/inquiry.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: ルーターを作る**

`backend/app/routers/inquiry.py`:

```python
# お問い合わせAPIのHTTP入出力。
# 業務的な失敗はServiceの戻り値で受け取り、ここでHTTPExceptionに変換する。

from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.inquiry import Inquiry
from app.models.inquiry_history import InquiryHistory
from app.repositories.inquiry import InquiryRepository
from app.repositories.inquiry_history import InquiryHistoryRepository
from app.repositories.user import UserRepository
from app.schemas.inquiry import (
    InquiryAssigneeUpdate,
    InquiryCreate,
    InquiryDetail,
    InquiryListItem,
    InquiryResponse,
    InquiryStatus,
    InquiryStatusUpdate,
)
from app.schemas.inquiry_history import CommentCreate, InquiryHistoryResponse
from app.services.inquiry import AssigneeUpdateError, InquiryService

router = APIRouter(prefix="/api/inquiries", tags=["inquiries"])


def get_inquiry_service(db: Session = Depends(get_db)) -> InquiryService:
    return InquiryService(
        InquiryRepository(db),
        InquiryHistoryRepository(db),
        UserRepository(db),
    )


def to_history_response(history: InquiryHistory) -> InquiryHistoryResponse:
    """履歴のモデルをレスポンスに詰め替える。user_nameはリレーションから取る。"""
    return InquiryHistoryResponse(
        id=history.id,
        entry_type=history.entry_type,
        body=history.body,
        from_value=history.from_value,
        to_value=history.to_value,
        user_name=history.user.name if history.user is not None else None,
        created_at=history.created_at,
    )


def to_detail(inquiry: Inquiry, histories: list[InquiryHistory]) -> InquiryDetail:
    return InquiryDetail(
        id=inquiry.id,
        name=inquiry.name,
        email=inquiry.email,
        subject=inquiry.subject,
        body=inquiry.body,
        status=InquiryStatus(inquiry.status),
        assignee=inquiry.assignee,
        created_at=inquiry.created_at,
        updated_at=inquiry.updated_at,
        histories=[to_history_response(h) for h in histories],
    )


@router.get("", response_model=list[InquiryListItem])
def list_inquiries(
    status: InquiryStatus | None = None,
    assignee_id: int | None = None,
    service: InquiryService = Depends(get_inquiry_service),
) -> list[InquiryListItem]:
    inquiries = service.list_inquiries(status=status, assignee_id=assignee_id)
    return [InquiryListItem.model_validate(i) for i in inquiries]


@router.get("/{inquiry_id}", response_model=InquiryDetail)
def get_inquiry(
    inquiry_id: int, service: InquiryService = Depends(get_inquiry_service)
) -> InquiryDetail:
    inquiry = service.get_inquiry(inquiry_id)

    if inquiry is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="お問い合わせが見つかりません",
        )

    return to_detail(inquiry, service.get_histories(inquiry_id))


@router.post(
    "", response_model=InquiryResponse, status_code=http_status.HTTP_201_CREATED
)
def create_inquiry(
    payload: InquiryCreate, service: InquiryService = Depends(get_inquiry_service)
) -> InquiryResponse:
    inquiry = service.create_inquiry(
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        body=payload.body,
    )
    return InquiryResponse.model_validate(inquiry)


@router.patch("/{inquiry_id}/status", response_model=InquiryDetail)
def update_status(
    inquiry_id: int,
    payload: InquiryStatusUpdate,
    user_id: int | None = None,
    service: InquiryService = Depends(get_inquiry_service),
) -> InquiryDetail:
    inquiry = service.update_status(inquiry_id, payload.status, user_id)

    if inquiry is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="お問い合わせが見つかりません",
        )

    return to_detail(inquiry, service.get_histories(inquiry_id))


@router.patch("/{inquiry_id}/assignee", response_model=InquiryDetail)
def update_assignee(
    inquiry_id: int,
    payload: InquiryAssigneeUpdate,
    user_id: int | None = None,
    service: InquiryService = Depends(get_inquiry_service),
) -> InquiryDetail:
    inquiry, error = service.update_assignee(inquiry_id, payload.assignee_id, user_id)

    if error is AssigneeUpdateError.INQUIRY_NOT_FOUND:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="お問い合わせが見つかりません",
        )

    if error is AssigneeUpdateError.USER_NOT_FOUND:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="指定された担当者が見つかりません",
        )

    if inquiry is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="お問い合わせが見つかりません",
        )

    return to_detail(inquiry, service.get_histories(inquiry_id))


@router.post(
    "/{inquiry_id}/comments",
    response_model=InquiryHistoryResponse,
    status_code=http_status.HTTP_201_CREATED,
)
def add_comment(
    inquiry_id: int,
    payload: CommentCreate,
    service: InquiryService = Depends(get_inquiry_service),
) -> InquiryHistoryResponse:
    history = service.add_comment(inquiry_id, payload.body, payload.user_id)

    if history is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="お問い合わせが見つかりません",
        )

    return to_history_response(history)
```

`user_id`（操作した担当者）はクエリパラメータで受ける。
ステータスと担当者の更新では、変更内容と操作者は別のものなので、本文に混ぜない。

- [ ] **Step 2: main.py にルーターを登録する**

```python
from app.routers import inquiry, user

app.include_router(user.router)
app.include_router(inquiry.router)
```

- [ ] **Step 3: 一覧と詳細を確認する**

```bash
make up && sleep 3 && curl -s http://localhost:8001/api/inquiries | python3 -m json.tool | head -20
```

Expected: 5件のお問い合わせが返る

```bash
curl -s http://localhost:8001/api/inquiries/2 | python3 -m json.tool
```

Expected: `histories` に3件の履歴が入っている

- [ ] **Step 4: 絞り込みを確認する**

```bash
curl -s "http://localhost:8001/api/inquiries?status=open" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))"
```

Expected: `2`

```bash
curl -s "http://localhost:8001/api/inquiries?assignee_id=1" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))"
```

Expected: `1`

- [ ] **Step 5: 受付を確認する**

```bash
curl -s -X POST http://localhost:8001/api/inquiries \
  -H 'Content-Type: application/json' \
  -d '{"name":"テスト","email":"test@example.com","subject":"確認","body":"本文です"}'
```

Expected: 201 で `{"id":6,...,"status":"open",...}` が返る

- [ ] **Step 6: ステータス変更と履歴を確認する**

```bash
curl -s -X PATCH "http://localhost:8001/api/inquiries/6/status?user_id=1" \
  -H 'Content-Type: application/json' -d '{"status":"in_progress"}' \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['status'], d['histories'])"
```

Expected: `in_progress` と、`status_changed`（open→in_progress）の履歴が1件

同じステータスをもう一度送り、履歴が増えないことを確認する。

```bash
curl -s -X PATCH "http://localhost:8001/api/inquiries/6/status?user_id=1" \
  -H 'Content-Type: application/json' -d '{"status":"in_progress"}' \
  | python3 -c "import json,sys; print(len(json.load(sys.stdin)['histories']))"
```

Expected: `1`（増えない）

- [ ] **Step 7: 担当者の割り当てとエラーを確認する**

```bash
curl -s -X PATCH "http://localhost:8001/api/inquiries/6/assignee?user_id=1" \
  -H 'Content-Type: application/json' -d '{"assignee_id":2}' \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['assignee'], len(d['histories']))"
```

Expected: 鈴木 花子 が担当者になり、履歴が2件になる

存在しない担当者を指定する。

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:8001/api/inquiries/6/assignee \
  -H 'Content-Type: application/json' -d '{"assignee_id":999}'
```

Expected: `400`

存在しないお問い合わせを指定する。

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:8001/api/inquiries/999/assignee \
  -H 'Content-Type: application/json' -d '{"assignee_id":1}'
```

Expected: `404`

- [ ] **Step 8: コメント投稿と不正な値を確認する**

```bash
curl -s -X POST http://localhost:8001/api/inquiries/6/comments \
  -H 'Content-Type: application/json' -d '{"body":"折り返し連絡しました","user_id":1}'
```

Expected: 201 で `entry_type` が `comment`、`user_name` が 佐藤 太郎

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:8001/api/inquiries/6/status \
  -H 'Content-Type: application/json' -d '{"status":"unknown"}'
```

Expected: `422`

- [ ] **Step 9: コミット**

```bash
git add backend/app/routers/inquiry.py backend/app/main.py
git commit -m "feat: お問い合わせAPIを追加"
```

---

## Task 8: APIクライアントと共通の型

**Files:**
- Modify: `frontend/lib/api.ts`
- Create: `frontend/lib/types.ts`

- [ ] **Step 1: api.ts に apiPost / apiPatch を追加する**

`frontend/lib/api.ts` の末尾に追加する。既存の `apiGet` はそのまま残す。

```typescript
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`APIエラー: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`APIエラー: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}
```

`apiGet` にキャッシュを無効化する設定を足す。Server Component から呼ぶとき、
更新後に古いデータが返らないようにするため。`apiGet` の `fetch` を次のように変える。

```typescript
  const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
```

- [ ] **Step 2: 共通の型を作る**

`frontend/lib/types.ts`:

```typescript
// 複数の画面で使うAPIレスポンスの型。
// 1つの画面でしか使わない型は、その画面のファイルに置く。

export type InquiryStatus = "open" | "in_progress" | "pending" | "closed";

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  open: "未対応",
  in_progress: "対応中",
  pending: "保留",
  closed: "完了",
};

export type User = {
  id: number;
  name: string;
  email: string;
};

export type InquiryListItem = {
  id: number;
  subject: string;
  name: string;
  status: InquiryStatus;
  assignee: User | null;
  created_at: string;
};

export type InquiryHistory = {
  id: number;
  entry_type: "comment" | "status_changed" | "assignee_changed";
  body: string | null;
  from_value: string | null;
  to_value: string | null;
  user_name: string | null;
  created_at: string;
};

export type InquiryDetail = {
  id: number;
  name: string;
  email: string;
  subject: string;
  body: string;
  status: InquiryStatus;
  assignee: User | null;
  created_at: string;
  updated_at: string;
  histories: InquiryHistory[];
};
```

- [ ] **Step 3: 型チェックを通す**

```bash
cd frontend && npx tsc --noEmit
```

Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add frontend/lib
git commit -m "feat: APIクライアントに送信用の関数と共通の型を追加"
```

---

## Task 9: ステータスバッジと一覧画面

**Files:**
- Create: `frontend/app/_components/StatusBadge.tsx`
- Create: `frontend/app/inquiries/page.tsx`
- Create: `frontend/app/inquiries/_components/InquiryTable.tsx`
- Create: `frontend/app/inquiries/_components/InquiryFilter.tsx`

- [ ] **Step 1: StatusBadge を作る**

`frontend/app/_components/StatusBadge.tsx`:

```tsx
// ステータスを色付きのバッジで表示する。一覧と詳細の両方で使う。

import { STATUS_LABELS, type InquiryStatus } from "@/lib/types";

const STATUS_CLASSES: Record<InquiryStatus, string> = {
  open: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-800",
  closed: "bg-green-100 text-green-700",
};

type Props = {
  status: InquiryStatus;
};

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
```

- [ ] **Step 2: InquiryTable を作る**

`frontend/app/inquiries/_components/InquiryTable.tsx`:

```tsx
// お問い合わせの一覧を表で表示する。表示だけなのでServer Component。

import Link from "next/link";

import { StatusBadge } from "@/app/_components/StatusBadge";
import type { InquiryListItem } from "@/lib/types";

type Props = {
  inquiries: InquiryListItem[];
};

export function InquiryTable({ inquiries }: Props) {
  if (inquiries.length === 0) {
    return <p className="py-8 text-gray-500">お問い合わせがありません。</p>;
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b bg-gray-50 text-left">
          <th className="p-3">件名</th>
          <th className="p-3">お問い合わせ者</th>
          <th className="p-3">対応状況</th>
          <th className="p-3">担当者</th>
          <th className="p-3">受付日時</th>
        </tr>
      </thead>
      <tbody>
        {inquiries.map((inquiry) => (
          <tr key={inquiry.id} className="border-b hover:bg-gray-50">
            <td className="p-3">
              <Link
                href={`/inquiries/${inquiry.id}`}
                className="text-blue-600 hover:underline"
              >
                {inquiry.subject}
              </Link>
            </td>
            <td className="p-3">{inquiry.name}</td>
            <td className="p-3">
              <StatusBadge status={inquiry.status} />
            </td>
            <td className="p-3">{inquiry.assignee?.name ?? "未割り当て"}</td>
            <td className="p-3 text-gray-500">
              {new Date(inquiry.created_at).toLocaleString("ja-JP")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 3: InquiryFilter を作る**

`frontend/app/inquiries/_components/InquiryFilter.tsx`:

```tsx
"use client";

// 一覧の絞り込み。選んだらURLのクエリを書き換えるだけで、状態は持たない。

import { useRouter } from "next/navigation";

import { STATUS_LABELS, type InquiryStatus, type User } from "@/lib/types";

type Props = {
  users: User[];
  currentStatus: string;
  currentAssigneeId: string;
};

const STATUSES: InquiryStatus[] = ["open", "in_progress", "pending", "closed"];

export function InquiryFilter({ users, currentStatus, currentAssigneeId }: Props) {
  const router = useRouter();

  const move = (status: string, assigneeId: string) => {
    const params = new URLSearchParams();

    if (status !== "") {
      params.set("status", status);
    }

    if (assigneeId !== "") {
      params.set("assignee_id", assigneeId);
    }

    const query = params.toString();
    router.push(query === "" ? "/inquiries" : `/inquiries?${query}`);
  };

  return (
    <div className="flex gap-4">
      <label className="flex items-center gap-2 text-sm">
        対応状況
        <select
          className="rounded border px-2 py-1"
          value={currentStatus}
          onChange={(e) => move(e.target.value, currentAssigneeId)}
        >
          <option value="">すべて</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        担当者
        <select
          className="rounded border px-2 py-1"
          value={currentAssigneeId}
          onChange={(e) => move(currentStatus, e.target.value)}
        >
          <option value="">すべて</option>
          {users.map((user) => (
            <option key={user.id} value={String(user.id)}>
              {user.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
```

- [ ] **Step 4: 一覧ページを作る**

`frontend/app/inquiries/page.tsx`:

```tsx
// お問い合わせ一覧のページ。絞り込み条件はURLのクエリから読む。

import { InquiryFilter } from "./_components/InquiryFilter";
import { InquiryTable } from "./_components/InquiryTable";
import { apiGet } from "@/lib/api";
import type { InquiryListItem, User } from "@/lib/types";

type Props = {
  searchParams: Promise<{ status?: string; assignee_id?: string }>;
};

export default async function InquiriesPage({ searchParams }: Props) {
  const { status = "", assignee_id: assigneeId = "" } = await searchParams;

  const params = new URLSearchParams();

  if (status !== "") {
    params.set("status", status);
  }

  if (assigneeId !== "") {
    params.set("assignee_id", assigneeId);
  }

  const query = params.toString();
  const [inquiries, users] = await Promise.all([
    apiGet<InquiryListItem[]>(
      query === "" ? "/api/inquiries" : `/api/inquiries?${query}`,
    ),
    apiGet<User[]>("/api/users"),
  ]);

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-bold">お問い合わせ一覧</h1>

      <div className="mb-4">
        <InquiryFilter
          users={users}
          currentStatus={status}
          currentAssigneeId={assigneeId}
        />
      </div>

      <InquiryTable inquiries={inquiries} />
    </main>
  );
}
```

Next.js 16 では `searchParams` が Promise になっている。書き方に迷ったら
`frontend/node_modules/next/dist/docs/` の該当ドキュメントを確認する。

- [ ] **Step 5: 型チェックと lint を通す**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 6: ブラウザで確認する**

`make dev` を起動し、`http://localhost:3000/inquiries` を開く。

Expected:
- 5件（Task 7 の確認で作った分があれば6件）が新しい順に並ぶ
- 対応状況のバッジに色が付く
- 対応状況で絞り込むとURLが `?status=open` になり、件数が減る
- 担当者で絞り込める
- 件名のリンクは `/inquiries/{id}` を指す（詳細はTask 10で作るので404でよい）

- [ ] **Step 7: コミット**

```bash
git add frontend/app/_components frontend/app/inquiries
git commit -m "feat: お問い合わせ一覧画面を追加"
```

---

## Task 10: 詳細画面（表示のみ）

先に表示だけを作り、操作はTask 11で足す。

**Files:**
- Create: `frontend/app/inquiries/[id]/page.tsx`
- Create: `frontend/app/inquiries/[id]/_components/InquiryDetailCard.tsx`
- Create: `frontend/app/inquiries/[id]/_components/HistoryTimeline.tsx`

- [ ] **Step 1: InquiryDetailCard を作る**

`frontend/app/inquiries/[id]/_components/InquiryDetailCard.tsx`:

```tsx
// お問い合わせの内容を表示する。表示だけなのでServer Component。

import { StatusBadge } from "@/app/_components/StatusBadge";
import type { InquiryDetail } from "@/lib/types";

type Props = {
  inquiry: InquiryDetail;
};

export function InquiryDetailCard({ inquiry }: Props) {
  return (
    <div className="rounded border p-6">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-bold">{inquiry.subject}</h1>
        <StatusBadge status={inquiry.status} />
      </div>

      <dl className="mb-4 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
        <dt className="text-gray-500">お問い合わせ者</dt>
        <dd>{inquiry.name}</dd>

        <dt className="text-gray-500">メールアドレス</dt>
        <dd>{inquiry.email}</dd>

        <dt className="text-gray-500">担当者</dt>
        <dd>{inquiry.assignee?.name ?? "未割り当て"}</dd>

        <dt className="text-gray-500">受付日時</dt>
        <dd>{new Date(inquiry.created_at).toLocaleString("ja-JP")}</dd>

        <dt className="text-gray-500">最終更新</dt>
        <dd>{new Date(inquiry.updated_at).toLocaleString("ja-JP")}</dd>
      </dl>

      <div className="whitespace-pre-wrap rounded bg-gray-50 p-4 text-sm">
        {inquiry.body}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: HistoryTimeline を作る**

`frontend/app/inquiries/[id]/_components/HistoryTimeline.tsx`:

```tsx
// 対応履歴を時系列で表示する。
// コメントと変更ログが同じ配列で来るので、entry_typeで表示を分ける。

import { STATUS_LABELS, type InquiryHistory } from "@/lib/types";

type Props = {
  histories: InquiryHistory[];
};

// DBに入っている値は文字列なので、asでキャストせずに突き合わせる。
// 見つからなければ、その値をそのまま表示する。
function statusLabel(value: string | null): string {
  if (value === null) {
    return "なし";
  }

  const found = Object.entries(STATUS_LABELS).find(([key]) => key === value);
  return found === undefined ? value : found[1];
}

function describe(history: InquiryHistory): string {
  if (history.entry_type === "status_changed") {
    return `対応状況を「${statusLabel(history.from_value)}」から「${statusLabel(history.to_value)}」に変更`;
  }

  if (history.entry_type === "assignee_changed") {
    const from = history.from_value ?? "未割り当て";
    const to = history.to_value ?? "未割り当て";
    return `担当者を「${from}」から「${to}」に変更`;
  }

  return "コメントを投稿";
}

export function HistoryTimeline({ histories }: Props) {
  if (histories.length === 0) {
    return <p className="text-sm text-gray-500">まだ対応履歴がありません。</p>;
  }

  return (
    <ol className="space-y-4">
      {histories.map((history) => (
        <li key={history.id} className="border-l-2 border-gray-200 pl-4">
          <div className="text-xs text-gray-500">
            {new Date(history.created_at).toLocaleString("ja-JP")}
            {history.user_name !== null && ` ・ ${history.user_name}`}
          </div>

          <div className="text-sm">{describe(history)}</div>

          {history.body !== null && (
            <div className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm">
              {history.body}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 3: 詳細ページを作る**

`frontend/app/inquiries/[id]/page.tsx`:

```tsx
// お問い合わせ詳細のページ。内容と対応履歴を表示する。

import { notFound } from "next/navigation";
import Link from "next/link";

import { HistoryTimeline } from "./_components/HistoryTimeline";
import { InquiryDetailCard } from "./_components/InquiryDetailCard";
import { apiGet } from "@/lib/api";
import type { InquiryDetail } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InquiryDetailPage({ params }: Props) {
  const { id } = await params;

  let inquiry: InquiryDetail;

  try {
    inquiry = await apiGet<InquiryDetail>(`/api/inquiries/${id}`);
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/inquiries" className="text-sm text-blue-600 hover:underline">
        ← 一覧に戻る
      </Link>

      <div className="mt-4">
        <InquiryDetailCard inquiry={inquiry} />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">対応履歴</h2>
        <HistoryTimeline histories={inquiry.histories} />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: 型チェックと lint を通す**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 5: ブラウザで確認する**

`http://localhost:3000/inquiries/2` を開く。

Expected:
- 件名・ステータスバッジ・お問い合わせ者・担当者・本文が表示される
- 対応履歴に「担当者を…に変更」「対応状況を…に変更」「コメントを投稿」が古い順で並ぶ
- `/inquiries/999` を開くと404ページになる

- [ ] **Step 6: コミット**

```bash
git add "frontend/app/inquiries/[id]"
git commit -m "feat: お問い合わせ詳細画面と対応履歴の表示を追加"
```

---

## Task 11: 詳細画面の操作パネル

ステータス変更・担当者割り当て・コメント投稿を足す。
認証がないため、操作者は画面上のセレクトで選ぶ。

**Files:**
- Create: `frontend/app/inquiries/[id]/_components/OperatorContext.tsx`
- Create: `frontend/app/inquiries/[id]/_components/OperatorSelect.tsx`
- Create: `frontend/app/inquiries/[id]/_components/StatusSelect.tsx`
- Create: `frontend/app/inquiries/[id]/_components/AssigneeSelect.tsx`
- Create: `frontend/app/inquiries/[id]/_components/CommentForm.tsx`
- Modify: `frontend/app/inquiries/[id]/page.tsx`

- [ ] **Step 1: 操作者の共有を作る**

3つの操作が同じ「操作者」を使うため、Contextで共有する。

`frontend/app/inquiries/[id]/_components/OperatorContext.tsx`:

```tsx
"use client";

// 「今操作している担当者」を操作パネルの中で共有する。
// 認証がないため、誰が操作したかは画面で選んでもらう。

import { createContext, useContext, useState, type ReactNode } from "react";

import type { User } from "@/lib/types";

type OperatorContextValue = {
  users: User[];
  operatorId: number;
  setOperatorId: (id: number) => void;
};

const OperatorContext = createContext<OperatorContextValue | null>(null);

type Props = {
  users: User[];
  children: ReactNode;
};

export function OperatorProvider({ users, children }: Props) {
  const [operatorId, setOperatorId] = useState<number>(users[0]?.id ?? 0);

  return (
    <OperatorContext.Provider value={{ users, operatorId, setOperatorId }}>
      {children}
    </OperatorContext.Provider>
  );
}

export function useOperator(): OperatorContextValue {
  const value = useContext(OperatorContext);

  if (value === null) {
    throw new Error("OperatorProviderの中で使う");
  }

  return value;
}
```

- [ ] **Step 2: OperatorSelect を作る**

`frontend/app/inquiries/[id]/_components/OperatorSelect.tsx`:

```tsx
"use client";

// 操作者を選ぶセレクト。ここで選んだ人が、以降の操作の履歴に残る。

import { useOperator } from "./OperatorContext";

export function OperatorSelect() {
  const { users, operatorId, setOperatorId } = useOperator();

  return (
    <label className="flex items-center gap-2 text-sm">
      操作者
      <select
        className="rounded border px-2 py-1"
        value={String(operatorId)}
        onChange={(e) => setOperatorId(Number(e.target.value))}
      >
        {users.map((user) => (
          <option key={user.id} value={String(user.id)}>
            {user.name}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 3: StatusSelect を作る**

`frontend/app/inquiries/[id]/_components/StatusSelect.tsx`:

```tsx
"use client";

// 対応状況を変更する。変更するとサーバー側で履歴が自動的に記録される。

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOperator } from "./OperatorContext";
import { apiPatch } from "@/lib/api";
import { STATUS_LABELS, type InquiryDetail, type InquiryStatus } from "@/lib/types";

const STATUSES: InquiryStatus[] = ["open", "in_progress", "pending", "closed"];

type Props = {
  inquiryId: number;
  currentStatus: InquiryStatus;
};

export function StatusSelect({ inquiryId, currentStatus }: Props) {
  const router = useRouter();
  const { operatorId } = useOperator();
  const [saving, setSaving] = useState(false);

  const change = async (status: string) => {
    setSaving(true);

    try {
      await apiPatch<InquiryDetail>(
        `/api/inquiries/${inquiryId}/status?user_id=${operatorId}`,
        { status },
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      対応状況
      <select
        className="rounded border px-2 py-1"
        value={currentStatus}
        disabled={saving}
        onChange={(e) => change(e.target.value)}
      >
        {STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 4: AssigneeSelect を作る**

`frontend/app/inquiries/[id]/_components/AssigneeSelect.tsx`:

```tsx
"use client";

// 担当者を割り当てる。空を選ぶと解除になる。

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOperator } from "./OperatorContext";
import { apiPatch } from "@/lib/api";
import type { InquiryDetail } from "@/lib/types";

type Props = {
  inquiryId: number;
  currentAssigneeId: number | null;
};

export function AssigneeSelect({ inquiryId, currentAssigneeId }: Props) {
  const router = useRouter();
  const { users, operatorId } = useOperator();
  const [saving, setSaving] = useState(false);

  const change = async (value: string) => {
    setSaving(true);

    try {
      await apiPatch<InquiryDetail>(
        `/api/inquiries/${inquiryId}/assignee?user_id=${operatorId}`,
        { assignee_id: value === "" ? null : Number(value) },
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      担当者
      <select
        className="rounded border px-2 py-1"
        value={currentAssigneeId === null ? "" : String(currentAssigneeId)}
        disabled={saving}
        onChange={(e) => change(e.target.value)}
      >
        <option value="">未割り当て</option>
        {users.map((user) => (
          <option key={user.id} value={String(user.id)}>
            {user.name}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 5: CommentForm を作る**

`frontend/app/inquiries/[id]/_components/CommentForm.tsx`:

```tsx
"use client";

// 対応メモを投稿する。投稿した内容は対応履歴に並ぶ。

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOperator } from "./OperatorContext";
import { apiPost } from "@/lib/api";
import type { InquiryHistory } from "@/lib/types";

type Props = {
  inquiryId: number;
};

export function CommentForm({ inquiryId }: Props) {
  const router = useRouter();
  const { operatorId } = useOperator();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (body.trim() === "") {
      return;
    }

    setSaving(true);

    try {
      await apiPost<InquiryHistory>(`/api/inquiries/${inquiryId}/comments`, {
        body,
        user_id: operatorId,
      });
      setBody("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        className="w-full rounded border p-2 text-sm"
        rows={3}
        placeholder="対応メモを入力"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button
        type="submit"
        disabled={saving || body.trim() === ""}
        className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white disabled:bg-gray-300"
      >
        {saving ? "投稿中..." : "投稿する"}
      </button>
    </form>
  );
}
```

- [ ] **Step 6: 詳細ページに操作パネルを組み込む**

`frontend/app/inquiries/[id]/page.tsx` を次のように変更する。
担当者一覧の取得と、操作パネルの追加が変更点。

```tsx
// お問い合わせ詳細のページ。内容・操作パネル・対応履歴を表示する。

import { notFound } from "next/navigation";
import Link from "next/link";

import { AssigneeSelect } from "./_components/AssigneeSelect";
import { CommentForm } from "./_components/CommentForm";
import { HistoryTimeline } from "./_components/HistoryTimeline";
import { InquiryDetailCard } from "./_components/InquiryDetailCard";
import { OperatorProvider } from "./_components/OperatorContext";
import { OperatorSelect } from "./_components/OperatorSelect";
import { StatusSelect } from "./_components/StatusSelect";
import { apiGet } from "@/lib/api";
import type { InquiryDetail, User } from "@/lib/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function InquiryDetailPage({ params }: Props) {
  const { id } = await params;

  let inquiry: InquiryDetail;

  try {
    inquiry = await apiGet<InquiryDetail>(`/api/inquiries/${id}`);
  } catch {
    notFound();
  }

  const users = await apiGet<User[]>("/api/users");

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/inquiries" className="text-sm text-blue-600 hover:underline">
        ← 一覧に戻る
      </Link>

      <div className="mt-4">
        <InquiryDetailCard inquiry={inquiry} />
      </div>

      <OperatorProvider users={users}>
        <section className="mt-6 rounded border p-6">
          <h2 className="mb-4 text-lg font-bold">対応</h2>

          <div className="mb-4 flex flex-wrap gap-4">
            <OperatorSelect />
            <StatusSelect inquiryId={inquiry.id} currentStatus={inquiry.status} />
            <AssigneeSelect
              inquiryId={inquiry.id}
              currentAssigneeId={inquiry.assignee?.id ?? null}
            />
          </div>

          <CommentForm inquiryId={inquiry.id} />
        </section>
      </OperatorProvider>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold">対応履歴</h2>
        <HistoryTimeline histories={inquiry.histories} />
      </section>
    </main>
  );
}
```

`OperatorProvider` は Client Component だが、
その子である `InquiryDetailCard` や `HistoryTimeline` は Server Component のまま
外側に置いているため、Client 化は操作パネルの中だけに留まる。

- [ ] **Step 7: 型チェックと lint を通す**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 8: ブラウザで確認する**

`http://localhost:3000/inquiries/1` を開く。

Expected:
- 操作者・対応状況・担当者のセレクトが並ぶ
- 対応状況を「対応中」に変えると、画面が更新され履歴に1件増える
- 履歴の操作者名が、操作者セレクトで選んだ人になる
- 担当者を割り当てると、上のカードの担当者が変わり履歴に1件増える
- 担当者を「未割り当て」に戻すと、履歴に「…から「未割り当て」に変更」が残る
- 対応メモを投稿すると、履歴の末尾に本文付きで表示され、入力欄が空になる
- 同じ対応状況をもう一度選んでも履歴が増えない

- [ ] **Step 9: コミット**

```bash
git add "frontend/app/inquiries/[id]"
git commit -m "feat: 詳細画面にステータス変更・担当者割り当て・対応メモを追加"
```

---

## Task 12: 公開の問い合わせフォーム

**Files:**
- Create: `frontend/app/contact/page.tsx`
- Create: `frontend/app/contact/_components/ContactForm.tsx`

- [ ] **Step 1: ContactForm を作る**

`frontend/app/contact/_components/ContactForm.tsx`:

```tsx
"use client";

// 公開の問い合わせフォーム。送信すると管理画面の一覧に載る。

import { useState } from "react";

import { apiPost } from "@/lib/api";

type InquiryCreated = {
  id: number;
  subject: string;
  status: string;
  created_at: string;
};

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError("");

    try {
      await apiPost<InquiryCreated>("/api/inquiries", {
        name,
        email,
        subject,
        body,
      });
      setSent(true);
      setName("");
      setEmail("");
      setSubject("");
      setBody("");
    } catch {
      setError("送信に失敗しました。入力内容を確認してください。");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded border border-green-300 bg-green-50 p-6">
        <p className="mb-3 text-sm">お問い合わせを受け付けました。</p>
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => setSent(false)}
        >
          続けて問い合わせる
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm">
        お名前
        <input
          type="text"
          required
          className="mt-1 w-full rounded border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="block text-sm">
        メールアドレス
        <input
          type="email"
          required
          className="mt-1 w-full rounded border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="block text-sm">
        件名
        <input
          type="text"
          required
          className="mt-1 w-full rounded border p-2"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </label>

      <label className="block text-sm">
        お問い合わせ内容
        <textarea
          required
          rows={6}
          className="mt-1 w-full rounded border p-2"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>

      {error !== "" && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={sending}
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:bg-gray-300"
      >
        {sending ? "送信中..." : "送信する"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: ページを作る**

`frontend/app/contact/page.tsx`:

```tsx
// 公開の問い合わせフォームのページ。

import { ContactForm } from "./_components/ContactForm";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-2xl font-bold">お問い合わせ</h1>
      <ContactForm />
    </main>
  );
}
```

- [ ] **Step 3: 型チェックと lint を通す**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 4: ブラウザで確認する**

`http://localhost:3000/contact` を開く。

Expected:
- 4つの入力欄と送信ボタンが表示される
- 送信すると「お問い合わせを受け付けました。」に変わる
- `/inquiries` を開くと、送信した内容が一番上に「未対応」で並ぶ

- [ ] **Step 5: コミット**

```bash
git add frontend/app/contact
git commit -m "feat: 公開の問い合わせフォームを追加"
```

---

## Task 13: トップページの導線と最終確認

**Files:**
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: トップページを書き換える**

`frontend/app/page.tsx` の中身を次に置き換える。

```tsx
// トップページ。管理画面と問い合わせフォームへの入口。

import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-2xl font-bold">お問い合わせ管理システム</h1>

      <ul className="space-y-3">
        <li>
          <Link
            href="/inquiries"
            className="block rounded border p-4 hover:bg-gray-50"
          >
            <div className="font-medium">お問い合わせ一覧</div>
            <div className="text-sm text-gray-500">
              受け付けたお問い合わせを確認し、対応する
            </div>
          </Link>
        </li>
        <li>
          <Link
            href="/contact"
            className="block rounded border p-4 hover:bg-gray-50"
          >
            <div className="font-medium">お問い合わせフォーム</div>
            <div className="text-sm text-gray-500">
              お問い合わせを送信する（利用者向け）
            </div>
          </Link>
        </li>
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: 型チェックと lint を通す**

```bash
cd frontend && npx tsc --noEmit && npm run lint
```

Expected: エラーなし

- [ ] **Step 3: ビルドが通ることを確認する**

```bash
cd frontend && npm run build
```

Expected: エラーなし

- [ ] **Step 4: 一連の流れを通しで確認する**

設計書6章の手順をブラウザで実施する。

1. `/contact` からお問い合わせを送信する
2. `/inquiries` の一覧に「未対応」で表示される
3. 詳細画面でステータスを変更し、履歴に記録される
4. 担当者を割り当て、履歴に記録される
5. 対応メモを投稿し、履歴に表示される
6. 一覧でステータスと担当者による絞り込みができる

- [ ] **Step 5: バックエンドの疎通を確認する**

```bash
make health
```

Expected: `{"status":"ok"}`

- [ ] **Step 6: コミット**

```bash
git add frontend/app/page.tsx
git commit -m "feat: トップページに各画面への導線を追加"
```

---

## 完了時の検証

```bash
make health
cd frontend && npx tsc --noEmit
cd frontend && npm run lint
cd frontend && npm run build
```

加えて、Task 13 Step 4 の通し確認を実施し、結果を報告する。
