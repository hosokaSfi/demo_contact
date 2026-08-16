# demo_contact

問い合わせ管理システム。ハンズオン教材を兼ねるため、読みやすさを優先する。

## 構成

- backend: FastAPI / SQLAlchemy 2.x / Pydantic v2 / SQLite（Dockerコンテナ内 / ホスト側 8001番）
- frontend: Next.js 16 App Router / React 19 / TypeScript / Tailwind CSS v4（ホスト上 / 3000番）

バックエンドはコンテナ内では8000番で動き、ホスト側に8001番で公開している。
フロントからのAPI呼び出し先は `http://localhost:8001`。

## 共通ルール

- ファイル冒頭に「そのファイルが何をするか」を1〜2行の日本語コメントで書く
- 型を明示する。`Any` と `as` によるキャストは使わない
- 説明が必要なのは「なぜそうしたか」。コードを読めば分かることはコメントにしない
- 設定値のハードコードは可。ただしAPIのURLだけは環境変数から読む
- ライブラリを増やすときは事前に相談する

---

# backend

## レイヤー構成

```
routers  →  services  →  repositories  →  models
                ↓
             schemas
```

各層の責務は次のとおり。**1つ下の層だけを呼ぶ**。routersからrepositoriesを直接呼ばない。

| 層 | 置き場所 | やること | やらないこと |
| --- | --- | --- | --- |
| routers | `app/routers/` | HTTPの入出力、パスとステータスコードの定義、`Depends`での組み立て | 業務ロジック、DB操作 |
| services | `app/services/` | 業務ロジック、複数リポジトリの調整、トランザクションの境界 | HTTPの知識（`HTTPException`を投げない）、SQLの組み立て |
| repositories | `app/repositories/` | SQLAlchemyを使ったDBの読み書き | 業務判断、HTTPの知識 |
| models | `app/models/` | テーブル定義（SQLAlchemy） | ロジック |
| schemas | `app/schemas/` | APIの入出力の型（Pydantic） | ロジック |

抽象インターフェース（Protocol / ABC）は作らない。ServiceはRepositoryの具象クラスを直接受け取る。
ドメインモデルとSQLAlchemyモデルも分けない。`models/` のクラスをそのまま各層で受け渡す。

## ファイルの分け方

機能ごとに1ファイル。ファイル名は単数形にする。

```
app/
├── main.py
├── database.py
├── models/inquiry.py
├── schemas/inquiry.py
├── repositories/inquiry.py
├── services/inquiry.py
└── routers/inquiry.py
```

各パッケージの `__init__.py` は空のままでよい。import は
`from app.services.inquiry import InquiryService` のようにフルパスで書く。

## Service と Repository の書き方

どちらもクラスにする。`Session` はコンストラクタで受け取る。

```python
class InquiryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def find_all(self) -> list[Inquiry]:
        return list(self.db.scalars(select(Inquiry)).all())
```

Serviceは必要なRepositoryをコンストラクタで受け取る。

```python
class InquiryService:
    def __init__(self, repository: InquiryRepository) -> None:
        self.repository = repository
```

routersでは `Depends` で組み立てる。組み立て用の関数は routers 側に置く。

```python
def get_inquiry_service(db: Session = Depends(get_db)) -> InquiryService:
    return InquiryService(InquiryRepository(db))
```

## エラーの扱い

Serviceは `HTTPException` を投げない。HTTPを知っているのは routers だけ。

- Serviceは業務的に失敗したことを、独自の例外か戻り値（`None` など）で表す
- routersがそれを受けて `HTTPException` に変換する

「見つからなかった」程度なら Service が `None` を返し、routers が404にするのでよい。
そのために例外クラスを作らない。

## commit の位置

`commit()` を呼ぶのは Service。Repositoryは `add` / `flush` まで。
1つのリクエストで複数の書き込みをまとめられるようにするため。

## その他

- SQLAlchemyは2.x系の書き方（`select()` / `Mapped` / `mapped_column`）を使う。`query()` は使わない
- Pydanticスキーマは用途ごとに分ける（`InquiryCreate` / `InquiryUpdate` / `InquiryResponse`）
- DBのモデルをそのままAPIのレスポンスにしない。必ずschemasを通す
- マイグレーションはAlembicを入れず、起動時の `create_all` で済ませる

---

# frontend

## ディレクトリ構成（co-location）

共通のものだけ `app/` 直下に置き、**特定の画面でしか使わないものはその画面の隣に置く**。

```
app/
├── _components/          # 全画面で使う共通コンポーネント
├── _hooks/               # 全画面で使う共通フック
├── layout.tsx
├── page.tsx
└── inquiries/
    ├── _components/      # 問い合わせ画面でしか使わないコンポーネント
    ├── _hooks/           # 問い合わせ画面でしか使わないフック
    ├── page.tsx
    └── [id]/
        ├── _components/
        └── page.tsx
```

`_` 始まりのディレクトリは Next.js がルーティングの対象から外す（Private Folders）。
`app/` の中に置いてもURLにならないので、画面の隣にコンポーネントを置ける。

Next.jsのバージョンが上がると書き方が変わることがある。迷ったら
`frontend/node_modules/next/dist/docs/` の中の該当ドキュメントを読んでから実装する。

`lib/` はAPI通信など、Reactに依存しない処理だけを置く。

判断に迷ったら**まず画面の隣に置く**。2つ目の画面から使うことになった時点で、
共通の `app/_components/` に引き上げる。最初から共通化しない。

## Server Component と Client Component

**既定はServer Component。** `"use client"` を書くのは次のどれかが必要なときだけ。

- `useState` / `useEffect` などのフック
- `onClick` などのイベントハンドラ
- ブラウザのAPI（`localStorage` など）

`"use client"` はimportより上、ファイルの先頭に書く。

Client Componentは葉のほうに寄せる。ページ全体をClient Componentにせず、
状態を持つ部分だけを小さく切り出す。

## データ取得

- Server Component: 関数の中で直接 `await` する
- Client Component: `lib/api.ts` の `apiGet` などを使う

APIのベースURLは `process.env.NEXT_PUBLIC_API_BASE_URL` から読む。
`fetch` を直接書かず、`lib/api.ts` のラッパーを通す。

## 命名

| 対象 | 規則 | 例 |
| --- | --- | --- |
| コンポーネントのファイル | PascalCase | `InquiryList.tsx` |
| フックのファイル | camelCase、`use` で始める | `useInquiries.ts` |
| ディレクトリ | kebab-case | `inquiries/`, `_components/` |
| 型 | PascalCase | `Inquiry`, `InquiryFormValues` |

コンポーネントは名前付きexportにする。1ファイル1コンポーネント。
ただし `page.tsx` / `layout.tsx` は Next.js の規約に従い default export。

## スタイル

- Tailwindのユーティリティクラスを使う。CSSファイルは増やさない
- 条件で切り替えるときはテンプレートリテラルでつなぐ。`clsx` などは入れない
- 凝ったデザインにしない。読めればよい

## 型

- `interface` ではなく `type` を使う
- APIのレスポンスの型は、使う場所の近くに書く。共通で使うものだけ `lib/` に置く
- `any` を使わない。外から来る値は `unknown` で受けてから絞り込む

---

## 作業の進め方

- 実装前に既存の似たコードを読み、その書き方に合わせる
- 大きな変更は先に方針を提示してから実装する
- 完了時は型チェック・lint・動作確認を行い、実施内容を報告する

```bash
make health                          # バックエンドの疎通確認
cd frontend && npx tsc --noEmit      # フロントの型チェック
cd frontend && npm run lint          # フロントのlint
```
