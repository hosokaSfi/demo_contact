# demo_contact

問い合わせ管理システムを作るハンズオン用の雛形。

いまは「環境が起動して、フロントからバックエンドに繋がる」ところまでしかない。
アプリ本体は当日みんなで作る。

## 構成

- バックエンド: FastAPI（Dockerコンテナの中で動く / ポート 8001）
- フロントエンド: Next.js（パソコンの上で直接動く / ポート 3000）
- データベース: SQLite（`backend/data/app.db` に保存される）

## 準備

初回だけ、フロントエンドのライブラリを入れる。

```bash
make install
```

## 起動

バックエンドとフロントエンドをまとめて起動する。

```bash
make start
```

起動したら http://localhost:3000 を開く。
画面に「API接続：ok」と出れば成功。

## 停止

`make start` したターミナルで `Ctrl+C` を押してフロントエンドを止めてから、次を実行する。

```bash
make stop
```

## よく使うコマンド

`make help` でも一覧が見られる。

| コマンド | 内容 |
| --- | --- |
| `make start` | バックエンドとフロントをまとめて起動する |
| `make stop` | バックエンドを停止する |
| `make up` | バックエンドだけ起動する |
| `make down` | バックエンドだけ停止する |
| `make dev` | フロントだけ起動する |
| `make install` | フロントのライブラリを入れる |
| `make logs` | バックエンドのログを見続ける |
| `make sh` | バックエンドのコンテナの中に入る |
| `make health` | バックエンドに繋がるか確かめる |

## makeを使わない場合

```bash
docker compose up --build
```

別のターミナルで:

```bash
cd frontend && npm install && npm run dev
```

停止は `Ctrl+C` のあとに `docker compose down`。

## 確認用のURL

- http://localhost:3000 … 画面
- http://localhost:8001/api/health … APIの疎通確認
- http://localhost:8001/docs … APIの一覧（Swagger UI）

## 当日さわるところ

- `backend/app/models/` … テーブルの定義
- `backend/app/schemas/` … APIの入出力の型
- `backend/app/routers/` … APIの追加
- `frontend/app/` … 画面
