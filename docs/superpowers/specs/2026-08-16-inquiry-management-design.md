# お問い合わせ管理システム 基本設計

作成日: 2026-08-16

## 1. 概要

お問い合わせの受付から対応完了までを管理するシステム。ハンズオン教材を兼ねるため、
読みやすさを優先し、抽象化と機能を最小限に留める。

### 機能一覧

- お問い合わせの一覧表示（ステータス・担当者での絞り込み）
- お問い合わせの詳細表示
- 対応状況（ステータス）の変更
- 対応履歴の確認と対応メモの投稿
- 担当者の割り当て・解除
- 公開フォームからのお問い合わせ受付

### 対象外（YAGNI）

- 認証・ログイン機能
- 担当者（users）の作成・更新・削除。シードデータで固定する
- お問い合わせの削除
- メール通知
- ファイル添付

## 2. 技術構成

| 層 | 技術 |
| --- | --- |
| backend | FastAPI / SQLAlchemy 2.x / Pydantic v2 / SQLite |
| frontend | Next.js 16 App Router / React 19 / TypeScript / Tailwind CSS v4 |

バックエンドはDockerコンテナ内の8000番で動き、ホスト側に8001番で公開する。
フロントエンドはホスト上の3000番。API のベースURLは
`NEXT_PUBLIC_API_BASE_URL`（`http://localhost:8001`）から読む。

## 3. DB設計

マイグレーションツール（Alembic）は導入せず、起動時の `create_all` でテーブルを作る。

### 3.1 users — 担当者マスタ

| カラム | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | INTEGER | PK, AUTOINCREMENT | |
| name | TEXT | NOT NULL | 担当者名 |
| email | TEXT | NOT NULL, UNIQUE | メールアドレス |
| created_at | DATETIME | NOT NULL | 作成日時 |

認証は行わないため、パスワードや権限のカラムは持たない。
レコードは起動時のシードデータで投入する。

### 3.2 inquiries — お問い合わせ

| カラム | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | INTEGER | PK, AUTOINCREMENT | |
| name | TEXT | NOT NULL | 問い合わせ者の氏名 |
| email | TEXT | NOT NULL | 問い合わせ者のメールアドレス |
| subject | TEXT | NOT NULL | 件名 |
| body | TEXT | NOT NULL | 問い合わせ本文 |
| status | TEXT | NOT NULL, default `'open'` | 対応状況 |
| assignee_id | INTEGER | FK → users.id, NULL可 | 担当者。未割り当ては NULL |
| created_at | DATETIME | NOT NULL | 受付日時 |
| updated_at | DATETIME | NOT NULL | 最終更新日時 |

#### status の値

| 値 | 表示 |
| --- | --- |
| `open` | 未対応 |
| `in_progress` | 対応中 |
| `pending` | 保留 |
| `closed` | 完了 |

遷移の制約は設けない。どの状態からどの状態へも変更できる。

### 3.3 inquiry_histories — 対応履歴

コメント（手動投稿）と変更ログ（自動記録）を1つのテーブルに統合し、
詳細画面で1本のタイムラインとして時系列に表示する。

| カラム | 型 | 制約 | 説明 |
| --- | --- | --- | --- |
| id | INTEGER | PK, AUTOINCREMENT | |
| inquiry_id | INTEGER | FK → inquiries.id, NOT NULL | 対象のお問い合わせ |
| entry_type | TEXT | NOT NULL | 履歴の種別 |
| body | TEXT | NULL可 | コメント本文 |
| from_value | TEXT | NULL可 | 変更前の値 |
| to_value | TEXT | NULL可 | 変更後の値 |
| user_id | INTEGER | FK → users.id, NULL可 | 操作した担当者 |
| created_at | DATETIME | NOT NULL | 記録日時 |

#### entry_type と使用カラム

| entry_type | 意味 | body | from_value / to_value |
| --- | --- | --- | --- |
| `comment` | 対応メモの投稿 | 使う | 使わない |
| `status_changed` | ステータス変更 | 使わない | ステータスの値（`open` など） |
| `assignee_changed` | 担当者の変更・解除 | 使わない | 担当者の表示名。未割り当ては NULL |

`assignee_changed` の from_value / to_value には users.id ではなく **担当者の表示名** を入れる。
履歴は当時の記録として固定したいため、後から担当者名が変わっても履歴の表示は変わらない。

## 4. バックエンド設計

### 4.1 ファイル構成

```
app/
├── main.py
├── database.py
├── seed.py                  # 起動時のシードデータ投入
├── models/
│   ├── user.py
│   ├── inquiry.py
│   └── inquiry_history.py
├── schemas/
│   ├── user.py
│   ├── inquiry.py
│   └── inquiry_history.py
├── repositories/
│   ├── user.py
│   ├── inquiry.py
│   └── inquiry_history.py
├── services/
│   ├── user.py
│   └── inquiry.py
└── routers/
    ├── user.py
    └── inquiry.py
```

