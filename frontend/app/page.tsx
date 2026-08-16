// トップページ。管理画面と問い合わせフォームへの入口。

import Link from "next/link";
import { ArrowRight, Inbox, MessageSquarePlus } from "lucide-react";

import { Card } from "./_components/Card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-indigo-50 via-white to-white px-8 py-16">
      <div className="mb-12 flex flex-col items-center text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Inbox className="h-6 w-6" />
        </span>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">
          お問い合わせ管理システム
        </h1>
        <p className="text-gray-500">
          お問い合わせを受け付け、履歴を残しながら対応するためのツール
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        <Link href="/inquiries">
          <Card hoverable className="h-full">
            <Inbox className="mb-3 h-6 w-6 text-indigo-600" />
            <div className="mb-1 font-semibold text-gray-900">
              お問い合わせ一覧
            </div>
            <p className="mb-4 text-sm text-gray-500">
              受け付けたお問い合わせを確認し、対応する
            </p>
            <span className="flex items-center gap-1 text-sm font-medium text-indigo-600">
              開く
              <ArrowRight className="h-4 w-4" />
            </span>
          </Card>
        </Link>

        <Link href="/contact">
          <Card hoverable className="h-full">
            <MessageSquarePlus className="mb-3 h-6 w-6 text-indigo-600" />
            <div className="mb-1 font-semibold text-gray-900">
              お問い合わせフォーム
            </div>
            <p className="mb-4 text-sm text-gray-500">
              お問い合わせを送信する（利用者向け）
            </p>
            <span className="flex items-center gap-1 text-sm font-medium text-indigo-600">
              開く
              <ArrowRight className="h-4 w-4" />
            </span>
          </Card>
        </Link>
      </div>
    </main>
  );
}
