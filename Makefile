# よく使うコマンドをまとめたファイル。`make help` で一覧が見られる。

.DEFAULT_GOAL := help
.PHONY: help start stop up down dev install logs sh health

help: ## コマンド一覧を表示する
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  make %-10s %s\n", $$1, $$2}'

start: ## バックエンドとフロントをまとめて起動する（止めるときは Ctrl+C → make stop）
	docker compose up -d --build
	cd frontend && npm run dev

stop: ## バックエンドを停止する（フロントは Ctrl+C で止める）
	docker compose down

up: ## バックエンドだけ起動する
	docker compose up -d --build

down: ## バックエンドだけ停止する
	docker compose down

dev: ## フロントだけ起動する
	cd frontend && npm run dev

install: ## フロントの依存ライブラリを入れる
	cd frontend && npm install

logs: ## バックエンドのログを表示し続ける
	docker compose logs -f backend

sh: ## バックエンドのコンテナの中に入る
	docker compose exec backend bash

health: ## バックエンドに疎通確認する
	curl -s http://localhost:8001/api/health