`routers → services → repositories → models` の順に、1つ下の層だけを呼ぶ。
抽象インターフェース（Protocol / ABC）は作らず、Service は Repository の具象クラスを直接受け取る。

`InquiryService` は `InquiryRepository`・`InquiryHistoryRepository`・`UserRepository` の
3つを受け取る。履歴の記録と担当者の存在確認のため。

### 4.2 API一覧

#### お問い合わせ

| メソッド | パス | 用途 | ステータス |
| --- | --- | --- | --- |
| GET | `/api/inquiries` | 一覧取得 | 200 |
| GET | `/api/inquiries/{id}` | 詳細取得（履歴を含む） | 200 / 404 |
| POST | `/api/inquiries` | 公開フォームからの受付 | 201 / 422 |
| PATCH | `/api/inquiries/{id}/status` | ステータス変更 | 200 / 404 / 422 |
| PATCH | `/api/inquiries/{id}/assignee` | 担当者の割り当て・解除 | 200 / 400 / 404 |
| POST | `/api/inquiries/{id}/comments` | 対応メモの投稿 | 201 / 404 |

`GET /api/inquiries` のクエリパラメータ:

| 名前 | 型 | 説明 |
| --- | --- | --- |
| `status` | `InquiryStatus`（省略可） | 指定したステータスで絞り込む |
| `assignee_id` | `int`（省略可） | 指定した担当者で絞り込む |

ステータス変更と担当者変更を別エンドポイントに分けたのは、
どちらも履歴への自動記録を伴う独立した操作であり、
1つの PATCH にまとめると Service 側の分岐が増えて読みにくくなるため。

#### 担当者

| メソッド | パス | 用途 | ステータス |
| --- | --- | --- | --- |
| GET | `/api/users` | 担当者一覧（割り当てのプルダウン用） | 200 |

### 4.3 スキーマ（Pydantic）

| スキーマ | 用途 | 主なフィールド |
| --- | --- | --- |
| `InquiryCreate` | 公開フォームからの受付 | name, email, subject, body |
| `InquiryStatusUpdate` | ステータス変更 | status |
| `InquiryAssigneeUpdate` | 担当者変更 | assignee_id（NULL可） |
| `CommentCreate` | 対応メモの投稿 | body, user_id |
| `InquiryListItem` | 一覧の1件 | id, subject, name, status, assignee, created_at |
| `InquiryDetail` | 詳細 | 全カラム + assignee + histories |
| `InquiryResponse` | 受付後の返却 | id, subject, status, created_at |
| `InquiryHistoryResponse` | 履歴の1件 | id, entry_type, body, from_value, to_value, user_name, created_at |
| `UserResponse` | 担当者の1件 | id, name, email |

`InquiryStatus` は `str, Enum` で定義し、スキーマで型として使う。
不正な値は Pydantic が弾き、FastAPI が 422 を返す。

DBのモデルをそのままレスポンスにせず、必ず schemas を通す。

### 4.4 履歴の自動記録

`InquiryService` の責務として実装する。

- `update_status()`: 現在の status と異なる場合のみ、`status_changed` の履歴を追加する
- `update_assignee()`: 現在の assignee_id と異なる場合のみ、`assignee_changed` の履歴を追加する
- `add_comment()`: `comment` の履歴を追加する

いずれも Repository の `add` / `flush` までで、`commit()` は Service が最後に1回だけ呼ぶ。
これにより「お問い合わせの更新」と「履歴の追加」が1トランザクションに収まる。

値が変わらなかった場合は履歴を残さない。同じステータスを選び直しただけの操作で
タイムラインが埋まるのを防ぐため。

### 4.5 エラーの扱い

Service は `HTTPException` を投げない。HTTP を知っているのは routers だけ。

| ケース | Service の戻り値 | routers の変換 |
| --- | --- | --- |
| お問い合わせが存在しない | `None` | 404 |
| 指定した assignee_id の担当者が存在しない | `None` | 400 |
| status の値が不正 | — | Pydantic が弾き 422 |

「お問い合わせが存在しない（404）」と「担当者が存在しない（400）」を
どちらも `None` で表すと routers 側で区別できないため、
`update_assignee()` は結果を判別できる形で返す。具体的には
`tuple[Inquiry | None, AssigneeUpdateError | None]` のように、
更新結果と失敗理由を組で返す。失敗理由は `str` の Enum とし、
例外クラスは作らない。

### 4.6 シードデータ

`seed.py` に定義し、`main.py` の lifespan で `create_all` の後に実行する。
users が0件のときだけ投入するため、再起動しても重複しない。

- users: 3件（例: 佐藤 太郎 / 鈴木 花子 / 高橋 次郎）
- inquiries: 5件程度。ステータスと担当者の有無がばらけるようにする
- inquiry_histories: 一部の inquiry にコメントと変更ログを数件

