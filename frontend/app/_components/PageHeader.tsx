// 管理画面（/inquiries系）の共通ヘッダー。ロゴとトップへの導線、必要なら戻るリンクを表示する。

import Link from "next/link";
import { Inbox } from "lucide-react";

type Props = {
  backHref?: string;
  backLabel?: string;
};

export function PageHeader({ backHref, backLabel }: Props) {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Inbox className="h-4 w-4" />
          </span>
          <span className="font-bold text-gray-900">お問い合わせ管理</span>
        </Link>

        {backHref !== undefined && (
          <Link
            href={backHref}
            className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            {backLabel ?? "一覧に戻る"}
          </Link>
        )}
      </div>
    </header>
  );
}
