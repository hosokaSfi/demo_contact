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