起動直後から一覧・詳細・タイムラインが空にならず、動作確認ができる状態にする。

## 5. フロントエンド設計

### 5.1 画面一覧

| パス | 種別 | 内容 |
| --- | --- | --- |
| `/` | Server | トップ。管理画面と問い合わせフォームへの導線 |
| `/inquiries` | Server | 一覧。テーブル表示と絞り込み |
| `/inquiries/[id]` | Server | 詳細。内容・操作パネル・履歴タイムライン |
| `/contact` | Server（内部にClient） | 公開の問い合わせフォーム |

### 5.2 ディレクトリ構成

```
app/
├── _components/
│   └── StatusBadge.tsx           # 一覧・詳細の両方で使う
├── layout.tsx
├── page.tsx
├── contact/
│   ├── _components/
│   │   └── ContactForm.tsx       # "use client"
│   └── page.tsx
└── inquiries/
    ├── _components/
    │   ├── InquiryTable.tsx      # Server
    │   └── InquiryFilter.tsx     # "use client"
    ├── page.tsx
    └── [id]/
        ├── _components/
        │   ├── InquiryDetailCard.tsx   # Server
        │   ├── StatusSelect.tsx        # "use client"
        │   ├── AssigneeSelect.tsx      # "use client"
        │   ├── CommentForm.tsx         # "use client"
        │   └── HistoryTimeline.tsx     # Server
        └── page.tsx
lib/
└── api.ts
```

`StatusBadge` のみ最初から `app/_components/` に置く。
一覧と詳細の2画面で確実に使うため。それ以外は画面の隣に置く。

### 5.3 Server / Client の分担

既定は Server Component。`"use client"` を書くのは
状態・イベントハンドラ・ブラウザAPIが必要な部分だけに限る。

| コンポーネント | 種別 | 理由 |
| --- | --- | --- |
| `InquiryFilter` | Client | 選択状態を持ち `router.push` する |
| `StatusSelect` | Client | 選択のイベントハンドラを持つ |
| `AssigneeSelect` | Client | 選択のイベントハンドラを持つ |
| `CommentForm` | Client | 入力状態を持つ |
| `ContactForm` | Client | 入力状態と送信結果の表示を持つ |
| その他 | Server | 表示のみ |

ページ全体を Client Component にせず、状態を持つ部分だけを小さく切り出す。

### 5.4 データの流れ

- 一覧・詳細の取得は Server Component で直接 `await`（`apiGet`）
- ステータス変更・担当者割り当て・コメント投稿・フォーム送信は
  Client Component から `apiPatch` / `apiPost`
- 更新後は `router.refresh()` で Server Component を再取得する。
  クライアント側に一覧や詳細の状態を二重に持たない

`lib/api.ts` には `apiGet` / `apiPost` / `apiPatch` の3つを用意する。
`fetch` を直接書かず、必ずこのラッパーを通す。
ベースURLは `process.env.NEXT_PUBLIC_API_BASE_URL` から読む。

### 5.5 一覧の絞り込み

絞り込み条件は URL のクエリパラメータで持つ（例: `/inquiries?status=open&assignee_id=1`）。

Server Component が `searchParams` を読んで API に渡すため、
絞り込みの状態を Client 側に保持しない。
`InquiryFilter` は選択されたら `router.push` するだけの役割に留める。

### 5.6 操作した担当者の指定

認証がないため「今の操作者が誰か」をシステムが知る手段がない。
ステータス変更・担当者変更・コメント投稿の際は、
画面上の「操作者」セレクトで選んだ担当者の id を API に送る。
詳細画面の操作パネルの先頭にこのセレクトを1つ置き、
3つの操作で共通に使う。

### 5.7 スタイル

Tailwind のユーティリティクラスのみを使い、CSSファイルは増やさない。
条件による切り替えはテンプレートリテラルでつなぐ（`clsx` は導入しない）。
デザインは凝らず、読めればよい水準に留める。

`StatusBadge` はステータスごとに色を変える。

| status | 色 |
| --- | --- |
| `open` | グレー |
| `in_progress` | ブルー |
| `pending` | イエロー |
| `closed` | グリーン |

## 6. 検証

作業完了時に以下を実施する。

```bash
make health                          # バックエンドの疎通確認
cd frontend && npx tsc --noEmit      # フロントの型チェック
cd frontend && npm run lint          # フロントのlint
```

加えて、ブラウザで次の一連の操作が通ることを確認する。

1. `/contact` からお問い合わせを送信する
2. `/inquiries` の一覧に表示される
3. 詳細画面でステータスを変更し、履歴に記録される
4. 担当者を割り当て、履歴に記録される
5. 対応メモを投稿し、履歴に表示される
6. 一覧でステータスと担当者による絞り込みができる
