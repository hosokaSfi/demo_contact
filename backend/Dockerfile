# バックエンド(FastAPI)を動かすコンテナの定義。
# Python 3.12 に依存ライブラリを入れて、uvicorn を自動リロード付きで起動する。

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# --reload: ソースを保存すると自動で再起動する（開発用）
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
