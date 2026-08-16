"use client";

// トップページ。開いたときにバックエンドの /api/health を呼び、その結果を画面に表示する。
// 疎通確認だけのページなので、問い合わせ管理の機能はまだ何もない。

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Health = { status: string };

export default function Home() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<Health>("/api/health")
      .then((data) => setStatus(data.status))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      );
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        {status && (
          <p className="text-4xl font-bold text-green-600">API接続：{status}</p>
        )}
        {error && (
          <p className="text-2xl font-bold break-all text-red-600">{error}</p>
        )}
        {!status && !error && (
          <p className="text-2xl text-gray-500">接続中...</p>
        )}
      </div>
    </main>
  );
}
